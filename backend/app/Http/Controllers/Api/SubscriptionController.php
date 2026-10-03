<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Package;
use App\Models\ProofingSession;
use App\Models\SubscriptionOrder;
use App\Services\MidtransService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
    private MidtransService $midtrans;

    public function __construct(MidtransService $midtrans)
    {
        $this->midtrans = $midtrans;
    }

    /**
     * GET /api/subscription
     * Mengambil status tier, batas kuota, dan penggunaan fitur studio fotografer
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $isPro = $user->isPro();
        $isTrial = $user->isTrial();
        $trialDaysRemaining = $user->trialDaysRemaining();

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
            'tier'                 => $isTrial ? 'trial' : ($user->subscription_tier ?? 'free'),
            'is_pro'               => $isPro,
            'is_trial'             => $isTrial,
            'trial_days_remaining' => $trialDaysRemaining,
            'status'               => $isTrial ? 'trial' : ($user->subscription_status ?? 'active'),
            'expires_at'           => $user->subscription_expires_at?->toISOString(),
            'days_remaining'       => $isTrial ? $trialDaysRemaining : $daysRemaining,
            'usage'                => [
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
            'midtrans'       => [
                'client_key'    => $this->midtrans->getClientKey(),
                'is_production' => $this->midtrans->isProduction(),
            ],
        ]);
    }

    /**
     * POST /api/subscription/create-transaction
     * Membuat order langganan dan men-generate Snap Token dari Midtrans
     */
    public function createTransaction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan' => 'required|string|in:monthly,yearly',
        ], [
            'plan.in' => 'Pilihan paket hanya tersedia bulanan (monthly) atau tahunan (yearly).',
        ]);

        $user = $request->user();
        $plan = $validated['plan'];
        $amount = $plan === 'yearly' ? 490000 : 49000;
        $orderId = 'SUB-' . date('Ymd') . '-' . strtoupper(Str::random(6));

        $order = SubscriptionOrder::create([
            'order_id' => $orderId,
            'user_id'  => $user->id,
            'plan'     => $plan,
            'amount'   => $amount,
            'status'   => 'pending',
        ]);

        $snapData = $this->midtrans->createSnapTransaction($order, $user);

        return response()->json([
            'data' => [
                'order_id'      => $order->order_id,
                'plan'          => $order->plan,
                'amount'        => (int) $order->amount,
                'snap_token'    => $snapData['token'],
                'redirect_url'  => $snapData['redirect_url'],
                'is_mock'       => $snapData['is_mock'] ?? false,
                'client_key'    => $this->midtrans->getClientKey(),
                'is_production' => $this->midtrans->isProduction(),
            ],
            'message' => 'Transaksi Midtrans Snap berhasil disiapkan.',
        ]);
    }

    /**
     * GET /api/subscription/orders/{orderId}/status
     * Memeriksa status transaksi order langganan
     */
    public function checkStatus(Request $request, string $orderId): JsonResponse
    {
        $order = SubscriptionOrder::where('order_id', $orderId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return response()->json([
            'data' => [
                'order_id'     => $order->order_id,
                'status'       => $order->status,
                'is_paid'      => $order->isPaid(),
                'amount'       => (int) $order->amount,
                'plan'         => $order->plan,
                'payment_type' => $order->payment_type,
                'paid_at'      => $order->paid_at?->toISOString(),
            ],
            'message' => 'Status transaksi langganan.',
        ]);
    }

    /**
     * POST /api/subscription/orders/{orderId}/simulate
     * Simulasi instan pembayaran sukses (khusus mode Sandbox / pengujian)
     */
    public function simulate(Request $request, string $orderId): JsonResponse
    {
        abort_if(
            !app()->environment('local', 'testing') && $this->midtrans->isProduction(),
            403,
            'Simulasi pembayaran hanya diizinkan pada mode development / sandbox.'
        );

        $order = SubscriptionOrder::where('order_id', $orderId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $order = $this->midtrans->simulatePaymentSuccess($orderId);

        return response()->json([
            'data' => [
                'order_id' => $order->order_id,
                'status'   => $order->status,
                'is_paid'  => true,
                'user'     => $request->user()->fresh(),
            ],
            'message' => 'Simulasi pembayaran sukses! Status Pro Studio telah aktif.',
        ]);
    }

    /**
     * POST /api/subscription/upgrade
     * Fallback manual upgrade (hanya untuk Admin platform atau mode local)
     */
    public function upgrade(Request $request): JsonResponse
    {
        abort_if(
            !$request->user()->isAdmin() && !app()->environment('local', 'testing'),
            403,
            'Upgrade manual tanpa transaksi Midtrans hanya dapat dilakukan oleh Administrator platform.'
        );

        $validated = $request->validate([
            'plan' => 'required|string|in:monthly,yearly',
        ]);

        $user = $request->user();
        $plan = $validated['plan'];

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
