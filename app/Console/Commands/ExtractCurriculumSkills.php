<?php

namespace App\Console\Commands;

use App\Models\Course;
use App\Models\LearningOutcome;
use App\Services\ETL\SkillExtractorService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExtractCurriculumSkills extends Command
{
    protected $signature = 'etl:extract-curriculum
                            {--course= : Specific course ID or code to process}
                            {--force : Re-extract all courses and learning outcomes}';

    protected $description = 'Extract and normalize skills from Curriculum Learning Outcomes (RPS) and map to course_skill';

    public function handle(SkillExtractorService $extractor): int
    {
        $this->info('Memulai ekstraksi skill dari dokumen kurikulum & Learning Outcomes...');

        $query = Course::with(['learningOutcomes', 'skills']);
        if ($courseParam = $this->option('course')) {
            $query->where(function ($q) use ($courseParam) {
                $q->where('id', $courseParam)->orWhere('code', $courseParam);
            });
        }

        $courses = $query->get();
        $totalCourses = $courses->count();

        if ($totalCourses === 0) {
            $this->warn('Tidak ada data mata kuliah yang ditemukan.');
            return self::SUCCESS;
        }

        $processedLOs = 0;
        $attachedSkills = 0;

        foreach ($courses as $course) {
            $extractedSkillIds = [];

            // 1. Extract from Course Name
            if (! empty($course->name)) {
                $fromName = $extractor->extractSkillIds($course->name);
                $extractedSkillIds = array_merge($extractedSkillIds, $fromName);
            }

            // 2. Extract from Learning Outcomes / CPMK
            foreach ($course->learningOutcomes as $lo) {
                if (! empty($lo->text)) {
                    $fromLO = $extractor->extractSkillIds($lo->text);
                    $extractedSkillIds = array_merge($extractedSkillIds, $fromLO);
                    $processedLOs++;
                }
            }

            $extractedSkillIds = array_unique($extractedSkillIds);

            if (! empty($extractedSkillIds)) {
                $course->skills()->syncWithoutDetaching($extractedSkillIds);
                $attachedSkills += count($extractedSkillIds);
            }
        }

        $this->newLine();
        $this->info("Ekstraksi kurikulum selesai:");
        $this->info("  • Mata kuliah diproses: {$totalCourses}");
        $this->info("  • Learning Outcomes dianalisis: {$processedLOs}");
        $this->info("  • Skill terpetakan ke mata kuliah: {$attachedSkills}");

        return self::SUCCESS;
    }
}
