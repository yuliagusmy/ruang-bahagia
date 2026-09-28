<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\ProofingPhoto;
use App\Models\ProofingSelection;
use App\Models\ProofingSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProofingController extends Controller
{
    // GET /proof/{slug}?pin=123456 (publik untuk klien)
    public function getBySlug(Request $request, string $slug): JsonResponse
    {
        $session = ProofingSession::where('slug', $slug)->first();

        if (!$session) {
            return response()->json(['message' => 'Sesi proofing tidak ditemukan.'], 404);
        }

        if ($session->isExpired()) {
            return response()->json(['message' => 'Masa berlaku sesi proofing ini telah berakhir.'], 410);
        }

        $pin = $request->query('pin');
        if (!$pin || $session->pin !== $pin) {
            return response()->json(['message' => 'PIN akses tidak valid.'], 403);
        }

        $session->load([
            'photos' => fn($q) => $q->where('status', 'ready')->orderBy('sort_order'),
            'booking:id,booking_code,event_date',
            'booking.package:id,name,photo_quota,selection_quota',
        ]);

        return response()->json([
            'data' => [
                'id'              => $session->id,
                'slug'            => $session->slug,
                'status'          => $session->status,
                'total_photos'    => $session->photos->count(),
                'selection_quota' => $session->selection_quota,
                'selected_count'  => $session->selected_count,
                'package'         => $session->booking?->package,
                'photos'          => $session->photos->map(fn($p) => [
                    'id'                => $p->id,
                    'original_filename' => $p->original_filename,
                    'display_filename'  => $p->display_filename,
                    'watermarked_url'   => $p->lowres_path,
                ]),
            ],
            'message' => 'Sesi proofing berhasil diakses.',
        ]);
    }

    // POST /proof/{slug}/selections (publik klien simpan seleksi)
    public function submitSelections(Request $request, string $slug): JsonResponse
    {
        $session = ProofingSession::where('slug', $slug)->firstOrFail();

        $data = $request->validate([
            'pin'         => 'required|string',
            'photo_ids'   => 'required|array',
            'photo_ids.*' => 'integer|exists:proofing_photos,id',
        ]);

        if ($session->pin !== $data['pin']) {
            return response()->json(['message' => 'PIN tidak cocok.'], 403);
        }

        if (count($data['photo_ids']) > $session->selection_quota) {
            return response()->json([
                'message' => "Jumlah foto yang dipilih melebihi kuota ({$session->selection_quota} foto).",
            ], 422);
        }

        return DB::transaction(function () use ($session, $data) {
            // Hapus seleksi sebelumnya jika ada
            ProofingSelection::where('proofing_session_id', $session->id)->delete();

            // Masukkan foto yang dipilih
            $now = now();
            $records = array_map(fn($id) => [
                'proofing_session_id' => $session->id,
                'proofing_photo_id'   => $id,
                'action'              => 'selected',
                'selected_at'         => $now,
                'created_at'          => $now,
                'updated_at'          => $now,
            ], $data['photo_ids']);

            ProofingSelection::insert($records);

            $session->update([
                'selected_count' => count($data['photo_ids']),
                'status'         => 'completed',
            ]);

            // Update status booking ke editing
            $session->booking?->update(['status' => 'editing']);

            return response()->json([
                'data'    => ['selected_count' => count($data['photo_ids'])],
                'message' => 'Pilihan foto berhasil disimpan dan dikirimkan ke fotografer.',
            ]);
        });
    }

    // GET /bookings/{booking}/proofing (fotografer melihat status sesi)
    public function getByBooking(Request $request, Booking $booking): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $session = $booking->proofingSession;

        if (!$session) {
            return response()->json(['message' => 'Sesi proofing belum dibuat untuk booking ini.'], 404);
        }

        $session->load([
            'photos' => fn($q) => $q->orderBy('sort_order'),
            'selections.photo',
            'booking.package',
        ]);

        $selectedPhotoIds = $session->selections()->where('action', 'selected')->pluck('proofing_photo_id')->toArray();

        return response()->json([
            'data' => [
                'id'              => $session->id,
                'slug'            => $session->slug,
                'pin'             => $session->pin,
                'status'          => $session->status,
                'selection_quota' => $session->selection_quota,
                'selected_count'  => $session->selected_count,
                'package'         => $session->booking?->package,
                'photos'          => $session->photos->map(fn($p) => [
                    'id'                => $p->id,
                    'original_filename' => $p->original_filename,
                    'watermarked_url'   => $p->lowres_path,
                    'status'            => in_array($p->id, $selectedPhotoIds) ? 'selected' : 'unselected',
                ]),
            ],
            'message' => 'Detail proofing berhasil dimuat.',
        ]);
    }
}
