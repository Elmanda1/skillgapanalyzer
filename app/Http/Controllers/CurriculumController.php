<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\LearningOutcome;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CurriculumController extends Controller
{
    public function index()
    {
        $courses = Course::with('studyProgram')->get();

        return inertia('Curriculum/Index', ['courses' => $courses]);
    }

    public function show(Course $course)
    {
        $course->load('studyProgram', 'skills', 'learningOutcomes');

        return inertia('Curriculum/Show', ['course' => $course]);
    }

    public function storeCourse(Request $request)
    {
        $validated = $request->validate([
            'study_program_id' => ['nullable', 'exists:study_programs,id'],
            'code' => ['required', 'string'],
            'name' => ['required', 'string'],
            'semester' => ['required', 'integer'],
            'credits' => ['required', 'integer'],
            'versi' => ['nullable', 'string'],
            'status_verifikasi_ekstraksi' => ['nullable', 'boolean'],
        ]);

        $studyProgramId = $validated['study_program_id'] ?? $request->user()?->study_program_id;

        if (! $studyProgramId) {
            throw ValidationException::withMessages([
                'study_program_id' => 'Program studi wajib diisi.',
            ]);
        }

        Course::create([
            'study_program_id' => $studyProgramId,
            'code' => $validated['code'],
            'name' => $validated['name'],
            'semester' => $validated['semester'],
            'credits' => $validated['credits'],
            'versi' => $validated['versi'] ?? 'v1',
            'status_verifikasi_ekstraksi' => $validated['status_verifikasi_ekstraksi'] ?? false,
        ]);

        return back();
    }

    public function syncSkills(Request $request, Course $course)
    {
        $validated = $request->validate([
            'skill_ids' => ['required', 'array'],
            'skill_ids.*' => ['exists:skills,id'],
        ]);

        $course->skills()->sync($validated['skill_ids']);

        return back();
    }

    public function storeLearningOutcome(Request $request, Course $course)
    {
        $validated = $request->validate([
            'text' => ['required', 'string'],
            'source_doc' => ['nullable', 'string'],
        ]);

        LearningOutcome::create([
            'course_id' => $course->id,
            'text' => $validated['text'],
            'source_doc' => $validated['source_doc'] ?? null,
        ]);

        return back();
    }
}
