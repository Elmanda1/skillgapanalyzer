<?php

use App\Models\Course;
use App\Models\Skill;
use App\Models\StudyProgram;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CurriculumApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    private function createStudyProgram(): StudyProgram
    {
        return StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'jenjang' => 'D4',
            'nama_prodi' => 'Teknik Informatika',
        ]);
    }

    private function actingAsKaprodi(?StudyProgram $program = null): User
    {
        $user = User::factory()->create();
        if ($program) {
            $user->update(['study_program_id' => $program->id]);
        }
        $user->assignRole(Role::create(['name' => 'kaprodi']));

        $this->actingAs($user);

        return $user;
    }

    private function actingAsSuperAdmin(?StudyProgram $program = null): User
    {
        $user = User::factory()->create();
        if ($program) {
            $user->update(['study_program_id' => $program->id]);
        }
        $user->assignRole(Role::create(['name' => 'super-admin']));

        $this->actingAs($user);

        return $user;
    }

    private function createSkill(): Skill
    {
        return Skill::create([
            'nama' => 'Machine Learning',
            'kategori' => 'Kecerdasan Buatan',
            'sektor_industri_terkait' => 'Teknologi Informasi',
        ]);
    }

    public function test_guest_cannot_access_curriculum_index()
    {
        $this->get('/curriculum')->assertRedirect('/login');
    }

    public function test_index_returns_curriculum_page_with_courses()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);
        Course::factory()->count(2)->create(['study_program_id' => $program->id]);

        $response = $this->get('/curriculum');

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Curriculum/Index', false)
                ->has('courses', 2));
    }

    public function test_show_returns_curriculum_show_page()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);
        $course = Course::factory()->create(['study_program_id' => $program->id]);
        $this->createSkill();
        $this->createSkill();

        $response = $this->get("/curriculum/courses/{$course->id}");

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Curriculum/Show', false)
                ->where('course.id', $course->id)
                ->has('skills', 2));
    }

    public function test_can_create_course_using_study_program_from_user()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);

        $response = $this->post('/curriculum/courses', [
            'code' => 'TI-402',
            'name' => 'Pengolahan Bahasa Alami',
            'semester' => 6,
            'credits' => 3,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('courses', [
            'study_program_id' => $program->id,
            'code' => 'TI-402',
            'name' => 'Pengolahan Bahasa Alami',
            'semester' => 6,
            'credits' => 3,
            'versi' => 'v1',
            'status_verifikasi_ekstraksi' => false,
        ]);
    }

    public function test_non_super_admin_cannot_override_study_program_when_creating_course()
    {
        $ownProgram = $this->createStudyProgram();
        $this->actingAsKaprodi($ownProgram);
        $otherProgram = $this->createStudyProgram();

        $response = $this->post('/curriculum/courses', [
            'study_program_id' => $otherProgram->id,
            'code' => 'TI-403',
            'name' => 'Sistem Terdistribusi',
            'semester' => 6,
            'credits' => 3,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('courses', [
            'study_program_id' => $ownProgram->id,
            'code' => 'TI-403',
        ]);
    }

    public function test_super_admin_can_create_course_for_other_study_program()
    {
        $this->actingAsSuperAdmin();
        $program = $this->createStudyProgram();

        $response = $this->post('/curriculum/courses', [
            'study_program_id' => $program->id,
            'code' => 'TI-403',
            'name' => 'Sistem Terdistribusi',
            'semester' => 6,
            'credits' => 3,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('courses', [
            'study_program_id' => $program->id,
            'code' => 'TI-403',
        ]);
    }

    public function test_index_scopes_courses_to_kaprodi_study_program()
    {
        $ownProgram = $this->createStudyProgram();
        $this->actingAsKaprodi($ownProgram);
        $otherProgram = $this->createStudyProgram();

        $ownCourses = Course::factory()->count(2)->create(['study_program_id' => $ownProgram->id]);
        Course::factory()->count(2)->create(['study_program_id' => $otherProgram->id]);

        $response = $this->get('/curriculum');

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Curriculum/Index', false)
                ->has('courses', 2));

        $returnedIds = collect($response->viewData('page')['props']['courses'])->pluck('id')->all();

        $this->assertEqualsCanonicalizing($ownCourses->pluck('id')->all(), $returnedIds);
    }

    public function test_cannot_set_status_verifikasi_ekstraksi_when_creating_course()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);

        $this->post('/curriculum/courses', [
            'code' => 'TI-405',
            'name' => 'Pemrograman Web Lanjut',
            'semester' => 6,
            'credits' => 3,
            'status_verifikasi_ekstraksi' => true,
        ])->assertRedirect();

        $this->assertDatabaseHas('courses', [
            'code' => 'TI-405',
            'status_verifikasi_ekstraksi' => false,
        ]);
    }

    public function test_cannot_create_course_with_semester_below_one()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);

        $response = $this->post('/curriculum/courses', [
            'code' => 'TI-406',
            'name' => 'Kursus Semester',
            'semester' => 0,
            'credits' => 3,
        ]);

        $response->assertSessionHasErrors('semester');
        $this->assertDatabaseCount('courses', 0);
    }

    public function test_cannot_create_course_with_semester_above_twelve()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);

        $response = $this->post('/curriculum/courses', [
            'code' => 'TI-407',
            'name' => 'Kursus Semester',
            'semester' => 13,
            'credits' => 3,
        ]);

        $response->assertSessionHasErrors('semester');
        $this->assertDatabaseCount('courses', 0);
    }

    public function test_cannot_create_course_with_credits_below_one()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);

        $response = $this->post('/curriculum/courses', [
            'code' => 'TI-408',
            'name' => 'Kursus SKS',
            'semester' => 3,
            'credits' => 0,
        ]);

        $response->assertSessionHasErrors('credits');
        $this->assertDatabaseCount('courses', 0);
    }

    public function test_cannot_create_course_with_code_longer_than_255()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);

        $response = $this->post('/curriculum/courses', [
            'code' => str_repeat('A', 256),
            'name' => 'Kursus Kode Panjang',
            'semester' => 3,
            'credits' => 3,
        ]);

        $response->assertSessionHasErrors('code');
        $this->assertDatabaseCount('courses', 0);
    }

    public function test_cannot_create_course_with_name_longer_than_255()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);

        $response = $this->post('/curriculum/courses', [
            'code' => 'TI-409',
            'name' => str_repeat('A', 256),
            'semester' => 3,
            'credits' => 3,
        ]);

        $response->assertSessionHasErrors('name');
        $this->assertDatabaseCount('courses', 0);
    }

    public function test_cannot_create_learning_outcome_with_text_longer_than_2000()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);
        $course = Course::factory()->create(['study_program_id' => $program->id]);

        $response = $this->post("/curriculum/courses/{$course->id}/learning-outcomes", [
            'text' => str_repeat('A', 2001),
        ]);

        $response->assertSessionHasErrors('text');
        $this->assertDatabaseCount('learning_outcomes', 0);
    }

    public function test_cannot_create_learning_outcome_with_source_doc_longer_than_255()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);
        $course = Course::factory()->create(['study_program_id' => $program->id]);

        $response = $this->post("/curriculum/courses/{$course->id}/learning-outcomes", [
            'text' => 'Mahasiswa mampu menguasai materi.',
            'source_doc' => str_repeat('A', 256),
        ]);

        $response->assertSessionHasErrors('source_doc');
        $this->assertDatabaseCount('learning_outcomes', 0);
    }

    public function test_cannot_create_course_without_study_program()
    {
        $this->actingAsKaprodi();

        $response = $this->post('/curriculum/courses', [
            'code' => 'TI-404',
            'name' => 'Keamanan Informasi',
            'semester' => 7,
            'credits' => 2,
        ]);

        $response->assertSessionHasErrors('study_program_id');
        $this->assertDatabaseCount('courses', 0);
    }

    public function test_can_sync_skills_to_course()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);
        $course = Course::factory()->create(['study_program_id' => $program->id]);
        $skill = $this->createSkill();

        $response = $this->post("/curriculum/courses/{$course->id}/skills", [
            'skill_ids' => [$skill->id],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('course_skill', [
            'course_id' => $course->id,
            'skill_id' => $skill->id,
        ]);
    }

    public function test_can_clear_all_skills_from_course()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);
        $course = Course::factory()->create(['study_program_id' => $program->id]);
        $skill = $this->createSkill();
        $course->skills()->sync([$skill->id]);

        $response = $this->post("/curriculum/courses/{$course->id}/skills", [
            'skill_ids' => [],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseMissing('course_skill', [
            'course_id' => $course->id,
            'skill_id' => $skill->id,
        ]);
    }

    public function test_can_create_learning_outcome_for_course()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);
        $course = Course::factory()->create(['study_program_id' => $program->id]);

        $response = $this->post("/curriculum/courses/{$course->id}/learning-outcomes", [
            'text' => 'Mahasiswa mampu menganalisis algoritma pembelajaran mesin.',
            'source_doc' => 'RPS-TI-401.pdf',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('learning_outcomes', [
            'course_id' => $course->id,
            'text' => 'Mahasiswa mampu menganalisis algoritma pembelajaran mesin.',
            'source_doc' => 'RPS-TI-401.pdf',
        ]);
    }

    public function test_non_super_admin_cannot_access_course_from_other_study_program()
    {
        $program = $this->createStudyProgram();
        $this->actingAsKaprodi($program);
        $course = Course::factory()->create();

        $response = $this->get("/curriculum/courses/{$course->id}");

        $response->assertForbidden();
    }

    public function test_super_admin_can_access_course_from_other_study_program()
    {
        $this->actingAsSuperAdmin();
        $course = Course::factory()->create();

        $response = $this->get("/curriculum/courses/{$course->id}");

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Curriculum/Show', false)
                ->where('course.id', $course->id));
    }

    public function test_user_without_allowed_role_cannot_access_curriculum_index()
    {
        $user = User::factory()->create();
        $user->assignRole(Role::create(['name' => 'mahasiswa']));
        $this->actingAs($user);

        $this->get('/curriculum')->assertForbidden();
    }

    public function test_super_admin_can_access_curriculum_index()
    {
        $this->actingAsSuperAdmin();

        $this->get('/curriculum')->assertOk();
    }
}
