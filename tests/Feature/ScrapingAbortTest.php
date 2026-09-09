<?php

namespace Tests\Feature;

use App\Models\ScrapingAgent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScrapingAbortTest extends TestCase
{
    use RefreshDatabase;

    public function test_abort_agent_updates_agent_status_to_offline(): void
    {
        $user = User::factory()->create();

        $agent = ScrapingAgent::create([
            'agent_code' => 'AGENT-TEST-01',
            'domain_url' => 'https://www.testdomain.com',
            'sumber' => 'testdomain.com',
            'wilayah' => 'Nodus Test',
            'status' => 'Syncing',
            'uptime' => 99.9,
            'volume_data' => 0.5,
            'last_sync' => now(),
        ]);

        $response = $this->actingAs($user)->postJson(route('scraping.abort'), [
            'agent_id' => $agent->id,
            'agent_code' => $agent->agent_code,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);

        $this->assertDatabaseHas('scraping_agents', [
            'id' => $agent->id,
            'status' => 'Offline',
        ]);
    }
}
