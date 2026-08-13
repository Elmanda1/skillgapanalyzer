<?php

use App\Http\Controllers\CurriculumController;
use App\Http\Controllers\AuthController;
use App\Models\Course;
use App\Models\GapAnalysis;
use App\Models\Skill;
use App\Models\StudyProgram;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return inertia('LandingPage');
});

Route::get('/login', function () {
    return inertia('LoginPage');
})->name('login');

Route::middleware(['auth', 'role:kaprodi|super-admin|dosen'])->prefix('curriculum')->name('curriculum.')->group(function () {
    Route::get('/', [CurriculumController::class, 'index'])->name('index');
    Route::get('/courses/{course}', [CurriculumController::class, 'show'])->name('courses.show');
    Route::post('/courses', [CurriculumController::class, 'storeCourse'])->name('courses.store');
    Route::post('/courses/{course}/skills', [CurriculumController::class, 'syncSkills'])->name('courses.skills.sync');
    Route::post('/courses/{course}/learning-outcomes', [CurriculumController::class, 'storeLearningOutcome'])->name('courses.learning-outcomes.store');
});
Route::post('/login', [AuthController::class, 'login']);

Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::get('/register', function () {
    return inertia('RegisterPage');
})->name('register');

Route::post('/register', [AuthController::class, 'registerStudent']);

Route::get('/dashboard', function () {
    $user = request()->user();
    $role = $user->roles->first()?->name;

    $stats = match ($role) {
        'super_admin' => [
            'totalSkills' => Skill::count(),
            'totalCourses' => Course::count(),
            'totalGaps' => GapAnalysis::count(),
            'mismatchGaps' => GapAnalysis::where('tipe_mismatch', '!=', 'aligned')->count(),
            'totalStudyPrograms' => StudyProgram::count(),
        ],
        'kaprodi' => [
            'studyProgram' => $user->studyProgram?->only(['id', 'nama_institusi', 'nama_prodi', 'jenjang']),
            'totalCourses' => Course::where('study_program_id', $user->study_program_id)->count(),
            'totalGaps' => GapAnalysis::where('study_program_id', $user->study_program_id)->count(),
            'mismatchGaps' => GapAnalysis::where('study_program_id', $user->study_program_id)
                ->where('tipe_mismatch', '!=', 'aligned')
                ->count(),
            'gapByType' => GapAnalysis::where('study_program_id', $user->study_program_id)
                ->select('tipe_mismatch', DB::raw('count(*) as total'))
                ->groupBy('tipe_mismatch')
                ->get(),
        ],
        'dosen' => [
            'courses' => $user->courses()->get(['courses.id', 'courses.code', 'courses.name', 'courses.semester', 'courses.credits']),
            'totalGaps' => GapAnalysis::where('study_program_id', $user->study_program_id)->count(),
        ],
        default => [],
    };

    return inertia('Dashboard/Dashboard', ['stats' => $stats]);
})->middleware('auth')->name('dashboard');
