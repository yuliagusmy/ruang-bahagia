<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\ProofingPhoto;
use App\Models\ProofingSelection;
use App\Models\ProofingSession;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProofingController extends Controller
{
    public function __construct(private ?GoogleDriveService $drive = null)
    {
        $this->drive = $this->drive ?? app(GoogleDriveService::class);
    }
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
            'booking:id,booking_code,event_date,client_id,package_id',
            'booking.client:id,name',
            'booking.package:id,name,photo_quota,selection_quota',
            'user:id,name,brand_name,whatsapp,phone',
        ]);

        return response()->json([
            'data' => [
                'id'                    => $session->id,
                'slug'                  => $session->slug,
                'status'                => $session->status,
                'total_photos'          => $session->photos->count(),
                'selection_quota'       => $session->selection_quota,
                'selected_count'        => $session->selected_count,
                'booking_code'          => $session->booking?->booking_code,
                'client_name'           => $session->booking?->client?->name,
                'package_name'          => $session->booking?->package?->name,
                'photographer_name'     => $session->user?->brand_name ?: ($session->user?->name ?: 'Studio Fotografi'),
                'photographer_whatsapp' => $session->user?->whatsapp ?: $session->user?->phone,
                'package'               => $session->booking?->package,
                'photos'                => $session->photos->map(fn($p) => [
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
            'booking.client',
        ]);

        $selectedPhotoIds = $session->selections()->where('action', 'selected')->pluck('proofing_photo_id')->toArray();

        return response()->json([
            'data' => [
                'id'              => $session->id,
                'booking_id'      => $booking->id,
                'booking_code'    => $booking->booking_code,
                'client_name'     => $booking->client?->name,
                'client_phone'    => $booking->client?->phone,
                'slug'            => $session->slug,
                'pin'             => $session->pin,
                'status'          => $session->status,
                'selection_quota' => $session->selection_quota,
                'selected_count'  => $session->selected_count,
                'total_photos'    => $session->photos->count(),
                'package'         => $session->booking?->package,
                'photos'          => $session->photos->map(fn($p) => [
                    'id'                => $p->id,
                    'original_filename' => $p->original_filename,
                    'display_filename'  => $p->display_filename,
                    'watermarked_url'   => $p->lowres_path,
                    'status'            => in_array($p->id, $selectedPhotoIds) ? 'selected' : 'unselected',
                ]),
            ],
            'message' => 'Detail proofing berhasil dimuat.',
        ]);
    }

    // POST /bookings/{booking}/proofing (fotografer inisialisasi sesi proofing)
    public function storeByBooking(Request $request, Booking $booking): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $session = $booking->proofingSession;

        if (!$session) {
            $data = $request->validate([
                'selection_quota' => 'nullable|integer|min:1',
                'pin'             => 'nullable|string|size:6',
                'expires_at'      => 'nullable|date',
            ]);

            $quota = $data['selection_quota'] 
                ?? $booking->package?->selection_quota 
                ?? $booking->package?->photo_quota 
                ?? 20;

            $session = ProofingSession::create([
                'booking_id'      => $booking->id,
                'user_id'         => $request->user()->id,
                'pin'             => $data['pin'] ?? str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT),
                'slug'            => Str::random(10),
                'total_photos'    => 0,
                'selection_quota' => $quota,
                'selected_count'  => 0,
                'status'          => 'active',
                'expires_at'      => $data['expires_at'] ?? now()->addDays(14),
            ]);
        }

        return $this->getByBooking($request, $booking);
    }

    // POST /bookings/{booking}/proofing/photos (fotografer menambah foto ke sesi)
    public function addPhotos(Request $request, Booking $booking): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $session = $booking->proofingSession;
        if (!$session) {
            return response()->json(['message' => 'Sesi proofing belum dibuat untuk booking ini.'], 404);
        }

        $data = $request->validate([
            'photos'                     => 'required|array|min:1',
            'photos.*.original_filename' => 'required|string',
            'photos.*.display_filename'  => 'nullable|string',
            'photos.*.lowres_path'       => 'required|string',
        ]);

        $maxSort = $session->photos()->max('sort_order') ?? 0;

        foreach ($data['photos'] as $idx => $p) {
            $session->photos()->create([
                'original_filename' => $p['original_filename'],
                'display_filename'  => $p['display_filename'] ?? $p['original_filename'],
                'lowres_path'       => $p['lowres_path'],
                'sort_order'        => $maxSort + $idx + 1,
                'status'            => 'ready',
            ]);
        }

        $session->update([
            'total_photos' => $session->photos()->count(),
            'status'       => 'active',
        ]);

        return $this->getByBooking($request, $booking);
    }

    // DELETE /bookings/{booking}/proofing/photos/{photo}
    public function deletePhoto(Request $request, Booking $booking, ProofingPhoto $photo): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $session = $booking->proofingSession;
        if (!$session || $photo->proofing_session_id !== $session->id) {
            return response()->json(['message' => 'Foto tidak ditemukan pada sesi ini.'], 404);
        }

        $photo->delete();
        $session->update([
            'total_photos' => $session->photos()->count(),
        ]);

        return response()->json(['message' => 'Foto berhasil dihapus dari sesi proofing.']);
    }

    // POST /bookings/{booking}/proofing/import-drive
    public function importFromDrive(Request $request, Booking $booking): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $data = $request->validate([
            'folder_input' => 'required|string',
        ]);

        $userId = $request->user()->id;
        if (!$this->drive->isConnected($userId)) {
            return response()->json([
                'message' => 'Akun Google Drive Anda belum terhubung. Silakan hubungkan di menu Pengaturan terlebih dahulu.',
            ], 400);
        }

        $folderId = $this->drive->extractFolderId($data['folder_input']);
        if (!$folderId) {
            return response()->json([
                'message' => 'Format tautan atau ID folder Google Drive tidak valid.',
            ], 422);
        }

        try {
            $images = $this->drive->listImagesInFolder($userId, $folderId);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Gagal membaca folder Google Drive: ' . $e->getMessage(),
            ], 500);
        }

        if (empty($images)) {
            return response()->json([
                'message' => 'Tidak ditemukan file foto (JPG, PNG, WebP, RAW) di dalam folder Google Drive tersebut.',
            ], 404);
        }

        $session = $booking->proofingSession;
        if (!$session) {
            $quota = $booking->package?->selection_quota 
                ?? $booking->package?->photo_quota 
                ?? 20;

            $session = ProofingSession::create([
                'booking_id'      => $booking->id,
                'user_id'         => $userId,
                'pin'             => str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT),
                'slug'            => Str::random(10),
                'total_photos'    => 0,
                'selection_quota' => $quota,
                'selected_count'  => 0,
                'status'          => 'active',
                'expires_at'      => now()->addDays(14),
            ]);
        }

        return DB::transaction(function () use ($session, $images, $request, $booking) {
            $maxSort = $session->photos()->max('sort_order') ?? 0;

            foreach ($images as $idx => $img) {
                $session->photos()->create([
                    'original_filename' => $img['original_filename'],
                    'display_filename'  => $img['display_filename'],
                    'lowres_path'       => $img['lowres_path'],
                    'gdrive_file_id'    => $img['id'] ?? null,
                    'sort_order'        => $maxSort + $idx + 1,
                    'status'            => 'ready',
                ]);
            }

            $session->update([
                'total_photos' => $session->photos()->count(),
                'status'       => 'active',
            ]);

            return $this->getByBooking($request, $booking);
        });
    }
}
