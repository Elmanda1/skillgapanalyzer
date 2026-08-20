<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['nama', 'kategori', 'sektor_industri_terkait', 'dimension', 'is_hard_skill'])]
class Skill extends Model
{
    protected static function booted(): void
    {
        static::created(fn () => app(\App\Services\Taxonomy\TaxonomySummary::class)->forget());
        static::updated(fn () => app(\App\Services\Taxonomy\TaxonomySummary::class)->forget());
        static::deleted(fn () => app(\App\Services\Taxonomy\TaxonomySummary::class)->forget());
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        $term = trim($term);

        if ($term === '') {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('nama', 'like', "%{$term}%")
                ->orWhere('kategori', 'like', "%{$term}%")
                ->orWhere('sektor_industri_terkait', 'like', "%{$term}%")
                ->orWhereHas('aliases', fn (Builder $a) => $a->where('alias_name', 'like', "%{$term}%"));
        });
    }

    public function scopeInDimension(Builder $query, ?string $dimension): Builder
    {
        if (! $dimension || $dimension === '' || $dimension === 'all') {
            return $query;
        }

        return $query->where('dimension', $dimension);
    }

    public function scopeInCategory(Builder $query, ?string $kategori): Builder
    {
        if (! $kategori || $kategori === '' || $kategori === 'all') {
            return $query;
        }

        return $query->where('kategori', $kategori);
    }

    public function aliases()
    {
        return $this->hasMany(SkillAlias::class);
    }

    public function courses()
    {
        return $this->belongsToMany(Course::class);
    }

    public function jobVacancies()
    {
        return $this->belongsToMany(JobVacancy::class, 'job_vacancy_skill');
    }

    public function demandTrends()
    {
        return $this->hasMany(DemandTrend::class);
    }
}
