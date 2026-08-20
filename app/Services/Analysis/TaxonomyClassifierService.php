<?php

namespace App\Services\Analysis;

class TaxonomyClassifierService
{
    /**
     * Dimension weights based on Isnandar et al. (2024) 5-competence dimensions.
     */
    public const DIMENSION_WEIGHTS = [
        'hard_technical' => 1.00,
        'task_management' => 0.90,
        'contingency_management' => 0.90,
        'knowledge_information' => 0.80,
        'social_situational' => 0.80,
    ];

    /**
     * Classify mismatch type and calculate urgency score according to SDD §6 & §7.
     *
     * @param float $supplyLevel Relative curriculum supply weight (0.0 to 100.0)
     * @param float $demandPercentage Share of jobs demanding this skill (0.0 to 100.0)
     * @param int $demandFrequency Total job postings demanding this skill
     * @param float|null $growthRate Period-over-period growth rate (%)
     * @param string $dimension Competence dimension
     * @return array{tipe_mismatch: string, skor_urgensi: int, match_rate: float, rationale: string}
     */
    public function classify(
        float $supplyLevel,
        float $demandPercentage,
        int $demandFrequency,
        ?float $growthRate = 0.0,
        string $dimension = 'hard_technical'
    ): array {
        $growth = $growthRate ?? 0.0;
        $dimWeight = self::DIMENSION_WEIGHTS[$dimension] ?? 1.0;

        // 1. Case: Supply Absent (Supply = 0)
        if ($supplyLevel <= 0.0) {
            if ($demandFrequency >= 10 || $demandPercentage >= 2.0) {
                // High industry demand but completely absent from curriculum -> Skill Shortages
                $severity = ($demandPercentage >= 5.0 || $growth > 10.0) ? 10 : 8;
                $urgency = (int) round($severity * $dimWeight);

                return [
                    'tipe_mismatch' => 'skill_shortages',
                    'skor_urgensi' => min(10, max(1, $urgency)),
                    'match_rate' => 0.0,
                    'rationale' => 'Kebutuhan industri tinggi namun materi belum diajarkan dalam kurikulum.',
                ];
            }

            // Demand minimal & supply absent -> Not a critical gap
            return [
                'tipe_mismatch' => 'aligned',
                'skor_urgensi' => 0,
                'match_rate' => 0.0,
                'rationale' => 'Skill tidak menjadi prioritas kurikulum maupun pasar kerja saat ini.',
            ];
        }

        // 2. Case: Supply Present (Supply > 0)
        // Check for obsolescence: negative growth or 0 demand for a previously taught skill
        if ($demandFrequency === 0 || ($growth <= -40.0 && $demandPercentage < 0.5)) {
            $urgency = (int) round(4 * $dimWeight);

            return [
                'tipe_mismatch' => 'overeducation',
                'skor_urgensi' => $urgency,
                'match_rate' => 10.0,
                'rationale' => 'Materi diajarkan di kurikulum namun permintaan industri saat ini sangat minim.',
            ];
        }

        // Calculate skill match ratio
        // Supply level normalized against expected market demand intensity
        $expectedSupply = max(10.0, $demandPercentage * 5.0); // e.g. 5% market demand expects ~25 supply score
        $ratio = ($supplyLevel / $expectedSupply);

        if ($ratio >= 0.85) {
            // Well-aligned
            $matchRate = min(100.0, round($ratio * 100.0, 1));
            return [
                'tipe_mismatch' => 'aligned',
                'skor_urgensi' => 0,
                'match_rate' => $matchRate,
                'rationale' => 'Kompetensi kurikulum selaras dengan kebutuhan industri.',
            ];
        }

        if ($ratio >= 0.50) {
            // Partial gap (Skill Gaps)
            $matchRate = round($ratio * 100.0, 1);
            $severity = ($growth > 10.0) ? 7 : 5;
            $urgency = (int) round($severity * $dimWeight);

            return [
                'tipe_mismatch' => 'skill_gaps',
                'skor_urgensi' => min(10, max(1, $urgency)),
                'match_rate' => $matchRate,
                'rationale' => 'Materi sudah diajarkan tetapi porsi SKS/praktik masih perlu ditingkatkan.',
            ];
        }

        // Ratio < 0.50 (Underskilling)
        $matchRate = round($ratio * 100.0, 1);
        $severity = ($demandPercentage >= 4.0 || $growth > 15.0) ? 9 : 7;
        $urgency = (int) round($severity * $dimWeight);

        return [
            'tipe_mismatch' => 'underskilling',
            'skor_urgensi' => min(10, max(1, $urgency)),
            'match_rate' => $matchRate,
            'rationale' => 'Permintaan industri sangat tinggi, kedalaman kurikulum saat ini belum mencukupi standar industri.',
        ];
    }
}
