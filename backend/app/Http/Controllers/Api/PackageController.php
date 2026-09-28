<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    // GET /packages (fotografer: semua paket termasuk nonaktif)
    public function index(Request $request): JsonResponse
    {
        $packages = Package::where('user_id', $request->user()->id)
            ->orderBy('price')
            ->get();

        return response()->json($packages);
    }

    // GET /packages/public (publik: hanya paket aktif untuk halaman booking klien)
    public function public(Request $request): JsonResponse
    {
        $packages = Package::active()
            ->orderBy('price')
            ->get(['id', 'name', 'description', 'duration_hours',
                   'photo_quota', 'price', 'dp_amount', 'inclusions']);

        return response()->json($packages);
    }

    // POST /packages
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'            => 'required|string|max:100',
            'description'     => 'nullable|string',
            'duration_hours'  => 'required|integer|min:1',
            'photo_quota'     => 'required|integer|min:1',
            'selection_quota' => 'required|integer|min:1',
            'revision_count'  => 'sometimes|integer|min:0',
            'price'           => 'required|numeric|min:0',
            'dp_amount'       => 'required|numeric|min:0',
            'is_active'       => 'sometimes|boolean',
            'inclusions'      => 'nullable|array',
            'inclusions.*'    => 'string',
        ]);

        $user = $request->user();
        if (! $user->isPro()) {
            $existingCount = Package::where('user_id', $user->id)->count();
            if ($existingCount >= 2) {
                return response()->json([
                    'message'          => 'Batas maksimal 2 paket layanan tercapai untuk akun Starter. Upgrade ke Pro Studio untuk membuat paket tanpa batas.',
                    'upgrade_required' => true,
                    'current_count'    => $existingCount,
                    'max_limit'        => 2,
                ], 403);
            }
        }

        $data['user_id'] = $user->id;

        $package = Package::create($data);

        return response()->json($package, 201);
    }

    // GET /packages/{package}
    public function show(Request $request, Package $package): JsonResponse
    {
        $this->authorizeOwner($package, $request);

        return response()->json($package);
    }

    // PATCH /packages/{package}
    public function update(Request $request, Package $package): JsonResponse
    {
        $this->authorizeOwner($package, $request);

        $data = $request->validate([
            'name'            => 'sometimes|string|max:100',
            'description'     => 'nullable|string',
            'duration_hours'  => 'sometimes|integer|min:1',
            'photo_quota'     => 'sometimes|integer|min:1',
            'selection_quota' => 'sometimes|integer|min:1',
            'revision_count'  => 'sometimes|integer|min:0',
            'price'           => 'sometimes|numeric|min:0',
            'dp_amount'       => 'sometimes|numeric|min:0',
            'is_active'       => 'sometimes|boolean',
            'inclusions'      => 'nullable|array',
        ]);

        $package->update($data);

        return response()->json($package);
    }

    // DELETE /packages/{package}
    public function destroy(Request $request, Package $package): JsonResponse
    {
        $this->authorizeOwner($package, $request);

        if ($package->bookings()->exists()) {
            return response()->json([
                'message' => 'Paket tidak bisa dihapus karena sudah ada booking.',
            ], 422);
        }

        $package->delete();

        return response()->json(['message' => 'Paket dihapus.']);
    }

    private function authorizeOwner(Package $package, Request $request): void
    {
        abort_if($package->user_id !== $request->user()->id, 403, 'Akses ditolak.');
    }
}
