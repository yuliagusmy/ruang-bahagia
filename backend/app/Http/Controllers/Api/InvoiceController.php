<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    /**
     * Tampilkan detail kwitansi / invoice digital publik untuk klien.
     * Endpoint: GET /api/invoices/{bookingCode} (Public)
     */
    public function showPublic(string $bookingCode): JsonResponse
    {
        $booking = Booking::where('booking_code', $bookingCode)
            ->with([
                'client:id,name,phone,email',
                'package:id,name,price,dp_amount,description,duration_hours,photo_quota,inclusions',
                'addons:id,booking_id,package_addon_id,name,price,quantity',
                'payments' => fn($q) => $q->orderBy('created_at', 'asc'),
                'user:id,name,brand_name,username,phone,whatsapp,instagram,city,avatar_path,notification_settings',
            ])
            ->first();

        if (! $booking) {
            return response()->json([
                'message' => 'Invoice atau reservasi dengan kode ini tidak ditemukan.',
            ], 404);
        }

        $photographer = $booking->user;
        $notifSettings = $photographer?->notification_settings ?? [];

        $bankInfo = [
            'bank_name'           => $notifSettings['bank_name'] ?? 'BCA',
            'bank_account_number' => $notifSettings['bank_account_number'] ?? '',
            'bank_account_holder' => $notifSettings['bank_account_holder'] ?? ($photographer?->name ?? ''),
            'qris_notes'          => $notifSettings['qris_notes'] ?? null,
            'payment_notes'       => $notifSettings['payment_reminder_notes'] ?? null,
        ];

        $invoiceData = [
            'booking_code'     => $booking->booking_code,
            'status'           => $booking->status,
            'event_date'       => $booking->event_date?->format('Y-m-d'),
            'event_time'       => $booking->event_time,
            'event_location'   => $booking->event_location,
            'event_type'       => $booking->event_type,
            'total_price'      => (float) $booking->total_price,
            'dp_amount'        => (float) $booking->dp_amount,
            'remaining_amount' => (float) $booking->remaining_amount,
            'total_paid'       => (float) $booking->totalPaid(),
            'is_fully_paid'    => $booking->isFullyPaid(),
            'created_at'       => $booking->created_at?->format('Y-m-d H:i:s'),
            'client' => [
                'name'  => $booking->client?->name,
                'phone' => $booking->client?->phone,
                'email' => $booking->client?->email,
            ],
            'package' => [
                'name'           => $booking->package?->name,
                'price'          => (float) ($booking->package?->price ?? 0),
                'dp_amount'      => (float) ($booking->package?->dp_amount ?? 0),
                'description'    => $booking->package?->description,
                'duration_hours' => $booking->package?->duration_hours,
                'photo_quota'    => $booking->package?->photo_quota,
                'inclusions'     => $booking->package?->inclusions ?? [],
            ],
            'addons' => $booking->addons->map(fn($a) => [
                'name'     => $a->name,
                'price'    => (float) $a->price,
                'quantity' => $a->quantity,
                'subtotal' => (float) ($a->price * $a->quantity),
            ]),
            'payments' => $booking->payments->map(fn($p) => [
                'invoice_number' => $p->invoice_number,
                'type'           => $p->type,
                'amount'         => (float) $p->amount,
                'status'         => $p->status,
                'payment_method' => $p->payment_method,
                'paid_at'        => $p->paid_at?->format('Y-m-d H:i:s'),
                'created_at'     => $p->created_at?->format('Y-m-d H:i:s'),
            ]),
            'photographer' => [
                'name'        => $photographer?->name,
                'brand_name'  => $photographer?->brand_name,
                'username'    => $photographer?->username,
                'phone'       => $photographer?->phone,
                'whatsapp'    => $photographer?->whatsapp ?? $photographer?->phone,
                'instagram'   => $photographer?->instagram,
                'city'        => $photographer?->city,
                'avatar_path' => $photographer?->avatar_path,
                'bank_info'   => $bankInfo,
            ],
        ];

        return response()->json([
            'data'    => $invoiceData,
            'message' => 'Detail invoice digital berhasil dimuat.',
        ]);
    }
}
