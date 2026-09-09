<?php

use App\Http\Controllers\Api\AnalysisApiController;
use App\Http\Controllers\Api\ScraperProfileController;
use App\Http\Controllers\HealthCheckController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (v1 Contract - SDD §8)
|--------------------------------------------------------------------------
|
*/

// Health check endpoint (no version prefix)
Route::get('/health', HealthCheckController::class)->name('health.check');

Route::prefix('v1')->group(function () {
    Route::get('/dashboard/summary', [AnalysisApiController::class, 'summary']);
    Route::get('/gap-map', [AnalysisApiController::class, 'gapMap']);
    Route::get('/trends', [AnalysisApiController::class, 'trends']);
    Route::get('/recommendations', [AnalysisApiController::class, 'recommendations']);
    Route::post('/analysis/run', [AnalysisApiController::class, 'runAnalysis']);

    // Scraper Profiles
    Route::get('/scraper-profiles', [ScraperProfileController::class, 'index']);
    Route::post('/scraper-profiles', [ScraperProfileController::class, 'store']);
    Route::get('/scraper-profiles/{scraperProfile}', [ScraperProfileController::class, 'show']);
    Route::put('/scraper-profiles/{scraperProfile}', [ScraperProfileController::class, 'update']);
    Route::delete('/scraper-profiles/{scraperProfile}', [ScraperProfileController::class, 'destroy']);
    Route::post('/scraper-profiles/{scraperProfile}/test', [ScraperProfileController::class, 'test']);
    Route::get('/scraper-policies', [ScraperProfileController::class, 'policies']);
});