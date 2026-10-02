<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Notification as AppNotification;
use App\Models\PushSubscription;
use App\Services\WebPushService;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private WhatsAppService $whatsapp,
        private WebPushService $webPush
    ) {}

    /**
     * GET /notifications
     * Daftar notifikasi in-app fotografer
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $notifications = AppNotification::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->take(30)
            ->get();

        $unreadCount = AppNotification::where('user_id', $userId)->unread()->count();

        return response()->json([
            'data' => [
                'notifications' => $notifications,
                'unread_count'  => $unreadCount,
            ],
            'message' => 'Daftar notifikasi berhasil dimuat.',
        ]);
    }

    /**
     * PATCH /notifications/{notification}/read
     */
    public function markAsRead(Request $request, AppNotification $notification): JsonResponse
    {
        abort_if($notification->user_id !== $request->user()->id, 403);

        $notification->markAsRead();

        return response()->json([
            'data'    => $notification,
            'message' => 'Notifikasi ditandai telah dibaca.',
        ]);
    }

    /**
     * POST /notifications/mark-all-read
     */
    public function markAllRead(Request $request): JsonResponse
    {
        AppNotification::where('user_id', $request->user()->id)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json([
            'data'    => null,
            'message' => 'Semua notifikasi berhasil ditandai telah dibaca.',
        ]);
    }

    /**
     * GET /push-notifications/vapid-key
     */
    public function vapidPublicKey(): JsonResponse
    {
        return response()->json([
            'data'    => ['public_key' => WebPushService::getPublicKey()],
            'message' => 'VAPID public key didapatkan.',
        ]);
    }

    /**
     * POST /push-subscriptions
     * Daftarkan browser atau smartphone fotografer untuk Web Push PWA
     */
    public function subscribePush(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint'   => 'required|string',
            'p256dh'     => 'nullable|string',
            'auth'       => 'nullable|string',
            'user_agent' => 'nullable|string',
        ]);

        $subscription = PushSubscription::updateOrCreate(
            ['endpoint' => $data['endpoint']],
            [
                'user_id'    => $request->user()->id,
                'p256dh'     => $data['p256dh'] ?? null,
                'auth'       => $data['auth'] ?? null,
                'user_agent' => $data['user_agent'] ?? $request->header('User-Agent'),
            ]
        );

        return response()->json([
            'data'    => $subscription,
            'message' => 'Perangkat Anda berhasil didaftarkan untuk menerima Notifikasi Push PWA.',
        ], 201);
    }

    /**
     * POST /push-notifications/test
     * Uji coba notifikasi push ke perangkat fotografer
     */
    public function testPush(Request $request): JsonResponse
    {
        $user = $request->user();
        $sentCount = $this->webPush->sendPushToUser(
            $user,
            "Uji Coba Notifikasi Push Ruang Bahagia 📸",
            "Notifikasi push berfungsi normal pada perangkat Anda!",
            ['url' => '/dashboard']
        );

        // Buat juga di in-app notification
        AppNotification::create([
            'user_id'         => $user->id,
            'title'           => "Uji Coba Notifikasi Push Berhasil 📸",
            'body'            => "Notifikasi push PWA Anda telah aktif dan siap menerima peringatan booking baru!",
            'type'            => 'system_test',
            'notifiable_type' => get_class($user),
            'notifiable_id'   => $user->id,
        ]);

        return response()->json([
            'data'    => ['sent_count' => $sentCount],
            'message' => $sentCount > 0
                ? "Notifikasi push berhasil dikirim ke {$sentCount} perangkat terdaftar."
                : "Notifikasi dicatat. Pastikan Anda telah mengizinkan notifikasi browser pada perangkat ini.",
        ]);
    }

    /**
     * POST /whatsapp/test
     * Uji coba kirim pesan WhatsApp ke nomor fotografer
     */
    public function testWhatsApp(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'phone' => 'required|string',
        ]);

        $testMessage = "Halo Kak {$user->name} ✨\n\n"
            . "Ini adalah pesan uji coba dari integrasi *WhatsApp Gateway Ruang Bahagia*.\n"
            . "Jika Anda menerima pesan ini, konfigurasi WhatsApp Gateway studio Anda telah berhasil aktif dan siap mengirimkan notifikasi otomatis ke klien!\n\n"
            . "Waktu kirim: " . now()->translatedFormat('d F Y, H:i') . " WIB";

        $result = $this->whatsapp->sendMessage($user, $data['phone'], $testMessage);

        return response()->json([
            'data'    => $result,
            'message' => $result['message'],
        ], ($result['success'] ?? false) ? 200 : 422);
    }

    /**
     * POST /bookings/{booking}/send-wa
     * Pengiriman pesan WhatsApp manual / 1-klik untuk booking tertentu
     */
    public function sendBookingWa(Request $request, Booking $booking): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'type'            => 'required|string|in:dp_confirmed,h1_reminder,proofing_ready,final_delivery,custom',
            'custom_message'  => 'nullable|string',
        ]);

        $booking->load(['client', 'package', 'proofingSession', 'delivery', 'user']);

        switch ($data['type']) {
            case 'dp_confirmed':
                $result = $this->whatsapp->sendDpConfirmedNotification($booking);
                break;
            case 'h1_reminder':
                $result = $this->whatsapp->sendH1Reminder($booking);
                if ($result['success'] ?? false) {
                    $booking->update(['h1_reminder_sent_at' => now()]);
                }
                break;
            case 'proofing_ready':
                $result = $this->whatsapp->sendProofingReadyNotification($booking);
                break;
            case 'final_delivery':
                $result = $this->whatsapp->sendFinalDeliveryNotification($booking);
                break;
            case 'custom':
                if (empty($data['custom_message'])) {
                    return response()->json(['message' => 'Pesan kustom tidak boleh kosong.'], 422);
                }
                $result = $this->whatsapp->sendMessage($booking->user, $booking->client?->phone ?? '', $data['custom_message']);
                break;
            default:
                return response()->json(['message' => 'Tipe pesan tidak dikenali.'], 422);
        }

        return response()->json([
            'data'    => $result,
            'message' => $result['message'] ?? 'Pesan diproses.',
        ], ($result['success'] ?? false) ? 200 : 422);
    }
}
