<?php

namespace App\Console\Commands;

use App\Models\ScraperProfile;
use App\Services\Scraping\GenericFastScraper;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ScrapeJobs extends Command
{
    protected $signature = 'jobs:scrape
                            {profile : Profile domain (e.g. jobstreet.co.id)}
                            {--max-pages=10 : Maximum listing pages to crawl}
                            {--max-jobs=50 : Maximum jobs to extract}
                            {--output= : Custom output file path (default: storage/app/imports/{domain}_jobs.json)}';

    protected $description = 'Scrape job listings using configured ScraperProfile (API or HTML selectors)';

    public function handle(): int
    {
        $domain = $this->argument('profile');
        $maxPages = (int) $this->option('max-pages');
        $maxJobs = (int) $this->option('max-jobs');

        $profile = ScraperProfile::where('domain', $domain)->where('is_active', true)->first();

        if (!$profile) {
            $this->error("No active ScraperProfile found for domain: {$domain}");
            $this->info('Available profiles:');
            ScraperProfile::where('is_active', true)->get()->each(function ($p) {
                $this->line("  - {$p->domain} ({$p->strategy}) - {$p->name}");
            });
            return self::FAILURE;
        }

        $this->info("Starting scrape for {$profile->name} ({$profile->domain})");
        $this->info("Strategy: {$profile->strategy} | Max pages: {$maxPages} | Max jobs: {$maxJobs}");

        $outputFile = $this->option('output') 
            ?? storage_path("app/imports/{$profile->domain}_jobs.json");

        $this->ensureOutputDirectory($outputFile);

        $scraper = new GenericFastScraper($profile, $profile->policy);
        $count = 0;
        $startTime = microtime(true);

        $this->output->progressStart($maxJobs);

        foreach ($scraper->scrape($maxPages, $maxJobs) as $job) {
            $this->appendJsonLine($outputFile, $job);
            $count++;
            $this->output->progressAdvance();
        }

        $this->output->progressFinish();

        $elapsed = round(microtime(true) - $startTime, 2);
        $this->newLine();
        $this->info("Scraping completed in {$elapsed}s");
        $this->info("Jobs extracted: {$count}");
        $this->info("Output file: {$outputFile}");

        if ($count > 0) {
            $this->info("Running jobs:import...");
            $this->call('jobs:import', [
                '--file' => $outputFile,
                '--source' => $profile->domain,
            ]);
        }

        return self::SUCCESS;
    }

    private function ensureOutputDirectory(string $path): void
    {
        $dir = dirname($path);
        if (!File::isDirectory($dir)) {
            File::makeDirectory($dir, 0775, true);
        }
    }

    private function appendJsonLine(string $path, array $data): void
    {
        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
        File::append($path, $json);
    }
}