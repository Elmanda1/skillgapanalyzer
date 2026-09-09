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
}
