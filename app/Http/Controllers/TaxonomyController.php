<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use App\Models\SkillAlias;
use App\Services\Taxonomy\TaxonomySummary;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaxonomyController extends Controller
{
    public function __construct(private TaxonomySummary $summary)
    {
    }

    public function reference(Request $request)
    {
        $search = trim((string) $request->string('search', ''));
        $dimension = $request->string('dimension', 'all');
        $kategori = $request->string('kategori', 'all');

        $skills = Skill::query()
            ->with('aliases')
            ->orderBy('nama')
            ->search($search)
            ->inDimension($dimension)
            ->inCategory($kategori)
            ->paginate(25)
            ->withQueryString();

        return inertia('Taxonomy/Reference', [
            'skills' => $skills,
            'filters' => [
                'search' => $search,
                'dimension' => $dimension,
                'kategori' => $kategori,
            ],
            'summary' => $this->summary->get(),
        ]);
    }

    public function index(Request $request)
    {
        $search = trim((string) $request->string('search', ''));

        $skills = Skill::query()
            ->with('aliases')
            ->orderBy('nama')
            ->search($search)
            ->paginate(25)
            ->withQueryString();

        return inertia('Taxonomy/Manage', [
            'skills' => $skills,
            'search' => $search,
        ]);
    }

    public function search(Request $request)
    {
        $term = trim((string) $request->string('q', ''));

        if ($term === '') {
            return response()->json(['results' => []]);
        }

        $results = Skill::query()
            ->search($term)
            ->select('id', 'nama', 'kategori', 'sektor_industri_terkait', 'dimension')
            ->orderBy('nama')
            ->limit(20)
            ->get();

        return response()->json([
            'results' => $results,
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

        $this->summary->forget();

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

        $this->summary->forget();

        return back();
    }

    public function destroy(Request $request, Skill $skill)
    {
        $skill->aliases()->delete();
        $skill->delete();

        $this->summary->forget();

        return back();
    }
}