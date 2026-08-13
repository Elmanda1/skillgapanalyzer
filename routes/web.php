<?php

use App\Http\Controllers\AuthController;
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

Route::get('/dashboard', function () {
    return inertia('Dashboard');
})->middleware('auth')->name('dashboard');
