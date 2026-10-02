<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Client;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\ProofingSession;
use App\Models\SubscriptionOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    /**
     * GET /api/admin/summary
     * Ringkasan eksekutif metrik bisnis platform Ruang Bahagia
     */
    public function summary(): JsonResponse
    {
        // 1. Finansial Langganan SaaS Platform
        $totalRevenue = (float) SubscriptionOrder::whereIn('status', ['paid', 'settlement'])->sum('amount');
        $revenueThisMonth = (float) SubscriptionOrder::whereIn('status', ['paid', 'settlement'])
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');

        $activeOrdersCount = SubscriptionOrder::whereIn('status', ['paid', 'settlement'])->count();

        // 2. Metrik Fotografer
        $allUsers = User::all();
        $totalPhotographers = $allUsers->count();

        $proPhotographers = 0;
        $trialPhotographers = 0;
        $expiredPhotographers = 0;

        foreach ($allUsers as $u) {
            if ($u->isPro()) {
                $proPhotographers++;
            } elseif ($u->isTrial()) {
                $trialPhotographers++;
            } else {
                $expiredPhotographers++;
            }
        }

        // 3. Metrik Adopsi Ekosistem
        $totalClients = Client::count();
        $totalBookings = Booking::count();
        $totalProofingSessions = ProofingSession::count();
        $totalGrossBookingValue = (float) Payment::sum('amount');

        return response()->json([
            'data' => [
                'saas_metrics' => [
                    'total_revenue'               => $totalRevenue,
                    'revenue_this_month'          => $revenueThisMonth,
                    'active_subscription_orders' => $activeOrdersCount,
                ],
                'photographer_metrics' => [
                    'total_registered' => $totalPhotographers,
                    'pro_active'       => $proPhotographers,
                    'trial_active'     => $trialPhotographers,
                    'expired'          => $expiredPhotographers,
                ],
                'ecosystem_metrics' => [
                    'total_clients'             => $totalClients,
                    'total_bookings'            => $totalBookings,
                    'total_proofing_sessions'   => $totalProofingSessions,
                    'total_gross_booking_value' => $totalGrossBookingValue,
                ],
            ],
            'message' => 'Ringkasan metrik Super Admin berhasil dimuat.',
        ]);
    }

    /**
     * GET /api/admin/photographers
     * Daftar fotografer lengkap dengan pencarian, filter, dan counter relasi
     */
    public function photographers(Request $request): JsonResponse
    {
        $search = $request->query('search', '');
        $filter = $request->query('filter', 'all'); // all | pro | trial | expired

        $query = User::query()
            ->withCount(['clients', 'bookings', 'proofingSessions', 'packages'])
            ->latest('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('brand_name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $photographers = $query->paginate(25);

        // Filter status tier client-side/collection jika filter spesifik diminta
        $items = collect($photographers->items())->filter(function ($u) use ($filter) {
            if ($filter === 'pro') return $u->isPro();
            if ($filter === 'trial') return $u->isTrial();
            if ($filter === 'expired') return !$u->isPro() && !$u->isTrial();
            return true;
        })->values();

        return response()->json([
            'data' => [
                'items' => $items,
                'pagination' => [
                    'current_page' => $photographers->currentPage(),
                    'last_page'    => $photographers->lastPage(),
                    'per_page'     => $photographers->perPage(),
                    'total'        => $photographers->total(),
                ],
            ],
            'message' => 'Daftar fotografer berhasil dimuat.',
        ]);
    }

    /**
     * POST /api/admin/photographers/{id}/adjust-subscription
     * Kontrol manual status langganan fotografer oleh admin
     */
    public function adjustSubscription(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'action' => 'required|in:grant_pro,extend_days,revoke_pro',
            'days'   => 'nullable|integer|min:1|max:1000',
        ]);

        $photographer = User::findOrFail($id);
        $action = $request->input('action');
        $days = (int) ($request->input('days') ?? 30);

        if ($action === 'grant_pro') {
            $photographer->subscription_tier = 'pro';
            $photographer->subscription_status = 'active';
            $photographer->subscription_expires_at = now()->addDays($days);
            $message = "Paket Pro Studio berhasil diaktifkan selama {$days} hari.";
        } elseif ($action === 'extend_days') {
            $base = ($photographer->subscription_expires_at && $photographer->subscription_expires_at->isFuture())
                ? $photographer->subscription_expires_at
                : now();

            $photographer->subscription_tier = 'pro';
            $photographer->subscription_status = 'active';
            $photographer->subscription_expires_at = $base->copy()->addDays($days);
            $message = "Masa aktif Pro berhasil ditambah {$days} hari.";
        } elseif ($action === 'revoke_pro') {
            $photographer->subscription_tier = 'free';
            $photographer->subscription_status = 'expired';
            $photographer->subscription_expires_at = now()->subDay();
            $message = "Status Pro Studio fotografer telah dinonaktifkan.";
        }

        $photographer->save();

        return response()->json([
            'data'    => $photographer->fresh(),
            'message' => $message,
        ]);
    }

    /**
     * GET /api/admin/transactions
     * Riwayat order langganan SaaS fotografer
     */
    public function transactions(): JsonResponse
    {
        $transactions = SubscriptionOrder::with('user:id,name,brand_name,username,email')
            ->latest('id')
            ->paginate(20);

        return response()->json([
            'data' => [
                'items' => $transactions->items(),
                'pagination' => [
                    'current_page' => $transactions->currentPage(),
                    'last_page'    => $transactions->lastPage(),
                    'total'        => $transactions->total(),
                ],
            ],
            'message' => 'Daftar transaksi langganan berhasil dimuat.',
        ]);
    }
}
