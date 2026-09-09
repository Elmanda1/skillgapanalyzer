<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\LearningOutcome;
use App\Models\Skill;
use App\Models\StudyProgram;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

    public function template()
    {
        $ss = new Spreadsheet();
        $sheet = $ss->getActiveSheet();
        $sheet->fromArray(
            [['kode', 'nama', 'semester', 'sks', 'versi', 'study_program_id', 'skills', 'cpl_text', 'cpl_source']],
            null,
            'A1'
        );
        $sheet->fromArray([
            ['TI-401', 'Cloud Computing', 5, 3, 'v1', '', 'Docker; Kubernetes', 'Mampu deploy container', 'RPS-2026'],
            ['TI-402', 'Pemrograman Web', 4, 3, 'v1', '', 'React; Laravel', 'Mampu bangun API REST', 'RPS-2026'],
        ], null, 'A2');

        return new StreamedResponse(function () use ($ss) {
            (new Xlsx($ss))->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="template-kurikulum.xlsx"',
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:5120'],
            'dry_run' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();
        $isSuperAdmin = $user->hasRole('super_admin');
        $dryRun = $request->boolean('dry_run');

        $spreadsheet = IOFactory::load($request->file('file')->getRealPath());
        $rows = $spreadsheet->getActiveSheet()->toArray(null, true, true, false);
        array_shift($rows); // drop header

        if (count($rows) > 1000) {
            return response()->json(['message' => 'Maksimal 1000 baris per import.'], 422);
        }

        $errors = [];
        $warnings = [];
        $parsed = [];
        $preview = [];

        foreach ($rows as $i => $row) {
            $line = $i + 2;
            [$code, $name, $semester, $credits, $versi, $spId, $skillsRaw, $cplText, $cplSource] = array_pad($row, 9, null);
            $code = trim((string) $code);
            $name = trim((string) $name);

            if ($code === '' && $name === '' && $semester === null && $credits === null) {
                continue;
            }

            $rowErrors = [];
            if ($code === '') {
                $rowErrors[] = 'kode wajib diisi.';
            }
            if ($name === '') {
                $rowErrors[] = 'nama wajib diisi.';
            }
            if (! is_numeric($semester) || (int) $semester < 1 || (int) $semester > 12) {
                $rowErrors[] = 'semester harus 1-12.';
            }
            if (! is_numeric($credits) || (int) $credits < 1) {
                $rowErrors[] = 'sks minimal 1.';
            }

            $studyProgramId = $isSuperAdmin && $spId ? (int) $spId : $user->study_program_id;
            if (! $studyProgramId || ! StudyProgram::whereKey($studyProgramId)->exists()) {
                $rowErrors[] = 'study_program_id tidak valid.';
            } elseif (! $isSuperAdmin && (int) $studyProgramId !== (int) $user->study_program_id) {
                $rowErrors[] = 'di luar prodi anda.';
            }

            $skillNames = array_values(array_filter(array_map('trim', explode(';', (string) $skillsRaw))));
            $skillIds = [];
            $unmatched = [];
            foreach ($skillNames as $s) {
                $hit = Skill::whereRaw('LOWER(nama) = ?', [mb_strtolower($s)])->first();
                if ($hit) {
                    $skillIds[] = $hit->id;
                } else {
                    $unmatched[] = $s;
                }
            }
            if ($unmatched !== []) {
                $warnings[] = ['row' => $line, 'skills' => $unmatched];
            }

            if ($rowErrors !== []) {
                foreach ($rowErrors as $msg) {
                    $errors[] = ['row' => $line, 'message' => $msg];
                }
                continue;
            }

            $parsed[] = [
                'line' => $line,
                'study_program_id' => (int) $studyProgramId,
                'code' => $code,
                'name' => $name,
                'semester' => (int) $semester,
                'credits' => (int) $credits,
                'versi' => trim((string) $versi) ?: 'v1',
                'skill_ids' => $skillIds,
                'has_skills_col' => trim((string) $skillsRaw) !== '',
                'cpl_text' => trim((string) $cplText),
                'cpl_source' => trim((string) $cplSource) ?: null,
            ];
            $preview[] = ['row' => $line, 'code' => $code, 'name' => $name, 'skills_matched' => count($skillIds), 'skills_unmatched' => $unmatched];
        }

        if ($dryRun || $errors !== []) {
            return response()->json(['mode' => 'preview', 'valid' => count($parsed), 'rows' => $preview, 'errors' => $errors, 'warnings' => $warnings]);
        }

        $created = 0;
        $updated = 0;
        DB::transaction(function () use ($parsed, &$created, &$updated) {
            foreach ($parsed as $p) {
                $course = Course::where('study_program_id', $p['study_program_id'])->where('code', $p['code'])->first();
                if ($course) {
                    $course->update([
                        'name' => $p['name'],
                        'semester' => $p['semester'],
                        'credits' => $p['credits'],
                        'versi' => $p['versi'],
                    ]);
                    $updated++;
                } else {
                    $course = Course::create([
                        'study_program_id' => $p['study_program_id'],
                        'code' => $p['code'],
                        'name' => $p['name'],
                        'semester' => $p['semester'],
                        'credits' => $p['credits'],
                        'versi' => $p['versi'],
                        'status_verifikasi_ekstraksi' => false,
                    ]);
                    $created++;
                }
                if ($p['has_skills_col']) {
                    $course->skills()->sync($p['skill_ids']);
                }
                if ($p['cpl_text'] !== '') {
                    LearningOutcome::firstOrCreate(
                        ['course_id' => $course->id, 'text' => $p['cpl_text']],
                        ['source_doc' => $p['cpl_source']]
                    );
                }
            }
        });

        return response()->json(['mode' => 'committed', 'created' => $created, 'updated' => $updated, 'warnings' => $warnings, 'errors' => []]);
    }

    private function ensureCourseAccess(Request $request, Course $course): void
    {
        if (! $request->user()->hasRole('super_admin') && $course->study_program_id !== $request->user()->study_program_id) {
            abort(403);
        }
    }
}
