<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    // GET /dashboard
    // Summary card untuk halaman utama fotografer
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $now    = now();

        $stats = [
            // Total booking bulan ini
            'bookings_this_month' => Booking::where('user_id', $userId)
                ->whereMonth('created_at', $now->month)
                ->whereYear('created_at', $now->year)
                ->count(),

            // Booking mendatang (belum selesai/batal)
            'upcoming_bookings' => Booking::where('user_id', $userId)
                ->where('event_date', '>=', $now->toDateString())
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->count(),

            // Klien aktif (bukan completed/cancelled)
            'active_clients' => Client::where('user_id', $userId)
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->count(),

            // Pendapatan bulan ini (dari payment yang lunas)
            'revenue_this_month' => \App\Models\Payment::where('user_id', $userId)
                ->where('status', 'paid')
                ->whereMonth('paid_at', $now->month)
                ->whereYear('paid_at', $now->year)
                ->sum('amount'),

            // Notifikasi belum dibaca
            'unread_notifications' => Notification::where('user_id', $userId)
                ->unread()
                ->count(),
        ];

        // 5 booking terdekat
        $upcoming = Booking::where('user_id', $userId)
            ->upcoming()
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->with(['client:id,name,phone', 'package:id,name'])
            ->limit(5)
            ->get();

        // Pipeline klien per status
        $pipeline = Client::where('user_id', $userId)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return response()->json([
            'stats'    => $stats,
            'upcoming' => $upcoming,
            'pipeline' => $pipeline,
        ]);
    }
}
