<?php

namespace Tests\Feature;

use App\Models\DemandTrend;
use App\Models\GapAnalysis;
use App\Models\Skill;
use App\Models\StudyProgram;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnalysisApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $program = StudyProgram::create([
            'nama_institusi' => 'Politeknik Negeri Jakarta',
            'nama_prodi' => 'Teknik Informatika',
            'jenjang' => 'D4',
            'jurusan' => 'Teknik Informatika dan Komputer',
        ]);

        $skill = Skill::create([
            'nama' => 'React.js',
            'kategori' => 'Frontend Dev',
            'sektor_industri_terkait' => 'Teknologi & TI',
            'dimension' => 'hard_technical',
            'is_hard_skill' => true,
        ]);

        GapAnalysis::create([
            'study_program_id' => $program->id,
            'skill_id' => $skill->id,
            'tipe_mismatch' => 'aligned',
            'skor_urgensi' => 0,
            'match_rate' => 95.0,
            'periode_data' => '2026-08',
            'evidence_count' => 120,
        ]);

        DemandTrend::create([
            'skill_id' => $skill->id,
            'period' => '2026-08',
            'source' => 'loker.id',
            'frequency' => 120,
            'percentage' => 8.5,
            'growth_rate' => 10.0,
        ]);
    }

    public function test_api_summary_returns_successful_payload(): void
    {
        $response = $this->getJson('/api/v1/dashboard/summary');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'period',
                'program' => ['id', 'name', 'jenjang'],
                'metrics' => ['match_rate', 'total_skills_evaluated', 'mismatch_distribution'],
                'radar_dimensions',
                'top_urgency_gaps',
            ]);
    }

    public function test_api_gap_map_returns_skill_items(): void
    {
        $response = $this->getJson('/api/v1/gap-map');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'period',
                'total',
                'data' => [
                    '*' => ['id', 'skill_id', 'skill_name', 'tipe_mismatch', 'skor_urgensi', 'match_rate', 'evidence_count'],
                ],
            ]);
    }

    public function test_api_trends_returns_historical_series(): void
    {
        $response = $this->getJson('/api/v1/trends');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'source',
                'trends' => [
                    '*' => ['skill_id', 'skill_name', 'series'],
                ],
            ]);
    }

    public function test_api_recommendations_returns_intervention_list(): void
    {
        $response = $this->getJson('/api/v1/recommendations');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'study_program_id',
                'recommendations',
            ]);
    }

    public function test_api_run_analysis_executes_on_demand(): void
    {
        $response = $this->postJson('/api/v1/analysis/run', [
            'period' => '2026-08',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);
    }
}
