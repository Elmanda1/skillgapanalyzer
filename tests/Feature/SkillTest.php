<?php

use App\Models\Skill;
use App\Models\SkillAlias;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SkillTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_skill()
    {
        Skill::create([
            'nama' => 'Machine Learning',
            'kategori' => 'Kecerdasan Buatan',
            'sektor_industri_terkait' => 'Teknologi Informasi',
        ]);

        $this->assertDatabaseHas('skills', ['nama' => 'Machine Learning']);
    }

    public function test_can_create_skill_alias()
    {
        $skill = Skill::create([
            'nama' => 'Machine Learning',
            'kategori' => 'Kecerdasan Buatan',
            'sektor_industri_terkait' => 'Teknologi Informasi',
        ]);

        SkillAlias::create([
            'skill_id' => $skill->id,
            'alias_name' => 'ML',
        ]);

        $this->assertDatabaseHas('skill_aliases', ['skill_id' => $skill->id, 'alias_name' => 'ML']);
    }

    public function test_skill_has_many_aliases()
    {
        $skill = Skill::create([
            'nama' => 'Machine Learning',
            'kategori' => 'Kecerdasan Buatan',
            'sektor_industri_terkait' => 'Teknologi Informasi',
        ]);
        SkillAlias::create(['skill_id' => $skill->id, 'alias_name' => 'ML']);
        SkillAlias::create(['skill_id' => $skill->id, 'alias_name' => 'Machine Learning Engineering']);

        $this->assertCount(2, $skill->aliases);
    }
}
