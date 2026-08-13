<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['wilayah', 'status', 'uptime', 'volume_data', 'last_sync'])]
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
            'last_sync' => 'datetime',
        ];
    }
}
