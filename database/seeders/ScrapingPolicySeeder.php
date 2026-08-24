<?php

namespace Database\Seeders;

use App\Models\ScrapingPolicy;
use Illuminate\Database\Seeder;

class ScrapingPolicySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // loker.id - Primary source
        ScrapingPolicy::updateOrCreate(
            ['domain' => 'loker.id'],
            [
                'name' => 'loker.id - Indonesian Job Portal',
                'base_url' => 'https://www.loker.id',
                'robots_txt_url' => 'https://www.loker.id/robots.txt',
                'rate_limit_per_minute' => 30,
                'rate_limit_per_hour' => 1000,
                'crawl_delay_seconds' => 2.0,
                'allowed_paths' => [
                    '/cari-lowongan-kerja*',
                    '/lowongan/*',
                    '/perusahaan/*',
                ],
                'disallowed_paths' => [
                    '/admin*',
                    '/api/*',
                    '/account*',
                    '/login*',
                    '/register*',
                    '/search*',
                    '*/edit*',
                    '*/delete*',
                ],
                'user_agent' => 'SkillGapBot/1.0 (+https://skillgapanalyzer.test/bot; bot@skillgapanalyzer.test)',
                'requires_auth' => false,
                'pii_fields_to_strip' => [
                    'email',
                    'phone',
                    'phone_number',
                    'mobile',
                    'whatsapp',
                    'contact_person',
                    'recruiter_name',
                    'recruiter_email',
                    'recruiter_phone',
                    'hr_email',
                    'hr_phone',
                    'alamat_lengkap',
                    'ktp',
                    'npwp',
                    'bank_account',
                ],
                'custom_headers' => [
                    'Accept-Language' => 'id-ID,id;q=0.9,en;q=0.8',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Cache-Control' => 'no-cache',
                ],
                'is_active' => true,
                'notes' => 'Primary Indonesian job portal. Uses Remix SSR. Public API via chalice-search/v4/search endpoint. Respects crawl-delay and robots.txt.',
            ]);

        // JobStreet (SEA) - Secondary source via public API
        ScrapingPolicy::updateOrCreate(
            ['domain' => 'id.jobstreet.com'],
            [
                'name' => 'JobStreet Indonesia (SEEK Group)',
                'base_url' => 'https://id.jobstreet.com',
                'robots_txt_url' => 'https://id.jobstreet.com/robots.txt',
                'rate_limit_per_minute' => 30,
                'rate_limit_per_hour' => 500,
                'crawl_delay_seconds' => 2.0,
                'allowed_paths' => [
                    '/api/chalice-search/v4/search*',
                    '/id/job-search/*',
                ],
                'disallowed_paths' => [
                    '/admin*',
                    '/employer*',
                    '/profile*',
                    '/login*',
                    '/register*',
                    '/saved*',
                    '/applications*',
                ],
                'user_agent' => 'SkillGapBot/1.0 (+https://skillgapanalyzer.test/bot; bot@skillgapanalyzer.test)',
                'requires_auth' => false,
                'pii_fields_to_strip' => [
                    'email',
                    'phone',
                    'contact_name',
                    'recruiter_name',
                    'recruiter_email',
                    'recruiter_phone',
                ],
                'custom_headers' => [
                    'Accept' => 'application/json',
                    'Accept-Language' => 'id-ID,id;q=0.9,en;q=0.8',
                    'X-Requested-With' => 'XMLHttpRequest',
                ],
                'is_active' => false, // Enable when implementing JobStreet fetcher
                'notes' => 'Part of SEEK Group. Public JSON API available at /api/chalice-search/v4/search. Requires siteKey=ID-Main. ToS prohibits scraping but API is public.',
            ]);

        // Glints Indonesia - Secondary source
        ScrapingPolicy::updateOrCreate(
            ['domain' => 'glints.com'],
            [
                'name' => 'Glints Indonesia',
                'base_url' => 'https://glints.com',
                'robots_txt_url' => 'https://glints.com/robots.txt',
                'rate_limit_per_minute' => 20,
                'rate_limit_per_hour' => 300,
                'crawl_delay_seconds' => 3.0,
                'allowed_paths' => [
                    '/id/api/graphql*',
                    '/id/lowongan-kerja*',
                    '/id/explore*',
                ],
                'disallowed_paths' => [
                    '/admin*',
                    '/employer*',
                    '/profile*',
                    '/login*',
                    '/register*',
                    '/chat*',
                    '/settings*',
                ],
                'user_agent' => 'SkillGapBot/1.0 (+https://skillgapanalyzer.test/bot; bot@skillgapanalyzer.test)',
                'requires_auth' => false,
                'pii_fields_to_strip' => [
                    'email',
                    'phone',
                    'recruiter_name',
                    'recruiter_email',
                ],
                'custom_headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ],
                'is_active' => false, // Enable when implementing Glints fetcher
                'notes' => 'GraphQL API at /id/api/graphql. Reverse-engineered schema. ToS prohibits automated access. Use with caution.',
            ]);

        // KitaLulus - Government-backed platform
        ScrapingPolicy::updateOrCreate(
            ['domain' => 'kitalulus.com'],
            [
                'name' => 'KitaLulus (Kemnaker RI)',
                'base_url' => 'https://kitalulus.com',
                'robots_txt_url' => 'https://kitalulus.com/robots.txt',
                'rate_limit_per_minute' => 10,
                'rate_limit_per_hour' => 200,
                'crawl_delay_seconds' => 5.0,
                'allowed_paths' => [
                    '/api/*',
                    '/lowongan*',
                ],
                'disallowed_paths' => [
                    '/admin*',
                    '/profile*',
                    '/login*',
                    '/register*',
                    '/cv*',
                ],
                'user_agent' => 'SkillGapBot/1.0 (+https://skillgapanalyzer.test/bot; bot@skillgapanalyzer.test)',
                'requires_auth' => false,
                'pii_fields_to_strip' => [
                    'email',
                    'phone',
                    'whatsapp',
                    'contact_person',
                ],
                'custom_headers' => [
                    'Accept' => 'application/json',
                ],
                'is_active' => false, // Enable when implementing KitaLulus fetcher
                'notes' => 'Government-backed platform (Kemnaker RI). App-driven, locked down. No public API. Parse.bot provides managed wrapper.',
            ]);

        $this->command->info('Scraping policies seeded successfully.');
    }
}