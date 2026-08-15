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

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::get('/register', function () {
    return inertia('RegisterPage');
})->name('register');
Route::post('/register', [AuthController::class, 'registerStudent']);

Route::middleware(['auth'])->group(function () {

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
                'scrapingAgents' => \App\Models\ScrapingAgent::all(),
                'sectors' => Skill::select('sektor_industri_terkait as name', DB::raw('count(*) * 100 / (select count(*) from skills) as pct'))
                    ->groupBy('sektor_industri_terkait')
                    ->get(),
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
    })->name('dashboard');

    Route::get('/management', function () {
        return inertia('CampusManagement');
    })->name('management');

    Route::get('/competency', function () {
        return inertia('CompetencyMap');
    })->name('competency');

    Route::get('/ai-analysis', function () {
        return inertia('AIAnalysis');
    })->name('ai-analysis');

    Route::get('/scraping', function () {
        return inertia('ScrapingAgents');
    })->name('scraping');

    Route::get('/settings', function () {
        return inertia('Settings');
    })->name('settings');

    Route::get('/help', function () {
        return inertia('Help');
    })->name('help');

    Route::get('/skills', function () {
        return inertia('SkillManager');
    })->name('skills');

    Route::get('/jobs', function () {
        return inertia('JobBrowser');
    })->name('jobs');

    Route::middleware(['role:kaprodi|super_admin|dosen'])->prefix('curriculum')->name('curriculum.')->group(function () {
        Route::get('/', [CurriculumController::class, 'index'])->name('index');
        Route::get('/courses/{course}', [CurriculumController::class, 'show'])->name('courses.show');
        Route::post('/courses', [CurriculumController::class, 'storeCourse'])->name('courses.store');
        Route::post('/courses/{course}/skills', [CurriculumController::class, 'syncSkills'])->name('courses.skills.sync');
        Route::post('/courses/{course}/learning-outcomes', [CurriculumController::class, 'storeLearningOutcome'])->name('courses.learning-outcomes.store');
    });

});
