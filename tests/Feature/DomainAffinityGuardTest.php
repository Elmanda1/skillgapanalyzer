<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\DemandTrend;
use App\Models\GapAnalysis;
use App\Models\Skill;
use App\Models\StudyProgram;
use App\Services\Analysis\SkillGapAnalyzerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DomainAffinityGuardTest extends TestCase
{
    use RefreshDatabase;

    private SkillGapAnalyzerService $analyzer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->analyzer = app(SkillGapAnalyzerService::class);
    }

    public function test_d01_sales_skill_is_filtered_out_for_teknik_informatika(): void
    {
        $ti = StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'nama_prodi' => 'Teknik Informatika',
            'jenjang' => 'D4',
            'sectors' => ['Teknologi & TI'],
        ]);

        $salesSkill = Skill::create([
            'nama' => 'B2B Sales Negotiation',
            'kategori' => 'Sales & Marketing',
            'dimension' => 'hard_technical',
            'sektor_industri_terkait' => 'Bisnis & Manajemen',
            'is_hard_skill' => true,
        ]);

        $isRelevant = $this->analyzer->isDomainRelevant($salesSkill, $ti, 0.0);
        $this->assertFalse($isRelevant, 'D-01: Hard technical sales skill must NOT be domain-relevant for Teknik Informatika when supply is 0');
    }

    public function test_d02_docker_skill_is_relevant_for_teknik_informatika(): void
    {
        $ti = StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'nama_prodi' => 'Teknik Informatika',
            'jenjang' => 'D4',
            'sectors' => ['Teknologi & TI'],
        ]);

        $docker = Skill::create([
            'nama' => 'Docker',
            'kategori' => 'Cloud & DevOps',
            'dimension' => 'hard_technical',
            'sektor_industri_terkait' => 'Teknologi & TI',
            'is_hard_skill' => true,
        ]);

        $isRelevant = $this->analyzer->isDomainRelevant($docker, $ti, 0.0);
        $this->assertTrue($isRelevant, 'D-02: Cloud & DevOps skill must be domain-relevant for Teknik Informatika');
    }

    public function test_d03_cross_discipline_dimensions_always_pass_domain_guard(): void
    {
        $ti = StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'nama_prodi' => 'Teknik Informatika',
            'jenjang' => 'D4',
            'sectors' => ['Teknologi & TI'],
        ]);

        $sipil = StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'nama_prodi' => 'Teknik Sipil Konstruksi',
            'jenjang' => 'D4',
            'sectors' => ['Teknik & Rekayasa', 'Konstruksi'],
        ]);

        $softSkill = Skill::create([
            'nama' => 'Team Collaboration',
            'kategori' => 'Soft Skills',
            'dimension' => 'social_situational',
            'sektor_industri_terkait' => 'Umum',
            'is_hard_skill' => false,
        ]);

        $this->assertTrue($this->analyzer->isDomainRelevant($softSkill, $ti, 0.0), 'D-03: Soft skills must pass for TI');
        $this->assertTrue($this->analyzer->isDomainRelevant($softSkill, $sipil, 0.0), 'D-03: Soft skills must pass for Sipil');
    }

    public function test_d04_unmapped_new_category_fails_open(): void
    {
        $ti = StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'nama_prodi' => 'Teknik Informatika',
            'jenjang' => 'D4',
            'sectors' => ['Teknologi & TI'],
        ]);

        $newSkill = Skill::create([
            'nama' => 'Rust Systems',
            'kategori' => 'Kategori Bahasa Baru 2026',
            'dimension' => 'hard_technical',
            'sektor_industri_terkait' => 'Teknologi & TI',
            'is_hard_skill' => true,
        ]);

        $isRelevant = $this->analyzer->isDomainRelevant($newSkill, $ti, 0.0);
        $this->assertTrue($isRelevant, 'D-04: Unmapped category must fail-open to avoid losing newly discovered skills');
    }

    public function test_d05_sales_skill_is_relevant_for_multi_sector_sistem_informasi(): void
    {
        $si = StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'nama_prodi' => 'Sistem Informasi',
            'jenjang' => 'D4',
            'sectors' => ['Teknologi & TI', 'Bisnis & Manajemen'],
        ]);

        $salesSkill = Skill::create([
            'nama' => 'Enterprise CRM Sales',
            'kategori' => 'Sales & Marketing',
            'dimension' => 'hard_technical',
            'sektor_industri_terkait' => 'Bisnis & Manajemen',
            'is_hard_skill' => true,
        ]);

        $isRelevant = $this->analyzer->isDomainRelevant($salesSkill, $si, 0.0);
        $this->assertTrue($isRelevant, 'D-05: Sales skill must be relevant for Sistem Informasi prodi which covers Bisnis & Manajemen');
    }

    public function test_d06_end_to_end_gap_analysis_never_includes_sales_in_teknik_informatika_gaps(): void
    {
        $ti = StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'nama_prodi' => 'Teknik Informatika',
            'jenjang' => 'D4',
            'sectors' => ['Teknologi & TI'],
        ]);

        $docker = Skill::create([
            'nama' => 'Docker',
            'kategori' => 'Cloud & DevOps',
            'dimension' => 'hard_technical',
            'sektor_industri_terkait' => 'Teknologi & TI',
            'is_hard_skill' => true,
        ]);

        $sales = Skill::create([
            'nama' => 'B2B Sales Direct',
            'kategori' => 'Sales & Marketing',
            'dimension' => 'hard_technical',
            'sektor_industri_terkait' => 'Bisnis & Manajemen',
            'is_hard_skill' => true,
        ]);

        // Add a course teaching Docker in TI
        $course = Course::create([
            'study_program_id' => $ti->id,
            'code' => 'TI-101',
            'name' => 'Dasar Cloud Computing',
            'semester' => 1,
            'credits' => 3,
            'versi' => 'v1',
            'status_verifikasi_ekstraksi' => true,
        ]);
        $course->skills()->attach([$docker->id]);

        // Demand trends for period 2026-08 (Both Docker and Sales have high industry demand)
        DemandTrend::create([
            'skill_id' => $docker->id,
            'period' => '2026-08',
            'source' => 'loker.id',
            'frequency' => 50,
            'percentage' => 25.00,
            'growth_rate' => 10.00,
        ]);

        DemandTrend::create([
            'skill_id' => $sales->id,
            'period' => '2026-08',
            'source' => 'loker.id',
            'frequency' => 80,
            'percentage' => 40.00,
            'growth_rate' => 15.00,
        ]);

        // Run full gap analysis
        $result = $this->analyzer->analyze($ti->id, '2026-08');

        // Assert that gap_analyses for Teknik Informatika contains Docker
        $this->assertDatabaseHas('gap_analyses', [
            'study_program_id' => $ti->id,
            'skill_id' => $docker->id,
            'periode_data' => '2026-08',
        ]);

        // Assert that gap_analyses for Teknik Informatika DOES NOT CONTAIN Sales!
        $this->assertDatabaseMissing('gap_analyses', [
            'study_program_id' => $ti->id,
            'skill_id' => $sales->id,
            'periode_data' => '2026-08',
        ]);
    }
}
