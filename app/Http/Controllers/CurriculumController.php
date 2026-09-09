<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\LearningOutcome;
use App\Models\Skill;
use App\Models\StudyProgram;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CurriculumController extends Controller
{
    public function index(Request $request)
    {
        $query = Course::with(['studyProgram', 'overriddenByUser']);

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

        $course->load([
            'studyProgram',
            'overriddenByUser',
            'skills' => function ($q) {
                $q->withPivot(['is_overridden', 'override_notes', 'overridden_by', 'overridden_at']);
            },
            'learningOutcomes.overriddenByUser',
        ]);

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

    public function updateLearningOutcome(Request $request, Course $course, LearningOutcome $learningOutcome)
    {
        $this->ensureCourseAccess($request, $course);

        if ($learningOutcome->course_id !== $course->id) {
            abort(404);
        }

        $validated = $request->validate([
            'text' => ['required', 'string', 'max:2000'],
            'source_doc' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $isKaprodiOrAdmin = $user->hasRole('super_admin') || $user->hasRole('kaprodi');

        // Snapshot original text if updated by Kaprodi for the first time
        $originalText = $learningOutcome->original_dosen_text;
        if ($isKaprodiOrAdmin && ! $originalText) {
            $originalText = $learningOutcome->text;
        }

        $updateData = [
            'text' => $validated['text'],
            'source_doc' => $validated['source_doc'] ?? $learningOutcome->source_doc,
        ];

        if ($isKaprodiOrAdmin) {
            $updateData['is_overridden'] = true;
            $updateData['override_notes'] = 'Teks CPMK di-edit & di-override oleh Kaprodi';
            $updateData['overridden_by'] = $user->id;
            $updateData['overridden_at'] = now();
            $updateData['original_dosen_text'] = $originalText;
        }

        $learningOutcome->update($updateData);

        return back();
    }

    public function destroyLearningOutcome(Request $request, Course $course, LearningOutcome $learningOutcome)
    {
        $this->ensureCourseAccess($request, $course);

        if ($learningOutcome->course_id !== $course->id) {
            abort(404);
        }

        $learningOutcome->delete();

        return back();
    }

    public function toggleCourseOverride(Request $request, Course $course)
    {
        $this->ensureCourseAccess($request, $course);

        $validated = $request->validate([
            'override_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $newState = ! $course->is_overridden;

        $snapshot = $course->original_dosen_snapshot;
        if ($newState && ! $snapshot) {
            $snapshot = [
                'code' => $course->code,
                'name' => $course->name,
                'semester' => $course->semester,
                'credits' => $course->credits,
                'versi' => $course->versi,
            ];
        }

        $course->update([
            'is_overridden' => $newState,
            'override_notes' => $newState ? ($validated['override_notes'] ?? 'Disesuaikan oleh Kaprodi') : null,
            'overridden_by' => $newState ? $request->user()->id : null,
            'overridden_at' => $newState ? now() : null,
            'original_dosen_snapshot' => $snapshot,
        ]);

        return back();
    }

    public function toggleLearningOutcomeOverride(Request $request, Course $course, LearningOutcome $learningOutcome)
    {
        $this->ensureCourseAccess($request, $course);

        if ($learningOutcome->course_id !== $course->id) {
            abort(404);
        }

        $validated = $request->validate([
            'override_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $newState = ! $learningOutcome->is_overridden;
        $originalText = $learningOutcome->original_dosen_text;
        if ($newState && ! $originalText) {
            $originalText = $learningOutcome->text;
        }

        $learningOutcome->update([
            'is_overridden' => $newState,
            'override_notes' => $newState ? ($validated['override_notes'] ?? 'CPMK di-override oleh Kaprodi') : null,
            'overridden_by' => $newState ? $request->user()->id : null,
            'overridden_at' => $newState ? now() : null,
            'original_dosen_text' => $originalText,
        ]);

        return back();
    }

    public function toggleSkillOverride(Request $request, Course $course, Skill $skill)
    {
        $this->ensureCourseAccess($request, $course);

        $pivot = DB::table('course_skill')
            ->where('course_id', $course->id)
            ->where('skill_id', $skill->id)
            ->first();

        if (! $pivot) {
            DB::table('course_skill')->insert([
                'course_id' => $course->id,
                'skill_id' => $skill->id,
                'is_overridden' => true,
                'override_notes' => 'Skill di-override oleh Kaprodi',
                'overridden_by' => $request->user()->id,
                'overridden_at' => now(),
            ]);

            return back();
        }

        $newState = ! (bool) ($pivot->is_overridden ?? false);

        DB::table('course_skill')
            ->where('course_id', $course->id)
            ->where('skill_id', $skill->id)
            ->update([
                'is_overridden' => $newState,
                'override_notes' => $newState ? 'Skill di-override oleh Kaprodi' : null,
                'overridden_by' => $newState ? $request->user()->id : null,
                'overridden_at' => $newState ? now() : null,
            ]);

        return back();
    }

    public function template()
    {
        $headers = ['kode', 'nama', 'semester', 'sks', 'versi', 'study_program_id', 'skills', 'cpl_text', 'cpl_source'];
        $sampleRows = [
            ['PNJ-301', 'Pemrograman Web Enterprise', 3, 4, 'v1', '', 'React.js; Laravel; Node.js', 'Mahasiswa mampu membangun aplikasi web fullstack enterprise', 'RPS-TI-301.pdf'],
            ['PNJ-302', 'Teknologi Cloud & DevOps', 4, 3, 'v1', '', 'Docker; Kubernetes; CI/CD', 'Mahasiswa mampu melakukan deployment container terdistribusi', 'RPS-TI-302.pdf'],
            ['PNJ-303', 'Basis Data Terdistribusi', 3, 3, 'v1', '', 'PostgreSQL; Redis; SQL', 'Mahasiswa memahami arsitektur database terdistribusi & caching', 'RPS-TI-303.pdf'],
        ];

        if (class_exists(\PhpOffice\PhpSpreadsheet\Spreadsheet::class)) {
            $ss = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $ss->getActiveSheet();
            $sheet->fromArray([$headers], null, 'A1');
            $sheet->fromArray($sampleRows, null, 'A2');

            return new StreamedResponse(function () use ($ss) {
                (new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($ss))->save('php://output');
            }, 200, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="template-kurikulum.xlsx"',
            ]);
        }

        // Native CSV Fallback with UTF-8 BOM for Microsoft Excel
        return new StreamedResponse(function () use ($headers, $sampleRows) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($handle, $headers);
            foreach ($sampleRows as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="template-kurikulum.csv"',
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:5120'],
            'dry_run' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();
        $isSuperAdmin = $user->hasRole('super_admin');
        $dryRun = $request->boolean('dry_run');
        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());

        $rows = [];

        if (class_exists(\PhpOffice\PhpSpreadsheet\IOFactory::class) && in_array($extension, ['xlsx', 'xls'])) {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getRealPath());
            $rows = $spreadsheet->getActiveSheet()->toArray(null, true, true, false);
        } else {
            // Native CSV parser
            $handle = fopen($file->getRealPath(), 'r');
            if ($handle !== false) {
                while (($data = fgetcsv($handle, 4096, ',')) !== false) {
                    if (isset($data[0])) {
                        $data[0] = preg_replace('/\x{EF}\x{BB}\x{BF}/u', '', $data[0]);
                    }
                    $rows[] = $data;
                }
                fclose($handle);
            }
        }

        if ($rows !== []) {
            array_shift($rows); // drop header
        }

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
