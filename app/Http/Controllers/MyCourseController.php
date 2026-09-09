<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MyCourseController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        $courses = $user->acquiredCourses()
            ->with('skills:id,nama')
            ->orderBy('semester')
            ->orderBy('code')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'code' => $c->code,
                'name' => $c->name,
                'semester' => $c->semester,
                'credits' => $c->credits,
                'status' => $c->semester < ($user->semester ?? 1) ? 'passed' : 'current',
                'skills' => $c->skills->pluck('nama')->all(),
            ])
            ->values()
            ->all();

        return inertia('MyCourses', [
            'courses' => $courses,
            'currentSemester' => $user->semester ?? 1,
            'studyProgram' => $user->studyProgram?->only(['id', 'nama_institusi', 'nama_prodi', 'jenjang']),
        ]);
    }
}
