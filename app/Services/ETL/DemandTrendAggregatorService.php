<?php

namespace App\Services\ETL;

use App\Models\DemandTrend;
use App\Models\JobVacancy;
use App\Models\Skill;
use Illuminate\Support\Facades\DB;

class DemandTrendAggregatorService
{
    /**
     * Aggregate job demand trends across all periods.
     * High performance bulk aggregation with upsert.
     *
     * @return array{periods: int, records_updated: int}
     */
    public function aggregate(string $source = 'loker.id'): array
    {
        $driver = DB::connection()->getDriverName();
        $dateExpr = $driver === 'sqlite'
            ? "COALESCE(strftime('%Y-%m', published_at), strftime('%Y-%m', tanggal_crawl), '2026-08')"
            : "COALESCE(TO_CHAR(published_at, 'YYYY-MM'), TO_CHAR(tanggal_crawl, 'YYYY-MM'), '2026-08')";

        $periods = JobVacancy::query()
            ->selectRaw("{$dateExpr} as period")
            ->whereNotNull('id')
            ->groupBy('period')
            ->orderBy('period')
            ->pluck('period')
            ->filter()
            ->values()
            ->toArray();

        if (empty($periods)) {
            $periods = [date('Y-m')];
        }

        $recordsCount = 0;
        $previousPeriodStats = [];
        $now = now();

        foreach ($periods as $period) {
            // Count total jobs in this period
            $totalJobs = JobVacancy::query()
                ->whereRaw("{$dateExpr} = ?", [$period])
                ->count();

            if ($totalJobs === 0) {
                continue;
            }

            // Count occurrences of each skill demanded in this period
            $skillCounts = DB::table('job_vacancy_skill as jvs')
                ->join('job_vacancies as jv', 'jv.id', '=', 'jvs.job_vacancy_id')
                ->whereRaw("{$dateExpr} = ?", [$period])
                ->select('jvs.skill_id', DB::raw('COUNT(DISTINCT jvs.job_vacancy_id) as freq'))
                ->groupBy('jvs.skill_id')
                ->pluck('freq', 'jvs.skill_id')
                ->toArray();

            // We aggregate for all skills that either appear in this period, or are in the standard taxonomy
            $demandedSkillIds = array_keys($skillCounts);

            $upsertRows = [];
            foreach ($demandedSkillIds as $skillId) {
                $freq = (int) ($skillCounts[$skillId] ?? 0);
                $pct = round(($freq / $totalJobs) * 100, 2);

                // Calculate growth rate vs previous period
                $growthRate = null;
                if (isset($previousPeriodStats[$skillId]) && $previousPeriodStats[$skillId]['freq'] > 0) {
                    $prevFreq = $previousPeriodStats[$skillId]['freq'];
                    $growthRate = round((($freq - $prevFreq) / $prevFreq) * 100, 2);
                } elseif (isset($previousPeriodStats[$skillId]) && $previousPeriodStats[$skillId]['freq'] === 0 && $freq > 0) {
                    $growthRate = 100.00;
                }

                $upsertRows[] = [
                    'skill_id' => $skillId,
                    'period' => $period,
                    'source' => $source,
                    'frequency' => $freq,
                    'percentage' => $pct,
                    'growth_rate' => $growthRate,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $previousPeriodStats[$skillId] = [
                    'freq' => $freq,
                    'pct' => $pct,
                ];
            }

            // Bulk upsert in chunks of 500 for high performance
            foreach (array_chunk($upsertRows, 500) as $chunk) {
                DB::table('demand_trends')->upsert(
                    $chunk,
                    ['skill_id', 'period', 'source'],
                    ['frequency', 'percentage', 'growth_rate', 'updated_at']
                );
                $recordsCount += count($chunk);
            }
        }

        return [
            'periods' => count($periods),
            'records_updated' => $recordsCount,
        ];
    }
}
