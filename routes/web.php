<?php

use App\Http\Controllers\CurriculumController;
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
