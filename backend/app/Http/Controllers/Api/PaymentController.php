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
            'type'           => 'required|in:dp,installment,full',
            'amount'         => 'required|numeric|min:1',
            'method'         => 'required|in:transfer_bank,qris,tunai,e_wallet',
            'proof_image_path' => 'nullable|string',
            'transaction_id' => 'nullable|string|max:100',
            'notes'          => 'nullable|string',
        ]);

        return DB::transaction(function () use ($data, $booking) {
            $data['booking_id'] = $booking->id;
            $data['user_id']    = $booking->user_id;
            $data['status']     = 'paid';
            $data['paid_at']    = now();

            $payment = Payment::create($data);

            // Hitung total yang sudah dibayar
            $totalPaid = $booking->payments()->where('status', 'paid')->sum('amount');
            $remaining = max(0, $booking->total_price - $totalPaid);

            $booking->update(['remaining_amount' => $remaining]);

            // Jika ini DP pertama: lock jadwal + update status booking & klien
            if ($data['type'] === 'dp' && $booking->status === 'confirmed') {
                $booking->update(['status' => 'dp_paid']);
                $booking->client?->update(['status' => 'dp_paid']);

                if ($booking->schedule_id) {
                    Schedule::find($booking->schedule_id)?->lock();
                }
            }

            return response()->json([
                'payment'        => $payment,
                'total_paid'     => $totalPaid,
                'remaining'      => $remaining,
                'booking_status' => $booking->fresh()->status,
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
