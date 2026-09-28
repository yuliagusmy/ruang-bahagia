<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    // GET /schedules?month=2024-03
    // Kembalikan semua slot (opsional filter bulan) beserta status-nya (untuk kalender)
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'sometimes|nullable|date_format:Y-m',
        ]);

        $query = Schedule::where('user_id', $request->user()->id);

        if ($request->filled('month')) {
            $query->forMonth($request->month);
        }

        $schedules = $query->orderBy('date')
            ->orderBy('start_time')
            ->get(['id', 'date', 'start_time', 'end_time', 'status', 'location', 'notes']);

        return response()->json($schedules);
    }

    // POST /schedules
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date'       => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time'   => 'required|date_format:H:i|after:start_time',
            'status'     => 'sometimes|in:available,blocked',
            'location'   => 'nullable|string|max:255',
            'notes'      => 'nullable|string|max:500',
        ]);

        $data['user_id'] = $request->user()->id;
        $data['status']  = $data['status'] ?? 'available';

        $schedule = Schedule::create($data);

        return response()->json($schedule, 201);
    }

    // PATCH /schedules/{schedule}
    // Hanya boleh update slot milik user sendiri yang masih "available"
    public function update(Request $request, Schedule $schedule): JsonResponse
    {
        $this->authorizeOwner($schedule, $request);

        $data = $request->validate([
            'date'       => 'sometimes|date',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time'   => 'sometimes|date_format:H:i',
            'status'     => 'sometimes|in:available,blocked',
            'location'   => 'nullable|string|max:255',
            'notes'      => 'nullable|string|max:500',
        ]);

        if ($schedule->status === 'booked') {
            return response()->json(['message' => 'Slot sudah terbooking, tidak bisa diubah.'], 422);
        }

        $schedule->update($data);

        return response()->json($schedule);
    }

    // DELETE /schedules/{schedule}
    public function destroy(Request $request, Schedule $schedule): JsonResponse
    {
        $this->authorizeOwner($schedule, $request);

        if ($schedule->status === 'booked') {
            return response()->json(['message' => 'Slot sudah terbooking, tidak bisa dihapus.'], 422);
        }

        $schedule->delete();

        return response()->json(['message' => 'Slot dihapus.']);
    }

    // GET /schedules/available?date=2024-03-15
    // Endpoint publik: klien lihat slot tersedia (semua slot ke depan atau filter per tanggal)
    public function available(Request $request): JsonResponse
    {
        $request->validate(['date' => 'sometimes|nullable|date']);

        $query = Schedule::where('status', 'available')
            ->where('date', '>=', now()->toDateString());

        if ($request->filled('date')) {
            $query->where('date', $request->date);
        }

        $slots = $query->orderBy('date')
            ->orderBy('start_time')
            ->get(['id', 'date', 'start_time', 'end_time', 'location', 'notes']);

        return response()->json($slots);
    }

    private function authorizeOwner(Schedule $schedule, Request $request): void
    {
        abort_if($schedule->user_id !== $request->user()->id, 403, 'Akses ditolak.');
    }
}
