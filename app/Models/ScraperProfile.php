<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'scraping_policy_id',
    'name',
    'domain',
    'strategy',
    'api_endpoints',
    'api_headers',
    'json_field_mapping',
    'job_id_extractor',
    'list_selectors',
    'detail_selectors',
    'pagination',
    'crawl_delay_seconds',
    'concurrency',
    'is_active',
])]
class ScraperProfile extends Model
{
    protected $casts = [
        'api_endpoints' => 'array',
        'api_headers' => 'array',
        'json_field_mapping' => 'array',
        'list_selectors' => 'array',
        'detail_selectors' => 'array',
        'pagination' => 'array',
        'crawl_delay_seconds' => 'float',
        'concurrency' => 'integer',
        'is_active' => 'boolean',
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(ScrapingPolicy::class, 'scraping_policy_id');
    }

    public function getEffectiveCrawlDelay(): float
    {
        return $this->crawl_delay_seconds ?? $this->policy?->getEffectiveCrawlDelay() ?? 2.0;
    }

    public function getEffectiveConcurrency(): int
    {
        return $this->concurrency ?? 4;
    }

    public static function findActiveForDomain(string $domain): ?self
    {
        return self::where('domain', $domain)
            ->where('is_active', true)
            ->first();
    }
}