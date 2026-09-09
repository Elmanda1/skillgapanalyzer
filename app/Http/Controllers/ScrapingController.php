<?php

namespace App\Http\Controllers;

use App\Models\ScraperProfile;
use App\Models\ScrapingAgent;
use App\Models\ScrapingLog;
use App\Models\ScrapingPolicy;
use App\Services\Scraping\GenericFastScraper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
            'max_pages' => 0,
            'max_jobs' => 0,
            'last_sync' => now(),
        ]);

        return back()->with('status', "Agen {$agentCode} ({$sumber}) berhasil dideploy! Menghubungkan log live...");
    }

    public function deployStream(Request $request): StreamedResponse
    {
        $agentId = $request->input('agent_id');
        $agentCode = $request->input('agent_code');
        $domainUrl = $request->input('domain_url', 'https://www.loker.id');

        $agent = null;
        if ($agentId) {
            $agent = ScrapingAgent::find($agentId);
        } elseif ($agentCode) {
            $agent = ScrapingAgent::where('agent_code', $agentCode)->first();
        }

        if (!$agent && $domainUrl) {
            $cleanDomain = str_replace(['https://', 'http://', 'www.'], '', $domainUrl);
            $agent = ScrapingAgent::where('sumber', 'like', "%{$cleanDomain}%")->first();
        }

        if ($agent) {
            $agent->update(['status' => 'Syncing', 'last_sync' => now()]);
            $domainUrl = $agent->domain_url ?: $domainUrl;
        }


        return response()->stream(function () use ($agent, $domainUrl) {
            set_time_limit(0);
            ignore_user_abort(true);
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_write_close();
            }

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

            // Check for fast PHP scraper profile first
            $profile = ScraperProfile::findActiveForDomain($targetDomain);

            if ($profile) {
                $sendData("[INFO] Found ScraperProfile for {$targetDomain} (strategy: {$profile->strategy}). Using FAST PHP scraper...");
                $this->runFastPhpScraper($profile, $agent, $sendData, $maxPages, $maxJobs);
            } elseif (str_contains($targetDomain, 'loker.id')) {
                $sendData("[INFO] Using loker.id enhanced Python scraper...");
                $this->runPythonScraper($agent, $sendData, 'scrape_loker_enhanced.py', $maxPages, $maxJobs);
            } else {
                $sendData("[INFO] No ScraperProfile found. Falling back to Universal AI Python scraper...");
                $this->runPythonScraper($agent, $sendData, 'universal/run_pipeline.py', $maxPages, $maxJobs, $domainUrl);
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

    public function abortAgent(Request $request)
    {
        $agentId = $request->input('agent_id');
        $agentCode = $request->input('agent_code');
        $domainUrl = $request->input('domain_url');

        $agent = null;
        if ($agentId) {
            $agent = ScrapingAgent::find($agentId);
        } elseif ($agentCode) {
            $agent = ScrapingAgent::where('agent_code', $agentCode)->first();
        } elseif ($domainUrl) {
            $clean = str_replace(['https://', 'http://', 'www.'], '', $domainUrl);
            $agent = ScrapingAgent::where('sumber', 'like', "%{$clean}%")->first();
        }

        $codeStr = $agent?->agent_code ?? ($agentCode ?: 'GLOBAL');
        $targetStr = $domainUrl ?: ($agent?->domain_url ?? ($agent?->sumber ?? 'portal target'));

        // Always set both global & agent-specific abort flags
        Cache::put("abort_requested_global", true, 300);
        if ($agent) {
            $agent->update(['status' => 'Offline', 'last_sync' => now()]);
            Cache::put("abort_requested_{$agent->id}", true, 300);
        }
        ScrapingAgent::where('status', 'Syncing')->update(['status' => 'Offline']);

        $killedPids = [];

        // 1. Kill PIDs recorded in file storage
        $pidFile = storage_path('app/scraping_pids.json');
        if (file_exists($pidFile)) {
            $filePids = json_decode(file_get_contents($pidFile), true) ?: [];
            foreach ($filePids as $pid) {
                if ($pid && is_numeric($pid)) {
                    if (str_contains(PHP_OS_FAMILY, 'Windows')) {
                        exec("taskkill /F /T /PID {$pid} 2>NUL");
                    } else {
                        exec("kill -9 {$pid} 2>/dev/null");
                    }
                    $killedPids[] = (int) $pid;
                }
            }
            @unlink($pidFile);
        }

        // 2. Kill PIDs recorded in Cache
        $cachePids = Cache::get('active_scraping_pids', []);
        foreach ($cachePids as $pid) {
            if ($pid && is_numeric($pid) && !in_array((int)$pid, $killedPids)) {
                if (str_contains(PHP_OS_FAMILY, 'Windows')) {
                    exec("taskkill /F /T /PID {$pid} 2>NUL");
                } else {
                    exec("kill -9 {$pid} 2>/dev/null");
                }
                $killedPids[] = (int) $pid;
            }
        }
        Cache::forget('active_scraping_pids');

        // 3. Fallback OS force-kill via WMIC & Taskkill
        try {
            if (str_contains(PHP_OS_FAMILY, 'Windows')) {
                exec('wmic process where "name=\'python.exe\' and (commandline like \'%run_pipeline.py%\' or commandline like \'%scrape_loker%\')" call terminate 2>NUL');
                exec('taskkill /F /IM python.exe /T 2>NUL');
            } else {
                exec('pkill -9 -f "run_pipeline.py|scrape_loker" 2>/dev/null');
            }
        } catch (\Throwable $e) {
            // Ignore if process already dead
        }

        $pidInfo = count($killedPids) > 0 ? " (Process ID: " . implode(', ', array_unique($killedPids)) . ")" : "";
        $logMessage = "Penghentian scraper agen {$codeStr} ({$targetStr}) berhasil diselesaikan. Status agen diubah ke Offline{$pidInfo}.";

        // 4. Log event to ScrapingLog table
        try {
            ScrapingLog::create([
                'url' => $targetStr,
                'method' => 'POST',
                'status_code' => 499,
                'error_message' => $logMessage,
                'started_at' => now(),
                'completed_at' => now(),
                'status' => 'aborted',
            ]);
        } catch (\Throwable $e) {
            // Ignore if DB write fails
        }

        return response()->json([
            'success' => true,
            'code' => $codeStr,
            'killed_pids' => array_values(array_unique($killedPids)),
            'log_message' => $logMessage,
            'message' => "Penghentian scraper agen {$codeStr} berhasil diselesaikan.",
        ]);
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

    private function runFastPhpScraper(ScraperProfile $profile, ?ScrapingAgent $agent, callable $sendData, int $maxPages, int $maxJobs): void
    {
        $scraper = new GenericFastScraper($profile, $profile->policy);
        $outputFile = storage_path("app/imports/{$profile->domain}_jobs.json");

        $sendData("[INFO] Starting FAST PHP scraper for {$profile->domain} (strategy: {$profile->strategy})...");

        // Ensure output directory exists
        $dir = dirname($outputFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        // Clear previous output file
        if (file_exists($outputFile)) {
            unlink($outputFile);
        }

        $count = 0;
        $startTime = microtime(true);

        foreach ($scraper->scrape($maxPages, $maxJobs) as $job) {
            $json = json_encode($job, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
            file_put_contents($outputFile, $json, FILE_APPEND | LOCK_EX);
            
            $count++;
            
            if ($count % 10 === 0) {
                $sendData("[INFO] Extracted {$count} jobs so far...");
            }
        }

        $elapsed = round(microtime(true) - $startTime, 2);
        $sendData("[SUCCESS] Extracted {$count} jobs in {$elapsed}s. Starting import...");

        if ($count > 0) {
            $this->runImportJob($outputFile, $profile->domain, $sendData);
        }
    }

    private function runPythonScraper(?ScrapingAgent $agent, callable $sendData, string $scriptName, int $maxPages, int $maxJobs, string $domainUrl = ''): void
    {
        $pythonBin = $this->findPythonBinary();
        $scriptPath = base_path('data-engine/' . $scriptName);
        
        if (!file_exists($scriptPath)) {
            $sendData("[ERROR] Python script not found: {$scriptPath}");
            return;
        }

        $args = [
            escapeshellarg($pythonBin),
            '-u',
            escapeshellarg($scriptPath),
        ];

        if ($scriptName === 'scrape_loker_enhanced.py') {
            $args[] = '--phase=all';
            $args[] = '--workers=4';
            $args[] = '--interval=2.0';
            if ($maxPages > 0 && $maxPages < 9999) {
                $args[] = "--max-pages={$maxPages}";
            }
            if ($maxJobs > 0 && $maxJobs < 999999) {
                $args[] = "--max-jobs={$maxJobs}";
            }
        } elseif ($scriptName === 'universal/run_pipeline.py') {
            $args[] = '--domain=' . escapeshellarg($domainUrl);
            if ($maxPages > 0 && $maxPages < 9999) {
                $args[] = "--max-pages={$maxPages}";
            }
            if ($maxJobs > 0 && $maxJobs < 999999) {
                $args[] = "--max-jobs={$maxJobs}";
            }
        }

        $cmd = implode(' ', $args);
        $sendData("[INFO] Runner Command: {$cmd}");

        $descriptorspec = [
            0 => ["pipe", "r"],
            1 => ["pipe", "w"],
            2 => ["pipe", "w"],
        ];

        $process = proc_open($cmd, $descriptorspec, $pipes, base_path());

        if (is_resource($process)) {
            $status = proc_get_status($process);
            $pid = $status['pid'] ?? null;
            if ($pid) {
                $pids = Cache::get('active_scraping_pids', []);
                $pids[] = $pid;
                Cache::put('active_scraping_pids', array_unique($pids), 3600);

                $pidFile = storage_path('app/scraping_pids.json');
                $filePids = file_exists($pidFile) ? (json_decode(file_get_contents($pidFile), true) ?: []) : [];
                $filePids[] = $pid;
                @file_put_contents($pidFile, json_encode(array_values(array_unique($filePids))));
            }


            fclose($pipes[0]);
            stream_set_blocking($pipes[1], false);
            stream_set_blocking($pipes[2], false);

            $wasAborted = false;

            while (true) {
                $status = proc_get_status($process);

                // Check abort request flag
                $abortGlobal = Cache::get("abort_requested_global", false);
                $abortAgent = $agent ? Cache::get("abort_requested_{$agent->id}", false) : false;
                $agentDbOffline = $agent ? (ScrapingAgent::find($agent->id)?->status === 'Offline') : false;

                if ($abortGlobal || $abortAgent || $agentDbOffline) {
                    $wasAborted = true;
                    $sendData("[SYSTEM] 🛑 Sinyal Abort diterima! Menghentikan process tree Python (PID: {$pid})...");
                    if ($pid) {
                        if (str_contains(PHP_OS_FAMILY, 'Windows')) {
                            exec("taskkill /F /T /PID {$pid} 2>NUL");
                        } else {
                            exec("kill -9 {$pid} 2>/dev/null");
                        }
                    }
                    break;
                }

                $stdout = fgets($pipes[1]);
                $stderr = fgets($pipes[2]);

                if ($stdout !== false && trim($stdout) !== '') {
                    $line = trim($stdout);
                    $prefix = str_contains(strtolower($line), 'error') ? '[ERROR] ' : 
                             (str_contains(strtolower($line), 'success') || str_contains(strtolower($line), 'complete') ? '[SUCCESS] ' : '[INFO] ');
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

            if ($wasAborted) {
                $sendData("[SYSTEM] 🛑 Scraper Python berhasil di-terminate secara paksa.", true);
                return;
            }

            if ($exitCode === 0) {
                $sendData("[SUCCESS] Python scraper completed with exit code 0.");
            } else {
                $sendData("[WARNING] Python scraper exited with code {$exitCode}.");
            }
        } else {
            $sendData("[ERROR] Failed to start Python scraper process.");
            return;
        }


        // Import step for Python scrapers
        $sendData("[INFO] Starting import (jobs:import)...");
        $this->runImportJob(
            base_path("database/datajson/lowongan_loker_id.json"), 
            'loker.id', 
            $sendData
        );
    }

    private function runImportJob(string $filePath, string $source, callable $sendData): void
    {
        if (!file_exists($filePath)) {
            $sendData("[WARNING] Import file not found: {$filePath}");
            return;
        }

        $phpBin = $this->findPhpBinary();
        $importCmd = escapeshellarg($phpBin) . ' -d memory_limit=512M ' . escapeshellarg(base_path('artisan')) . ' jobs:import --file=' . escapeshellarg($filePath) . ' --source=' . escapeshellarg($source);

        $descriptorspec = [
            0 => ["pipe", "r"],
            1 => ["pipe", "w"],
            2 => ["pipe", "w"],
        ];

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
    }
}
