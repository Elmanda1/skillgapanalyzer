<?php

namespace App\Services\Analysis;

use App\Models\Course;
use App\Models\DemandTrend;
use App\Models\Skill;
use App\Models\StudyProgram;
use Illuminate\Support\Facades\DB;

class SkillGapAnalyzerService
{
    /**
     * Bottom-up Category to Sector mapping (changesv2_extractor.md §1 & §2.2).
     */
    public const CATEGORY_SECTOR_MAP = [
        'Cloud & DevOps' => 'Teknologi & TI',
        'AI & Data Science' => 'Teknologi & TI',
        'Frontend Dev' => 'Teknologi & TI',
        'Backend Dev' => 'Teknologi & TI',
        'Database' => 'Teknologi & TI',
        'Mobile Dev' => 'Teknologi & TI',
        'Cybersecurity' => 'Teknologi & TI',
        'Sales & Marketing' => 'Bisnis & Manajemen',
        'Akuntansi & Keuangan' => 'Bisnis & Manajemen',
        'Bisnis & Manajemen' => 'Bisnis & Manajemen',
        'Desain & Multimedia' => 'Kreatif & Desain',
        'Teknik Sipil & Konstruksi' => 'Teknik & Rekayasa',
        'Teknik Mesin & Manufaktur' => 'Manufaktur',
    ];

    public function __construct(
        private TaxonomyClassifierService $classifier
    ) {}

    /**
     * Check if a skill is domain-relevant to the given StudyProgram (changesv2_extractor.md §2.2 & §2.3).
     */
    public function isDomainRelevant(Skill $skill, StudyProgram $program, float $supplyLevel = 0.0): bool
    {
        // 1. If taught in curriculum (Supply > 0) -> ALWAYS relevant
        if ($supplyLevel > 0.0) {
            return true;
        }

        // 2. Cross-discipline competence dimensions (non-hard technical) -> ALWAYS relevant
        $dimension = $skill->dimension ?? 'hard_technical';
        if ($dimension !== 'hard_technical') {
            return true;
        }

        // 3. Category sector mapping
        $kategori = $skill->kategori ?? '';
        if ($kategori === '' || $kategori === 'Umum' || $kategori === 'Industri') {
            return false;
        }

        if (isset(self::CATEGORY_SECTOR_MAP[$kategori])) {
            $skillSector = self::CATEGORY_SECTOR_MAP[$kategori];
            if ($skillSector === 'Umum') {
                return true;
            }
            $programSectors = $program->getEffectiveSectors();
            return in_array($skillSector, $programSectors, true);
        }

        // 4. Direct sektor_industri_terkait check if present
        if (! empty($skill->sektor_industri_terkait) && $skill->sektor_industri_terkait !== 'Umum') {
            $programSectors = $program->getEffectiveSectors();
            return in_array($skill->sektor_industri_terkait, $programSectors, true);
        }

        return false;
    }

    /**
     * Run full gap analysis for one or all study programs on a given period.
     *
     * @param int|null $studyProgramId Optional specific study program ID
     * @param string|null $period Target period (defaults to latest period in demand_trends)
     * @param string $source Data source name
     * @return array{period: string, programs_analyzed: int, total_gaps_recorded: int, summaries: array}
     */
    public function analyze(?int $studyProgramId = null, ?string $period = null, string $source = 'loker.id'): array
    {
        // 1. Determine period with fallback if requested period has no data
        $latestPeriod = DemandTrend::query()->where('source', $source)->max('period') ?? date('Y-m');
        if (! $period || ! DemandTrend::query()->where('period', $period)->where('source', $source)->exists()) {
            $period = $latestPeriod;
        }

        // 2. Load demand data for this period
        $demandMap = []; // skill_id => DemandTrend
        $demandTrends = DemandTrend::query()
            ->where('period', $period)
            ->where('source', $source)
            ->get();

        foreach ($demandTrends as $dt) {
            $demandMap[$dt->skill_id] = [
                'frequency' => (int) $dt->frequency,
                'percentage' => (float) $dt->percentage,
                'growth_rate' => (float) ($dt->growth_rate ?? 0.0),
            ];
        }

        // 3. Load all standard skills metadata
        $skills = Skill::query()->get(['id', 'nama', 'kategori', 'dimension', 'is_hard_skill', 'sektor_industri_terkait'])->keyBy('id');

        // 4. Determine study programs to analyze
        $programQuery = StudyProgram::query();
        if ($studyProgramId) {
            $programQuery->where('id', $studyProgramId);
        }
        $programs = $programQuery->get();

        $totalGapsRecorded = 0;
        $summaries = [];
        $now = now();

        foreach ($programs as $program) {
            // Load courses and associated skills for this study program
            $courses = Course::with('skills:id,nama,kategori,dimension')
                ->where('study_program_id', $program->id)
                ->get();

            // Calculate supply vector for each skill
            $supplyScores = []; // skill_id => total_credits / weight
            foreach ($courses as $course) {
                $credits = max(1, (int) $course->credits);
                foreach ($course->skills as $skill) {
                    $supplyScores[$skill->id] = ($supplyScores[$skill->id] ?? 0.0) + ($credits * 15.0);
                }
            }

            // Target skills: union of program supply skills + skills with industry demand, filtered by Domain Affinity Guard
            $rawCandidateSkillIds = array_unique(array_merge(
                array_keys($supplyScores),
                array_keys(array_filter($demandMap, fn ($d) => $d['frequency'] >= 2 || $d['percentage'] >= 0.2))
            ));

            // Apply Domain Affinity Guard at the root ($evalSkillIds) - changesv2_extractor.md §2.2
            $evalSkillIds = array_values(array_filter($rawCandidateSkillIds, function ($skillId) use ($skills, $program, $supplyScores) {
                $skill = $skills->get($skillId);
                if (! $skill) {
                    return false;
                }
                $supplyLevel = $supplyScores[$skillId] ?? 0.0;
                return $this->isDomainRelevant($skill, $program, $supplyLevel);
            }));

            $programMatchedWeights = 0.0;
            $programTotalDemandWeights = 0.0;
            $upsertRows = [];
            $mismatchCounts = [
                'aligned' => 0,
                'skill_shortages' => 0,
                'underskilling' => 0,
                'overeducation' => 0,
                'skill_gaps' => 0,
            ];

            foreach ($evalSkillIds as $skillId) {
                $skill = $skills->get($skillId);
                if (! $skill) {
                    continue;
                }

                $supplyLevel = $supplyScores[$skillId] ?? 0.0;
                $demandInfo = $demandMap[$skillId] ?? [
                    'frequency' => 0,
                    'percentage' => 0.0,
                    'growth_rate' => 0.0,
                ];

                $dimension = $skill->dimension ?? 'hard_technical';

                // Classify mismatch and calculate urgency
                $result = $this->classifier->classify(
                    $supplyLevel,
                    $demandInfo['percentage'],
                    $demandInfo['frequency'],
                    $demandInfo['growth_rate'],
                    $dimension
                );

                // Weight contribution for Program Match Rate (SDD §7)
                $isDomainRelevant = ($skill->kategori && $skill->kategori !== 'Umum') || $supplyLevel > 0;
                $relevanceMultiplier = $isDomainRelevant ? 2.5 : 0.8;

                $demandWeight = max(1.0, $demandInfo['percentage'] * 10.0) * $relevanceMultiplier;

                if ($demandInfo['frequency'] > 0 || $supplyLevel > 0) {
                    $programTotalDemandWeights += $demandWeight;

                    if ($supplyLevel > 0) {
                        $matchedProportion = min(1.0, max(0.0, $result['match_rate'] / 100.0));
                        $programMatchedWeights += ($demandWeight * ($matchedProportion > 0 ? $matchedProportion : 0.5));
                    }
                }

                $type = $result['tipe_mismatch'];
                $mismatchCounts[$type] = ($mismatchCounts[$type] ?? 0) + 1;

                $upsertRows[] = [
                    'study_program_id' => $program->id,

                    'skill_id' => $skillId,
                    'tipe_mismatch' => $type,
                    'skor_urgensi' => $result['skor_urgensi'],
                    'match_rate' => $result['match_rate'],
                    'periode_data' => $period,
                    'evidence_count' => $demandInfo['frequency'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Calculate overall Program Match Rate % (SDD §7)
            $overallMatchRate = ($programTotalDemandWeights > 0)
                ? round(min(100.0, ($programMatchedWeights / $programTotalDemandWeights) * 100), 1)
                : 0.0;

            // Clean up previous gap analysis rows for this program & period before saving fresh evaluated skills
            DB::table('gap_analyses')
                ->where('study_program_id', $program->id)
                ->where('periode_data', $period)
                ->delete();

            // Bulk insert into gap_analyses
            foreach (array_chunk($upsertRows, 250) as $chunk) {
                DB::table('gap_analyses')->insert($chunk);
                $totalGapsRecorded += count($chunk);
            }

            $summaries[] = [
                'program_id' => $program->id,
                'program_name' => $program->nama_prodi,
                'overall_match_rate' => $overallMatchRate,
                'total_skills_evaluated' => count($upsertRows),
                'mismatch_breakdown' => $mismatchCounts,
            ];
        }

        return [
            'period' => $period,
            'programs_analyzed' => count($programs),
            'total_gaps_recorded' => $totalGapsRecorded,
            'summaries' => $summaries,
        ];
    }
}
