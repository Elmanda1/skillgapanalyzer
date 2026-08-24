<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScrapingPolicy extends Model
{
    protected $fillable = [
        'domain',
        'name',
        'base_url',
        'robots_txt_url',
        'rate_limit_per_minute',
        'rate_limit_per_hour',
        'crawl_delay_seconds',
        'allowed_paths',
        'disallowed_paths',
        'user_agent',
        'requires_auth',
        'auth_config',
        'pii_fields_to_strip',
        'custom_headers',
        'is_active',
        'last_robots_check_at',
        'robots_check_status',
        'notes',
    ];

    protected $casts = [
        'rate_limit_per_minute' => 'integer',
        'rate_limit_per_hour' => 'integer',
        'crawl_delay_seconds' => 'float',
        'allowed_paths' => 'array',
        'disallowed_paths' => 'array',
        'custom_headers' => 'array',
        'pii_fields_to_strip' => 'array',
        'auth_config' => 'array',
        'requires_auth' => 'boolean',
        'is_active' => 'boolean',
        'last_robots_check_at' => 'datetime',
    ];

    public function scrapingLogs()
    {
        return $this->hasMany(ScrapingLog::class);
    }

    public function isPathAllowed(string $path): bool
    {
        // Check disallowed paths first
        foreach ($this->disallowed_paths ?? [] as $disallowed) {
            if (fnmatch($disallowed, $path) || str_starts_with($path, rtrim($disallowed, '*'))) {
                return false;
            }
        }

        // If allowed_paths is empty, allow all (except disallowed)
        if (empty($this->allowed_paths)) {
            return true;
        }

        // Check allowed paths
        foreach ($this->allowed_paths as $allowed) {
            if (fnmatch($allowed, $path) || str_starts_with($path, rtrim($allowed, '*'))) {
                return true;
            }
        }

        return false;
    }

    public function getEffectiveCrawlDelay(): float
    {
        return $this->crawl_delay_seconds ?? 1.0;
    }

    public function getEffectiveRateLimit(): int
    {
        return $this->rate_limit_per_minute ?? 60;
    }

    public static function getForDomain(string $domain): ?self
    {
        return self::where('domain', $domain)->where('is_active', true)->first();
    }
}