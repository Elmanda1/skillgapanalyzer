<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Skill;
use App\Models\StudyProgram;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserSemesterSkillTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_acquires_courses_and_skills_up_to_their_semester(): void
    {
        $prodi = StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Test',
            'jenjang' => 'D4',
            'nama_prodi' => 'Teknik Informatika',
        ]);

        $courseSem1 = Course::create([
            'study_program_id' => $prodi->id,
            'code' => 'TI101',
            'name' => 'Pemrograman Dasar',
            'semester' => 1,
            'credits' => 3,
            'versi' => '2026',
            'status_verifikasi_ekstraksi' => true,
        ]);

        $courseSem2 = Course::create([
            'study_program_id' => $prodi->id,
            'code' => 'TI201',
            'name' => 'Pemrograman Web',
            'semester' => 2,
            'credits' => 3,
            'versi' => '2026',
            'status_verifikasi_ekstraksi' => true,
        ]);

        $courseSem5 = Course::create([
            'study_program_id' => $prodi->id,
            'code' => 'TI501',
            'name' => 'Cloud Architecture',
            'semester' => 5,
            'credits' => 4,
            'versi' => '2026',
            'status_verifikasi_ekstraksi' => true,
        ]);

        $skill1 = Skill::create(['nama' => 'Basic Algorithm', 'kategori' => 'Backend Dev', 'sektor_industri_terkait' => 'Teknologi Informasi']);
        $skill2 = Skill::create(['nama' => 'HTML & CSS', 'kategori' => 'Frontend Dev', 'sektor_industri_terkait' => 'Teknologi Informasi']);
        $skill5 = Skill::create(['nama' => 'Kubernetes Cluster', 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'Teknologi Informasi']);

        $courseSem1->skills()->attach($skill1->id);
        $courseSem2->skills()->attach($skill2->id);
        $courseSem5->skills()->attach($skill5->id);

        // Student in Semester 2
        $user = User::create([
            'name' => 'Mahasiswa Semester 2',
            'email' => 'mhs2@test.com',
            'password' => bcrypt('password'),
            'study_program_id' => $prodi->id,
            'semester' => 2,
        ]);

        // Validate courses acquired
        $acquiredCourses = $user->acquiredCourses()->get();
        $this->assertCount(2, $acquiredCourses);
        $this->assertTrue($acquiredCourses->contains('id', $courseSem1->id));
        $this->assertTrue($acquiredCourses->contains('id', $courseSem2->id));
        $this->assertFalse($acquiredCourses->contains('id', $courseSem5->id));

        // Validate skills acquired
        $acquiredSkills = $user->acquiredSkills()->get();
        $this->assertCount(2, $acquiredSkills);
        $this->assertTrue($acquiredSkills->contains('id', $skill1->id));
        $this->assertTrue($acquiredSkills->contains('id', $skill2->id));
        $this->assertFalse($acquiredSkills->contains('id', $skill5->id));

        // Promote to Semester 5
        $user->update(['semester' => 5]);

        $this->assertCount(3, $user->acquiredCourses()->get());
        $this->assertCount(3, $user->acquiredSkills()->get());
        $this->assertTrue($user->acquiredSkills()->get()->contains('id', $skill5->id));
    }

    public function test_user_skills_are_isolated_to_their_own_study_program(): void
    {
        $prodiA = StudyProgram::create([
            'nama_institusi' => 'Politeknik A',
            'jenjang' => 'D3',
            'nama_prodi' => 'Teknik Komputer',
        ]);

        $prodiB = StudyProgram::create([
            'nama_institusi' => 'Politeknik B',
            'jenjang' => 'S1',
            'nama_prodi' => 'Akuntansi',
        ]);

        $courseA = Course::create([
            'study_program_id' => $prodiA->id,
            'code' => 'TK101',
            'name' => 'Jaringan Dasar',
            'semester' => 1,
            'credits' => 3,
            'versi' => '2026',
            'status_verifikasi_ekstraksi' => true,
        ]);

        $courseB = Course::create([
            'study_program_id' => $prodiB->id,
            'code' => 'AKT101',
            'name' => 'Akuntansi Keuangan',
            'semester' => 1,
            'credits' => 3,
            'versi' => '2026',
            'status_verifikasi_ekstraksi' => true,
        ]);

        $skillA = Skill::create(['nama' => 'Cisco Networking', 'kategori' => 'Cybersecurity', 'sektor_industri_terkait' => 'Teknologi Informasi']);
        $skillB = Skill::create(['nama' => 'Financial Auditing', 'kategori' => 'Akuntansi & Keuangan', 'sektor_industri_terkait' => 'Keuangan']);

        $courseA->skills()->attach($skillA->id);
        $courseB->skills()->attach($skillB->id);

        $studentA = User::create([
            'name' => 'Student A',
            'email' => 'studenta@test.com',
            'password' => bcrypt('password'),
            'study_program_id' => $prodiA->id,
            'semester' => 4,
        ]);

        // Student A must only acquire skills from Prodi A
        $skillsA = $studentA->acquiredSkills()->get();
        $this->assertCount(1, $skillsA);
        $this->assertTrue($skillsA->contains('id', $skillA->id));
        $this->assertFalse($skillsA->contains('id', $skillB->id));
    }

    public function test_user_without_study_program_returns_empty_collections(): void
    {
        $user = User::create([
            'name' => 'User Without Prodi',
            'email' => 'noprodi@test.com',
            'password' => bcrypt('password'),
            'study_program_id' => null,
            'semester' => 4,
        ]);

        $this->assertCount(0, $user->acquiredCourses()->get());
        $this->assertCount(0, $user->acquiredSkills()->get());
    }
}
