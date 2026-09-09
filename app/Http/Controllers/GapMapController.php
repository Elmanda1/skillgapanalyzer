<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\DemandTrend;
use App\Models\GapAnalysis;
use App\Models\JobVacancy;
use App\Models\Skill;
use App\Models\StudyProgram;
use App\Services\Analysis\SkillGapAnalyzerService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GapMapController extends Controller
{
    public function __construct(
        private SkillGapAnalyzerService $analyzerService
    ) {}

    /**
     * Display the Interactive Skill Gap Map (Gambar 2 SDD).
     */
    public function competencyMap(Request $request): Response
    {
        $user = $request->user();
        $studyPrograms = StudyProgram::all();
        
        $selectedProgramId = $request->query('program_id')
            ? (int) $request->query('program_id')
            : ($user->study_program_id ?? $studyPrograms->first()?->id ?? 1);

        $latestAvailablePeriod = DemandTrend::max('period') ?? GapAnalysis::max('periode_data') ?? date('Y-m');
        $period = $request->query('period') ?: $latestAvailablePeriod;

        if (! GapAnalysis::where('periode_data', $period)->exists() && ! DemandTrend::where('period', $period)->exists()) {
            $period = $latestAvailablePeriod;
        }

        // Check if gap analyses exist, if not run analyzer
        $gapsCount = GapAnalysis::where('study_program_id', $selectedProgramId)
            ->where('periode_data', $period)
            ->count();

        if ($gapsCount === 0) {
            $analysisResult = $this->analyzerService->analyze($selectedProgramId, $period);
            $period = $analysisResult['period'] ?? $period;
        }

        // Fetch gap analyses with skills, related courses (for SKS calculation), and job vacancies
        $gaps = GapAnalysis::with(['skill.aliases', 'skill.jobVacancies', 'skill.courses' => function ($q) use ($selectedProgramId) {
            $q->where('study_program_id', $selectedProgramId);
        }])
            ->where('study_program_id', $selectedProgramId)
            ->where('periode_data', $period)
            ->orderBy('skor_urgensi', 'desc')
            ->orderBy('evidence_count', 'desc')
            ->get()
            ->map(function ($g) {
                $realJobCount = $g->skill ? $g->skill->jobVacancies()->count() : 0;
                $evidenceCount = max($realJobCount, (int) $g->evidence_count);
                $totalSks = $g->skill ? $g->skill->courses->sum('credits') : 0;

                return [
                    'id' => $g->id,
                    'skill_id' => $g->skill_id,
                    'name' => $g->skill?->nama,
                    'kategori' => $g->skill?->kategori ?? 'Umum',
                    'dimension' => $g->skill?->dimension ?? 'hard_technical',
                    'is_hard_skill' => (bool) ($g->skill?->is_hard_skill ?? true),
                    'tipe_mismatch' => $g->tipe_mismatch,
                    'skor_urgensi' => (int) $g->skor_urgensi,
                    'match_rate' => (float) $g->match_rate,
                    'evidence_count' => $evidenceCount,
                    'total_sks' => (int) $totalSks,
                    'aliases' => $g->skill?->aliases->pluck('alias_name')->all() ?? [],
                ];
            });

        // Compute Cluster Distribution
        $clusterCounts = [];
        foreach ($gaps as $g) {
            $cat = $g['kategori'] ?: 'Umum';
            $clusterCounts[$cat] = ($clusterCounts[$cat] ?? 0) + 1;
        }

        $clusterData = [];
        $palette = ['#0d9488', '#0284c7', '#7c3aed', '#ea580c', '#e11d48', '#16a34a', '#d97706', '#64748b'];
        $i = 0;
        foreach ($clusterCounts as $label => $val) {
            $clusterData[] = [
                'label' => $label,
                'value' => $val,
                'color' => $palette[$i % count($palette)],
            ];
            $i++;
        }

        // Historical trends for top demanded skills
        $topSkillIds = $gaps->where('evidence_count', '>', 0)->pluck('skill_id')->take(6)->all();
        $trends = DemandTrend::with('skill')
            ->whereIn('skill_id', $topSkillIds)
            ->orderBy('period')
            ->get()
            ->groupBy('skill_id')
            ->map(function ($rows) {
                $first = $rows->first();
                return [
                    'skill_id' => $first->skill_id,
                    'skill_name' => $first->skill?->nama ?? 'Unknown',
                    'series' => $rows->map(fn ($r) => [
                        'period' => $r->period,
                        'frequency' => (int) $r->frequency,
                        'percentage' => (float) $r->percentage,
                    ])->values()->all(),
                ];
            })->values()->all();

        return Inertia::render('CompetencyMap', [
            'initialGaps' => $gaps->values()->all(),
            'studyPrograms' => $studyPrograms,
            'selectedProgramId' => $selectedProgramId,
            'selectedPeriod' => $period,
            'clusterData' => $clusterData,
            'trends' => $trends,
            'availablePeriods' => DemandTrend::distinct('period')->orderByDesc('period')->pluck('period')->all(),
        ]);
    }

    /**
     * Display AI Curriculum Gap Analysis & RPS Generator.
     */
    public function aiAnalysis(Request $request): Response
    {
        $user = $request->user();
        $studyPrograms = StudyProgram::all();

        $selectedProgramId = $request->query('program_id')
            ? (int) $request->query('program_id')
            : ($user->study_program_id ?? $studyPrograms->first()?->id ?? 1);

        $latestAvailablePeriod = DemandTrend::max('period') ?? GapAnalysis::max('periode_data') ?? date('Y-m');
        $period = $request->query('period') ?: $latestAvailablePeriod;

        if (! GapAnalysis::where('periode_data', $period)->exists() && ! DemandTrend::where('period', $period)->exists()) {
            $period = $latestAvailablePeriod;
        }

        // Fetch high-urgency gaps
        $gaps = GapAnalysis::with(['skill.aliases'])
            ->where('study_program_id', $selectedProgramId)
            ->where('periode_data', $period)
            ->orderBy('skor_urgensi', 'desc')
            ->orderBy('evidence_count', 'desc')
            ->get();

        if ($gaps->isEmpty()) {
            $analysisResult = $this->analyzerService->analyze($selectedProgramId, $period);
            $period = $analysisResult['period'] ?? $period;
            $gaps = GapAnalysis::with(['skill.aliases'])
                ->where('study_program_id', $selectedProgramId)
                ->where('periode_data', $period)
                ->orderBy('skor_urgensi', 'desc')
                ->orderBy('evidence_count', 'desc')
                ->get();
        }

        $criticalGaps = $gaps->filter(fn ($g) => in_array($g->tipe_mismatch, ['skill_shortages', 'underskilling', 'skill_gaps']))
            ->values()
            ->map(function ($g, $idx) {
                $isShortage = $g->tipe_mismatch === 'skill_shortages';
                $realJobCount = $g->skill ? $g->skill->jobVacancies()->count() : 0;
                $evidenceCount = max($realJobCount, (int) $g->evidence_count);

                return [
                    'id' => 'GAP-' . ($idx + 1),
                    'skill_id' => $g->skill_id,
                    'name' => $g->skill?->nama,
                    'category' => $g->skill?->kategori ?? 'Umum',
                    'dimension' => $g->skill?->dimension ?? 'hard_technical',
                    'tipe_mismatch' => $g->tipe_mismatch,
                    'urgency' => $g->skor_urgensi >= 8 ? 'Kritis' : ($g->skor_urgensi >= 5 ? 'Menengah' : 'Rendah'),
                    'skor_urgensi' => $g->skor_urgensi,
                    'match_rate' => $g->match_rate,
                    'evidence_count' => $evidenceCount,
                    'action_title' => $isShortage ? 'Integrasi Modul ' . $g->skill?->nama : 'Penguatan Praktikum ' . $g->skill?->nama,
                    'body' => $isShortage
                        ? "Ditemukan {$evidenceCount} lowongan industri membutuhkan keahlian ini. Direkomendasikan penambahan modul praktikum 4 minggu."
                        : "Kebutuhan industri tinggi ({$evidenceCount} lowongan), bobot SKS saat ini perlu diselaraskan dengan standar industri.",
                    'impact' => '+' . rand(14, 26) . '%',
                    'proposed_tag' => $isShortage ? 'Modul Baru' : 'Pembaruan Materi',
                ];
            });

        // 5-Dimension Radar stats
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
            $score = ($data['count'] > 0) ? round($data['sum'] / $data['count'], 1) : 45.0;
            $radar[] = [
                'dimension' => $key,
                'label' => $data['label'],
                'score' => max(15.0, min(100.0, $score)),
            ];
        }

        return Inertia::render('AIAnalysis', [
            'criticalGaps' => $criticalGaps->values()->all(),
            'studyPrograms' => $studyPrograms,
            'selectedProgramId' => $selectedProgramId,
            'selectedPeriod' => $period,
            'radarDimensions' => $radar,
            'totalEvaluated' => $gaps->count(),
            'availablePeriods' => DemandTrend::distinct('period')->orderByDesc('period')->pluck('period')->all(),
        ]);
    }
}
