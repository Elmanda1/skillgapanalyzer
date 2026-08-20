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
        $response->assertInertia(fn ($page) => $page->component('Taxonomy/Reference', false)->has('skills'));
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
        $aliasSkill = Skill::create(['nama' => 'A', 'kategori' => 'X', 'sektor_industri_terkait' => 'Y']);
        SkillAlias::create(['skill_id' => $aliasSkill->id, 'alias_name' => 'k8s']);

        $user = $this->makeUser('kaprodi');

        $response = $this->actingAs($user)->post('/taxonomy/manage', [
            'nama' => 'Kubernetes',
            'kategori' => 'Cloud & DevOps',
            'sektor_industri_terkait' => 'TI',
            'aliases' => ['k8s'],
        ]);

        $response->assertSessionHasErrors('aliases.0');
    }

    public function test_deleting_skill_removes_aliases(): void
    {
        $skill = Skill::create(['nama' => 'B', 'kategori' => 'X', 'sektor_industri_terkait' => 'Y']);
        SkillAlias::create(['skill_id' => $skill->id, 'alias_name' => 'be']);

        $user = $this->makeUser('super_admin');
        $this->actingAs($user)->delete("/taxonomy/manage/{$skill->id}");

        $this->assertDatabaseMissing('skill_aliases', ['skill_id' => $skill->id]);
    }

    public function test_kaprodi_can_update_skill_aliases(): void
    {
        $skill = Skill::create(['nama' => 'K8s', 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'TI', 'dimension' => 'hard_technical']);
        $keep = SkillAlias::create(['skill_id' => $skill->id, 'alias_name' => 'k8s']);

        $user = $this->makeUser('kaprodi');

        $response = $this->actingAs($user)->put("/taxonomy/manage/{$skill->id}", [
            'nama' => 'Kubernetes',
            'kategori' => 'Cloud & DevOps',
            'sektor_industri_terkait' => 'TI',
            'dimension' => 'hard_technical',
            'is_hard_skill' => true,
            'aliases' => ['kubernetes', 'k8s'],   // keep 'k8s' + add new
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('skill_aliases', ['skill_id' => $skill->id, 'alias_name' => 'kubernetes']);
        $this->assertDatabaseHas('skill_aliases', ['skill_id' => $skill->id, 'alias_name' => 'k8s']);
    }

    public function test_update_skill_alias_conflicts_with_another_skill(): void
    {
        $aliasSkill = Skill::create(['nama' => 'A', 'kategori' => 'X', 'sektor_industri_terkait' => 'Y']);
        SkillAlias::create(['skill_id' => $aliasSkill->id, 'alias_name' => 'k8s']);
        $skill = Skill::create(['nama' => 'Kubernetes', 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'TI']);

        $user = $this->makeUser('kaprodi');

        $response = $this->actingAs($user)->put("/taxonomy/manage/{$skill->id}", [
            'nama' => 'Kubernetes',
            'kategori' => 'Cloud & DevOps',
            'sektor_industri_terkait' => 'TI',
            'aliases' => ['k8s'],
        ]);

        $response->assertSessionHasErrors('aliases.0');
    }

    public function test_update_skill_can_clear_all_aliases(): void
    {
        $skill = Skill::create(['nama' => 'B', 'kategori' => 'X', 'sektor_industri_terkait' => 'Y']);
        SkillAlias::create(['skill_id' => $skill->id, 'alias_name' => 'be']);

        $user = $this->makeUser('kaprodi');

        $response = $this->actingAs($user)->put("/taxonomy/manage/{$skill->id}", [
            'nama' => 'B',
            'kategori' => 'X',
            'sektor_industri_terkait' => 'Y',
            'aliases' => [],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseMissing('skill_aliases', ['skill_id' => $skill->id]);
    }

    public function test_update_skill_padded_alias_conflicts_with_another_skill(): void
    {
        $aliasSkill = Skill::create(['nama' => 'A', 'kategori' => 'X', 'sektor_industri_terkait' => 'Y']);
        SkillAlias::create(['skill_id' => $aliasSkill->id, 'alias_name' => 'k8s']);
        $skill = Skill::create(['nama' => 'Kubernetes', 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'TI']);

        $user = $this->makeUser('kaprodi');

        $response = $this->actingAs($user)->put("/taxonomy/manage/{$skill->id}", [
            'nama' => 'Kubernetes',
            'kategori' => 'Cloud & DevOps',
            'sektor_industri_terkait' => 'TI',
            'aliases' => [' k8s '],
        ]);

        $response->assertSessionHasErrors('aliases.0');
    }

    public function test_update_skill_rejects_whitespace_only_alias(): void
    {
        $skill = Skill::create(['nama' => 'C', 'kategori' => 'X', 'sektor_industri_terkait' => 'Y']);

        $user = $this->makeUser('kaprodi');

        $response = $this->actingAs($user)->put("/taxonomy/manage/{$skill->id}", [
            'nama' => 'C',
            'kategori' => 'X',
            'sektor_industri_terkait' => 'Y',
            'aliases' => ['   '],
        ]);

        $response->assertSessionHasErrors('aliases.0');
        $this->assertDatabaseCount('skill_aliases', 0);
    }

    public function test_reference_paginates_instead_of_dumping_all_skills(): void
    {
        for ($i = 0; $i < 30; $i++) {
            Skill::create(['nama' => "Skill #{$i}", 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'TI']);
        }

        $user = $this->makeUser('mahasiswa');
        $response = $this->actingAs($user)->get('/taxonomy');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Taxonomy/Reference', false)
            ->has('skills.data', 25)
            ->where('skills.total', 30)
            ->where('summary.totalSkills', 30));
    }

    public function test_reference_search_and_filters_are_applied_server_side(): void
    {
        Skill::create(['nama' => 'Kubernetes', 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'TI', 'dimension' => 'hard_technical']);
        Skill::create(['nama' => 'Public Speaking', 'kategori' => 'Soft Skills', 'sektor_industri_terkait' => 'Umum', 'dimension' => 'social_situational']);

        $user = $this->makeUser('mahasiswa');

        $response = $this->actingAs($user)->get('/taxonomy?search=kubernetes&dimension=hard_technical&kategori=Cloud%20%26%20DevOps');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Taxonomy/Reference', false)
            ->where('filters.search', 'kubernetes')
            ->where('skills.total', 1)
            ->has('skills.data', 1)
            ->where('skills.data.0.nama', 'Kubernetes'));
    }

    public function test_manage_search_searches_across_entire_catalog(): void
    {
        for ($i = 0; $i < 30; $i++) {
            Skill::create(['nama' => "Skill #{str_pad($i, 2, '0', STR_PAD_LEFT)}", 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'TI']);
        }
        Skill::create(['nama' => 'Kubernetes', 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'TI']);

        $user = $this->makeUser('kaprodi');
        $response = $this->actingAs($user)->get('/taxonomy/manage?search=kubernetes');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Taxonomy/Manage', false)
            ->where('skills.total', 1)
            ->has('skills.data', 1)
            ->where('skills.data.0.nama', 'Kubernetes'));
    }

    public function test_autocomplete_search_returns_matching_results(): void
    {
        $skill = Skill::create(['nama' => 'Kubernetes', 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'TI']);
        SkillAlias::create(['skill_id' => $skill->id, 'alias_name' => 'k8s']);
        Skill::create(['nama' => 'Docker', 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'TI']);

        $user = $this->makeUser('dosen');
        $response = $this->actingAs($user)->getJson('/taxonomy/search?q=k8s');

        $response->assertOk()
            ->assertJsonCount(1, 'results')
            ->assertJsonPath('results.0.nama', 'Kubernetes');
    }
}
