<?php

namespace App\Jobs;

use App\Models\ScrapingLog;
use App\Models\ScrapingPolicy;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Throwable;

class FetchJobsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The maximum number of seconds the job can run before timing out.
     */
    public int $timeout = 3600;

    public function __construct(
        public string $policyDomain = 'loker.id',
        public string $phase = 'all',
        public int $maxPages = 5,
        public int $maxJobs = 50,
        public int $workers = 2,
        public string $correlationId = '',
    ) {
        if (empty($this->correlationId)) {
            $this->correlationId = 'queued_' . $this->policyDomain . '_' . $this->phase . '_' . now()->format('Ymd_His');
        }
    }

    public function handle(): void
    {
        $policy = ScrapingPolicy::getForDomain($this->policyDomain);
        if (!$policy || !$policy->is_active) {
            Log::warning("Policy {$this->policyDomain} tidak ditemukan atau tidak aktif");
            return;
        }

        $correlationId = $this->correlationId;
        $log = ScrapingLog::create([
            'scraping_policy_id' => (new \App\Models\ScrapingPolicy())->getForDomain($this->policyDomain)?->id,
            'url' => (new \App\Models\ScrapingPolicy())->getForDomain($this->policyDomain)?->base_url ?? '',
            'method' => 'QUEUED',
            'status' => 'running',
            'started_at' => now(),
            'retry_count' => $this->attempts() - 1,
        ]);

        $startTime = microtime(true);

        try {
            $this->runPythonScraper($log);
            $this->runLaravelImport($this->policyDomain, $correlationId);
            $this->runLaravelAggregate($correlationId);

            $duration = round(microtime(true) - $startTime, 2);
            $log->update([
                'status' => 'success',
                'completed_at' => now(),
                'response_time_ms' => (int) ($duration * 1000),
            ]);

        } catch (\Throwable $e) {
            $duration = round(microtime(true) - $startTime, 2);
            Log::error("FetchJobsJob failed", [
                'policy' => $this->policyDomain,
                'phase' => $this->phase,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'correlation_id' => $correlationId,
                'attempt' => $this->attempts(),
            ]);

            $log->update([
                'status' => 'failed',
                'completed_at' => now(),
                'response_time_ms' => (int) ($duration * 1000),
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    private function runPythonScraper(ScrapingLog $log): void
    {
        $policy = ScrapingPolicy::getForDomain($this->policyDomain);
        $scriptPath = base_path('data-engine/scrape_loker_enhanced.py');
        
        if (!file_exists($scriptPath)) {
            throw new \RuntimeException("Python script not found: {$scriptPath}");
        }

        $pythonBin = $this->findPythonBinary();
        
        $args = [
            $pythonBin,
            base_path('data-engine/scrape_loker_enhanced.py'),
            '--phase=' . $this->phase,
            '--max-pages=' . $this->maxPages,
            '--max-jobs=' . $this->maxJobs,
            '--workers=' . $this->workers,
            '--correlation-id=' . $this->correlationId,
        ];

        Log::info("Menjalankan Python scraper", ['args' => implode(' ', $args)]);

        $process = Process::command($args)
            ->timeout(3600)
            ->idleTimeout(300)
            ->run();

        if (!$process->successful()) {
            $errorOutput = $process->errorOutput();
            Log::error("Python scraper gagal", ['error' => $errorOutput]);
            throw new \RuntimeException("Python scraper failed: {$errorOutput}");
        }

        $output = $process->output();
        Log::info("Python scraper output", ['output' => substr($output, -500)]);
        
        // Parse output for stats
        if (preg_match('/unique ids: (\d+) \(reported total (\d+)\)/', $output, $matches)) {
            // Could update log here if needed
        }
    }

    private function runLaravelImport(string $policyDomain, string $correlationId): void
    {
        Log::info("Menjalankan Laravel jobs:import (memory_limit=512M)");
        
        $filePath = base_path("database/datajson/lowongan_loker_id.json");
        if (!file_exists($filePath)) {
            Log::warning("File aggregate tidak ditemukan: {$filePath}");
            return;
        }

        $phpBin = $this->findPhpBinary();
        $artisanPath = base_path('artisan');
        
        $process = Process::command([$phpBin, '-d', 'memory_limit=512M', base_path('artisan'), 'jobs:import', '--file=' . $filePath, '--source=' . $policyDomain])
            ->timeout(300)
            ->run();

        if (!$process->successful()) {
            Log::error("Import gagal", ['error' => $process->errorOutput()]);
            return;
        }

        Log::info($process->output());
    }

    private function runLaravelAggregate(string $correlationId): void
    {
        Log::info("Menjalankan analisis kesenjangan (jobs:analyze)");
        
        $process = Process::command(['php', base_path('artisan'), 'analysis:run'])
            ->timeout(120)
            ->run();

        if (!$process->successful()) {
            Log::error("Analisis gagal", ['error' => $process->errorOutput()]);
            return;
        }

        Log::info("Analisis selesai");
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

        return 'python3'; // fallback
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

        return 'php'; // fallback
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