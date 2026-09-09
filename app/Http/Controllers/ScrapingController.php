<?php

namespace App\Http\Controllers;

use App\Models\ScrapingAgent;
use App\Models\ScrapingLog;
use App\Models\ScrapingPolicy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ScrapingController extends Controller
{
    public function index()
    {
        $dbAgents = ScrapingAgent::all();

        if ($dbAgents->isEmpty()) {
            $defaultDomains = [
                ['code' => 'AGENT-LOKERID-01', 'domain' => 'https://www.loker.id', 'sumber' => 'loker.id', 'data' => 2.4, 'status' => 'Active'],
                ['code' => 'AGENT-JOBSTREET-01', 'domain' => 'https://www.jobstreet.co.id', 'sumber' => 'jobstreet.co.id', 'data' => 1.8, 'status' => 'Active'],
                ['code' => 'AGENT-INDEED-01', 'domain' => 'https://id.indeed.com', 'sumber' => 'id.indeed.com', 'data' => 1.2, 'status' => 'Syncing'],
                ['code' => 'AGENT-KALIBRR-01', 'domain' => 'https://www.kalibrr.com', 'sumber' => 'kalibrr.com', 'data' => 0.8, 'status' => 'Active'],
                ['code' => 'AGENT-TECHINASIA-01', 'domain' => 'https://id.techinasia.com', 'sumber' => 'id.techinasia.com', 'data' => 0.6, 'status' => 'Active'],
            ];

            foreach ($defaultDomains as $idx => $d) {
                ScrapingAgent::create([
                    'agent_code' => $d['code'],
                    'domain_url' => $d['domain'],
                    'sumber' => $d['sumber'],
                    'wilayah' => "Nodus Agen ({$d['sumber']})",
                    'status' => $d['status'],
                    'uptime' => 99.9 - ($idx * 0.1),
                    'volume_data' => $d['data'],
                    'max_pages' => 10,
                    'max_jobs' => 15,
                    'last_sync' => now()->subMinutes($idx * 15),
                ]);
            }
            $dbAgents = ScrapingAgent::all();
        }

        $mappedAgents = $dbAgents->map(function ($a) {
            $code = $a->agent_code ?? ($a->id ? "AGENT-{$a->id}" : 'AGENT-01');
            $sumber = $a->sumber ?? $a->wilayah ?? 'loker.id';
            $lastSync = $a->last_sync ? $a->last_sync->format('d/m/Y H:i:s') : date('d/m/Y H:i:s');

            return [
                'db_id' => $a->id,
                'id' => $code,
                'sumber' => $sumber,
                'source' => $sumber,
                'domain_url' => $a->domain_url ?? "https://{$sumber}",
                'status' => $a->status === 'Aktif' ? 'Active' : ($a->status === 'Sinkronisasi' ? 'Syncing' : $a->status),
                'data' => $a->volume_data ? "{$a->volume_data} GB" : '1.5 GB',
                'last_scrap' => $lastSync,
                'lastScrap' => $lastSync,
            ];
        });

        $logs = ScrapingLog::with('policy')->latest()->take(20)->get();

        return inertia('ScrapingAgents', [
            'dbAgents' => $mappedAgents,
            'dbLogs' => $logs,
        ]);
    }

    public function deployAgent(Request $request)
    {
        $validated = $request->validate([
            'domain_url' => 'required|string',
            'agent_code' => 'nullable|string',
            'max_pages' => 'nullable|integer|min:1|max:50',
            'max_jobs' => 'nullable|integer|min:1|max:100',
        ]);

        $rawUrl = trim($validated['domain_url']);
        if (! str_starts_with($rawUrl, 'http://') && ! str_starts_with($rawUrl, 'https://')) {
            $rawUrl = 'https://' . $rawUrl;
        }

        $parsed = parse_url($rawUrl);
        $domain = $parsed['host'] ?? $rawUrl;
        $sumber = str_replace('www.', '', $domain);

        $agentCode = ! empty($validated['agent_code'])
            ? strtoupper(trim($validated['agent_code']))
            : 'AGENT-' . strtoupper(explode('.', $sumber)[0]) . '-' . str_pad((string) (ScrapingAgent::count() + 1), 2, '0', STR_PAD_LEFT);

        $agent = ScrapingAgent::create([
            'agent_code' => $agentCode,
            'domain_url' => $rawUrl,
            'sumber' => $sumber,
            'wilayah' => "Nodus Agen ({$sumber})",
            'status' => 'Syncing',
            'uptime' => 99.9,
            'volume_data' => 0.5,
            'max_pages' => $validated['max_pages'] ?? 9999,
            'max_jobs' => $validated['max_jobs'] ?? 999999,
            'last_sync' => now(),
        ]);

        return back()->with('status', "Agen {$agentCode} ({$sumber}) berhasil dideploy! Menghubungkan log live...");
    }

    public function deployStream(Request $request): StreamedResponse
    {
        $agentId = $request->input('agent_id');
        $domainUrl = $request->input('domain_url', 'https://www.loker.id');

        $agent = null;
        if ($agentId) {
            $agent = ScrapingAgent::find($agentId);
        }

        if ($agent) {
            $agent->update(['status' => 'Syncing', 'last_sync' => now()]);
            $domainUrl = $agent->domain_url ?: $domainUrl;
        }

        return response()->stream(function () use ($agent, $domainUrl) {
            if (ob_get_level()) {
                ob_end_clean();
            }

            $sendData = function (string $line, bool $done = false) {
                $timestamp = date('d/m/Y H:i:s');
                $formattedLine = "[{$timestamp}] " . $line;
                echo "data: " . json_encode([
                    'line' => $formattedLine,
                    'done' => $done,
                    'timestamp' => $timestamp
                ]) . "\n\n";
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();
            };

            $targetDomain = str_replace(['https://', 'http://', 'www.'], '', $domainUrl);
            $sendData("[SYSTEM] Memulai deployment & eksekusi scraper AI (High-Speed Concurrent Mode) untuk domain: {$targetDomain}...");

            $pythonBin = $this->findPythonBinary();
            $maxPages = $agent->max_pages ?? 9999;
            $maxJobs = $agent->max_jobs ?? 999999;

            // Route execution engine: use scrape_loker_enhanced.py for loker.id, or Universal AI Scraper for other domains
            if (str_contains($targetDomain, 'loker.id')) {
                $scriptPath = base_path('data-engine/scrape_loker_enhanced.py');
                $cmd = escapeshellarg($pythonBin) . ' ' . escapeshellarg($scriptPath) . ' --phase=all --workers=16 --interval=0.05' . ($maxPages > 0 && $maxPages < 9999 ? ' --max-pages=' . $maxPages : '') . ($maxJobs > 0 && $maxJobs < 999999 ? ' --max-jobs=' . $maxJobs : '');
            } else {
                $scriptPath = base_path('data-engine/universal/run_pipeline.py');
                $cmd = escapeshellarg($pythonBin) . ' ' . escapeshellarg($scriptPath) . ' --domain=' . escapeshellarg($domainUrl) . ($maxPages > 0 && $maxPages < 9999 ? ' --max-pages=' . $maxPages : '') . ($maxJobs > 0 && $maxJobs < 999999 ? ' --max-jobs=' . $maxJobs : '');
            }

            $descriptorspec = [
                0 => ["pipe", "r"],
                1 => ["pipe", "w"],
                2 => ["pipe", "w"],
            ];

            $sendData("[INFO] Runner Command: {$cmd}");
            $process = proc_open($cmd, $descriptorspec, $pipes, base_path());

            if (is_resource($process)) {
                fclose($pipes[0]);
                stream_set_blocking($pipes[1], false);
                stream_set_blocking($pipes[2], false);

                while (true) {
                    $status = proc_get_status($process);
                    $stdout = fgets($pipes[1]);
                    $stderr = fgets($pipes[2]);

                    if ($stdout !== false && trim($stdout) !== '') {
                        $line = trim($stdout);
                        $prefix = str_contains(strtolower($line), 'error') ? '[ERROR] ' : (str_contains(strtolower($line), 'success') || str_contains(strtolower($line), 'complete') ? '[SUCCESS] ' : '[INFO] ');
                        if (str_starts_with($line, '[')) {
                            $sendData($line);
                        } else {
                            $sendData($prefix . $line);
                        }
                    }

                    if ($stderr !== false && trim($stderr) !== '') {
                        $line = trim($stderr);
                        if (! str_contains(strtolower($line), 'warning:') && ! str_contains(strtolower($line), 'userwarning')) {
                            $sendData("[WARNING] " . $line);
                        }
                    }

                    if (! $status['running'] && feof($pipes[1]) && feof($pipes[2])) {
                        break;
                    }

                    usleep(40000);
                }

                fclose($pipes[1]);
                fclose($pipes[2]);
                $exitCode = proc_close($process);

                if ($exitCode === 0) {
                    $sendData("[SUCCESS] Engine Scraper AI untuk domain {$targetDomain} selesai dengan status 0.");
                } else {
                    $sendData("[WARNING] Scraper AI selesai dengan kode exit {$exitCode}. Selesai dengan beberapa catatan.");
                }
            } else {
                $sendData("[ERROR] Gagal membuka proses execution untuk scraper Python.");
            }

            // Step 2: Import data to DB
            $sendData("[INFO] Memulai pengimporan data lowongan ke basis data SQLite pusat (jobs:import)...");
            $phpBin = $this->findPhpBinary();
            $importCmd = escapeshellarg($phpBin) . ' -d memory_limit=512M ' . escapeshellarg(base_path('artisan')) . ' jobs:import';

            $importProcess = proc_open($importCmd, $descriptorspec, $pipes, base_path());
            if (is_resource($importProcess)) {
                fclose($pipes[0]);
                stream_set_blocking($pipes[1], false);

                while (true) {
                    $status = proc_get_status($importProcess);
                    $line = fgets($pipes[1]);
                    if ($line !== false && trim($line) !== '') {
                        $sendData("[INFO] [ImportJobs] " . trim($line));
                    }
                    if (! $status['running'] && feof($pipes[1])) {
                        break;
                    }
                    usleep(100000);
                }
                fclose($pipes[1]);
                fclose($pipes[2]);
                proc_close($importProcess);
            }

            if ($agent) {
                $agent->update([
                    'status' => 'Active',
                    'last_sync' => now(),
                    'volume_data' => round($agent->volume_data + 0.4, 1),
                ]);
            }

            $sendData("[SUCCESS] Deployment & sinkronisasi data lowongan domain {$targetDomain} berhasil diselesaikan!", true);

        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    public function syncStream(Request $request): StreamedResponse
    {
        return $this->deployStream($request);
    }

    private function findPythonBinary(): string
    {
        $candidates = [
            'C:\Users\harib\AppData\Local\Programs\Python\Python313\python.exe',
            'C:\Program Files\Python313\python.exe',
            'C:\Program Files (x86)\Python313\python.exe',
            'C:\Python313\python.exe',
            'C:\php84\python.exe',
            'python3',
            'python',
            '/usr/bin/python3',
            '/usr/local/bin/python3',
        ];

        foreach ($candidates as $candidate) {
            if (file_exists($candidate) || $this->commandExists($candidate)) {
                return $candidate;
            }
        }

        return 'python';
    }

    private function findPhpBinary(): string
    {
        $candidates = [
            'C:\php84\php.exe',
            'C:\php\php.exe',
            'php',
            '/usr/bin/php',
            '/usr/local/bin/php',
        ];

        foreach ($candidates as $candidate) {
            if (file_exists($candidate) || $this->commandExists($candidate)) {
                return $candidate;
            }
        }

        return 'php';
    }

    private function commandExists(string $command): bool
    {
        try {
            $process = Process::command(['where', $command])->timeout(5)->run();
            return $process->successful();
        } catch (\Throwable) {
            return false;
        }
    }
}
