<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScrapingLog extends Model
{
    protected $fillable = [
        'scraping_policy_id',
        'url',
        'method',
        'status_code',
        'response_time_ms',
        'request_headers',
        'response_headers',
        'error_message',
        'items_found',
        'items_imported',
        'pii_stripped_count',
        'started_at',
        'completed_at',
        'status',
        'retry_count',
    ];

    protected $casts = [
        'request_headers' => 'array',
        'response_headers' => 'array',
        'items_found' => 'integer',
        'items_imported' => 'integer',
        'pii_stripped_count' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'retry_count' => 'integer',
    ];

    public function policy()
    {
        return $this->belongsTo(ScrapingPolicy::class);
    }

    public function getDurationMs(): ?int
    {
        if ($this->started_at && $this->completed_at) {
            return $this->started_at->diffInMilliseconds($this->completed_at);
        }
        return null;
    }

    public function isSuccessful(): bool
    {
        return $this->status === 'success';
    }
}