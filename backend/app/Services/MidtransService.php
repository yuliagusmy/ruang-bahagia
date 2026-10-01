<?php

namespace App\Services;

use App\Models\SubscriptionOrder;
use App\Models\User;
use Carbon\Carbon;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class MidtransService
{
    private Client $http;
    private string $serverKey;
    private string $clientKey;
    private bool $isProduction;
    private string $snapBaseUrl;
    private string $apiBaseUrl;

    public function __construct()
    {
        $this->http         = new Client(['timeout' => 15]);
        $this->serverKey    = config('services.midtrans.server_key') ?? '';
        $this->clientKey    = config('services.midtrans.client_key') ?? '';
        $this->isProduction = (bool) (config('services.midtrans.is_production') ?? false);

        $this->snapBaseUrl = $this->isProduction
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        $this->apiBaseUrl = $this->isProduction
            ? 'https://api.midtrans.com/v2'
            : 'https://api.sandbox.midtrans.com/v2';
    }

    public function getClientKey(): string
    {
        return $this->clientKey;
    }

    public function isProduction(): bool
    {
        return $this->isProduction;
    }

    /**
     * Buat Snap Token ke Midtrans API
     */
    public function createSnapTransaction(SubscriptionOrder $order, User $user): array
    {
        $planTitle = $order->plan === 'yearly'
            ? 'Langganan Pro Studio (1 Tahun - Hemat 2 Bulan)'
            : 'Langganan Pro Studio (1 Bulan)';

        $params = [
            'transaction_details' => [
                'order_id'     => $order->order_id,
                'gross_amount' => (int) $order->amount,
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email'      => $user->email,
                'phone'      => $user->whatsapp ?: $user->phone ?: '08123456789',
            ],
            'item_details' => [
                [
                    'id'       => "PRO-{$order->plan}",
                    'price'    => (int) $order->amount,
                    'quantity' => 1,
                    'name'     => substr($planTitle, 0, 50),
                ],
            ],
            'callbacks' => [
                'finish' => config('app.frontend_url', 'http://localhost:5173') . '/subscription?payment=success&order_id=' . $order->order_id,
            ],
        ];

        // Jika Server Key masih dummy/default lokal, fallback ke mock Snap Token
        if (str_contains($this->serverKey, 'DEMO') || empty($this->serverKey)) {
            $mockToken = 'MOCK-SNAP-' . strtoupper(substr(md5($order->order_id), 0, 16));
            $order->update([
                'snap_token'        => $mockToken,
                'snap_redirect_url' => "https://app.sandbox.midtrans.com/snap/v2/vtweb/{$mockToken}",
            ]);

            return [
                'token'        => $mockToken,
                'redirect_url' => $order->snap_redirect_url,
                'is_mock'      => true,
            ];
        }

        try {
            $authHeader = 'Basic ' . base64_encode($this->serverKey . ':');
            $response = $this->http->post($this->snapBaseUrl, [
                'headers' => [
                    'Authorization' => $authHeader,
                    'Content-Type'  => 'application/json',
                    'Accept'        => 'application/json',
                ],
                'json' => $params,
            ]);

            $body = json_decode($response->getBody(), true);
            $token = $body['token'] ?? null;
            $redirectUrl = $body['redirect_url'] ?? null;

            $order->update([
                'snap_token'        => $token,
                'snap_redirect_url' => $redirectUrl,
            ]);

            return [
                'token'        => $token,
                'redirect_url' => $redirectUrl,
                'is_mock'      => false,
            ];
        } catch (GuzzleException $e) {
            Log::error('Midtrans Snap Transaction Error: ' . $e->getMessage());

            // Fallback ke mock agar pengujian lokal tetap berjalan lancar
            $mockToken = 'MOCK-SNAP-' . strtoupper(substr(md5($order->order_id), 0, 16));
            $order->update([
                'snap_token'        => $mockToken,
                'snap_redirect_url' => "https://app.sandbox.midtrans.com/snap/v2/vtweb/{$mockToken}",
            ]);

            return [
                'token'        => $mockToken,
                'redirect_url' => $order->snap_redirect_url,
                'is_mock'      => true,
                'api_error'    => $e->getMessage(),
            ];
        }
    }

    /**
     * Verifikasi Signature Key dari Webhook Midtrans
     */
    public function verifyWebhookSignature(string $orderId, string $statusCode, string $grossAmount, string $signatureKey): bool
    {
        // Format Midtrans: SHA512(order_id + status_code + gross_amount + ServerKey)
        $expectedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $this->serverKey);
        return hash_equals($expectedSignature, $signatureKey);
    }

    /**
     * Memproses Webhook Notification dari Midtrans
     */
    public function handleWebhookNotification(array $payload): SubscriptionOrder
    {
        $orderId           = $payload['order_id'] ?? '';
        $transactionStatus = $payload['transaction_status'] ?? '';
        $fraudStatus       = $payload['fraud_status'] ?? 'accept';
        $paymentType       = $payload['payment_type'] ?? '';

        $order = SubscriptionOrder::where('order_id', $orderId)->firstOrFail();

        $isPaid = false;
        if ($transactionStatus === 'capture') {
            if ($fraudStatus === 'accept') {
                $isPaid = true;
            }
        } elseif ($transactionStatus === 'settlement') {
            $isPaid = true;
        }

        if ($isPaid) {
            $order->update([
                'status'          => 'settlement',
                'paid_at'         => now(),
                'payment_type'    => $paymentType,
                'payment_details' => $payload,
            ]);

            $this->activateUserSubscription($order);
        } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
            $order->update([
                'status'          => $transactionStatus,
                'payment_details' => $payload,
            ]);
        } elseif ($transactionStatus === 'pending') {
            $order->update([
                'status'          => 'pending',
                'payment_type'    => $paymentType,
                'payment_details' => $payload,
            ]);
        }

        return $order;
    }

    /**
     * Simulasi Pembayaran Sukses (khusus mode Sandbox / Dev)
     */
    public function simulatePaymentSuccess(string $orderId): SubscriptionOrder
    {
        $order = SubscriptionOrder::where('order_id', $orderId)->firstOrFail();

        $order->update([
            'status'          => 'settlement',
            'paid_at'         => now(),
            'payment_type'    => 'qris_simulator',
            'payment_details' => ['simulation' => true, 'timestamp' => now()->toIso8601String()],
        ]);

        $this->activateUserSubscription($order);

        return $order;
    }

    /**
     * Aktifkan atau perpanjang masa aktif Pro fotografer
     */
    private function activateUserSubscription(SubscriptionOrder $order): void
    {
        $user = $order->user;
        if (!$user) return;

        $currentExpiry = ($user->subscription_expires_at && $user->subscription_expires_at->isFuture())
            ? $user->subscription_expires_at
            : Carbon::now();

        $newExpiry = $order->plan === 'yearly'
            ? $currentExpiry->copy()->addYear()
            : $currentExpiry->copy()->addMonth();

        $user->subscription_tier = 'pro';
        $user->subscription_status = 'active';
        $user->subscription_expires_at = $newExpiry;
        $user->save();
    }
}
