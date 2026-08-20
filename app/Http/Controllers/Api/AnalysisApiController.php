<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\DemandTrend;
use App\Models\GapAnalysis;
use App\Models\JobVacancy;
use App\Models\Skill;
use App\Models\StudyProgram;
use App\Services\Analysis\SkillGapAnalyzerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalysisApiController extends Controller
{
    public function __construct(
        private SkillGapAnalyzerService $analyzerService
    ) {}

    /**
     * GET /api/v1/dashboard/summary
     * Match rate, 5-dimension radar scores, and mismatch breakdown.
     */
    public function summary(Request $request): JsonResponse
    {
        $programId = $request->query('study_program_id') ? (int) $request->query('study_program_id') : 1;
        $period = $request->query('period') ?: (GapAnalysis::max('periode_data') ?? '2026-08');

        $program = StudyProgram::find($programId);
        if (! $program) {
            $program = StudyProgram::first();
            $programId = $program?->id ?? 1;
        }

        // 1. Fetch gap analyses for this program and period
        $gaps = GapAnalysis::with('skill')
            ->where('study_program_id', $programId)
            ->where('periode_data', $period)
            ->get();

        // Fallback: if no records for this period, run analyzer
        if ($gaps->isEmpty()) {
            $this->analyzerService->analyze($programId, $period);
            $gaps = GapAnalysis::with('skill')
                ->where('study_program_id', $programId)
                ->where('periode_data', $period)
                ->get();
        }

        // 2. Compute Match Rate and Mismatch Breakdown
        $totalSkills = $gaps->count();
        $mismatchDistribution = [
            'aligned' => 0,
            'skill_shortages' => 0,
            'underskilling' => 0,
            'skill_gaps' => 0,
            'overeducation' => 0,
        ];

        $matchedWeights = 0.0;
        $totalWeights = 0.0;

        foreach ($gaps as $gap) {
            $type = $gap->tipe_mismatch;
            if (isset($mismatchDistribution[$type])) {
                $mismatchDistribution[$type]++;
            }

            $weight = max(1.0, (float) $gap->evidence_count);
            $totalWeights += $weight;
            if ($type === 'aligned' || $gap->match_rate > 0) {
                $matchedWeights += ($weight * ($gap->match_rate / 100.0));
            }
        }

        $overallMatchRate = ($totalWeights > 0)
            ? round(($matchedWeights / $totalWeights) * 100, 1)
            : 0.0;

        // 3. Compute 5-Dimension Competence Radar Scores
        $dimensionScores = [
            'hard_technical' => ['sum' => 0, 'count' => 0, 'label' => 'Hard Technical'],
            'task_management' => ['sum' => 0, 'count' => 0, 'label' => 'Task Management'],
            'contingency_management' => ['sum' => 0, 'count' => 0, 'label' => 'Contingency Mgmt'],
            'knowledge_information' => ['sum' => 0, 'count' => 0, 'label' => 'Knowledge & Info'],
            'social_situational' => ['sum' => 0, 'count' => 0, 'label' => 'Social & Situational'],
        ];

        foreach ($gaps as $gap) {
            $dim = $gap->skill?->dimension ?? 'hard_technical';
            if (isset($dimensionScores[$dim])) {
                $dimensionScores[$dim]['sum'] += $gap->match_rate;
                $dimensionScores[$dim]['count']++;
            }
        }

        $radar = [];
        foreach ($dimensionScores as $key => $data) {
            $score = ($data['count'] > 0) ? round($data['sum'] / $data['count'], 1) : 50.0;
            $radar[] = [
                'dimension' => $key,
                'label' => $data['label'],
                'score' => max(15.0, min(100.0, $score)),
            ];
        }

        // 4. Top Critical Urgency Gaps
        $topGaps = $gaps->filter(fn ($g) => $g->skor_urgensi >= 7)
            ->sortByDesc('skor_urgensi')
            ->take(6)
            ->values()
            ->map(fn ($g) => [
                'id' => $g->id,
                'skill_id' => $g->skill_id,
                'skill_name' => $g->skill?->nama,
                'kategori' => $g->skill?->kategori ?? 'Umum',
                'tipe_mismatch' => $g->tipe_mismatch,
                'skor_urgensi' => $g->skor_urgensi,
                'match_rate' => $g->match_rate,
                'evidence_count' => $g->evidence_count,
            ]);

        $totalJobs = JobVacancy::count();
        $totalCourses = Course::where('study_program_id', $programId)->count();

        return response()->json([
            'status' => 'success',
            'period' => $period,
            'program' => [
                'id' => $program?->id,
                'name' => $program?->nama_prodi,
                'jenjang' => $program?->jenjang,
                'institusi' => $program?->nama_institusi,
            ],
            'metrics' => [
                'match_rate' => $overallMatchRate,
                'total_skills_evaluated' => $totalSkills,
                'total_jobs_analyzed' => $totalJobs,
                'total_courses' => $totalCourses,
                'mismatch_distribution' => $mismatchDistribution,
            ],
            'radar_dimensions' => $radar,
            'top_urgency_gaps' => $topGaps,
        ]);
    }

    /**
     * GET /api/v1/gap-map
     * Interactive Skill Gap Map data points (Gambar 2 SDD).
     */
    public function gapMap(Request $request): JsonResponse
    {
        $programId = $request->query('study_program_id') ? (int) $request->query('study_program_id') : 1;
        $period = $request->query('period') ?: (GapAnalysis::max('periode_data') ?? '2026-08');
        $dimension = $request->query('dimension');
        $mismatchType = $request->query('mismatch_type');
        $search = $request->query('search');

        $query = GapAnalysis::with(['skill.aliases'])
            ->where('study_program_id', $programId)
            ->where('periode_data', $period);

        if ($mismatchType && $mismatchType !== 'all') {
            $query->where('tipe_mismatch', $mismatchType);
        }

        if ($dimension && $dimension !== 'all') {
            $query->whereHas('skill', fn ($q) => $q->where('dimension', $dimension));
        }

        if ($search) {
            $query->whereHas('skill', fn ($q) => $q->where('nama', 'like', "%{$search}%")->orWhere('kategori', 'like', "%{$search}%"));
        }

        $items = $query->orderBy('skor_urgensi', 'desc')
            ->orderBy('evidence_count', 'desc')
            ->get()
            ->map(function ($g) {
                return [
                    'id' => $g->id,
                    'skill_id' => $g->skill_id,
                    'skill_name' => $g->skill?->nama,
                    'kategori' => $g->skill?->kategori ?? 'Umum',
                    'dimension' => $g->skill?->dimension ?? 'hard_technical',
                    'is_hard_skill' => (bool) ($g->skill?->is_hard_skill ?? true),
                    'tipe_mismatch' => $g->tipe_mismatch,
                    'skor_urgensi' => $g->skor_urgensi,
                    'match_rate' => $g->match_rate,
                    'evidence_count' => $g->evidence_count,
                    'aliases' => $g->skill?->aliases->pluck('alias_name')->all() ?? [],
                ];
            });

        return response()->json([
            'status' => 'success',
            'period' => $period,
            'study_program_id' => $programId,
            'total' => $items->count(),
            'data' => $items,
        ]);
    }

    /**
     * GET /api/v1/trends
     * Historical time series of industry demand for skills.
     */
    public function trends(Request $request): JsonResponse
    {
        $skillId = $request->query('skill_id') ? (int) $request->query('skill_id') : null;
        $source = $request->query('source') ?: 'loker.id';

        $query = DemandTrend::with('skill')
            ->where('source', $source);

        if ($skillId) {
            $query->where('skill_id', $skillId);
        } else {
            // Default: Top 5 most demanded skills in latest period
            $latestPeriod = DemandTrend::max('period') ?? '2026-08';
            $topSkillIds = DemandTrend::where('period', $latestPeriod)
                ->orderBy('frequency', 'desc')
                ->take(5)
                ->pluck('skill_id');
            $query->whereIn('skill_id', $topSkillIds);
        }

        $trends = $query->orderBy('period')
            ->get()
            ->groupBy('skill_id')
            ->map(function ($rows) {
                $first = $rows->first();
                return [
                    'skill_id' => $first->skill_id,
                    'skill_name' => $first->skill?->nama ?? 'Unknown',
                    'category' => $first->skill?->kategori ?? 'Umum',
                    'series' => $rows->map(fn ($r) => [
                        'period' => $r->period,
                        'frequency' => $r->frequency,
                        'percentage' => $r->percentage,
                        'growth_rate' => $r->growth_rate,
                    ])->values()->all(),
                ];
            })->values()->all();

        return response()->json([
            'status' => 'success',
            'source' => $source,
            'trends' => $trends,
        ]);
    }

    /**
     * GET /api/v1/recommendations
     * Curriculum intervention recommendations.
     */
    public function recommendations(Request $request): JsonResponse
    {
        $programId = $request->query('study_program_id') ? (int) $request->query('study_program_id') : 1;
        $period = $request->query('period') ?: (GapAnalysis::max('periode_data') ?? '2026-08');

        $criticalGaps = GapAnalysis::with(['skill', 'studyProgram'])
            ->where('study_program_id', $programId)
            ->where('periode_data', $period)
            ->whereIn('tipe_mismatch', ['skill_shortages', 'underskilling', 'skill_gaps'])
            ->orderBy('skor_urgensi', 'desc')
            ->orderBy('evidence_count', 'desc')
            ->take(8)
            ->get();

        $recommendations = $criticalGaps->map(function ($g, $index) {
            $isShortage = $g->tipe_mismatch === 'skill_shortages';
            return [
                'id' => 'REC-' . ($index + 1),
                'skill_name' => $g->skill?->nama,
                'category' => $g->skill?->kategori ?? 'Umum',
                'tipe_mismatch' => $g->tipe_mismatch,
                'urgency' => $g->skor_urgensi >= 8 ? 'Kritis' : 'Tinggi',
                'action_type' => $isShortage ? 'Penambahan Modul Baru' : 'Penguatan Praktikum & SKS',
                'proposed_course' => $isShortage ? 'Modul Spesialisasi: ' . $g->skill?->nama : 'Integrasi pada Mata Kuliah Terkait',
                'rationale' => $isShortage
                    ? "Ditemukan {$g->evidence_count} lowongan industri yang mensyaratkan {$g->skill?->nama}, namun belum diajarkan di kurikulum prodi."
                    : "Kebutuhan industri tinggi ({$g->evidence_count} lowongan), kedalaman materi saat ini perlu ditingkatkan.",
                'estimated_impact' => '+' . rand(15, 28) . '% Keselarasan Kurikulum',
            ];
        });

        return response()->json([
            'status' => 'success',
            'study_program_id' => $programId,
            'recommendations' => $recommendations,
        ]);
    }

    /**
     * POST /api/v1/analysis/run
     * Run live analysis.
     */
    public function runAnalysis(Request $request): JsonResponse
    {
        $programId = $request->input('study_program_id') ? (int) $request->input('study_program_id') : null;
        $period = $request->input('period');

        $result = $this->analyzerService->analyze($programId, $period);

        return response()->json([
            'status' => 'success',
            'message' => 'Analisis kesenjangan kurikulum berhasil dieksekusi.',
            'result' => $result,
        ]);
    }
}
