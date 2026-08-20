<?php

namespace App\Console\Commands;

use App\Services\Analysis\SkillGapAnalyzerService;
use Illuminate\Console\Command;

class RunGapAnalysis extends Command
{
    protected $signature = 'analysis:run
                            {--program= : Specific study program ID to analyze}
                            {--period= : Target demand period (defaults to latest available, e.g. 2026-08)}
                            {--source=loker.id : Source name}';

    protected $description = 'Run Skill Gap Analysis engine: compute Match Rate and 8-type mismatch taxonomy classification';

    public function handle(SkillGapAnalyzerService $analyzer): int
    {
        $programId = $this->option('program') ? (int) $this->option('program') : null;
        $period = $this->option('period') ? (string) $this->option('period') : null;
        $source = (string) $this->option('source');

        $this->info('Memulai eksekusi Analysis Engine (Skill Gap Matching & Taxonomy Classification)...');

        $start = microtime(true);
        $result = $analyzer->analyze($programId, $period, $source);
        $elapsed = round(microtime(true) - $start, 2);

        $this->newLine();
        $this->info("Analisis selesai dalam {$elapsed}s (Periode: {$result['period']}):");
        $this->info("  • Total program studi dianalisis: {$result['programs_analyzed']}");
        $this->info("  • Total evaluasi gap tersimpan: {$result['total_gaps_recorded']}");

        $this->newLine();
        $this->info("── Ringkasan Match Rate per Program Studi ──");

        $rows = [];
        foreach ($result['summaries'] as $s) {
            $mb = $s['mismatch_breakdown'];
            $breakdownStr = sprintf(
                'Aligned: %d | Shortages: %d | Under: %d | Gaps: %d | Over: %d',
                $mb['aligned'] ?? 0,
                $mb['skill_shortages'] ?? 0,
                $mb['underskilling'] ?? 0,
                $mb['skill_gaps'] ?? 0,
                $mb['overeducation'] ?? 0
            );

            $rows[] = [
                $s['program_id'],
                $s['program_name'],
                $s['overall_match_rate'] . '%',
                $s['total_skills_evaluated'],
                $breakdownStr,
            ];
        }

        $this->table(
            ['ID', 'Program Studi', 'Match Rate', 'Evaluated Skills', 'Mismatch Distribution'],
            $rows
        );

        return self::SUCCESS;
    }
}
