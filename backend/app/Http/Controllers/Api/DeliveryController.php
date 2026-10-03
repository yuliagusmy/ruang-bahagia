<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Delivery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DeliveryController extends Controller
{
    /**
     * GET /bookings/{booking}/delivery
     * Mengambil detail delivery untuk fotografer (private)
     */
    public function getByBooking(Request $request, Booking $booking): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $delivery = $booking->delivery;

        return response()->json([
            'data'    => $delivery,
            'message' => $delivery ? 'Data delivery ditemukan.' : 'Belum ada data delivery.',
        ]);
    }

    /**
     * POST /bookings/{booking}/delivery
     * Menyimpan atau memperbarui link delivery final (private)
     */
    public function saveDelivery(Request $request, Booking $booking): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $data = $request->validate([
            'download_link'    => 'required|url',
            'download_pin'     => 'nullable|string|size:6',
            'gdrive_folder_id' => 'nullable|string',
            'file_count'       => 'nullable|integer|min:0',
            'expires_in_days'  => 'nullable|integer|min:1|max:90',
            'status'           => 'nullable|in:preparing,ready,downloaded',
            'mark_completed'   => 'nullable|boolean',
        ]);

        $pin = !empty($data['download_pin'])
            ? $data['download_pin']
            : str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        $days = (int)($data['expires_in_days'] ?? 14);
        $now = now();
        $status = $data['status'] ?? 'ready';

        $delivery = Delivery::updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'user_id'          => $request->user()->id,
                'download_link'    => $data['download_link'],
                'download_pin'     => $pin,
                'gdrive_folder_id' => $data['gdrive_folder_id'] ?? null,
                'file_count'       => $data['file_count'] ?? 0,
                'status'           => $status,
                'available_at'     => $now,
                'expires_at'       => (clone $now)->addDays($days),
            ]
        );

        if (!empty($data['mark_completed']) || $status === 'ready') {
            if (in_array($booking->status, ['confirmed', 'in_progress', 'editing', 'proofing'])) {
                $booking->update(['status' => 'completed']);
            }

            // Auto-kirim notifikasi WhatsApp ke klien bahwa foto final siap diunduh
            $notifSettings = $request->user()->notification_settings ?? [];
            if (!isset($notifSettings['wa_auto_final_delivery']) || $notifSettings['wa_auto_final_delivery']) {
                try {
                    app(\App\Services\WhatsAppService::class)->sendFinalDeliveryNotification($booking->fresh(['client', 'package', 'user', 'delivery']));
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning("Gagal auto-kirim WA final delivery: " . $e->getMessage());
                }
            }
        }

        return response()->json([
            'data'    => $delivery,
            'message' => 'Tautan serah terima foto final berhasil disimpan.',
        ]);
    }

    /**
     * GET /deliveries/{bookingCode}
     * Akses publik untuk klien mengunduh file foto resolusi tinggi
     */
    public function getByCodePublic(Request $request, string $bookingCode): JsonResponse
    {
        $booking = Booking::with(['user', 'client', 'package', 'delivery'])
            ->where('booking_code', $bookingCode)
            ->first();

        if (!$booking || !$booking->delivery) {
            return response()->json([
                'message' => 'Tautan serah terima foto belum tersedia untuk nomor reservasi ini.',
            ], 404);
        }

        $delivery = $booking->delivery;

        // Cek PIN akses unduhan secara aman (timing-attack resistant)
        $pin = $request->query('pin');
        if ($delivery->download_pin && (!$pin || !hash_equals((string)$delivery->download_pin, (string)$pin))) {
            return response()->json([
                'message' => 'PIN akses tidak valid.',
            ], 403);
        }

        // Cek kadaluarsa retensi (14 hari)
        if (($delivery->expires_at && $delivery->expires_at->isPast()) || $delivery->status === 'deleted') {
            return response()->json([
                'message' => 'Masa berlaku unduhan foto telah berakhir (melewati batas waktu penyimpanan). Silakan hubungi fotografer Anda.',
            ], 410);
        }

        // Jika pertama kali dibuka saat status ready, tandai downloaded
        if ($delivery->status === 'ready') {
            $delivery->update(['status' => 'downloaded']);
        }

        $hoursLeft = $delivery->expires_at ? max(0, now()->diffInHours($delivery->expires_at, false)) : null;
        $daysLeft = $hoursLeft !== null ? ceil($hoursLeft / 24) : null;

        $existingTestimonial = \App\Models\Testimonial::where('booking_id', $booking->id)->first();

        return response()->json([
            'data' => [
                'booking_code'          => $booking->booking_code,
                'client_name'           => $booking->client?->name,
                'package_name'          => $booking->package?->name,
                'photographer_name'     => $booking->user?->brand_name ?: ($booking->user?->name ?: 'Studio Fotografi'),
                'photographer_whatsapp' => $booking->user?->whatsapp ?: $booking->user?->phone,
                'download_link'         => $delivery->download_link,
                'file_count'            => $delivery->file_count,
                'status'                => $delivery->status,
                'available_at'          => $delivery->available_at?->toIso8601String(),
                'expires_at'            => $delivery->expires_at?->toIso8601String(),
                'hours_left'            => $hoursLeft,
                'days_left'             => $daysLeft,
                'has_reviewed'          => (bool)$existingTestimonial,
                'testimonial'           => $existingTestimonial ? [
                    'rating'  => $existingTestimonial->rating,
                    'comment' => $existingTestimonial->comment,
                ] : null,
            ],
            'message' => 'Foto final siap diunduh.',
        ]);
    }
}
