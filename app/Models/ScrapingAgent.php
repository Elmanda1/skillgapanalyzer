<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'agent_code',
    'domain_url',
    'sumber',
    'wilayah',
    'status',
    'uptime',
    'volume_data',
    'max_pages',
    'max_jobs',
    'last_sync',
])]
class ScrapingAgent extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'uptime' => 'float',
            'volume_data' => 'float',
            'max_pages' => 'integer',
            'max_jobs' => 'integer',
            'last_sync' => 'datetime',
        ];
    }
}
