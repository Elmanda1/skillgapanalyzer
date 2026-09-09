<?php
use App\Models\Skill;
use App\Models\StudyProgram;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CurriculumImportTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsKaprodi(?StudyProgram $program = null): User
    {
        $user = User::factory()->create();
        if ($program) { $user->update(['study_program_id' => $program->id]); }
        $user->assignRole(Role::firstOrCreate(['name' => 'kaprodi']));
        $this->actingAs($user);
        return $user;
    }

    private function makeXlsx(array $rows): UploadedFile
    {
        $ss = new Spreadsheet();
        $sheet = $ss->getActiveSheet();
        $sheet->fromArray([['kode','nama','semester','sks','versi','study_program_id','skills','cpl_text','cpl_source']], null, 'A1');
        $sheet->fromArray($rows, null, 'A2');
        $path = tempnam(sys_get_temp_dir(), 'cur') . '.xlsx';
        (new Xlsx($ss))->save($path);
        return new UploadedFile($path, 'kurikulum.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
    }

    public function test_dry_run_returns_preview_without_writing()
    {
        $sp = StudyProgram::create(['nama_institusi' => 'PNJ', 'jenjang' => 'D4', 'nama_prodi' => 'TI']);
        $this->actingAsKaprodi($sp);
        Skill::create(['nama' => 'Docker', 'kategori' => 'DevOps', 'sektor_industri_terkait' => 'TI']);

        $file = $this->makeXlsx([['TI-401','Cloud Computing',5,3,'v1','','Docker','Mampu deploy container','RPS-2026']]);

        $res = $this->postJson('/curriculum/import', ['file' => $file, 'dry_run' => true]);
        $res->assertOk()->assertJsonPath('mode', 'preview')->assertJsonPath('valid', 1);
        $this->assertDatabaseCount('courses', 0);
    }

    public function test_commit_upserts_by_code_and_syncs_skills_and_cpl()
    {
        $sp = StudyProgram::create(['nama_institusi' => 'PNJ', 'jenjang' => 'D4', 'nama_prodi' => 'TI']);
        $this->actingAsKaprodi($sp);
        $skill = Skill::create(['nama' => 'Docker', 'kategori' => 'DevOps', 'sektor_industri_terkait' => 'TI']);
        \App\Models\Course::create(['study_program_id' => $sp->id, 'code' => 'TI-401', 'name' => 'Lama', 'semester' => 5, 'credits' => 2, 'versi' => 'v1', 'status_verifikasi_ekstraksi' => false]);

        $file = $this->makeXlsx([['TI-401', 'Cloud Computing', 5, 3, 'v1', '', 'Docker', 'Mampu deploy container', 'RPS']]);

        $res = $this->postJson('/curriculum/import', ['file' => $file]);

        $res->assertOk()->assertJsonPath('mode', 'committed')->assertJsonPath('updated', 1)->assertJsonPath('created', 0);
        $this->assertDatabaseHas('courses', ['code' => 'TI-401', 'name' => 'Cloud Computing', 'credits' => 3]);
        $this->assertDatabaseHas('learning_outcomes', ['text' => 'Mampu deploy container']);
        $this->assertEquals([$skill->id], \App\Models\Course::where('code', 'TI-401')->first()->skills()->pluck('skills.id')->all());
    }

    public function test_commit_with_row_errors_writes_nothing()
    {
        $sp = StudyProgram::create(['nama_institusi' => 'PNJ', 'jenjang' => 'D4', 'nama_prodi' => 'TI']);
        $this->actingAsKaprodi($sp);

        $file = $this->makeXlsx([['', 'Tanpa Kode', 5, 3, 'v1', '', '', '', '']]);

        $res = $this->postJson('/curriculum/import', ['file' => $file]);

        $res->assertOk()->assertJsonPath('mode', 'preview');
        $this->assertNotEmpty($res->json('errors'));
        $this->assertDatabaseCount('courses', 0);
    }

    public function test_non_super_admin_cannot_import_to_other_prodi()
    {
        $mine = StudyProgram::create(['nama_institusi' => 'PNJ', 'jenjang' => 'D4', 'nama_prodi' => 'TI']);
        $other = StudyProgram::create(['nama_institusi' => 'POLBAN', 'jenjang' => 'D4', 'nama_prodi' => 'TI']);
        $this->actingAsKaprodi($mine);

        $file = $this->makeXlsx([['TI-900', 'MK Asing', 1, 2, 'v1', (string) $other->id, '', '', '']]);

        $this->postJson('/curriculum/import', ['file' => $file])->assertOk();

        $this->assertDatabaseHas('courses', ['code' => 'TI-900', 'study_program_id' => $mine->id]);
        $this->assertDatabaseMissing('courses', ['code' => 'TI-900', 'study_program_id' => $other->id]);
    }

    public function test_guest_and_mahasiswa_cannot_import()
    {
        $sp = StudyProgram::create(['nama_institusi' => 'PNJ', 'jenjang' => 'D4', 'nama_prodi' => 'TI']);
        $file = $this->makeXlsx([['TI-401', 'X', 1, 2, 'v1', '', '', '', '']]);

        $this->postJson('/curriculum/import', ['file' => $file, 'dry_run' => true])->assertUnauthorized();

        $mhs = User::factory()->create(['study_program_id' => $sp->id]);
        $mhs->assignRole(Role::firstOrCreate(['name' => 'mahasiswa']));
        $this->actingAs($mhs);
        $this->postJson('/curriculum/import', ['file' => $file, 'dry_run' => true])->assertForbidden();
    }
}
