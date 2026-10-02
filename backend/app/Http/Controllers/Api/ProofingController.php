<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Notification;
use App\Models\ProofingPhoto;
use App\Models\ProofingSelection;
use App\Models\ProofingSession;
use App\Services\GoogleDriveService;
use App\Services\WebPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProofingController extends Controller
{
    public function __construct(private ?GoogleDriveService $drive = null)
    {
        $this->drive = $this->drive ?? app(GoogleDriveService::class);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ENDPOINT PUBLIK KLIEN
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * GET /proof/{slug}?pin=123456
     * Diakses oleh klien di smartphone untuk melihat foto & melakukan swipe proofing
     */
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
                'title'                 => $session->display_title,
                'status'                => $session->status,
                'total_photos'          => $session->photos->count(),
                'selection_quota'       => $session->selection_quota,
                'selected_count'        => $session->selected_count,
                'booking_code'          => $session->booking?->booking_code,
                'client_name'           => $session->display_client_name,
                'package_name'          => $session->booking?->package?->name ?: ($session->title ?: 'Dokumentasi Foto'),
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

    /**
     * POST /proof/{slug}/selections
     * Klien menyimpan hasil seleksi foto
     */
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

            // Update status booking ke editing jika terikat booking
            $session->booking?->update(['status' => 'editing']);

            // Kirim notifikasi Web Push ke fotografer
            try {
                app(WebPushService::class)->notifyProofingCompleted(
                    $session->fresh(['booking.user', 'booking.client', 'booking.package', 'user'])
                );
            } catch (\Throwable $e) {
                Log::warning("Gagal kirim push notification seleksi foto: " . $e->getMessage());
            }

            // Catat notifikasi in-app
            try {
                Notification::create([
                    'user_id'         => $session->user_id,
                    'title'           => "Klien Selesai Memilih Foto! 🎉",
                    'body'            => "Kak {$session->display_client_name} telah menyelesaikan pemilihan " . count($data['photo_ids']) . " foto pada {$session->display_title}.",
                    'type'            => 'selection_done',
                    'data'            => [
                        'session_id'     => $session->id,
                        'booking_id'     => $session->booking_id,
                        'client_name'    => $session->display_client_name,
                        'selected_count' => count($data['photo_ids']),
                        'url'            => "/proofing/{$session->id}",
                    ],
                    'notifiable_type' => ProofingSession::class,
                    'notifiable_id'   => $session->id,
                ]);
            } catch (\Throwable $e) {
                Log::warning("Gagal simpan in-app notification seleksi: " . $e->getMessage());
            }

            return response()->json([
                'data'    => ['selected_count' => count($data['photo_ids'])],
                'message' => 'Pilihan foto berhasil disimpan dan dikirimkan ke fotografer.',
            ]);
        });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ENDPOINT STANDALONE TOOLS FOTOGRAFER (BISA DIGUNAKAN TANPA CLIENT / BOOKING)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * GET /proofing-sessions
     * Fotografer melihat seluruh daftar sesi proofing (baik standalone maupun dari booking)
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $query  = ProofingSession::where('user_id', $userId)
            ->with(['booking.client', 'booking.package', 'photos'])
            ->orderByDesc('created_at');

        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('client_name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhereHas('booking.client', fn($cq) => $cq->where('name', 'like', "%{$search}%"));
            });
        }

        $sessions = $query->get()->map(function ($s) {
            return [
                'id'                => $s->id,
                'booking_id'        => $s->booking_id,
                'booking_code'      => $s->booking?->booking_code,
                'title'             => $s->title,
                'display_title'     => $s->display_title,
                'client_name'       => $s->display_client_name,
                'client_phone'      => $s->client_phone ?: $s->booking?->client?->phone,
                'slug'              => $s->slug,
                'pin'               => $s->pin,
                'status'            => $s->status,
                'selection_quota'   => $s->selection_quota,
                'selected_count'    => $s->selected_count,
                'total_photos'      => $s->photos->count(),
                'gdrive_folder_url' => $s->gdrive_folder_url,
                'is_standalone'     => is_null($s->booking_id),
                'created_at'        => $s->created_at?->format('d M Y'),
                'thumbnail_preview' => $s->photos->first()?->lowres_path,
            ];
        });

        return response()->json([
            'data'    => $sessions,
            'message' => 'Daftar sesi proofing berhasil dimuat.',
        ]);
    }

    /**
     * POST /proofing-sessions
     * Buat sesi proofing langsung sebagai tools mandiri (tanpa klien/booking)
     */
    public function store(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $data = $request->validate([
            'title'             => 'required|string|max:255',
            'client_name'       => 'nullable|string|max:255',
            'client_phone'      => 'nullable|string|max:50',
            'client_email'      => 'nullable|email|max:255',
            'selection_quota'   => 'nullable|integer|min:1',
            'pin'               => 'nullable|string|size:6',
            'expires_at'        => 'nullable|date',
            'booking_id'        => 'nullable|exists:bookings,id',
            'gdrive_folder_url' => 'nullable|string',
        ]);

        $session = ProofingSession::create([
            'user_id'           => $userId,
            'booking_id'        => $data['booking_id'] ?? null,
            'title'             => $data['title'],
            'client_name'       => $data['client_name'] ?? null,
            'client_phone'      => $data['client_phone'] ?? null,
            'client_email'      => $data['client_email'] ?? null,
            'gdrive_folder_url' => $data['gdrive_folder_url'] ?? null,
            'selection_quota'   => $data['selection_quota'] ?? 20,
            'pin'               => $data['pin'] ?? str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT),
            'slug'              => Str::random(10),
            'total_photos'      => 0,
            'selected_count'    => 0,
            'status'            => 'active',
            'expires_at'        => $data['expires_at'] ?? now()->addDays(14),
        ]);

        $importedCount = 0;
        $driveMessage  = '';

        // Jika fotografer langsung memasukkan tautan Google Drive
        if (!empty($data['gdrive_folder_url'])) {
            $folderId = $this->drive->extractFolderId($data['gdrive_folder_url']);
            if ($folderId && $this->drive->isConnected($userId)) {
                try {
                    $images = $this->drive->listImagesInFolder($userId, $folderId);
                    if (!empty($images)) {
                        foreach ($images as $idx => $img) {
                            $session->photos()->create([
                                'original_filename' => $img['original_filename'],
                                'display_filename'  => $img['display_filename'],
                                'lowres_path'       => $img['lowres_path'],
                                'gdrive_file_id'    => $img['id'] ?? null,
                                'sort_order'        => $idx + 1,
                                'status'            => 'ready',
                            ]);
                        }
                        $session->update([
                            'total_photos' => count($images),
                        ]);
                        $importedCount = count($images);
                        $driveMessage  = " dan {$importedCount} foto dari Google Drive berhasil ditarik";
                    }
                } catch (\Throwable $e) {
                    Log::warning("Gagal auto import gdrive saat create session: " . $e->getMessage());
                }
            }
        }

        return response()->json([
            'data'    => $this->formatSessionPayload($session->fresh()),
            'message' => "Sesi proofing berhasil dibuat{$driveMessage}!",
        ], 201);
    }

    /**
     * GET /proofing-sessions/{proofingSession}
     * Ambil rincian sesi proofing berdasarkan ID sesi (bekerja untuk standalone maupun booking)
     */
    public function show(Request $request, ProofingSession $proofingSession): JsonResponse
    {
        abort_if($proofingSession->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        return response()->json([
            'data'    => $this->formatSessionPayload($proofingSession),
            'message' => 'Detail sesi proofing berhasil dimuat.',
        ]);
    }

    /**
     * PATCH /proofing-sessions/{proofingSession}
     * Update sesi proofing
     */
    public function update(Request $request, ProofingSession $proofingSession): JsonResponse
    {
        abort_if($proofingSession->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $data = $request->validate([
            'title'             => 'sometimes|required|string|max:255',
            'client_name'       => 'nullable|string|max:255',
            'client_phone'      => 'nullable|string|max:50',
            'client_email'      => 'nullable|email|max:255',
            'selection_quota'   => 'sometimes|integer|min:1',
            'pin'               => 'sometimes|string|size:6',
            'status'            => 'sometimes|in:draft,active,completed,expired',
            'expires_at'        => 'nullable|date',
            'booking_id'        => 'nullable|exists:bookings,id',
            'gdrive_folder_url' => 'nullable|string',
        ]);

        $proofingSession->update($data);

        return response()->json([
            'data'    => $this->formatSessionPayload($proofingSession->fresh()),
            'message' => 'Sesi proofing berhasil diperbarui.',
        ]);
    }

    /**
     * DELETE /proofing-sessions/{proofingSession}
     * Hapus sesi proofing
     */
    public function destroy(Request $request, ProofingSession $proofingSession): JsonResponse
    {
        abort_if($proofingSession->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $proofingSession->delete();

        return response()->json([
            'data'    => null,
            'message' => 'Sesi proofing berhasil dihapus.',
        ]);
    }

    /**
     * POST /proofing-sessions/{proofingSession}/photos
     * Tambah foto langsung ke sesi berdasarkan session ID
     */
    public function addPhotosToSession(Request $request, ProofingSession $proofingSession): JsonResponse
    {
        abort_if($proofingSession->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $data = $request->validate([
            'photos'                     => 'required|array|min:1',
            'photos.*.original_filename' => 'required|string',
            'photos.*.display_filename'  => 'nullable|string',
            'photos.*.lowres_path'       => 'required|string',
        ]);

        $maxSort = $proofingSession->photos()->max('sort_order') ?? 0;

        foreach ($data['photos'] as $idx => $p) {
            $proofingSession->photos()->create([
                'original_filename' => $p['original_filename'],
                'display_filename'  => $p['display_filename'] ?? $p['original_filename'],
                'lowres_path'       => $p['lowres_path'],
                'sort_order'        => $maxSort + $idx + 1,
                'status'            => 'ready',
            ]);
        }

        $proofingSession->update([
            'total_photos' => $proofingSession->photos()->count(),
            'status'       => 'active',
        ]);

        return response()->json([
            'data'    => $this->formatSessionPayload($proofingSession->fresh()),
            'message' => 'Foto berhasil ditambahkan ke sesi proofing.',
        ]);
    }

    /**
     * POST /proofing-sessions/{proofingSession}/import-drive
     * Import folder Google Drive langsung ke sesi
     */
    public function importDriveToSession(Request $request, ProofingSession $proofingSession): JsonResponse
    {
        abort_if($proofingSession->user_id !== $request->user()->id, 403, 'Akses ditolak.');

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

        return DB::transaction(function () use ($proofingSession, $images, $data) {
            $maxSort = $proofingSession->photos()->max('sort_order') ?? 0;

            foreach ($images as $idx => $img) {
                $proofingSession->photos()->create([
                    'original_filename' => $img['original_filename'],
                    'display_filename'  => $img['display_filename'],
                    'lowres_path'       => $img['lowres_path'],
                    'gdrive_file_id'    => $img['id'] ?? null,
                    'sort_order'        => $maxSort + $idx + 1,
                    'status'            => 'ready',
                ]);
            }

            $proofingSession->update([
                'total_photos'      => $proofingSession->photos()->count(),
                'status'            => 'active',
                'gdrive_folder_url' => $data['folder_input'],
            ]);

            return response()->json([
                'data'    => $this->formatSessionPayload($proofingSession->fresh()),
                'message' => count($images) . ' foto berhasil ditarik dari Google Drive!',
            ]);
        });
    }

    /**
     * DELETE /proofing-sessions/{proofingSession}/photos/{photo}
     * Hapus foto dari sesi
     */
    public function deletePhotoFromSession(Request $request, ProofingSession $proofingSession, ProofingPhoto $photo): JsonResponse
    {
        abort_if($proofingSession->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        if ($photo->proofing_session_id !== $proofingSession->id) {
            return response()->json(['message' => 'Foto tidak ditemukan pada sesi ini.'], 404);
        }

        $photo->delete();
        $proofingSession->update([
            'total_photos' => $proofingSession->photos()->count(),
        ]);

        return response()->json(['message' => 'Foto berhasil dihapus dari sesi proofing.']);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ENDPOINT LEGACY BERBASIS BOOKING (UNTUK KOMPATIBILITAS HALAMAN DETAIL BOOKING)
    // ──────────────────────────────────────────────────────────────────────────

    public function getByBooking(Request $request, Booking $booking): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $session = $booking->proofingSession;

        if (!$session) {
            return response()->json(['message' => 'Sesi proofing belum dibuat untuk booking ini.'], 404);
        }

        return response()->json([
            'data'    => $this->formatSessionPayload($session),
            'message' => 'Detail proofing berhasil dimuat.',
        ]);
    }

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
                'title'           => "Sesi {$booking->package?->name}",
                'client_name'     => $booking->client?->name,
                'client_phone'    => $booking->client?->phone,
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

    public function addPhotos(Request $request, Booking $booking): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $session = $booking->proofingSession;
        if (!$session) {
            return response()->json(['message' => 'Sesi proofing belum dibuat untuk booking ini.'], 404);
        }

        return $this->addPhotosToSession($request, $session);
    }

    public function deletePhoto(Request $request, Booking $booking, ProofingPhoto $photo): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $session = $booking->proofingSession;
        if (!$session) {
            return response()->json(['message' => 'Sesi proofing belum dibuat untuk booking ini.'], 404);
        }

        return $this->deletePhotoFromSession($request, $session, $photo);
    }

    public function importFromDrive(Request $request, Booking $booking): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $session = $booking->proofingSession;
        if (!$session) {
            $quota = $booking->package?->selection_quota 
                ?? $booking->package?->photo_quota 
                ?? 20;

            $session = ProofingSession::create([
                'booking_id'      => $booking->id,
                'user_id'         => $request->user()->id,
                'title'           => "Sesi {$booking->package?->name}",
                'client_name'     => $booking->client?->name,
                'client_phone'    => $booking->client?->phone,
                'pin'             => str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT),
                'slug'            => Str::random(10),
                'total_photos'    => 0,
                'selection_quota' => $quota,
                'selected_count'  => 0,
                'status'          => 'active',
                'expires_at'      => now()->addDays(14),
            ]);
        }

        return $this->importDriveToSession($request, $session);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // HELPER FORMATTING
    // ──────────────────────────────────────────────────────────────────────────

    private function formatSessionPayload(ProofingSession $session): array
    {
        $session->loadMissing([
            'photos' => fn($q) => $q->orderBy('sort_order'),
            'selections.photo',
            'booking.package',
            'booking.client',
            'user',
        ]);

        $selectedPhotoIds = $session->selections()->where('action', 'selected')->pluck('proofing_photo_id')->toArray();
        $selectedPhotos   = $session->photos->whereIn('id', $selectedPhotoIds);
        $rawFilenames     = $selectedPhotos->pluck('original_filename')->values()->toArray();
        $lightroomQuery   = implode(' ', array_map(function ($name) {
            return pathinfo($name, PATHINFO_FILENAME);
        }, $rawFilenames));

        return [
            'id'                  => $session->id,
            'booking_id'          => $session->booking_id,
            'booking_code'        => $session->booking?->booking_code,
            'title'               => $session->title,
            'display_title'       => $session->display_title,
            'client_name'         => $session->client_name,
            'display_client_name' => $session->display_client_name,
            'client_phone'        => $session->client_phone ?: $session->booking?->client?->phone,
            'client_email'        => $session->client_email ?: $session->booking?->client?->email,
            'gdrive_folder_url'   => $session->gdrive_folder_url,
            'slug'                => $session->slug,
            'pin'                 => $session->pin,
            'status'              => $session->status,
            'selection_quota'     => $session->selection_quota,
            'selected_count'      => $session->selected_count,
            'total_photos'        => $session->photos->count(),
            'package'             => $session->booking?->package,
            'package_name'        => $session->booking?->package?->name,
            'selected_filenames'  => $rawFilenames,
            'lightroom_query'     => $lightroomQuery,
            'is_standalone'       => is_null($session->booking_id),
            'created_at'          => $session->created_at?->format('d M Y, H:i'),
            'expires_at'          => $session->expires_at?->format('d M Y'),
            'photos'              => $session->photos->map(fn($p) => [
                'id'                => $p->id,
                'original_filename' => $p->original_filename,
                'display_filename'  => $p->display_filename,
                'watermarked_url'   => $p->lowres_path,
                'status'            => in_array($p->id, $selectedPhotoIds) ? 'selected' : 'unselected',
            ]),
        ];
    }
}
