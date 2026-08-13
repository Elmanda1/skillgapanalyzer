<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudyProgramTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_study_program()
    {
        $program = \App\Models\StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'jenjang' => 'D4',
            'nama_prodi' => 'Teknik Informatika',
        ]);

        $this->assertDatabaseHas('study_programs', ['nama_prodi' => 'Teknik Informatika']);
    }
}
