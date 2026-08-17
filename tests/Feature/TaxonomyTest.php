<?php

namespace Tests\Feature;

use App\Models\Skill;
use App\Models\SkillAlias;
use App\Models\StudyProgram;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TaxonomyTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role): User
    {
        $sp = StudyProgram::create(['nama_institusi' => 'Test', 'jenjang' => 'D4', 'nama_prodi' => 'TI']);
        $user = User::factory()->create(['study_program_id' => $sp->id]);
        $user->assignRole(Role::create(['name' => $role]));

        return $user;
    }

    public function test_authenticated_user_can_view_taxonomy_reference(): void
    {
        $user = $this->makeUser('mahasiswa');
        Skill::create(['nama' => 'Docker', 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'TI', 'dimension' => 'hard_technical', 'is_hard_skill' => true]);

        $response = $this->actingAs($user)->get('/taxonomy');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Taxonomy/Reference', false));
    }

    public function test_kaprodi_can_create_skill_with_aliases(): void
    {
        $user = $this->makeUser('kaprodi');

        $response = $this->actingAs($user)->post('/taxonomy/manage', [
            'nama' => 'Terraform',
            'kategori' => 'Cloud & DevOps',
            'sektor_industri_terkait' => 'TI',
            'dimension' => 'hard_technical',
            'is_hard_skill' => true,
            'aliases' => ['iac', 'infrastructure as code'],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('skills', ['nama' => 'Terraform']);
        $this->assertDatabaseHas('skill_aliases', ['alias_name' => 'iac']);
    }

    public function test_mahasiswa_cannot_create_skill(): void
    {
        $user = $this->makeUser('mahasiswa');

        $response = $this->actingAs($user)->post('/taxonomy/manage', [
            'nama' => 'Forbidden',
            'kategori' => 'X',
            'sektor_industri_terkait' => 'Y',
        ]);

        $response->assertForbidden();
    }

    public function test_skill_alias_must_be_unique(): void
    {
        Skill::create(['nama' => 'A', 'kategori' => 'X', 'sektor_industri_terkait' => 'Y']);
        SkillAlias::create(['skill_id' => 1, 'alias_name' => 'k8s']);

        $user = $this->makeUser('kaprodi');

        $response = $this->actingAs($user)->post('/taxonomy/manage', [
            'nama' => 'Kubernetes',
            'kategori' => 'Cloud & DevOps',
            'sektor_industri_terkait' => 'TI',
            'aliases' => ['k8s'],
        ]);

        $response->assertSessionHasErrors('aliases.0');
    }

    public function test_deleting_skill_cascades_aliases(): void
    {
        $skill = Skill::create(['nama' => 'B', 'kategori' => 'X', 'sektor_industri_terkait' => 'Y']);
        SkillAlias::create(['skill_id' => $skill->id, 'alias_name' => 'be']);

        $user = $this->makeUser('super_admin');
        $this->actingAs($user)->delete("/taxonomy/manage/{$skill->id}");

        $this->assertDatabaseMissing('skill_aliases', ['skill_id' => $skill->id]);
    }
}
