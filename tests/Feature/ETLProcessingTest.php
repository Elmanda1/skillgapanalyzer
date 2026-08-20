<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\DemandTrend;
use App\Models\JobVacancy;
use App\Models\LearningOutcome;
use App\Models\Skill;
use App\Models\SkillAlias;
use App\Models\StudyProgram;
use App\Services\ETL\SkillExtractorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ETLProcessingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic skills & aliases
        $docker = Skill::create([
            'nama' => 'Docker',
            'kategori' => 'Cloud & DevOps',
            'sektor_industri_terkait' => 'Teknologi & TI',
            'dimension' => 'hard_technical',
            'is_hard_skill' => true,
        ]);
        SkillAlias::create(['skill_id' => $docker->id, 'alias_name' => 'containerization']);
        SkillAlias::create(['skill_id' => $docker->id, 'alias_name' => 'docker container']);

        $react = Skill::create([
            'nama' => 'React.js',
            'kategori' => 'Frontend Dev',
            'sektor_industri_terkait' => 'Teknologi & TI',
            'dimension' => 'hard_technical',
            'is_hard_skill' => true,
        ]);
        SkillAlias::create(['skill_id' => $react->id, 'alias_name' => 'react']);
        SkillAlias::create(['skill_id' => $react->id, 'alias_name' => 'reactjs']);

        $laravel = Skill::create([
            'nama' => 'Laravel',
            'kategori' => 'Backend Dev',
            'sektor_industri_terkait' => 'Teknologi & TI',
            'dimension' => 'hard_technical',
            'is_hard_skill' => true,
        ]);
        SkillAlias::create(['skill_id' => $laravel->id, 'alias_name' => 'laravel php']);
    }

    public function test_skill_extractor_service_extracts_and_resolves_aliases(): void
    {
        $service = app(SkillExtractorService::class);
        $service->loadIndex(true);

        $text = "Kami mencari developer yang paham containerization dan mahir reactjs.";
        $extracted = $service->extract($text);

        $names = array_column($extracted, 'name');
        $this->assertContains('Docker', $names);
        $this->assertContains('React.js', $names);
    }

    public function test_demand_trends_artisan_command_aggregates_data(): void
    {
        $docker = Skill::where('nama', 'Docker')->first();
        $react = Skill::where('nama', 'React.js')->first();

        // Create job vacancies
        $job1 = JobVacancy::create([
            'sumber' => 'loker.id',
            'tanggal_crawl' => '2026-08-10',
            'published_at' => '2026-08-10 10:00:00',
            'sektor' => 'Teknologi',
            'lokasi' => 'Jakarta',
            'slug' => 'job-1',
            'title' => 'DevOps Engineer',
        ]);
        $job1->skills()->attach([$docker->id]);

        $job2 = JobVacancy::create([
            'sumber' => 'loker.id',
            'tanggal_crawl' => '2026-08-15',
            'published_at' => '2026-08-15 11:00:00',
            'sektor' => 'Teknologi',
            'lokasi' => 'Bandung',
            'slug' => 'job-2',
            'title' => 'Frontend Engineer',
        ]);
        $job2->skills()->attach([$react->id, $docker->id]);

        // Run artisan command
        $this->artisan('etl:process-trends')
            ->assertSuccessful();

        $this->assertDatabaseHas('demand_trends', [
            'skill_id' => $docker->id,
            'period' => '2026-08',
            'frequency' => 2,
            'percentage' => 100.00,
        ]);

        $this->assertDatabaseHas('demand_trends', [
            'skill_id' => $react->id,
            'period' => '2026-08',
            'frequency' => 1,
            'percentage' => 50.00,
        ]);
    }

    public function test_extract_curriculum_skills_command_links_course_skills(): void
    {
        $program = StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'nama_prodi' => 'Teknik Informatika',
            'jenjang' => 'D4',
            'jurusan' => 'Teknik Informatika dan Komputer',
        ]);

        $course = Course::create([
            'study_program_id' => $program->id,
            'code' => 'TI-301',
            'name' => 'Pemrograman Web Modern',
            'semester' => 3,
            'credits' => 3,
            'versi' => '2026',
            'status_verifikasi_ekstraksi' => false,
        ]);

        LearningOutcome::create([
            'course_id' => $course->id,
            'text' => 'Mahasiswa mampu membangun aplikasi web menggunakan framework Laravel dan arsitektur containerization Docker.',
        ]);

        $this->artisan('etl:extract-curriculum')
            ->assertSuccessful();

        $docker = Skill::where('nama', 'Docker')->first();
        $laravel = Skill::where('nama', 'Laravel')->first();

        $this->assertTrue($course->skills()->where('skills.id', $docker->id)->exists());
        $this->assertTrue($course->skills()->where('skills.id', $laravel->id)->exists());
    }
}
