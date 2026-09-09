<?php

namespace Database\Seeders;

use App\Models\ScraperProfile;
use App\Models\ScrapingPolicy;
use Illuminate\Database\Seeder;

class ScraperProfileSeeder extends Seeder
{
    public function run(): void
    {
        // JobStreet - uses public API
        $jobstreetPolicy = ScrapingPolicy::where('domain', 'id.jobstreet.com')->first();
        if ($jobstreetPolicy) {
            ScraperProfile::updateOrCreate(
                ['domain' => 'jobstreet.co.id'],
                [
                    'scraping_policy_id' => $jobstreetPolicy->id,
                    'name' => 'JobStreet Indonesia (API)',
                    'strategy' => 'api',
                    'api_endpoints' => [
                        'list' => 'https://id.jobstreet.com/api/chalice-search/v4/search?siteKey=ID-Main&page={page}&pageSize=50&keywords=',
                        'detail' => 'https://id.jobstreet.com/api/chalice-search/v4/search?siteKey=ID-Main&jobId={id}',
                    ],
                    'api_headers' => [
                        'Accept' => 'application/json',
                        'Accept-Language' => 'id-ID,id;q=0.9,en;q=0.8',
                        'X-Requested-With' => 'XMLHttpRequest',
                        'User-Agent' => 'SkillGapBot/1.0 (+https://skillgapanalyzer.test/bot; bot@skillgapanalyzer.test)',
                    ],
                    'json_field_mapping' => [
                        'title' => 'data[0].title',
                        'company_name' => 'data[0].company.name',
                        'location' => 'data[0].location',
                        'salary_min' => 'data[0].salary.min',
                        'salary_max' => 'data[0].salary.max',
                        'job_type' => 'data[0].workType',
                        'job_experience' => 'data[0].experience',
                        'is_remote' => 'data[0].isRemote',
                        'skills' => 'data[0].classifications[*].name',
                        'description' => 'data[0].description',
                        'requirements' => 'data[0].requirements',
                        'source_url' => 'data[0].jobUrl',
                    ],
                    'job_id_extractor' => '/job/([a-zA-Z0-9-]+)',
                    'crawl_delay_seconds' => 2.0,
                    'concurrency' => 4,
                    'is_active' => true,
                ]);
        }

        // Glints - GraphQL API
        $glintsPolicy = ScrapingPolicy::where('domain', 'glints.com')->first();
        if ($glintsPolicy) {
            ScraperProfile::updateOrCreate(
                ['domain' => 'glints.com'],
                [
                    'scraping_policy_id' => $glintsPolicy->id,
                    'name' => 'Glints Indonesia (GraphQL)',
                    'strategy' => 'api',
                    'api_endpoints' => [
                        'list' => 'https://glints.com/id/api/graphql',
                        'detail' => 'https://glints.com/id/api/graphql',
                    ],
                    'api_headers' => [
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                        'User-Agent' => 'SkillGapBot/1.0 (+https://skillgapanalyzer.test/bot; bot@skillgapanalyzer.test)',
                    ],
                    'json_field_mapping' => [
                        'title' => 'data.job.title',
                        'company_name' => 'data.job.company.name',
                        'location' => 'data.job.location',
                        'salary_min' => 'data.job.salary.min',
                        'salary_max' => 'data.job.salary.max',
                        'skills' => 'data.job.skills[*].name',
                        'description' => 'data.job.description',
                        'source_url' => 'data.job.url',
                    ],
                    'job_id_extractor' => '/job/([a-zA-Z0-9-]+)',
                    'crawl_delay_seconds' => 3.0,
                    'concurrency' => 2,
                    'is_active' => false, // GraphQL requires specific query structure
                ]);
        }

        // Kalibrr - API
        $kalibrrPolicy = ScrapingPolicy::where('domain', 'kalibrr.com')->first();
        if ($kalibrrPolicy) {
            ScraperProfile::updateOrCreate(
                ['domain' => 'kalibrr.com'],
                [
                    'scraping_policy_id' => $kalibrrPolicy->id,
                    'name' => 'Kalibrr (API)',
                    'strategy' => 'api',
                    'api_endpoints' => [
                        'list' => 'https://www.kalibrr.com/api/v1/search?page={page}&limit=50',
                        'detail' => 'https://www.kalibrr.com/api/v1/job/{id}',
                    ],
                    'api_headers' => [
                        'Accept' => 'application/json',
                        'User-Agent' => 'SkillGapBot/1.0 (+https://skillgapanalyzer.test/bot; bot@skillgapanalyzer.test)',
                    ],
                    'json_field_mapping' => [
                        'title' => 'data[0].name',
                        'company_name' => 'data[0].company.name',
                        'location' => 'data[0].location',
                        'salary_min' => 'data[0].salary.from',
                        'salary_max' => 'data[0].salary.to',
                        'skills' => 'data[0].skills[*].name',
                        'description' => 'data[0].description',
                        'source_url' => 'data[0].url',
                    ],
                    'job_id_extractor' => '/job/([a-zA-Z0-9-]+)',
                    'crawl_delay_seconds' => 2.0,
                    'concurrency' => 4,
                    'is_active' => false,
                ]);
        }

        // KitaLulus - HTML selectors (fallback)
        $kitalulusPolicy = ScrapingPolicy::where('domain', 'kitalulus.com')->first();
        if ($kitalulusPolicy) {
            ScraperProfile::updateOrCreate(
                ['domain' => 'kitalulus.com'],
                [
                    'scraping_policy_id' => $kitalulusPolicy->id,
                    'name' => 'KitaLulus (HTML Selectors)',
                    'strategy' => 'html_selectors',
                    'list_selectors' => [
                        'item' => '.job-card, .vacancy-item, [data-testid="job-card"]',
                        'detail_link' => 'a.job-link@href, a[href*="/lowongan/"]@href',
                        'title' => '.job-title, h3.title',
                        'company' => '.company-name, .employer-name',
                        'location' => '.location, .job-location',
                    ],
                    'detail_selectors' => [
                        'title' => 'h1.job-title, h1.title',
                        'company_name' => '.company-name, .employer-name',
                        'location' => '.job-location, .location',
                        'salary_min' => '.salary-min, [data-salary-min]',
                        'salary_max' => '.salary-max, [data-salary-max]',
                        'job_type' => '.job-type, .employment-type',
                        'job_experience' => '.experience, .years-experience',
                        'is_remote' => '.remote-badge, .work-from-home',
                        'description' => '.job-description, .description',
                        'requirements' => '.requirements li, .qualifications li',
                        'skills' => '.skills .tag, .tech-stack .tag',
                    ],
                    'pagination' => [
                        'type' => 'page_param',
                        'param' => 'page',
                        'max' => 50,
                    ],
                    'crawl_delay_seconds' => 5.0,
                    'concurrency' => 2,
                    'is_active' => false,
                ]);
        }

        // LinkedIn - HTML selectors (fallback)
        $linkedinPolicy = ScrapingPolicy::firstOrCreate(
            ['domain' => 'linkedin.com'],
            [
                'name' => 'LinkedIn Jobs',
                'base_url' => 'https://www.linkedin.com',
                'robots_txt_url' => 'https://www.linkedin.com/robots.txt',
                'rate_limit_per_minute' => 10,
                'rate_limit_per_hour' => 200,
                'crawl_delay_seconds' => 5.0,
                'allowed_paths' => ['/jobs/search*', '/jobs/view*'],
                'disallowed_paths' => ['/login*', '/feed*', '/in/*', '/company/*'],
                'user_agent' => 'SkillGapBot/1.0 (+https://skillgapanalyzer.test/bot; bot@skillgapanalyzer.test)',
                'is_active' => false,
            ]);
        
        ScraperProfile::updateOrCreate(
            ['domain' => 'linkedin.com'],
            [
                'scraping_policy_id' => $linkedinPolicy->id,
                'name' => 'LinkedIn Jobs (HTML Selectors)',
                'strategy' => 'html_selectors',
                'list_selectors' => [
                    'item' => '.job-search-card, .jobs-search-results__list-item',
                    'detail_link' => 'a.job-search-card__link@href, a[href*="/jobs/view/"]@href',
                    'title' => '.job-search-card__title, h3',
                    'company' => '.job-search-card__company-name, h4',
                    'location' => '.job-search-card__location',
                ],
                'detail_selectors' => [
                    'title' => '.job-title, h1.t-24',
                    'company_name' => '.company-name, .jobs-unified-top-card__company-name',
                    'location' => '.job-location, .jobs-unified-top-card__bullet',
                    'job_type' => '.job-type, .employment-type',
                    'job_experience' => '.experience-level',
                    'description' => '.job-description, .jobs-description__content',
                    'skills' => '.skill-tag, .jobs-unified-top-card__skills .skill',
                ],
                'pagination' => [
                    'type' => 'page_param',
                    'param' => 'start',
                    'max' => 20,
                ],
                'crawl_delay_seconds' => 5.0,
                'concurrency' => 1,
                'is_active' => false,
            ]);

        $this->command->info('Scraper profiles seeded successfully.');
    }
}