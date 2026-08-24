<?php

namespace App\Console\Commands;

use App\Jobs\FetchJobsJob;
use App\Models\ScrapingLog;
use App\Models\ScrapingPolicy;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Exception\ProcessFailedException;

class JobFetchScheduler extends Command
{
    protected $signature = 'jobs:fetch-scheduled
                            {--policy=loker.id : Scraping policy domain to use}
                            {--phase=enumerate : Phase to run (enumerate|detail|aggregate|all)}
                            {--max-pages=5 : Max pages for enumeration}
                            {--max-jobs=50 : Max jobs for detail scraping}
                            {--workers=2 : Number of worker threads}
                            {--queue : Dispatch to queue instead of running synchronously}
                            {--force : Run even if another instance is running}
                            {--dry-run : Log what would be done without executing}';

    protected $description = 'Scheduled job fetcher with legal compliance (robots.txt, rate limits, PII filtering)';

    private ?ScrapingLog $currentLog = null;

    public function handle(): int
    {
        $policyDomain = $this->option('policy');
        $phase = $this->option('phase');
        $maxPages = (int) $this->option('max-pages');
        $maxJobs = (int) $this->option('max-jobs');
        $workers = (int) $this->option('workers');
        $force = $this->option('force');
        $dryRun = $this->option('dry-run');

        $policy = ScrapingPolicy::getForDomain($policyDomain);
        if (!$policy) {
            $this->error("Policy tidak ditemukan untuk domain: {$policyDomain}");
            return self::FAILURE;
        }

        if (!$policy->is_active) {
            $this->warn("Policy {$policyDomain} tidak aktif. Gunakan --force untuk memaksa.");
            if (!$force) {
                return self::SUCCESS;
            }
        }

        // Prevent concurrent runs unless forced
        $lockKey = "job_fetch_{$policyDomain}_{$phase}";
        if (!$force && cache()->has($lockKey)) {
            $this->warn("Job sudah berjalan (lock aktif). Gunakan --force untuk memaksa.");
            return self::SUCCESS;
        }

        if (!$dryRun) {
            cache()->put($lockKey, true, now()->addHours(2));
        }

        $correlationId = 'scheduled_' . $policyDomain . '_' . $phase . '_' . now()->format('Ymd_His');

        $this->info("Memulai JobFetchScheduler");
        $this->info("Policy: {$policy->name} ({$policy->domain})");
        $this->info("Phase: {$phase} | Max pages: {$maxPages} | Max jobs: {$maxJobs} | Workers: {$workers}");
        $this->info("Correlation ID: {$correlationId}");

        // Create log entry
        $this->currentLog = ScrapingLog::create([
            'scraping_policy_id' => $policy->id,
            'url' => $policy->base_url,
            'method' => 'CLI_SCHEDULED',
            'status' => 'running',
            'started_at' => now(),
            'retry_count' => 0,
        ]);

        $startTime = microtime(true);

        $useQueue = $this->option('queue');

        try {
            if ($dryRun) {
                $this->info("[DRY RUN] Akan menjalankan: python scrape_loker_enhanced.py --phase={$phase} --max-pages={$maxPages} --max-jobs={$maxJobs} --workers={$workers} --correlation-id={$correlationId}");
                $this->currentLog->update([
                    'status' => 'success',
                    'completed_at' => now(),
                    'items_found' => 0,
                    'items_imported' => 0,
                ]);
                return self::SUCCESS;
            }

            if ($useQueue) {
                $this->info("Dispatching ke queue...");
                \App\Jobs\FetchJobsJob::dispatch(
                    policyDomain: $policyDomain,
                    phase: $phase,
                    maxPages: $maxPages,
                    maxJobs: $maxJobs,
                    workers: $workers,
                    correlationId: $correlationId,
                )->onQueue('job_fetching');
                
                $this->currentLog->update([
                    'status' => 'queued',
                    'completed_at' => now(),
                    'items_found' => 0,
                    'items_imported' => 0,
                ]);
                
                $this->info("Job telah di-dispatch ke queue 'job_fetching'.");
                return self::SUCCESS;
            }

            $this->runPythonScraper($policy, $phase, $maxPages, $maxJobs, $workers, $correlationId);
            $this->runLaravelImport($policy, $correlationId);
            $this->runLaravelAggregate($correlationId);

            $duration = round(microtime(true) - $startTime, 2);
            $this->info("Selesai dalam {$duration}s");

            $this->currentLog->update([
                'status' => 'success',
                'completed_at' => now(),
                'response_time_ms' => (int) ($duration * 1000),
            ]);

            return self::SUCCESS;

        } catch (\Throwable $e) {
            $duration = round(microtime(true) - $startTime, 2);
            $this->error("Error: " . $e->getMessage());
            Log::error("JobFetchScheduler failed", [
                'policy' => $policyDomain,
                'phase' => $phase,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'correlation_id' => $correlationId,
            ]);

            $this->currentLog->update([
                'status' => 'failed',
                'completed_at' => now(),
                'response_time_ms' => (int) (($duration ?? 0) * 1000),
                'error_message' => $e->getMessage(),
            ]);

            return self::FAILURE;
        } finally {
            cache()->forget($lockKey);
        }
    }

    private function runPythonScraper(ScrapingPolicy $policy, string $phase, int $maxPages, int $maxJobs, int $workers, string $correlationId): void
    {
        $scriptPath = base_path('data-engine/scrape_loker_enhanced.py');
        if (!file_exists($scriptPath)) {
            throw new \RuntimeException("Python script not found: {$scriptPath}");
        }

        $pythonBin = $this->findPythonBinary();
        
        $args = [
            $pythonBin,
            base_path('data-engine/scrape_loker_enhanced.py'),
            '--phase=' . $phase,
            '--max-pages=' . $maxPages,
            '--max-jobs=' . $maxJobs,
            '--workers=' . $workers,
            '--correlation-id=' . $correlationId,
        ];

        $this->info("Menjalankan Python scraper: " . implode(' ', $args));

        $process = Process::command($args)
            ->timeout(3600)
            ->idleTimeout(300)
            ->run();

        if (!$process->successful()) {
            $errorOutput = $process->errorOutput();
            $this->error("Python scraper gagal: " . $errorOutput);
            
            $this->currentLog->update([
                'status' => 'failed',
                'error_message' => 'Python scraper failed: ' . $errorOutput,
                'completed_at' => now(),
            ]);
            
            throw new \RuntimeException("Python scraper failed: {$errorOutput}");
        }

        $output = $process->output();
        $this->info("Python scraper output: " . substr($output, -500));
        
        // Parse output for stats
        if (preg_match('/unique ids: (\d+) \(reported total (\d+)\)/', $output, $matches)) {
            $this->currentLog->update([
                'items_found' => (int) $matches[1],
            ]);
        }
    }

    private function runLaravelImport(string $policyDomain, string $correlationId): void
    {
        $this->info("Menjalankan Laravel jobs:import (memory_limit=512M)...");
        
        $filePath = base_path("database/datajson/lowongan_loker_id.json");
        if (!file_exists($filePath)) {
            $this->warn("File aggregate tidak ditemukan: {$filePath}");
            return;
        }

        $phpBin = $this->findPhpBinary();
        $artisanPath = base_path('artisan');
        
        $process = Process::command([$phpBin, '-d', 'memory_limit=512M', $artisanPath, 'jobs:import', '--file=' . $filePath, '--source=' . $policyDomain])
            ->timeout(300)
            ->run();

        if (!$process->successful()) {
            $this->error("Import gagal: " . $process->errorOutput());
            return;
        }

        $this->info($process->output());

        // Count imported
        $imported = \App\Models\JobVacancy::where('sumber', $policyDomain)->count();
        $this->currentLog->update(['items_imported' => $imported]);
        $this->info("Import selesai: {$imported} lowongan");
    }

    private function runLaravelAggregate(string $correlationId): void
    {
        $this->info("Menjalankan analisis kesenjangan (jobs:analyze)...");
        
        $this->call('analysis:run');
        
        $this->info("Analisis selesai");
    }

    private function findPythonBinary(): string
    {
        // Try common locations
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