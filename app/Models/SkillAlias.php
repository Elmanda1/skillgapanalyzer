<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['skill_id', 'alias_name', 'min_context_required', 'context_keywords'])]
class SkillAlias extends Model
{
    protected $casts = [
        'min_context_required' => 'boolean',
        'context_keywords' => 'array',
    ];

    protected static function booted(): void
    {
        static::created(fn () => app(\App\Services\Taxonomy\TaxonomySummary::class)->forget());
        static::deleted(fn () => app(\App\Services\Taxonomy\TaxonomySummary::class)->forget());
    }

    public function skill()
    {
        return $this->belongsTo(Skill::class);
    }
}

