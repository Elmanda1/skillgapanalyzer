<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['sumber', 'tanggal_crawl', 'sektor', 'lokasi'])]
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
        ];
    }
}
