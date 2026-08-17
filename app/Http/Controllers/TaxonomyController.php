<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use App\Models\SkillAlias;
use Illuminate\Http\Request;

class TaxonomyController extends Controller
{
    public function reference(Request $request)
    {
        $skills = Skill::with('aliases')->orderBy('nama')->get();

        return inertia('Taxonomy/Reference', [
            'skills' => $skills,
            'totalSkills' => $skills->count(),
            'totalAliases' => SkillAlias::count(),
        ]);
    }

    public function index(Request $request)
    {
        $skills = Skill::with('aliases')->orderBy('nama')->get();

        return inertia('Taxonomy/Manage', [
            'skills' => $skills,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255', 'unique:skills,nama'],
            'kategori' => ['required', 'string', 'max:100'],
            'sektor_industri_terkait' => ['required', 'string', 'max:100'],
            'dimension' => ['nullable', 'string', 'in:hard_technical,task_management,contingency_management,knowledge_information,social_situational'],
            'is_hard_skill' => ['boolean'],
            'aliases' => ['array'],
            'aliases.*' => ['string', 'max:100', 'distinct', 'unique:skill_aliases,alias_name'],
        ]);

        $skill = Skill::create($validated);

        if (! empty($validated['aliases'])) {
            foreach ($validated['aliases'] as $alias) {
                SkillAlias::firstOrCreate(
                    ['alias_name' => trim($alias)],
                    ['skill_id' => $skill->id]
                );
            }
        }

        return back();
    }

    public function update(Request $request, Skill $skill)
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255', "unique:skills,nama,{$skill->id}"],
            'kategori' => ['required', 'string', 'max:100'],
            'sektor_industri_terkait' => ['required', 'string', 'max:100'],
            'dimension' => ['nullable', 'string', 'in:hard_technical,task_management,contingency_management,knowledge_information,social_situational'],
            'is_hard_skill' => ['boolean'],
            'aliases' => ['array'],
            'aliases.*' => ['string', 'max:100', 'distinct', "unique:skill_aliases,alias_name,NULL,id,skill_id,{$skill->id}"],
        ]);

        $skill->update($validated);

        if (isset($validated['aliases'])) {
            $keepIds = [];
            foreach ($validated['aliases'] as $alias) {
                $sa = SkillAlias::updateOrCreate(
                    ['alias_name' => trim($alias), 'skill_id' => $skill->id],
                    ['skill_id' => $skill->id]
                );
                $keepIds[] = $sa->id;
            }
            $skill->aliases()->whereNotIn('id', $keepIds)->delete();
        }

        return back();
    }

    public function destroy(Request $request, Skill $skill)
    {
        $skill->aliases()->delete();
        $skill->delete();

        return back();
    }
}
