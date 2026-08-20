<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\DemandTrend;
use App\Models\GapAnalysis;
use App\Models\Skill;
use App\Models\StudyProgram;
use App\Services\Analysis\SkillGapAnalyzerService;
use App\Services\Analysis\TaxonomyClassifierService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SkillGapAnalysisTest extends TestCase
{
    use RefreshDatabase;

    public function test_taxonomy_classifier_identifies_shortages_underskilling_and_overeducation(): void
    {
        $classifier = new TaxonomyClassifierService();

        // 1. Skill Shortage: Supply = 0, High Demand
        $shortage = $classifier->classify(
            supplyLevel: 0.0,
            demandPercentage: 8.5,
            demandFrequency: 45,
            growthRate: 15.0,
            dimension: 'hard_technical'
        );
        $this->assertEquals('skill_shortages', $shortage['tipe_mismatch']);
        $this->assertGreaterThanOrEqual(8, $shortage['skor_urgensi']);

        // 2. Overeducation: Supply = 50, Demand = 0
        $over = $classifier->classify(
            supplyLevel: 50.0,
            demandPercentage: 0.0,
            demandFrequency: 0,
            growthRate: 0.0,
            dimension: 'hard_technical'
        );
        $this->assertEquals('overeducation', $over['tipe_mismatch']);

        // 3. Aligned: Supply matches demand
        $aligned = $classifier->classify(
            supplyLevel: 45.0,
            demandPercentage: 5.0,
            demandFrequency: 25,
            growthRate: 5.0,
            dimension: 'hard_technical'
        );
        $this->assertEquals('aligned', $aligned['tipe_mismatch']);
        $this->assertEquals(0, $aligned['skor_urgensi']);

        // 4. Underskilling: Supply low relative to high demand
        $under = $classifier->classify(
            supplyLevel: 5.0,
            demandPercentage: 8.0,
            demandFrequency: 50,
            growthRate: 20.0,
            dimension: 'hard_technical'
        );
        $this->assertEquals('underskilling', $under['tipe_mismatch']);
        $this->assertGreaterThanOrEqual(7, $under['skor_urgensi']);
    }

    public function test_gap_analysis_artisan_command_generates_gap_analyses(): void
    {
        $program = StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'nama_prodi' => 'Teknik Informatika',
            'jenjang' => 'D4',
            'jurusan' => 'Teknik Informatika dan Komputer',
        ]);

        $react = Skill::create([
            'nama' => 'React.js',
            'kategori' => 'Frontend Dev',
            'sektor_industri_terkait' => 'Teknologi & TI',
            'dimension' => 'hard_technical',
            'is_hard_skill' => true,
        ]);

        $docker = Skill::create([
            'nama' => 'Docker',
            'kategori' => 'Cloud & DevOps',
            'sektor_industri_terkait' => 'Teknologi & TI',
            'dimension' => 'hard_technical',
            'is_hard_skill' => true,
        ]);

        $course = Course::create([
            'study_program_id' => $program->id,
            'code' => 'TI-301',
            'name' => 'Pemrograman Web Enterprise',
            'semester' => 3,
            'credits' => 4,
            'versi' => '2026',
            'status_verifikasi_ekstraksi' => true,
        ]);
        $course->skills()->attach([$react->id]);

        DemandTrend::create([
            'skill_id' => $react->id,
            'period' => '2026-08',
            'source' => 'loker.id',
            'frequency' => 50,
            'percentage' => 8.0,
            'growth_rate' => 12.5,
        ]);

        DemandTrend::create([
            'skill_id' => $docker->id,
            'period' => '2026-08',
            'source' => 'loker.id',
            'frequency' => 40,
            'percentage' => 6.5,
            'growth_rate' => 10.0,
        ]);

        $this->artisan('analysis:run', ['--period' => '2026-08'])
            ->assertSuccessful();

        // Verify gap analyses generated
        $this->assertDatabaseHas('gap_analyses', [
            'study_program_id' => $program->id,
            'skill_id' => $react->id,
            'periode_data' => '2026-08',
        ]);

        $this->assertDatabaseHas('gap_analyses', [
            'study_program_id' => $program->id,
            'skill_id' => $docker->id,
            'periode_data' => '2026-08',
            'tipe_mismatch' => 'skill_shortages',
        ]);
    }
}
