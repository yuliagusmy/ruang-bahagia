<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Notification as AppNotification;
use App\Models\ProofingSession;
use App\Models\PushSubscription;
use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class WebPushService
{
    private Client $http;

    public function __construct()
    {
        $this->http = new Client([
            'timeout'     => 10,
            'http_errors' => false,
        ]);
    }

    /**
     * VAPID Public Key untuk frontend browser (PWA PushManager.subscribe)
     */
    public static function getPublicKey(): string
    {
        return config('services.vapid.public_key', env('VAPID_PUBLIC_KEY', 'BKpIomvU7_bQhL5g8fK1_3r4tX5y6z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z'));
    }

    /**
     * Notifikasi saat ada booking baru masuk dari portal publik klien
     */
    public function notifyNewBooking(Booking $booking): void
    {
        $photographer = $booking->user;
        if (!$photographer) return;

        $clientName = $booking->client?->name ?? 'Calon Klien';
        $packageName = $booking->package?->name ?? 'Sesi Foto';
        $eventDate = $booking->event_date ? $booking->event_date->format('d M Y') : '-';

        $title = "Reservasi Baru Masuk! 📸";
        $body = "Kak {$clientName} memesan {$packageName} untuk tanggal {$eventDate}.";
        $actionUrl = "/bookings/{$booking->id}";

        // 1. Simpan in-app notification
        AppNotification::create([
            'user_id'         => $photographer->id,
            'title'           => $title,
            'body'            => $body,
            'type'            => 'booking_new',
            'data'            => [
                'booking_id'   => $booking->id,
                'booking_code' => $booking->booking_code,
                'client_name'  => $clientName,
                'package_name' => $packageName,
                'url'          => $actionUrl,
            ],
            'notifiable_type' => Booking::class,
            'notifiable_id'   => $booking->id,
        ]);

        // 2. Dispatch push notification ke device browser fotografer
        $this->sendPushToUser($photographer, $title, $body, [
            'url' => $actionUrl,
            'tag' => 'booking-new-' . $booking->id,
        ]);
    }

    /**
     * Notifikasi saat klien selesai swipe proofing foto
     */
    public function notifyProofingCompleted(ProofingSession $session): void
    {
        $booking = $session->booking;
        $photographer = $booking?->user;
        if (!$photographer || !$booking) return;

        $clientName = $booking->client?->name ?? 'Klien';
        $packageName = $booking->package?->name ?? 'Sesi Foto';
        $count = $session->selected_count ?: $session->selections()->where('action', 'selected')->count();

        $title = "Seleksi Foto Selesai! 🎉";
        $body = "Klien {$clientName} telah memilih {$count} foto ({$packageName}). Siap diedit!";
        $actionUrl = "/bookings/{$booking->id}";

        // 1. Simpan in-app notification
        AppNotification::create([
            'user_id'         => $photographer->id,
            'title'           => $title,
            'body'            => $body,
            'type'            => 'selection_done',
            'data'            => [
                'booking_id'   => $booking->id,
                'session_id'   => $session->id,
                'client_name'  => $clientName,
                'selected_count' => $count,
                'url'          => $actionUrl,
            ],
            'notifiable_type' => Booking::class,
            'notifiable_id'   => $booking->id,
        ]);

        // 2. Dispatch push notification ke device browser fotografer
        $this->sendPushToUser($photographer, $title, $body, [
            'url' => $actionUrl,
            'tag' => 'proofing-done-' . $session->id,
        ]);
    }

    /**
     * Kirim payload Web Push ke semua langganan aktif milik fotografer
     */
    public function sendPushToUser(User $user, string $title, string $body, array $extraData = []): int
    {
        $subscriptions = PushSubscription::where('user_id', $user->id)->get();
        if ($subscriptions->isEmpty()) {
            return 0;
        }

        $payload = json_encode([
            'title' => $title,
            'body'  => $body,
            'data'  => array_merge(['url' => '/dashboard'], $extraData),
            'timestamp' => now()->timestamp,
        ]);

        $sentCount = 0;
        foreach ($subscriptions as $sub) {
            try {
                // Post langsung ke Push Service endpoint browser
                $headers = [
                    'Content-Type' => 'application/json',
                    'TTL'          => '86400',
                ];

                $response = $this->http->post($sub->endpoint, [
                    'headers' => $headers,
                    'body'    => $payload,
                ]);

                $status = $response->getStatusCode();
                if ($status === 201 || $status === 200 || $status === 202) {
                    $sentCount++;
                } elseif ($status === 404 || $status === 410) {
                    // Subscription sudah kadaluarsa di browser, bersihkan
                    $sub->delete();
                }
            } catch (\Throwable $e) {
                // Jangan gagalkan alur utama jika push service gagal
                Log::debug("Push notification delivery warning for user {$user->id}: " . $e->getMessage());
            }
        }

        return $sentCount;
    }
}
