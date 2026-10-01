<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    private MidtransService $midtrans;

    public function __construct(MidtransService $midtrans)
    {
        $this->midtrans = $midtrans;
    }

    /**
     * POST /api/webhooks/midtrans
     * Endpoint publik untuk menerima HTTP POST notification dari Midtrans
     */
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('Midtrans Webhook Received: ', $payload);

        $orderId      = $payload['order_id'] ?? null;
        $statusCode   = $payload['status_code'] ?? null;
        $grossAmount  = $payload['gross_amount'] ?? null;
        $signatureKey = $payload['signature_key'] ?? null;

        if (!$orderId || !$statusCode || !$grossAmount) {
            return response()->json(['message' => 'Format payload webhook tidak valid.'], 400);
        }

        // Verifikasi signature jika bukan mock/demo test
        if ($signatureKey && !str_contains(config('services.midtrans.server_key'), 'DEMO')) {
            $isValid = $this->midtrans->verifyWebhookSignature($orderId, $statusCode, $grossAmount, $signatureKey);
            if (!$isValid) {
                Log::warning("Midtrans Webhook: Invalid signature key for Order #{$orderId}");
                return response()->json(['message' => 'Invalid signature key.'], 403);
            }
        }

        try {
            $order = $this->midtrans->handleWebhookNotification($payload);
            return response()->json([
                'status'  => 'ok',
                'message' => "Order #{$order->order_id} berhasil diproses ({$order->status}).",
            ]);
        } catch (\Throwable $e) {
            Log::error("Midtrans Webhook Error: " . $e->getMessage());
            return response()->json(['message' => 'Gagal memproses webhook: ' . $e->getMessage()], 500);
        }
    }
}
