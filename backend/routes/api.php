<?php

use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\GDriveController;
use App\Http\Controllers\Api\MidtransWebhookController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PackageAddonController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PhotographerController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\ProofingController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\TestimonialController;
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
Route::post('/auth/register',        [AuthController::class, 'register']);
Route::post('/auth/login',           [AuthController::class, 'login']);
Route::get ('/auth/google/url',      [AuthController::class, 'googleUrl']);
Route::get ('/auth/google/redirect', [AuthController::class, 'googleRedirect']);
Route::get ('/auth/google/callback', [AuthController::class, 'googleCallback']);
Route::post('/auth/google/one-tap',  [AuthController::class, 'googleOneTap']);

// Profil Publik Dinamis Fotografer (@username)
Route::get('/photographers/{username}', [PhotographerController::class, 'showByUsername']);

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

// Final Delivery (Unduh foto resolusi tinggi klien)
Route::get('/deliveries/{bookingCode}', [DeliveryController::class, 'getByCodePublic']);

// Testimonial & Review Klien (Public)
Route::post('/deliveries/{bookingCode}/review', [TestimonialController::class, 'publicStore']);
Route::get ('/photographers/{username}/reviews', [TestimonialController::class, 'publicList']);
Route::get ('/testimonials/featured',           [TestimonialController::class, 'featuredGlobal']);

// Kwitansi & Invoice Digital Publik Klien
Route::get('/invoices/{bookingCode}', [InvoiceController::class, 'showPublic']);

// Layanan Tambahan (Add-on) Publik per Paket
Route::get('/packages/{package}/addons', [PackageAddonController::class, 'index']);

// Google Drive OAuth callback (public — Google redirect browser langsung ke sini)
Route::get('/gdrive/callback', [GDriveController::class, 'callback']);

// Midtrans Payment Webhook (public — Midtrans server mengirim POST ke sini)
Route::post('/webhooks/midtrans', [MidtransWebhookController::class, 'handle']);

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
    Route::get   ('/packages',                          [PackageController::class, 'index']);
    Route::post  ('/packages',                          [PackageController::class, 'store']);
    Route::get   ('/packages/{package}',                [PackageController::class, 'show']);
    Route::patch ('/packages/{package}',                [PackageController::class, 'update']);
    Route::delete('/packages/{package}',                [PackageController::class, 'destroy']);
    Route::post  ('/packages/{package}/addons',         [PackageAddonController::class, 'store']);
    Route::delete('/packages/{package}/addons/{addon}', [PackageAddonController::class, 'destroy']);

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

    // Proofing Admin (Standalone Tools & Booking-Linked)
    Route::get   ('/proofing-sessions',                                [ProofingController::class, 'index']);
    Route::post  ('/proofing-sessions',                                [ProofingController::class, 'store']);
    Route::get   ('/proofing-sessions/{proofingSession}',              [ProofingController::class, 'show']);
    Route::patch ('/proofing-sessions/{proofingSession}',              [ProofingController::class, 'update']);
    Route::delete('/proofing-sessions/{proofingSession}',              [ProofingController::class, 'destroy']);
    Route::post  ('/proofing-sessions/{proofingSession}/photos',       [ProofingController::class, 'addPhotosToSession']);
    Route::post  ('/proofing-sessions/{proofingSession}/import-drive', [ProofingController::class, 'importDriveToSession']);
    Route::delete('/proofing-sessions/{proofingSession}/photos/{photo}',[ProofingController::class, 'deletePhotoFromSession']);

    // Proofing Legacy Booking Routes
    Route::get   ('/bookings/{booking}/proofing',                 [ProofingController::class, 'getByBooking']);
    Route::post  ('/bookings/{booking}/proofing',                 [ProofingController::class, 'storeByBooking']);
    Route::post  ('/bookings/{booking}/proofing/photos',          [ProofingController::class, 'addPhotos']);
    Route::post  ('/bookings/{booking}/proofing/import-drive',    [ProofingController::class, 'importFromDrive']);
    Route::delete('/bookings/{booking}/proofing/photos/{photo}',   [ProofingController::class, 'deletePhoto']);

    // Final Delivery
    Route::get ('/bookings/{booking}/delivery', [DeliveryController::class, 'getByBooking']);
    Route::post('/bookings/{booking}/delivery', [DeliveryController::class, 'saveDelivery']);

    // Subscription & SaaS Tier (Midtrans Integration)
    Route::get ('/subscription',                            [SubscriptionController::class, 'show']);
    Route::post('/subscription/upgrade',                    [SubscriptionController::class, 'upgrade']);
    Route::post('/subscription/create-transaction',         [SubscriptionController::class, 'createTransaction']);
    Route::get ('/subscription/orders/{orderId}/status',    [SubscriptionController::class, 'checkStatus']);
    Route::post('/subscription/orders/{orderId}/simulate',  [SubscriptionController::class, 'simulate']);

    // Google Drive Integration
    Route::get   ('/gdrive/status',     [GDriveController::class, 'status']);
    Route::get   ('/gdrive/connect',    [GDriveController::class, 'connect']);
    Route::get   ('/gdrive/folders',    [GDriveController::class, 'folders']);
    Route::delete('/gdrive/disconnect', [GDriveController::class, 'disconnect']);

    // Expenses (Laba Bersih & Biaya Operasional Sesi)
    Route::get   ('/bookings/{booking}/expenses',           [ExpenseController::class, 'index']);
    Route::post  ('/bookings/{booking}/expenses',           [ExpenseController::class, 'store']);
    Route::delete('/bookings/{booking}/expenses/{expense}', [ExpenseController::class, 'destroy']);

    // Reports (Laporan Keuangan & Ekspor Spreadsheet Excel)
    Route::get('/reports/financial',            [ReportController::class, 'financial']);
    Route::get('/reports/financial/export-csv', [ReportController::class, 'exportCsv']);

    // Notifications, Web Push & WhatsApp Gateway
    Route::get  ('/notifications',                   [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post ('/notifications/mark-all-read',     [NotificationController::class, 'markAllRead']);
    Route::get  ('/push-notifications/vapid-key',    [NotificationController::class, 'vapidPublicKey']);
    Route::post ('/push-subscriptions',              [NotificationController::class, 'subscribePush']);
    Route::post ('/push-notifications/test',         [NotificationController::class, 'testPush']);
    Route::post ('/whatsapp/test',                   [NotificationController::class, 'testWhatsApp']);
    Route::post ('/bookings/{booking}/send-wa',      [NotificationController::class, 'sendBookingWa']);

    // Testimonials (Manajemen Ulasan Fotografer)
    Route::get   ('/reviews',                               [TestimonialController::class, 'index']);
    Route::patch ('/reviews/{testimonial}/toggle-featured', [TestimonialController::class, 'toggleFeatured']);
    Route::delete('/reviews/{testimonial}',                 [TestimonialController::class, 'destroy']);

    // Super Admin Platform Dashboard (Hanya role: admin)
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/summary',                           [AdminDashboardController::class, 'summary']);
        Route::get('/photographers',                     [AdminDashboardController::class, 'photographers']);
        Route::post('/photographers/{id}/adjust-subscription', [AdminDashboardController::class, 'adjustSubscription']);
        Route::get('/transactions',                      [AdminDashboardController::class, 'transactions']);
    });

});
