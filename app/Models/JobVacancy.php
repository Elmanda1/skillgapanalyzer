<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'sumber',
    'tanggal_crawl',
    'sektor',
    'lokasi',
    'slug',
    'title',
    'company_name',
    'company_logo',
    'source_url',
    'salary_min',
    'salary_max',
    'job_type',
    'job_experience',
    'is_remote',
    'published_at',
    'closed_at',
])]
class JobVacancy extends Model
{
    public function skills()
    {
        return $this->belongsToMany(Skill::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal_crawl' => 'date',
            'is_remote' => 'boolean',
            'salary_min' => 'integer',
            'salary_max' => 'integer',
            'published_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }
}