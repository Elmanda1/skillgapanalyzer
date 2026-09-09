<?php

use App\Models\Course;
use App\Models\StudyProgram;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MyCoursesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function makeProdi(string $prodi = 'Teknik Informatika'): StudyProgram
    {
        return StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'jenjang' => 'D4',
            'nama_prodi' => $prodi,
        ]);
    }

    private function makeCourse(StudyProgram $prodi, string $code, int $semester): Course
    {
        return Course::create([
            'study_program_id' => $prodi->id,
            'code' => $code,
            'name' => 'MK ' . $code,
            'semester' => $semester,
            'credits' => 3,
            'versi' => 'v1',
            'status_verifikasi_ekstraksi' => false,
        ]);
    }

    private function actingAsMahasiswa(StudyProgram $prodi, int $semester = 3): User
    {
        $user = User::factory()->create([
            'study_program_id' => $prodi->id,
            'semester' => $semester,
        ]);
        $user->assignRole(Role::findOrCreate('mahasiswa'));
        $this->actingAs($user);

        return $user;
    }

    public function test_mahasiswa_sees_passed_and_current_courses_only(): void
    {
        $prodi = $this->makeProdi();
        $this->makeCourse($prodi, 'TI101', 1);
        $this->makeCourse($prodi, 'TI201', 2);
        $this->makeCourse($prodi, 'TI301', 3);
        $this->makeCourse($prodi, 'TI401', 4);
        $this->actingAsMahasiswa($prodi, 3);

        $this->get('/my-courses')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('MyCourses', false)
                ->has('courses', 3)
                ->where('courses.0.status', 'passed')
                ->where('courses.2.status', 'current')
                ->where('currentSemester', 3));
    }

    public function test_courses_are_scoped_to_own_study_program(): void
    {
        $prodiA = $this->makeProdi('Teknik Informatika');
        $prodiB = $this->makeProdi('Akuntansi');
        $this->makeCourse($prodiA, 'TI101', 1);
        $this->makeCourse($prodiB, 'AK101', 1);
        $this->actingAsMahasiswa($prodiA, 2);

        $this->get('/my-courses')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('courses', 1)
                ->where('courses.0.code', 'TI101'));
    }

    public function test_guest_redirected_and_non_mahasiswa_forbidden(): void
    {
        $this->get('/my-courses')->assertRedirect('/login');

        $prodi = $this->makeProdi();
        $dosen = User::factory()->create(['study_program_id' => $prodi->id]);
        $dosen->assignRole(Role::findOrCreate('dosen'));
        $this->actingAs($dosen);

        $this->get('/my-courses')->assertForbidden();
    }
}
