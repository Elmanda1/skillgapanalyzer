<?php

namespace App\Services\Scraping;

use App\Models\ScraperProfile;
use App\Models\ScrapingPolicy;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Symfony\Component\DomCrawler\Crawler;

class GenericFastScraper
{
    private ScrapingHttpClient $httpClient;

    public function __construct(
        private ScraperProfile $profile,
        private ScrapingPolicy $policy
    ) {
        $this->httpClient = new ScrapingHttpClient($policy);
    }

    public function scrape(int $maxPages = 10, int $maxJobs = 50): \Generator
    {
        $urls = $this->enumerate($maxPages);
        $count = 0;

        foreach ($urls as $url) {
            if ($count >= $maxJobs) {
                break;
            }

            $job = $this->fetchDetail($url);
            if ($job) {
                $count++;
                yield $job;
            }

            // Polite delay between detail requests
            $this->politeDelay();
        }

        Log::info("Scraping complete", [
            'domain' => $this->profile->domain,
            'pages_crawled' => $maxPages,
            'jobs_extracted' => $count,
        ]);
    }

    private function enumerate(int $maxPages): array
    {
        $urls = [];

        if ($this->profile->strategy === 'api' && $this->profile->api_endpoints['list'] ?? null) {
            return $this->enumerateApi($maxPages);
        }

        return $this->enumerateHtml($maxPages);
    }

    private function enumerateApi(int $maxPages): array
    {
        $urls = [];
        $listUrlTemplate = $this->profile->api_endpoints['list'];

        for ($page = 1; $page <= $maxPages; $page++) {
            $listUrl = str_replace('{page}', (string) $page, $listUrlTemplate);

            $response = $this->httpClient->get($listUrl, $this->profile->api_headers ?? []);
            if (!$response) {
                break;
            }

            $data = json_decode($response, true);
            if (!$data) {
                break;
            }

            $items = $this->extractArrayFromJson($data, 'data');
            if (empty($items)) {
                break;
            }

            $detailTemplate = $this->profile->api_endpoints['detail'] ?? '';
            $idExtractor = $this->profile->job_id_extractor ?? '/job/([a-zA-Z0-9-]+)';

            foreach ($items as $item) {
                $jobId = $this->extractJobId($item, $idExtractor);
                if ($jobId && $detailTemplate) {
                    $detailUrl = str_replace('{id}', $jobId, $detailTemplate);
                    $urls[] = $detailUrl;
                }
            }

            if (count($items) < 20) {
                break; // Last page
            }
        }

        return array_unique($urls);
    }

    private function enumerateHtml(int $maxPages): array
    {
        $urls = [];
        $listSelectors = $this->profile->list_selectors ?? [];
        $pagination = $this->profile->pagination ?? ['type' => 'page_param', 'param' => 'page', 'max' => 50];

        $baseUrl = $this->policy->base_url;
        $listingPath = $this->policy->allowed_paths[0] ?? '/';

        for ($page = 1; $page <= min($maxPages, $pagination['max'] ?? 50); $page++) {
            $listUrl = $this->buildListingUrl($baseUrl, $listingPath, $pagination, $page);

            $html = $this->httpClient->get($listUrl);
            if (!$html) {
                break;
            }

            $crawler = new Crawler($html);
            $itemSelector = $listSelectors['item'] ?? '.job-card, .vacancy-item, [data-testid="job-card"]';
            $linkSelector = $listSelectors['detail_link'] ?? 'a[href*="/job/"], a[href*="/lowongan/"]';

            try {
                $items = $crawler->filter($itemSelector);
                $found = false;

                foreach ($items as $node) {
                    $itemCrawler = new Crawler($node);
                    $links = $itemCrawler->filter($linkSelector);

                    if ($links->count() > 0) {
                        $href = $links->first()->attr('href');
                        if ($href) {
                            $absoluteUrl = $this->resolveUrl($baseUrl, $href);
                            $urls[] = $absoluteUrl;
                            $found = true;
                        }
                    }
                }

                if (!$found) {
                    break;
                }

            } catch (\Exception $e) {
                Log::warning("HTML enumeration error", ['url' => $listUrl, 'error' => $e->getMessage()]);
                break;
            }
        }

        return array_unique($urls);
    }

    private function fetchDetail(string $url): ?array
    {
        if ($this->profile->strategy === 'api' && $this->profile->api_endpoints['detail'] ?? null) {
            return $this->fetchDetailApi($url);
        }

        return $this->fetchDetailHtml($url);
    }

    private function fetchDetailApi(string $detailUrl): ?array
    {
        $response = $this->httpClient->get($detailUrl, $this->profile->api_headers ?? []);
        if (!$response) {
            return null;
        }

        $data = json_decode($response, true);
        if (!$data) {
            return null;
        }

        // API detail might return single object or array with one item
        $item = isset($data['data']) && is_array($data['data']) ? $data['data'][0] : $data;
        
        return $this->mapJsonToSchema($item, $detailUrl);
    }

    private function fetchDetailHtml(string $url): ?array
    {
        $html = $this->httpClient->get($url);
        if (!$html) {
            return null;
        }

        $crawler = new Crawler($html);
        $selectors = $this->profile->detail_selectors ?? [];

        $raw = ['source_url' => $url];

        foreach ($selectors as $field => $selector) {
            try {
                $elements = $crawler->filter($selector);
                if ($elements->count() > 0) {
                    $first = $elements->first();
                    
                    // Check if selector ends with @attr
                    if (preg_match('/(.+)@(\w+)$/', $selector, $matches)) {
                        $raw[$field] = $first->attr($matches[2]);
                    } else {
                        $raw[$field] = trim($first->text());
                    }
                }
            } catch (\Exception) {
                // Selector not found, skip
            }
        }

        return $this->normalize($raw);
    }

    private function mapJsonToSchema(array $item, string $sourceUrl): ?array
    {
        $mapping = $this->profile->json_field_mapping ?? [];
        $raw = ['source_url' => $sourceUrl];

        foreach ($mapping as $internalField => $jsonPath) {
            $value = Arr::get($item, $jsonPath);
            if ($value !== null) {
                $raw[$internalField] = is_array($value) ? implode(', ', array_map('trim', $value)) : $value;
            }
        }

        return $this->normalize($raw);
    }

    private function normalize(array $raw): array
    {
        // Generate slug from title + company + source
        $slugBase = ($raw['title'] ?? 'job') . '-' . ($raw['company_name'] ?? 'company');
        $slug = strtolower(preg_replace('/[^a-z0-9]+/', '-', $slugBase)) . '-' . substr(md5($raw['source_url'] ?? ''), 0, 8);

        // Clean PII from text fields
        $textFields = ['description', 'requirements', 'company_name', 'location'];
        foreach ($textFields as $field) {
            if (isset($raw[$field])) {
                $raw[$field] = $this->httpClient->stripPii($raw[$field]);
            }
        }

        // Normalize skills array
        $skills = [];
        if (!empty($raw['skills'])) {
            $skillList = is_string($raw['skills']) ? explode(',', $raw['skills']) : (array) $raw['skills'];
            foreach ($skillList as $skill) {
                $skill = trim($skill);
                if ($skill !== '') {
                    $skills[] = $skill;
                }
            }
        }

        return [
            'sumber' => $this->profile->domain,
            'tanggal_crawl' => now()->toDateString(),
            'sektor' => $raw['sektor'] ?? $this->guessSector($raw),
            'lokasi' => $raw['location'] ?? '',
            'slug' => $slug,
            'status' => 'active',
            'title' => $raw['title'] ?? 'Lowongan Pekerjaan',
            'company_name' => $raw['company_name'] ?? 'Perusahaan',
            'company_logo' => $raw['company_logo'] ?? '',
            'source_url' => $raw['source_url'] ?? '',
            'salary_min' => $this->parseSalary($raw['salary_min'] ?? null),
            'salary_max' => $this->parseSalary($raw['salary_max'] ?? null),
            'job_type' => $raw['job_type'] ?? '',
            'job_experience' => $raw['job_experience'] ?? '',
            'is_remote' => $this->parseBoolean($raw['is_remote'] ?? false),
            'published_at' => $this->parseDate($raw['published_at'] ?? null),
            'closed_at' => $this->parseDate($raw['closed_at'] ?? null),
            'skills' => $skills,
        ];
    }

    private function buildListingUrl(string $baseUrl, string $path, array $pagination, int $page): string
    {
        $param = $pagination['param'] ?? 'page';
        
        if ($pagination['type'] === 'page_param') {
            $separator = str_contains($path, '?') ? '&' : '?';
            return $baseUrl . $path . $separator . $param . '=' . $page;
        }
        
        if ($pagination['type'] === 'path') {
            return $baseUrl . rtrim($path, '/') . '/page/' . $page;
        }
        
        return $baseUrl . $path;
    }

    private function resolveUrl(string $baseUrl, string $href): string
    {
        if (str_starts_with($href, 'http')) {
            return $href;
        }
        if (str_starts_with($href, '/')) {
            return rtrim($baseUrl, '/') . $href;
        }
        return rtrim($baseUrl, '/') . '/' . $href;
    }

    private function extractArrayFromJson(array $data, string $key): array
    {
        // Try common keys for job arrays
        foreach (['data', 'jobs', 'results', 'items', 'list', $key] as $k) {
            if (isset($data[$k]) && is_array($data[$k])) {
                return $data[$k];
            }
        }
        return [];
    }

    private function extractJobId(array $item, string $pattern): ?string
    {
        // Try to find job ID in common fields
        $candidates = [
            $item['id'] ?? null,
            $item['jobId'] ?? null,
            $item['job_id'] ?? null,
            $item['url'] ?? null,
            $item['link'] ?? null,
            $item['source_url'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            if ($candidate && preg_match($pattern, $candidate, $matches)) {
                return $matches[1] ?? $matches[0];
            }
        }
        return null;
    }

    private function guessSector(array $raw): string
    {
        $text = implode(' ', array_filter($raw));
        
        if (preg_match('/(software|developer|engineer|programmer|tech|it|data|cyber|cloud|devops)/i', $text)) {
            return 'Teknologi & TI';
        }
        if (preg_match('/(finance|akuntansi|banking|keuangan)/i', $text)) {
            return 'Keuangan';
        }
        if (preg_match('/(sales|marketing|business)/i', $text)) {
            return 'Bisnis & Manajemen';
        }
        if (preg_match('/(design|desain|creative|multimedia)/i', $text)) {
            return 'Kreatif & Desain';
        }
        
        return 'Umum';
    }

    private function parseSalary($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        
        $clean = preg_replace('/[^\d]/', '', (string) $value);
        if ($clean === '') {
            return null;
        }
        
        $num = (int) $clean;
        // If value looks like millions (e.g., 5000000), keep as-is
        // If value looks like abbreviated (e.g., 5), assume millions
        return $num < 1000 ? $num * 1_000_000 : $num;
    }

    private function parseBoolean($value): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        $str = strtolower(trim((string) $value));
        return in_array($str, ['true', '1', 'yes', 'ya', 'remote', 'wfh', 'work from home']);
    }

    private function parseDate($value): ?string
    {
        if (!$value) {
            return null;
        }
        
        try {
            return \Carbon\Carbon::parse($value)->format('Y-m-d H:i:s');
        } catch (\Throwable) {
            return null;
        }
    }

    private function politeDelay(): void
    {
        $delay = $this->profile->getEffectiveCrawlDelay();
        usleep((int) ($delay * 1_000_000));
    }
}