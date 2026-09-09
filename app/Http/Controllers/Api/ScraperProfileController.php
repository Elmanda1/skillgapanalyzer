<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScraperProfile;
use App\Models\ScrapingPolicy;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ScraperProfileController extends Controller
{
    public function index(): JsonResponse
    {
        $profiles = ScraperProfile::with('policy')
            ->orderBy('domain')
            ->get()
            ->map(fn ($p) => $this->formatProfile($p));

        return response()->json($profiles);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'scraping_policy_id' => 'required|exists:scraping_policies,id',
            'name' => 'required|string|max:255',
            'domain' => 'required|string|max:255|unique:scraper_profiles,domain',
            'strategy' => 'required|in:api,html_selectors,hybrid',
            'api_endpoints' => 'nullable|array',
            'api_headers' => 'nullable|array',
            'json_field_mapping' => 'nullable|array',
            'job_id_extractor' => 'nullable|string',
            'list_selectors' => 'nullable|array',
            'detail_selectors' => 'nullable|array',
            'pagination' => 'nullable|array',
            'crawl_delay_seconds' => 'nullable|numeric|min:0',
            'concurrency' => 'nullable|integer|min:1|max:20',
            'is_active' => 'boolean',
        ]);

        $profile = ScraperProfile::create($validated);
        $profile->load('policy');

        return response()->json($this->formatProfile($profile), 201);
    }

    public function show(ScraperProfile $scraperProfile): JsonResponse
    {
        $scraperProfile->load('policy');
        return response()->json($this->formatProfile($scraperProfile));
    }

    public function update(Request $request, ScraperProfile $scraperProfile): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'domain' => 'sometimes|string|max:255|unique:scraper_profiles,domain,' . $scraperProfile->id,
            'strategy' => 'sometimes|in:api,html_selectors,hybrid',
            'api_endpoints' => 'nullable|array',
            'api_headers' => 'nullable|array',
            'json_field_mapping' => 'nullable|array',
            'job_id_extractor' => 'nullable|string',
            'list_selectors' => 'nullable|array',
            'detail_selectors' => 'nullable|array',
            'pagination' => 'nullable|array',
            'crawl_delay_seconds' => 'nullable|numeric|min:0',
            'concurrency' => 'nullable|integer|min:1|max:20',
            'is_active' => 'boolean',
        ]);

        $scraperProfile->update($validated);
        $scraperProfile->load('policy');

        return response()->json($this->formatProfile($scraperProfile));
    }

    public function destroy(ScraperProfile $scraperProfile): JsonResponse
    {
        $scraperProfile->delete();
        return response()->json(['message' => 'Scraper profile deleted']);
    }

    public function test(ScraperProfile $scraperProfile): JsonResponse
    {
        if (!$scraperProfile->is_active) {
            return response()->json(['error' => 'Profile is not active'], 400);
        }

        $scraper = new \App\Services\Scraping\GenericFastScraper($scraperProfile, $scraperProfile->policy);

        try {
            $jobs = [];
            $count = 0;
            
            foreach ($scraper->scrape(1, 3) as $job) {
                $jobs[] = [
                    'title' => $job['title'],
                    'company_name' => $job['company_name'],
                    'location' => $job['lokasi'],
                    'sektor' => $job['sektor'],
                    'skills' => $job['skills'],
                    'source_url' => $job['source_url'],
                ];
                $count++;
            }

            return response()->json([
                'success' => true,
                'jobs_found' => $count,
                'sample_jobs' => $jobs,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function policies(): JsonResponse
    {
        $policies = ScrapingPolicy::where('is_active', true)
            ->orderBy('domain')
            ->get(['id', 'domain', 'name', 'base_url', 'rate_limit_per_minute', 'crawl_delay_seconds']);

        return response()->json($policies);
    }

    private function formatProfile(ScraperProfile $p): array
    {
        return [
            'id' => $p->id,
            'scraping_policy_id' => $p->scraping_policy_id,
            'policy' => $p->policy ? [
                'id' => $p->policy->id,
                'domain' => $p->policy->domain,
                'name' => $p->policy->name,
            ] : null,
            'name' => $p->name,
            'domain' => $p->domain,
            'strategy' => $p->strategy,
            'api_endpoints' => $p->api_endpoints,
            'api_headers' => $p->api_headers,
            'json_field_mapping' => $p->json_field_mapping,
            'job_id_extractor' => $p->job_id_extractor,
            'list_selectors' => $p->list_selectors,
            'detail_selectors' => $p->detail_selectors,
            'pagination' => $p->pagination,
            'crawl_delay_seconds' => $p->crawl_delay_seconds,
            'concurrency' => $p->concurrency,
            'is_active' => $p->is_active,
            'created_at' => $p->created_at?->toISOString(),
            'updated_at' => $p->updated_at?->toISOString(),
        ];
    }
}