<?php

namespace App\Services\Taxonomy;

use App\Models\Skill;
use App\Models\SkillAlias;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TaxonomySummary
{
    public const CACHE_KEY = 'taxonomy.summary.v1';

    public const CACHE_TTL = 300;

    public function get(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, fn () => $this->compute());
    }

    public function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    protected function compute(): array
    {
        $dimensionRows = Skill::select('dimension', DB::raw('count(*) as total'))
            ->groupBy('dimension')
            ->get();

        $dimensionCounts = [
            'hard_technical' => 0,
            'task_management' => 0,
            'contingency_management' => 0,
            'knowledge_information' => 0,
            'social_situational' => 0,
        ];

        foreach ($dimensionRows as $row) {
            $dim = $row->dimension ?: 'hard_technical';
            $dimensionCounts[$dim] = isset($dimensionCounts[$dim]) ? $dimensionCounts[$dim] + (int) $row->total : (int) $row->total;
        }

        $categories = Skill::select('kategori', DB::raw('count(*) as total'))
            ->groupBy('kategori')
            ->orderBy('kategori')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->kategori,
                'total' => (int) $row->total,
            ])
            ->all();

        return [
            'totalSkills' => Skill::count(),
            'totalAliases' => SkillAlias::count(),
            'dimensionCounts' => $dimensionCounts,
            'categories' => $categories,
        ];
    }
}