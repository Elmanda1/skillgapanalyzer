<?php

namespace App\Console\Commands;

use App\Models\JobVacancy;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class FetchJobLogos extends Command
{
    protected $signature = 'jobs:fetch-logos
                            {--limit= : Stop after N jobs (useful for smoke tests)}
                            {--force : Re-download even if logo already local}';

    protected $description = 'Download job company logos into local storage (fixes expiring signed URLs & CORP blocks)';

    private int $downloaded = 0;

    private int $skipped = 0;

    private int $failed = 0;

    public function handle(): int
    {
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $force = (bool) $this->option('force');

        $query = JobVacancy::query()
            ->whereNotNull('company_logo')
            ->where('company_logo', '!=', '');

        if (! $force) {
            $query->where('company_logo', 'not like', '/storage/logos/%');
        }

        if ($limit) {
            $query->limit($limit);
        }

        $jobs = $query->orderBy('id')->get();
        $total = $jobs->count();

        if ($total === 0) {
            $this->info('Tidak ada logo yang perlu diunduh.');

            return self::SUCCESS;
        }

        $this->info("Mengunduh logo untuk {$total} lowongan...");

        foreach ($jobs as $job) {
            $result = $this->download($job);

            if ($result === 'downloaded') {
                $this->downloaded++;
            } elseif ($result === 'skipped') {
                $this->skipped++;
            } else {
                $this->failed++;
                $this->warn("  Gagal (id={$job->id}): " . substr($job->company_logo, 0, 80));
            }
        }

        $this->newLine();
        $this->info("Selesai: {$this->downloaded} diunduh | {$this->skipped} dilewati | {$this->failed} gagal.");

        return self::SUCCESS;
    }

    private function download(JobVacancy $job): string
    {
        $url = $job->company_logo;

        if (str_starts_with($url, '/storage/logos/')) {
            return 'skipped';
        }

        if (! filter_var($url, FILTER_VALIDATE_URL)) {
            return 'failed';
        }

        try {
            $response = Http::timeout(20)
                ->connectTimeout(10)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                    'Accept' => 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                ])
                ->get($url);

            if (! $response->successful()) {
                return 'failed';
            }

            $extension = $this->guessExtension($response->header('Content-Type'), $url);
            $name = 'logos/' . $job->id . '.' . $extension;

            Storage::disk('public')->put($name, $response->body());

            $job->forceFill(['company_logo' => '/storage/' . $name])->save();

            return 'downloaded';
        } catch (ConnectionException|\Throwable $e) {
            return 'failed';
        }
    }

    private function guessExtension(?string $contentType, string $url): string
    {
        $map = [
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            'image/svg' => 'svg',
            'image/svg+xml' => 'svg',
            'image/bmp' => 'bmp',
        ];

        foreach ($map as $mime => $ext) {
            if (str_contains((string) $contentType, $mime)) {
                return $ext;
            }
        }

        if (preg_match('/\.(jpg|jpeg)$/i', $url)) {
            return 'jpg';
        }

        return 'jpg';
    }
}
