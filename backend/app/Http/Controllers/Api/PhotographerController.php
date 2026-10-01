<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class PhotographerController extends Controller
{
    /**
     * Tampilkan profil publik fotografer berdasarkan username (@handle).
     * Endpoint: GET /api/photographers/{username}
     */
    public function showByUsername(string $username): JsonResponse
    {
        // Bersihkan tanda @ jika klien mengirim @username
        $cleanUsername = ltrim(strtolower(trim($username)), '@');

        $photographer = User::where('username', $cleanUsername)->first();

        if (! $photographer) {
            return response()->json([
                'message' => "Fotografer dengan username '@{$cleanUsername}' tidak ditemukan.",
            ], 404);
        }

        // Ambil paket aktif fotografer ini
        $packages = $photographer->packages()
            ->where('is_active', true)
            ->with(['addons' => fn($q) => $q->where('is_active', true)])
            ->orderBy('price', 'asc')
            ->get();

        // Ambil galeri sesi portofolio publik fotografer ini
        $portfolioItems = $photographer->portfolioItems()
            ->where('is_visible', true)
            ->orderByDesc('is_featured')
            ->orderBy('sort_order', 'asc')
            ->get();

        // Ambil jadwal sesi tersedia fotografer ini
        $availableSchedules = $photographer->schedules()
            ->where('date', '>=', now()->toDateString())
            ->where('status', 'available')
            ->orderBy('date', 'asc')
            ->get(['id', 'date', 'start_time', 'end_time', 'notes']);

        return response()->json([
            'data' => [
                'photographer' => [
                    'id'          => $photographer->id,
                    'name'        => $photographer->name,
                    'brand_name'  => $photographer->brand_name,
                    'username'    => $photographer->username,
                    'bio'         => $photographer->bio,
                    'city'        => $photographer->city,
                    'avatar_path' => $photographer->avatar_path,
                    'phone'       => $photographer->phone,
                    'whatsapp'    => $photographer->whatsapp,
                    'instagram'   => $photographer->instagram,
                ],
                'packages'         => $packages,
                'portfolio_items'  => $portfolioItems,
                'available_slots'  => $availableSchedules,
            ],
            'message' => "Profil fotografer @{$cleanUsername} berhasil dimuat.",
        ]);
    }
}
