<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    // GET /bookings/{booking}/payments
    public function index(Request $request, Booking $booking): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403);

        return response()->json($booking->payments()->orderByDesc('created_at')->get());
    }

    // POST /bookings/{booking}/payments
    // Fotografer konfirmasi/catat pembayaran masuk
    public function store(Request $request, Booking $booking): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'type'             => 'required|in:dp,installment,full,final',
            'amount'           => 'required|numeric|min:1',
            'method'           => 'nullable|string',
            'payment_method'   => 'nullable|string',
            'proof_image_path' => 'nullable|string',
            'transaction_id'   => 'nullable|string|max:100',
            'notes'            => 'nullable|string',
        ]);

        return DB::transaction(function () use ($data, $booking) {
            $paymentMethod = $data['method'] ?? $data['payment_method'] ?? 'qris';
            if ($paymentMethod === 'transfer') {
                $paymentMethod = 'transfer_bank';
            }

            $paymentType = ($data['type'] === 'final') ? 'full' : $data['type'];

            $payment = Payment::create([
                'booking_id'       => $booking->id,
                'user_id'          => $booking->user_id,
                'type'             => $paymentType,
                'amount'           => $data['amount'],
                'method'           => $paymentMethod,
                'proof_image_path' => $data['proof_image_path'] ?? null,
                'transaction_id'   => $data['transaction_id'] ?? null,
                'notes'            => $data['notes'] ?? null,
                'status'           => 'paid',
                'paid_at'          => now(),
            ]);

            // Hitung total yang sudah dibayar
            $totalPaid = $booking->payments()->where('status', 'paid')->sum('amount');
            $remaining = max(0, (float) $booking->total_price - (float) $totalPaid);

            $updateData = ['remaining_amount' => $remaining];

            // Jika ini pembayaran DP: update status booking & klien, lock jadwal kalender
            if ($paymentType === 'dp' || in_array($booking->status, ['pending', 'confirmed'])) {
                $updateData['status'] = 'dp_paid';
                $updateData['dp_paid_at'] = now();

                $booking->client?->update(['status' => 'dp_paid']);

                if ($booking->schedule_id) {
                    Schedule::find($booking->schedule_id)?->lock();
                }
            }

            if ($remaining <= 0) {
                // Jika sudah lunas seluruhnya
                if (!in_array($booking->status, ['in_progress', 'editing', 'proofing', 'completed'])) {
                    $updateData['status'] = 'dp_paid';
                }
            }

            $booking->update($updateData);

            return response()->json([
                'payment'        => $payment,
                'total_paid'     => $totalPaid,
                'remaining'      => $remaining,
                'booking_status' => $booking->fresh()->status,
                'message'        => 'Pembayaran berhasil dikonfirmasi secara manual.',
            ], 201);
        });
    }

    // PATCH /payments/{payment}/confirm
    // Konfirmasi bukti transfer dari klien
    public function confirm(Request $request, Payment $payment): JsonResponse
    {
        abort_if($payment->user_id !== $request->user()->id, 403);

        $payment->markAsPaid();

        return response()->json(['message' => 'Pembayaran dikonfirmasi.', 'payment' => $payment]);
    }
}
