<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DemandTrend extends Model
{
    use HasFactory;

    protected $fillable = [
        'skill_id',
        'period',
        'frequency',
        'percentage',
        'source',
        'growth_rate',
    ];

    protected $casts = [
        'frequency' => 'integer',
        'percentage' => 'float',
        'growth_rate' => 'float',
    ];

    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class);
    }
}
