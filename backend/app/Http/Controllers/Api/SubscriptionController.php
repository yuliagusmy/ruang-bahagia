<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Package;
use App\Models\ProofingSession;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /**
     * GET /api/subscription
     * Mengambil status tier, batas kuota, dan penggunaan fitur studio fotografer
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $isPro = $user->isPro();

        // Hitung pemakaian fitur saat ini
        $packagesCount = Package::where('user_id', $user->id)->count();

        $bookingsThisMonth = Booking::where('user_id', $user->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $proofingCount = ProofingSession::whereHas('booking', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->where('status', 'active')->count();

        $daysRemaining = null;
        if ($user->subscription_expires_at) {
            $daysRemaining = max(0, (int) now()->diffInDays($user->subscription_expires_at, false));
        }

        return response()->json([
            'tier'           => $user->subscription_tier ?? 'free',
            'is_pro'         => $isPro,
            'status'         => $user->subscription_status ?? 'active',
            'expires_at'     => $user->subscription_expires_at?->toISOString(),
            'days_remaining' => $daysRemaining,
            'usage'          => [
                'packages_count'      => $packagesCount,
                'packages_limit'      => $isPro ? null : 2,
                'bookings_this_month' => $bookingsThisMonth,
                'bookings_limit'      => $isPro ? null : 5,
                'proofing_count'      => $proofingCount,
                'proofing_limit'      => $isPro ? null : 1,
            ],
            'features'       => [
                'unlimited_packages'  => $isPro,
                'unlimited_bookings'  => $isPro,
                'unlimited_proofing'  => $isPro,
                'remove_watermark'    => $isPro,
                'custom_branding'     => $isPro,
                'verified_badge'      => $isPro,
                'export_reports'      => $isPro,
            ],
        ]);
    }

    /**
     * POST /api/subscription/upgrade
     * Memproses upgrade akun studio ke Pro Studio (Bulanan / Tahunan)
     */
    public function upgrade(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan'           => 'required|string|in:monthly,yearly',
            'payment_method' => 'sometimes|string|in:qris,transfer',
        ], [
            'plan.in' => 'Pilihan paket hanya tersedia bulanan (monthly) atau tahunan (yearly).',
        ]);

        $user = $request->user();
        $plan = $validated['plan'];

        // Tambah masa aktif
        $currentExpiry = ($user->subscription_expires_at && $user->subscription_expires_at->isFuture())
            ? $user->subscription_expires_at
            : Carbon::now();

        $newExpiry = $plan === 'yearly'
            ? $currentExpiry->copy()->addYear()
            : $currentExpiry->copy()->addMonth();

        $user->subscription_tier = 'pro';
        $user->subscription_status = 'active';
        $user->subscription_expires_at = $newExpiry;
        $user->save();

        return response()->json([
            'message'    => 'Selamat! Akun studio Anda berhasil diupgrade ke Pro Studio.',
            'tier'       => 'pro',
            'is_pro'     => true,
            'plan'       => $plan,
            'expires_at' => $newExpiry->toISOString(),
            'user'       => $user->fresh(),
        ]);
    }
}
