<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\ProofingController;
use App\Http\Controllers\Api\ScheduleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Ruang Bahagia API Routes
|--------------------------------------------------------------------------
|
| Grup: public  → tidak perlu auth (klien bisa akses)
| Grup: private → wajib Sanctum token (fotografer)
|
*/

// ── Public Routes ──────────────────────────────────────────────────────────

// Auth
Route::post('/auth/login', [AuthController::class, 'login']);

// Katalog publik untuk halaman booking klien
Route::get('/packages/public',      [PackageController::class, 'public']);
Route::get('/schedules/available',  [ScheduleController::class, 'available']);
Route::get('/portfolio/public',             [PortfolioController::class, 'public']);
Route::get('/portfolio/public/{portfolio}', [PortfolioController::class, 'show']);

// Klien buat request booking sendiri
Route::post('/bookings/request', [BookingController::class, 'clientRequest']);

// Client Proofing (swipe foto klien)
Route::get ('/proof/{slug}',            [ProofingController::class, 'getBySlug']);
Route::post('/proof/{slug}/selections', [ProofingController::class, 'submitSelections']);

// ── Private Routes (Fotografer) ────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post  ('/auth/logout',  [AuthController::class, 'logout']);
    Route::get   ('/auth/me',      [AuthController::class, 'me']);
    Route::patch ('/auth/profile', [AuthController::class, 'updateProfile']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Schedules (kalender)
    Route::get   ('/schedules',            [ScheduleController::class, 'index']);
    Route::post  ('/schedules',            [ScheduleController::class, 'store']);
    Route::patch ('/schedules/{schedule}', [ScheduleController::class, 'update']);
    Route::delete('/schedules/{schedule}', [ScheduleController::class, 'destroy']);

    // Packages
    Route::get   ('/packages',             [PackageController::class, 'index']);
    Route::post  ('/packages',             [PackageController::class, 'store']);
    Route::get   ('/packages/{package}',   [PackageController::class, 'show']);
    Route::patch ('/packages/{package}',   [PackageController::class, 'update']);
    Route::delete('/packages/{package}',   [PackageController::class, 'destroy']);

    // Clients (Mini CRM)
    Route::get   ('/clients',           [ClientController::class, 'index']);
    Route::post  ('/clients',           [ClientController::class, 'store']);
    Route::get   ('/clients/{client}',  [ClientController::class, 'show']);
    Route::patch ('/clients/{client}',  [ClientController::class, 'update']);
    Route::delete('/clients/{client}',  [ClientController::class, 'destroy']);

    // Bookings
    Route::get  ('/bookings',                        [BookingController::class, 'index']);
    Route::post ('/bookings',                        [BookingController::class, 'store']);
    Route::get  ('/bookings/upcoming',               [BookingController::class, 'upcoming']);
    Route::get  ('/bookings/{booking}',              [BookingController::class, 'show']);
    Route::patch('/bookings/{booking}/status',       [BookingController::class, 'updateStatus']);

    // Payments (nested di bawah booking)
    Route::get  ('/bookings/{booking}/payments', [PaymentController::class, 'index']);
    Route::post ('/bookings/{booking}/payments', [PaymentController::class, 'store']);
    Route::patch('/payments/{payment}/confirm',  [PaymentController::class, 'confirm']);

    // Portfolio
    Route::get   ('/portfolio',              [PortfolioController::class, 'index']);
    Route::post  ('/portfolio',              [PortfolioController::class, 'store']);
    Route::get   ('/portfolio/{portfolio}',  [PortfolioController::class, 'show']);
    Route::patch ('/portfolio/{portfolio}',  [PortfolioController::class, 'update']);
    Route::delete('/portfolio/{portfolio}',  [PortfolioController::class, 'destroy']);

    // Proofing Admin
    Route::get('/bookings/{booking}/proofing', [ProofingController::class, 'getByBooking']);

});
