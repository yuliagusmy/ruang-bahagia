<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Models\PackageAddon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PackageAddonController extends Controller
{
    /**
     * Ambil daftar add-on untuk sebuah paket layanan.
     * Endpoint: GET /api/packages/{package}/addons (Public/Private)
     */
    public function index(Package $package): JsonResponse
    {
        $addons = PackageAddon::where('user_id', $package->user_id)
            ->where(function ($q) use ($package) {
                $q->where('package_id', $package->id)
                  ->orWhereNull('package_id');
            })
            ->where('is_active', true)
            ->orderBy('price', 'asc')
            ->get();

        return response()->json([
            'data'    => $addons,
            'message' => 'Daftar layanan tambahan (add-on) berhasil dimuat.',
        ]);
    }

    /**
     * Tambah layanan add-on baru oleh fotografer.
     * Endpoint: POST /api/packages/{package}/addons (Private)
     */
    public function store(Request $request, Package $package): JsonResponse
    {
        abort_if($package->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'price'       => 'required|numeric|min:0',
            'icon'        => 'nullable|string|max:10',
            'is_active'   => 'nullable|boolean',
        ]);

        $addon = PackageAddon::create([
            'user_id'     => $request->user()->id,
            'package_id'  => $package->id,
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'price'       => $data['price'],
            'icon'        => $data['icon'] ?? '📦',
            'is_active'   => $data['is_active'] ?? true,
        ]);

        return response()->json([
            'data'    => $addon,
            'message' => 'Layanan add-on berhasil ditambahkan.',
        ], 201);
    }

    /**
     * Hapus layanan add-on oleh fotografer.
     * Endpoint: DELETE /api/packages/{package}/addons/{addon} (Private)
     */
    public function destroy(Request $request, Package $package, PackageAddon $addon): JsonResponse
    {
        abort_if($addon->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $addon->delete();

        return response()->json([
            'message' => 'Layanan add-on berhasil dihapus.',
        ]);
    }
}
