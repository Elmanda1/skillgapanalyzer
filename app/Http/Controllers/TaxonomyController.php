<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use App\Models\SkillAlias;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
        if (is_array($request->input('aliases'))) {
            $request->merge([
                'aliases' => array_map('trim', $request->input('aliases')),
            ]);
        }

        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255', 'unique:skills,nama'],
            'kategori' => ['required', 'string', 'max:100'],
            'sektor_industri_terkait' => ['required', 'string', 'max:100'],
            'dimension' => ['nullable', 'string', 'in:hard_technical,task_management,contingency_management,knowledge_information,social_situational'],
            'is_hard_skill' => ['boolean'],
            'aliases' => ['array'],
            'aliases.*' => ['required', 'string', 'min:1', 'max:100', 'distinct', Rule::unique('skill_aliases', 'alias_name')],
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
        if (is_array($request->input('aliases'))) {
            $request->merge([
                'aliases' => array_map('trim', $request->input('aliases')),
            ]);
        }

        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255', "unique:skills,nama,{$skill->id}"],
            'kategori' => ['required', 'string', 'max:100'],
            'sektor_industri_terkait' => ['required', 'string', 'max:100'],
            'dimension' => ['nullable', 'string', 'in:hard_technical,task_management,contingency_management,knowledge_information,social_situational'],
            'is_hard_skill' => ['boolean'],
            'aliases' => ['array'],
            'aliases.*' => [
                'required', 'string', 'min:1', 'max:100', 'distinct',
                Rule::unique('skill_aliases', 'alias_name')
                    ->where(fn ($query) => $query->where('skill_id', '!=', $skill->id)),
            ],
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
