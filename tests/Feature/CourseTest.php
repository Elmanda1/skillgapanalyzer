<?php

use App\Models\Course;
use App\Models\Skill;
use App\Models\StudyProgram;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseTest extends TestCase
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

    public function test_can_create_course()
    {
        $program = $this->createStudyProgram();

        Course::create([
            'study_program_id' => $program->id,
            'code' => 'TI-401',
            'name' => 'Pembelajaran Mesin',
            'semester' => 4,
            'credits' => 3,
            'versi' => 'v1',
            'status_verifikasi_ekstraksi' => true,
        ]);

        $this->assertDatabaseHas('courses', ['code' => 'TI-401']);
    }

    public function test_course_belongs_to_study_program()
    {
        $program = $this->createStudyProgram();
        $course = Course::create([
            'study_program_id' => $program->id,
            'code' => 'TI-401',
            'name' => 'Pembelajaran Mesin',
            'semester' => 4,
            'credits' => 3,
            'versi' => 'v1',
            'status_verifikasi_ekstraksi' => true,
        ]);

        $this->assertTrue($course->studyProgram->is($program));
    }

    public function test_course_belongs_to_many_skills()
    {
        $course = Course::create([
            'study_program_id' => $this->createStudyProgram()->id,
            'code' => 'TI-401',
            'name' => 'Pembelajaran Mesin',
            'semester' => 4,
            'credits' => 3,
            'versi' => 'v1',
            'status_verifikasi_ekstraksi' => true,
        ]);
        $skill = Skill::create([
            'nama' => 'Machine Learning',
            'kategori' => 'Kecerdasan Buatan',
            'sektor_industri_terkait' => 'Teknologi Informasi',
        ]);

        $course->skills()->attach($skill);

        $this->assertDatabaseHas('course_skill', ['course_id' => $course->id, 'skill_id' => $skill->id]);
    }

    public function test_course_belongs_to_many_users()
    {
        $course = Course::create([
            'study_program_id' => $this->createStudyProgram()->id,
            'code' => 'TI-401',
            'name' => 'Pembelajaran Mesin',
            'semester' => 4,
            'credits' => 3,
            'versi' => 'v1',
            'status_verifikasi_ekstraksi' => true,
        ]);
        $user = User::factory()->create();

        $course->users()->attach($user);

        $this->assertDatabaseHas('course_user', ['course_id' => $course->id, 'user_id' => $user->id]);
    }
}
