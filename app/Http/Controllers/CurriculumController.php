<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\LearningOutcome;
use App\Models\Skill;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CurriculumController extends Controller
{
    public function index(Request $request)
    {
        $query = Course::with('studyProgram');

        if (! $request->user()->hasRole('super_admin')) {
            $query->where('study_program_id', $request->user()->study_program_id);
        }

        $studyPrograms = \App\Models\StudyProgram::orderBy('nama_prodi')->get();

        return inertia('Curriculum/Index', [
            'courses' => $query->get(),
            'studyPrograms' => $studyPrograms,
        ]);
    }

    public function show(Request $request, Course $course)
    {
        $this->ensureCourseAccess($request, $course);

        $course->load('studyProgram', 'skills', 'learningOutcomes');

        return inertia('Curriculum/Show', [
            'course' => $course,
            'totalSkills' => Skill::count(),
        ]);
    }

    public function storeCourse(Request $request)
    {
        $validated = $request->validate([
            'study_program_id' => ['nullable', 'exists:study_programs,id'],
            'code' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'semester' => ['required', 'integer', 'min:1', 'max:12'],
            'credits' => ['required', 'integer', 'min:1'],
            'versi' => ['nullable', 'string'],
        ]);

        $user = $request->user();

        $studyProgramId = $user->hasRole('super_admin') && isset($validated['study_program_id'])
            ? $validated['study_program_id']
            : $user->study_program_id;

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
            'status_verifikasi_ekstraksi' => false,
        ]);

        return back();
    }

    public function updateCourse(Request $request, Course $course)
    {
        $this->ensureCourseAccess($request, $course);

        $validated = $request->validate([
            'study_program_id' => ['nullable', 'exists:study_programs,id'],
            'code' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'semester' => ['required', 'integer', 'min:1', 'max:12'],
            'credits' => ['required', 'integer', 'min:1'],
            'versi' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $studyProgramId = $user->hasRole('super_admin') && isset($validated['study_program_id'])
            ? $validated['study_program_id']
            : $user->study_program_id;

        if (! $studyProgramId) {
            throw ValidationException::withMessages([
                'study_program_id' => 'Program studi wajib diisi.',
            ]);
        }

        $course->update([
            'study_program_id' => $studyProgramId,
            'code' => $validated['code'],
            'name' => $validated['name'],
            'semester' => $validated['semester'],
            'credits' => $validated['credits'],
            'versi' => $validated['versi'] ?? 'v1',
        ]);

        return back();
    }

    public function syncSkills(Request $request, Course $course)
    {
        $this->ensureCourseAccess($request, $course);

        $validated = $request->validate([
            'skill_ids' => ['array'],
            'skill_ids.*' => ['exists:skills,id'],
        ]);

        $course->skills()->sync($validated['skill_ids']);

        return back();
    }

    public function storeLearningOutcome(Request $request, Course $course)
    {
        $this->ensureCourseAccess($request, $course);

        $validated = $request->validate([
            'text' => ['required', 'string', 'max:2000'],
            'source_doc' => ['nullable', 'string', 'max:255'],
        ]);

        LearningOutcome::create([
            'course_id' => $course->id,
            'text' => $validated['text'],
            'source_doc' => $validated['source_doc'] ?? null,
        ]);

        return back();
    }

    private function ensureCourseAccess(Request $request, Course $course): void
    {
        if (! $request->user()->hasRole('super_admin') && $course->study_program_id !== $request->user()->study_program_id) {
            abort(403);
        }
    }
}
