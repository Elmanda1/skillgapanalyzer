<?php

namespace App\Http\Controllers;

use App\Models\ScrapingLog;
use App\Models\ScrapingPolicy;
use App\Models\JobVacancy;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class HealthCheckController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = [];
        $overallStatus = 'healthy';

        // 1. Database connectivity
        try {
            DB::connection()->getPdo();
            $checks['database'] = ['status' => 'healthy', 'message' => 'Connected'];
        } catch (\Throwable $e) {
            $checks['database'] = ['status' => 'unhealthy', 'message' => $e->getMessage()];
            $overallStatus = 'unhealthy';
        }

        // 2. Queue status
        try {
            $pendingJobs = \Illuminate\Support\Facades\Queue::size('job_fetching');
            $checks['queue'] = [
                'status' => 'healthy',
                'message' => "Queue operational",
                'pending_jobs' => $pendingJobs,
            ];
        } catch (\Throwable $e) {
            $checks['queue'] = ['status' => 'degraded', 'message' => $e->getMessage()];
            $overallStatus = 'degraded';
        }

        // 3. Scraping pipeline health
        $latestLog = ScrapingLog::latest()->first();
        if ($latestLog) {
            $lastRun = $latestLog->started_at;
            $minutesSinceLastRun = $lastRun->diffInMinutes(now());
            $pipelineStatus = $minutesSinceLastRun < 60 ? 'healthy' : ($minutesSinceLastRun < 24 * 60 ? 'degraded' : 'unhealthy');
            
            $checks['scraping_pipeline'] = [
                'status' => $pipelineStatus,
                'message' => "Last run {$minutesSinceLastRun} minutes ago",
                'last_run' => $lastRun->toIso8601String(),
                'last_status' => $latestLog->status,
            ];
            if ($pipelineStatus !== 'healthy') {
                $overallStatus = 'degraded';
            }
        } else {
            $checks['scraping_pipeline'] = ['status' => 'unhealthy', 'message' => 'No runs recorded'];
            $overallStatus = 'unhealthy';
        }

        // 4. Data freshness
        $latestJob = JobVacancy::latest('tanggal_crawl')->first();
        if ($latestJob) {
            $daysSinceCrawl = $latestJob->tanggal_crawl->diffInDays(now());
            $dataFreshness = $daysSinceCrawl <= 1 ? 'healthy' : ($daysSinceCrawl <= 7 ? 'degraded' : 'unhealthy');
            
            $checks['data_freshness'] = [
                'status' => $dataFreshness,
                'message' => "Latest crawl: {$latestJob->tanggal_crawl->toDateString()} ({$daysSinceCrawl} days ago)",
                'latest_crawl_date' => $latestJob->tanggal_crawl->toDateString(),
            ];
            if ($dataFreshness !== 'healthy') {
                $overallStatus = 'degraded';
            }
        } else {
            $checks['data_freshness'] = ['status' => 'unhealthy', 'message' => 'No job data found'];
            $overallStatus = 'unhealthy';
        }

        // 5. Redis connectivity (if configured)
        try {
            Redis::connection()->ping();
            $checks['redis'] = ['status' => 'healthy', 'message' => 'Connected'];
        } catch (\Throwable $e) {
            $checks['redis'] = ['status' => 'degraded', 'message' => 'Redis not available: ' . $e->getMessage()];
            // Redis is optional, don't mark overall as unhealthy
        }

        // 6. Storage availability
        try {
            $freeSpace = disk_free_space(storage_path());
            $totalSpace = disk_total_space(storage_path());
            $freePercent = $totalSpace > 0 ? round(($freeSpace / $totalSpace) * 100, 1) : 0;
            
            $storageStatus = $freePercent > 10 ? 'healthy' : ($freePercent > 5 ? 'degraded' : 'unhealthy');
            $checks['storage'] = [
                'status' => $storageStatus,
                'message' => "{$freePercent}% free ({$this->formatBytes($freeSpace)} / {$this->formatBytes($totalSpace)})",
                'free_percent' => $freePercent,
            ];
            if ($storageStatus !== 'healthy') {
                $overallStatus = 'degraded';
            }
        } catch (\Throwable $e) {
            $checks['storage'] = ['status' => 'degraded', 'message' => $e->getMessage()];
        }

        // 7. Active policies
        $activePolicies = ScrapingPolicy::where('is_active', true)->count();
        $checks['active_policies'] = [
            'status' => $activePolicies > 0 ? 'healthy' : 'degraded',
            'message' => "{$activePolicies} active scraping policies",
        ];
        if ($activePolicies === 0) {
            $overallStatus = 'degraded';
        }

        $httpStatus = $overallStatus === 'healthy' ? 200 : ($overallStatus === 'degraded' ? 200 : 503);

        return response()->json([
            'status' => $overallStatus,
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
        ], $httpStatus);
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $factor = floor((strlen($bytes) - 1) / 3);
        return round($bytes / (1024 ** $factor), 2) . ' ' . $units[$factor];
    }
}