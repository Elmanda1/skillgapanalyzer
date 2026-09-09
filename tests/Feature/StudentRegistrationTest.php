<?php

namespace Tests\Feature;

use App\Models\StudyProgram;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StudentRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'mahasiswa']);
    }

    public function test_registration_page_renders_study_programs_list(): void
    {
        $prodi = StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'jenjang' => 'S1',
            'nama_prodi' => 'Teknik Informatika',
        ]);

        $response = $this->get('/register');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('RegisterPage')
            ->has('studyPrograms')
        );
    }

    public function test_student_can_register_with_study_program_and_semester(): void
    {
        $prodi = StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Bandung',
            'jenjang' => 'D3',
            'nama_prodi' => 'Teknik Elektronika',
        ]);

        $response = $this->post('/register', [
            'name' => 'Budi Santoso',
            'email' => 'budi.santoso@polban.ac.id',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'study_program_id' => $prodi->id,
            'semester' => 4,
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticated();

        $user = User::where('email', 'budi.santoso@polban.ac.id')->first();
        $this->assertNotNull($user);
        $this->assertEquals('Budi Santoso', $user->name);
        $this->assertEquals($prodi->id, $user->study_program_id);
        $this->assertEquals(4, $user->semester);
        $this->assertTrue($user->hasRole('mahasiswa'));
    }

    public function test_registration_fails_when_semester_is_out_of_range(): void
    {
        $prodi = StudyProgram::create([
            'nama_institusi' => 'PENS',
            'jenjang' => 'S1',
            'nama_prodi' => 'Sains Data Terapan',
        ]);

        $response = $this->post('/register', [
            'name' => 'Out of Bound Student',
            'email' => 'oob@pens.ac.id',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'study_program_id' => $prodi->id,
            'semester' => 99, // Invalid semester
        ]);

        $response->assertSessionHasErrors(['semester']);
        $this->assertGuest();
    }
}
