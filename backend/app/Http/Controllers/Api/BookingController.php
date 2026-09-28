<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Client;
use App\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    // GET /bookings?status=dp_paid&page=1
    public function index(Request $request): JsonResponse
    {
        $bookings = Booking::where('user_id', $request->user()->id)
            ->when($request->status, fn($q) => $q->byStatus($request->status))
            ->with(['client:id,name,phone', 'package:id,name,price', 'schedule:id,date,start_time'])
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json($bookings);
    }

    // POST /bookings (fotografer input booking manual)
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id'        => 'required|exists:clients,id',
            'package_id'       => 'required|exists:packages,id',
            'schedule_id'      => 'nullable|exists:schedules,id',
            'event_date'       => 'required|date|after_or_equal:today',
            'event_time'       => 'required|date_format:H:i',
            'event_location'   => 'nullable|string|max:255',
            'event_type'       => 'nullable|string|max:100',
            'special_requests' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($data, $request) {
            $package = \App\Models\Package::findOrFail($data['package_id']);

            $data['user_id']          = $request->user()->id;
            $data['total_price']      = $package->price;
            $data['dp_amount']        = $package->dp_amount;
            $data['remaining_amount'] = $package->price - $package->dp_amount;
            $data['status']           = 'confirmed';

            $booking = Booking::create($data);

            // Tandai slot sebagai booked sementara (final lock saat DP dibayar)
            if ($booking->schedule_id) {
                Schedule::find($booking->schedule_id)?->update(['status' => 'booked']);
            }

            // Update status klien
            Client::find($data['client_id'])?->update(['status' => 'inquiry']);

            return response()->json(
                $booking->load(['client', 'package', 'schedule']),
                201
            );
        });
    }

    // POST /bookings/request (publik: klien buat request booking sendiri)
    public function clientRequest(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'             => 'required|string|max:100',
            'email'            => 'nullable|email',
            'phone'            => 'required|string|max:20',
            'package_id'       => 'required|exists:packages,id',
            'schedule_id'      => 'nullable|exists:schedules,id',
            'event_date'       => 'required|date|after_or_equal:today',
            'event_time'       => 'required|date_format:H:i',
            'event_location'   => 'nullable|string|max:255',
            'event_type'       => 'nullable|string|max:100',
            'special_requests' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($data) {
            $package = \App\Models\Package::findOrFail($data['package_id']);

            // Auto-create atau cari klien berdasarkan nomor HP
            $client = Client::firstOrCreate(
                ['phone' => $data['phone'], 'user_id' => $package->user_id],
                ['name'  => $data['name'], 'email' => $data['email'] ?? null, 'status' => 'inquiry']
            );

            $booking = Booking::create([
                'user_id'          => $package->user_id,
                'client_id'        => $client->id,
                'package_id'       => $package->id,
                'schedule_id'      => $data['schedule_id'] ?? null,
                'event_date'       => $data['event_date'],
                'event_time'       => $data['event_time'],
                'event_location'   => $data['event_location'] ?? null,
                'event_type'       => $data['event_type'] ?? null,
                'total_price'      => $package->price,
                'dp_amount'        => $package->dp_amount,
                'remaining_amount' => $package->price - $package->dp_amount,
                'status'           => 'pending',
                'special_requests' => $data['special_requests'] ?? null,
            ]);

            return response()->json([
                'booking_code'      => $booking->booking_code,
                'message'           => 'Booking berhasil dikirim. Tunggu konfirmasi fotografer.',
                'dp_amount'         => $booking->dp_amount,
                'total_price'       => $booking->total_price,
                'whatsapp'          => $package->user?->whatsapp ?? $package->user?->phone ?? '6281234567890',
                'photographer_name' => $package->user?->name ?? 'Fotografer Ruang Bahagia',
                'brand_name'        => $package->user?->brand_name ?? 'Ruang Bahagia Studio',
            ], 201);
        });
    }

    // GET /bookings/{booking}
    public function show(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeOwner($booking, $request);

        return response()->json(
            $booking->load(['client', 'package', 'schedule', 'payments'])
        );
    }

    // PATCH /bookings/{booking}/status
    public function updateStatus(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeOwner($booking, $request);

        $data = $request->validate([
            'status' => 'required|in:confirmed,in_progress,editing,proofing,completed,cancelled',
        ]);

        $booking->update($data);

        // Sinkronkan status klien dengan status booking
        $clientStatus = match ($data['status']) {
            'confirmed', 'pending' => 'inquiry',
            'in_progress'          => 'shooting',
            'editing'              => 'editing',
            'proofing'             => 'proofing',
            'completed'            => 'completed',
            'cancelled'            => 'cancelled',
            default                => $booking->client->status,
        };

        $booking->client?->update(['status' => $clientStatus]);

        return response()->json($booking->fresh(['client', 'package']));
    }

    // GET /bookings/upcoming
    public function upcoming(Request $request): JsonResponse
    {
        $bookings = Booking::where('user_id', $request->user()->id)
            ->upcoming()
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->with(['client:id,name,phone', 'package:id,name'])
            ->limit(10)
            ->get();

        return response()->json($bookings);
    }

    private function authorizeOwner(Booking $booking, Request $request): void
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');
    }
}
