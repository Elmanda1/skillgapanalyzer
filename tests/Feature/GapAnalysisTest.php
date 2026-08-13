<?php

use App\Models\GapAnalysis;
use App\Models\Skill;
use App\Models\StudyProgram;
use App\Models\SyllabusDraft;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GapAnalysisTest extends TestCase
{
    use RefreshDatabase;

    private function createStudyProgram(): StudyProgram
    {
        return StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'jenjang' => 'D4',
            'nama_prodi' => 'Teknik Informatika',
        ]);
    }

    private function createSkill(): Skill
    {
        return Skill::create([
            'nama' => 'Machine Learning',
            'kategori' => 'Kecerdasan Buatan',
            'sektor_industri_terkait' => 'Teknologi Informasi',
        ]);
    }

    public function test_can_create_gap_analysis()
    {
        $program = $this->createStudyProgram();
        $skill = $this->createSkill();

        GapAnalysis::create([
            'study_program_id' => $program->id,
            'skill_id' => $skill->id,
            'tipe_mismatch' => 'underskilling',
            'skor_urgensi' => 8,
            'match_rate' => 0.45,
            'periode_data' => '2026-01',
            'evidence_count' => 12,
        ]);

        $this->assertDatabaseHas('gap_analyses', [
            'study_program_id' => $program->id,
            'skill_id' => $skill->id,
            'tipe_mismatch' => 'underskilling',
            'skor_urgensi' => 8,
            'match_rate' => 0.45,
            'periode_data' => '2026-01',
            'evidence_count' => 12,
        ]);
    }

    public function test_gap_analysis_defaults_to_aligned_and_zero_evidence()
    {
        $program = $this->createStudyProgram();
        $skill = $this->createSkill();

        $gap = GapAnalysis::create([
            'study_program_id' => $program->id,
            'skill_id' => $skill->id,
            'skor_urgensi' => 1,
            'match_rate' => 0.9,
            'periode_data' => '2026-01',
        ]);

        $this->assertDatabaseHas('gap_analyses', [
            'study_program_id' => $program->id,
            'skill_id' => $skill->id,
            'tipe_mismatch' => 'aligned',
            'skor_urgensi' => 1,
            'match_rate' => 0.9,
            'periode_data' => '2026-01',
            'evidence_count' => 0,
        ]);
    }

    public function test_gap_analysis_belongs_to_study_program_and_skill()
    {
        $program = $this->createStudyProgram();
        $skill = $this->createSkill();
        $gap = GapAnalysis::create([
            'study_program_id' => $program->id,
            'skill_id' => $skill->id,
            'tipe_mismatch' => 'skill_shortage',
            'skor_urgensi' => 6,
            'match_rate' => 0.3,
            'periode_data' => '2026-01',
            'evidence_count' => 5,
        ]);

        $this->assertTrue($gap->studyProgram->is($program));
        $this->assertTrue($gap->skill->is($skill));
    }

    public function test_gap_analysis_casts_match_rate_to_float()
    {
        $gap = GapAnalysis::create([
            'study_program_id' => $this->createStudyProgram()->id,
            'skill_id' => $this->createSkill()->id,
            'tipe_mismatch' => 'underskilling',
            'skor_urgensi' => 7,
            'match_rate' => '0.55',
            'periode_data' => '2026-01',
        ]);

        $this->assertIsFloat($gap->match_rate);
        $this->assertSame(0.55, $gap->match_rate);
    }

    public function test_can_create_syllabus_draft_for_gap_analysis()
    {
        $gap = GapAnalysis::create([
            'study_program_id' => $this->createStudyProgram()->id,
            'skill_id' => $this->createSkill()->id,
            'tipe_mismatch' => 'underskilling',
            'skor_urgensi' => 8,
            'match_rate' => 0.45,
            'periode_data' => '2026-01',
            'evidence_count' => 12,
        ]);

        SyllabusDraft::create([
            'gap_analysis_id' => $gap->id,
            'konten_draft' => 'Silabus pembelajaran mesin untuk menutup gap keterampilan.',
            'status' => 'draft',
        ]);

        $this->assertDatabaseHas('syllabus_drafts', [
            'gap_analysis_id' => $gap->id,
            'konten_draft' => 'Silabus pembelajaran mesin untuk menutup gap keterampilan.',
            'status' => 'draft',
        ]);
    }

    public function test_gap_analysis_has_many_syllabus_drafts()
    {
        $gap = GapAnalysis::create([
            'study_program_id' => $this->createStudyProgram()->id,
            'skill_id' => $this->createSkill()->id,
            'tipe_mismatch' => 'underskilling',
            'skor_urgensi' => 8,
            'match_rate' => 0.45,
            'periode_data' => '2026-01',
            'evidence_count' => 12,
        ]);

        $draft = $gap->syllabusDrafts()->create([
            'konten_draft' => 'Draf silabus awal.',
            'status' => 'draft',
        ]);

        $this->assertDatabaseHas('syllabus_drafts', ['id' => $draft->id]);
        $this->assertTrue($draft->gapAnalysis->is($gap));
        $this->assertCount(1, $gap->syllabusDrafts);
    }

    public function test_syllabus_draft_can_have_approver()
    {
        $gap = GapAnalysis::create([
            'study_program_id' => $this->createStudyProgram()->id,
            'skill_id' => $this->createSkill()->id,
            'tipe_mismatch' => 'underskilling',
            'skor_urgensi' => 8,
            'match_rate' => 0.45,
            'periode_data' => '2026-01',
            'evidence_count' => 12,
        ]);
        $approver = User::factory()->create();
        $draft = SyllabusDraft::create([
            'gap_analysis_id' => $gap->id,
            'konten_draft' => 'Draf silabus yang sudah direview.',
            'status' => 'direview',
            'approver_id' => $approver->id,
        ]);

        $this->assertTrue($draft->approver->is($approver));
    }
}
