<?php

use App\Models\JobVacancy;
use App\Models\ScrapingAgent;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class JobVacancyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    private function actingAsMahasiswa(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::create(['name' => 'mahasiswa']));
        $this->actingAs($user);

        return $user;
    }

    private function makeJob(array $overrides = []): JobVacancy
    {
        return JobVacancy::create(array_merge([
            'sumber' => 'loker.id',
            'tanggal_crawl' => '2026-08-01',
            'sektor' => 'Teknologi Informasi',
            'lokasi' => 'Jakarta',
            'title' => 'Backend Developer',
            'company_name' => 'PT Tech',
            'source_url' => 'https://www.loker.id/lowongan/' . str()->random(16),
            'salary_min' => 5000000,
            'salary_max' => 8000000,
            'job_type' => 'Full Time',
            'is_remote' => true,
            'published_at' => '2026-08-10 10:00:00',
        ], $overrides));
    }

    public function test_can_create_job_vacancy()
    {
        JobVacancy::create([
            'sumber' => 'Jobstreet',
            'tanggal_crawl' => '2026-08-01',
            'sektor' => 'Teknologi Informasi',
            'lokasi' => 'Jakarta',
        ]);

        $this->assertDatabaseHas('job_vacancies', ['sumber' => 'Jobstreet', 'tanggal_crawl' => '2026-08-01 00:00:00']);
    }

    public function test_job_vacancy_belongs_to_many_skills()
    {
        $vacancy = JobVacancy::create([
            'sumber' => 'Jobstreet',
            'tanggal_crawl' => '2026-08-01',
            'sektor' => 'Teknologi Informasi',
            'lokasi' => 'Jakarta',
        ]);
        $skill = Skill::create([
            'nama' => 'Machine Learning',
            'kategori' => 'Kecerdasan Buatan',
            'sektor_industri_terkait' => 'Teknologi Informasi',
        ]);

        $vacancy->skills()->attach($skill);

        $this->assertDatabaseHas('job_vacancy_skill', ['job_vacancy_id' => $vacancy->id, 'skill_id' => $skill->id]);
    }

    public function test_can_create_scraping_agent()
    {
        ScrapingAgent::create([
            'wilayah' => 'Jakarta',
            'status' => 'aktif',
            'uptime' => 99.5,
            'volume_data' => 1234.5,
            'last_sync' => now(),
        ]);

        $this->assertDatabaseHas('scraping_agents', ['wilayah' => 'Jakarta', 'status' => 'aktif', 'uptime' => 99.5]);
    }

    public function test_jobs_page_lists_vacancies_with_pagination()
    {
        $this->actingAsMahasiswa();

        JobVacancy::query()->delete();
        for ($i = 0; $i < 25; $i++) {
            $this->makeJob([
                'title' => "Lowongan {$i}",
                'source_url' => "https://www.loker.id/lowongan/lowongan-{$i}",
            ]);
        }

        $this->get('/jobs')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('JobBrowser')
                ->has('jobs.data', 20)
                ->where('jobs.total', 25)
                ->where('jobs.per_page', 20)
                ->where('jobs.current_page', 1));
    }

    public function test_jobs_page_filters_by_search_lokasi_sektor_and_remote()
    {
        $this->actingAsMahasiswa();

        $this->makeJob(['title' => 'Docker Engineer', 'lokasi' => 'Bandung', 'sektor' => 'Teknologi Informasi', 'is_remote' => false]);
        $this->makeJob(['title' => 'Sales Admin', 'lokasi' => 'Jakarta', 'sektor' => 'Perdagangan', 'is_remote' => false]);
        $this->makeJob(['title' => 'Fullstack Remote', 'lokasi' => 'Surabaya', 'sektor' => 'Teknologi Informasi', 'is_remote' => true]);

        $this->get('/jobs?search=docker')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('jobs.data', 1)->where('jobs.data.0.title', 'Docker Engineer'));

        $this->get('/jobs?sektor=Perdagangan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('jobs.data', 1)->where('jobs.data.0.title', 'Sales Admin'));

        $this->get('/jobs?is_remote=1')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('jobs.data', 1)->where('jobs.data.0.title', 'Fullstack Remote'));

        $this->get('/jobs?lokasi=Bandung')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('jobs.data', 1)->where('jobs.data.0.lokasi', 'Bandung'));
    }

    public function test_jobs_page_eager_loads_skills()
    {
        $this->actingAsMahasiswa();

        $vacancy = $this->makeJob();
        $skill = Skill::create([
            'nama' => 'Docker',
            'kategori' => 'Cloud & DevOps',
            'sektor_industri_terkait' => 'Teknologi & TI',
            'dimension' => 'hard_technical',
        ]);
        $vacancy->skills()->attach($skill);

        $this->get('/jobs')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('jobs.data.0.skills', 1)
                ->where('jobs.data.0.skills.0.nama', 'Docker'));
    }

    public function test_jobs_page_searches_by_skill_name_and_skill_alias()
    {
        $this->actingAsMahasiswa();

        $vacancy = $this->makeJob(['title' => 'Graphic Designer', 'company_name' => 'PT Creative']);
        $skill = Skill::create([
            'nama' => 'Corel Draw',
            'kategori' => 'Desain Grafis',
            'sektor_industri_terkait' => 'Kreatif',
            'dimension' => 'hard_technical',
        ]);
        \App\Models\SkillAlias::create([
            'skill_id' => $skill->id,
            'alias_name' => 'CorelDraw Suite',
        ]);
        $vacancy->skills()->attach($skill);

        // Search by skill name
        $this->get('/jobs?search=Corel%20Draw')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('jobs.data', 1)
                ->where('jobs.data.0.title', 'Graphic Designer'));

        // Search by alias name
        $this->get('/jobs?search=CorelDraw%20Suite')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('jobs.data', 1)
                ->where('jobs.data.0.title', 'Graphic Designer'));
    }
}

