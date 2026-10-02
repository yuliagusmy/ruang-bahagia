<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private Client $http;

    public function __construct()
    {
        $this->http = new Client([
            'timeout' => 15,
            'http_errors' => false,
        ]);
    }

    /**
     * Normalisasi nomor WhatsApp ke format internasional (misal 62812xxxx)
     */
    public static function normalizePhone(?string $phone): string
    {
        if (!$phone) {
            return '';
        }

        // Hapus karakter non-digit
        $digits = preg_replace('/\D/', '', $phone);

        if (str_starts_with($digits, '0')) {
            $digits = '62' . substr($digits, 1);
        } elseif (str_starts_with($digits, '8')) {
            $digits = '62' . $digits;
        }

        return $digits;
    }

    /**
     * Kirim pesan WhatsApp melalui gateway (Fonnte / Wablas / Sandbox Log)
     */
    public function sendMessage(User $photographer, string $targetPhone, string $message): array
    {
        $target = self::normalizePhone($targetPhone);
        if (empty($target)) {
            return [
                'success' => false,
                'message' => 'Nomor telepon tujuan tidak valid.',
            ];
        }

        $settings = $photographer->notification_settings ?? [];
        $provider = $settings['wa_gateway_provider'] ?? config('services.whatsapp.provider', 'fonnte');
        $token = $settings['wa_gateway_token'] ?? config('services.whatsapp.token', '');

        // Jika token kosong, simulasikan pengiriman ke log
        if (empty($token)) {
            Log::info("WhatsApp Gateway [Simulasi / Token Kosong] ke {$target}:\n{$message}");
            return [
                'success' => true,
                'mode'    => 'simulated',
                'message' => 'Gateway berjalan dalam mode simulasi (token belum diisi di Pengaturan). Pesan dicatat di log server.',
            ];
        }

        try {
            if ($provider === 'fonnte') {
                $response = $this->http->post('https://api.fonnte.com/send_message', [
                    'headers' => [
                        'Authorization' => $token,
                    ],
                    'form_params' => [
                        'target'  => $target,
                        'message' => $message,
                    ],
                ]);

                $statusCode = $response->getStatusCode();
                $body = json_decode((string)$response->getBody(), true) ?? [];

                if ($statusCode >= 200 && $statusCode < 300 && ($body['status'] ?? false)) {
                    return [
                        'success' => true,
                        'mode'    => 'live',
                        'data'    => $body,
                        'message' => 'Pesan WhatsApp berhasil dikirim via Fonnte.',
                    ];
                }

                $errMsg = $body['reason'] ?? $body['message'] ?? "HTTP error {$statusCode}";
                Log::warning("Fonnte WA Error: {$errMsg}", ['body' => $body]);
                return [
                    'success' => false,
                    'message' => "Gagal mengirim via Fonnte: {$errMsg}",
                ];
            }

            if ($provider === 'wablas') {
                $serverUrl = rtrim($settings['wablas_server_url'] ?? env('WABLAS_SERVER_URL', 'https://jakarta.wablas.com'), '/');
                $response = $this->http->post("{$serverUrl}/api/send-message", [
                    'headers' => [
                        'Authorization' => $token,
                    ],
                    'form_params' => [
                        'phone'   => $target,
                        'message' => $message,
                    ],
                ]);

                $statusCode = $response->getStatusCode();
                $body = json_decode((string)$response->getBody(), true) ?? [];

                if ($statusCode >= 200 && $statusCode < 300 && ($body['status'] ?? false)) {
                    return [
                        'success' => true,
                        'mode'    => 'live',
                        'data'    => $body,
                        'message' => 'Pesan WhatsApp berhasil dikirim via Wablas.',
                    ];
                }

                $errMsg = $body['message'] ?? "HTTP error {$statusCode}";
                return [
                    'success' => false,
                    'message' => "Gagal mengirim via Wablas: {$errMsg}",
                ];
            }

            // Generic / Fallback
            Log::info("WhatsApp Gateway [Provider {$provider}] ke {$target}:\n{$message}");
            return [
                'success' => true,
                'mode'    => 'simulated',
                'message' => "Pesan WhatsApp diproses untuk provider {$provider}.",
            ];
        } catch (\Throwable $e) {
            Log::error("WhatsApp Gateway Exception: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Terjadi kendala saat menghubungi server gateway WhatsApp: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * 1. Notifikasi Saat DP Dikonfirmasi
     */
    public function sendDpConfirmedNotification(Booking $booking): array
    {
        $photographer = $booking->user;
        $client = $booking->client;
        if (!$photographer || !$client || empty($client->phone)) {
            return ['success' => false, 'message' => 'Data klien atau fotografer tidak lengkap.'];
        }

        $notifSettings = $photographer->notification_settings ?? [];
        if (isset($notifSettings['wa_auto_dp_confirmed']) && !$notifSettings['wa_auto_dp_confirmed']) {
            return ['success' => false, 'message' => 'Pengiriman otomatis DP dimatikan di pengaturan studio.'];
        }

        $brandName = $photographer->brand_name ?? $photographer->name;
        $clientName = $client->name;
        $packageName = $booking->package?->name ?? 'Sesi Foto';
        $eventDate = $booking->event_date ? $booking->event_date->format('d/m/Y') : '-';
        $eventTime = $booking->event_time ? substr($booking->event_time, 0, 5) . ' WIB' : '';
        $location = $booking->event_location ?: 'Lokasi disepakati bersama';
        $invoiceUrl = config('app.url') . "/invoice/{$booking->booking_code}";

        $message = "Halo Kak {$clientName} ✨\n\n"
            . "Pembayaran DP sesi foto *{$packageName}* telah kami terima dan diverifikasi!\n"
            . "Jadwal pemotretan Anda resmi terkunci:\n\n"
            . "🔖 Kode Booking: #{$booking->booking_code}\n"
            . "📅 Tanggal: {$eventDate}\n"
            . "⏰ Waktu: {$eventTime}\n"
            . "📍 Lokasi: {$location}\n\n"
            . "📄 Rincian Jadwal & Kwitansi Digital:\n{$invoiceUrl}\n\n"
            . "Terima kasih banyak telah mempercayakan momen bahagia Anda kepada {$brandName}! 🙏";

        return $this->sendMessage($photographer, $client->phone, $message);
    }

    /**
     * 2. Notifikasi Pengingat Sesi (H-1)
     */
    public function sendH1Reminder(Booking $booking): array
    {
        $photographer = $booking->user;
        $client = $booking->client;
        if (!$photographer || !$client || empty($client->phone)) {
            return ['success' => false, 'message' => 'Data klien atau fotografer tidak lengkap.'];
        }

        $notifSettings = $photographer->notification_settings ?? [];
        $brandName = $photographer->brand_name ?? $photographer->name;
        $clientName = $client->name;
        $packageName = $booking->package?->name ?? 'Sesi Foto';
        $eventDate = $booking->event_date ? $booking->event_date->format('d/m/Y') : '-';
        $eventTime = $booking->event_time ? substr($booking->event_time, 0, 5) . ' WIB' : '';
        $location = $booking->event_location ?: 'Lokasi yang telah ditentukan';
        $invoiceUrl = config('app.url') . "/invoice/{$booking->booking_code}";
        $h1CustomNotes = $notifSettings['h1_reminder_notes'] ?? '';

        $message = "Halo Kak {$clientName} 📸\n\n"
            . "Pengingat sesi foto besok bersama {$brandName}!\n"
            . "Kami ingin mengonfirmasi kembali jadwal pemotretan Anda:\n\n"
            . "📅 Tanggal: {$eventDate}\n"
            . "⏰ Waktu: {$eventTime} (Mohon hadir 15 menit lebih awal)\n"
            . "📍 Lokasi: {$location}\n"
            . "📦 Paket: {$packageName}\n\n"
            . "💡 Tips Persiapan & Outfit:\n"
            . "1. Pastikan pakaian dan aksesoris sudah disiapkan rapi malam ini.\n"
            . "2. Istirahat yang cukup agar esok tampil ceria dan segar!\n"
            . ($h1CustomNotes ? "3. Catatan Studio: {$h1CustomNotes}\n" : '')
            . "\n📄 Tautan Rincian Jadwal & Invoice:\n{$invoiceUrl}\n\n"
            . "Sampai jumpa di lokasi pemotretan besok ya Kak! ✨";

        return $this->sendMessage($photographer, $client->phone, $message);
    }

    /**
     * 3. Notifikasi Foto Mentah Siap Dipilih (Proofing Ready)
     */
    public function sendProofingReadyNotification(Booking $booking): array
    {
        $photographer = $booking->user;
        $client = $booking->client;
        $session = $booking->proofingSession;
        if (!$photographer || !$client || empty($client->phone)) {
            return ['success' => false, 'message' => 'Data klien atau fotografer tidak lengkap.'];
        }

        $clientName = $client->name;
        $packageName = $booking->package?->name ?? 'Sesi Foto';
        $slug = $session?->slug ?? $booking->booking_code;
        $pin = $session?->pin ?? '1234';
        $quota = $session?->selection_quota ?? ($booking->package?->photo_quota ?? 20);
        $proofingUrl = config('app.url') . "/proof/{$slug}";

        $message = "Halo Kak {$clientName} ✨\n\n"
            . "Sesi pemotretan Anda telah selesai dan foto-foto mentah sudah siap untuk Anda pilih!\n"
            . "Anda bisa langsung memilih foto favorit dari smartphone dengan pengalaman swipe interaktif:\n\n"
            . "🔗 Link Proofing: {$proofingUrl}\n"
            . "🔑 PIN Akses: {$pin}\n"
            . "📷 Kuota Pilihan: {$quota} foto\n\n"
            . "Silakan geser kanan untuk foto yang disukai. Setelah selesai, kami akan langsung memproses edit foto pilihan Anda. Selamat memilih! 🎉";

        return $this->sendMessage($photographer, $client->phone, $message);
    }

    /**
     * 4. Notifikasi Foto Final Siap Unduh (Final Delivery Ready)
     */
    public function sendFinalDeliveryNotification(Booking $booking): array
    {
        $photographer = $booking->user;
        $client = $booking->client;
        $delivery = $booking->delivery;
        if (!$photographer || !$client || empty($client->phone)) {
            return ['success' => false, 'message' => 'Data klien atau fotografer tidak lengkap.'];
        }

        $brandName = $photographer->brand_name ?? $photographer->name;
        $clientName = $client->name;
        $packageName = $booking->package?->name ?? 'Sesi Foto';
        $deliveryUrl = config('app.url') . "/delivery/{$booking->booking_code}";
        $pin = $delivery?->download_pin ?? '••••••';
        $fileCount = $delivery?->file_count ? "{$delivery->file_count} berkas foto" : "seluruh foto pilihan";

        $message = "Halo Kak {$clientName} 🎉\n\n"
            . "Koleksi foto final resolusi tinggi dari sesi *{$packageName}* telah selesai diedit dan siap diunduh!\n\n"
            . "📦 Jumlah: {$fileCount}\n"
            . "🔗 Link Unduh Foto Final: {$deliveryUrl}\n"
            . "🔑 PIN Unduh: {$pin}\n\n"
            . "Terima kasih banyak telah mempercayakan momen bahagia Anda kepada {$brandName}! Semoga hasil foto ini membawa kenangan indah selamanya. 🌸";

        return $this->sendMessage($photographer, $client->phone, $message);
    }
}
