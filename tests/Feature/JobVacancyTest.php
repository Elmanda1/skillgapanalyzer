<?php

use App\Models\JobVacancy;
use App\Models\ScrapingAgent;
use App\Models\Skill;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JobVacancyTest extends TestCase
{
    use RefreshDatabase;

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
}
