<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PortfolioItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortfolioController extends Controller
{
    // GET /portfolio (fotografer: semua item galeri miliknya)
    public function index(Request $request): JsonResponse
    {
        $items = PortfolioItem::where('user_id', $request->user()->id)
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->orderByDesc('is_featured')
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $items, 'message' => 'Daftar portofolio berhasil dimuat.']);
    }

    // GET /portfolio/public (publik: hanya item visible)
    public function public(Request $request): JsonResponse
    {
        $items = PortfolioItem::visible()
            ->when($request->category && $request->category !== 'all', fn($q) => $q->where('category', $request->category))
            ->orderByDesc('is_featured')
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->get(['id', 'title', 'description', 'category', 'thumbnail_path', 'photos', 'is_featured', 'taken_at']);

        return response()->json(['data' => $items, 'message' => 'Portofolio publik berhasil dimuat.']);
    }

    // GET /portfolio/{portfolio} (detail satu sesi karya)
    public function show(PortfolioItem $portfolio): JsonResponse
    {
        return response()->json(['data' => $portfolio, 'message' => 'Detail karya portofolio berhasil dimuat.']);
    }

    // POST /portfolio
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'          => 'required|string|max:150',
            'category'       => 'required|in:wedding,prewedding,portrait,editorial,family',
            'description'    => 'nullable|string',
            'thumbnail_path' => 'required|string|max:500',
            'photos'         => 'nullable|array',
            'photos.*'       => 'string',
            'is_featured'    => 'sometimes|boolean',
            'sort_order'     => 'sometimes|integer',
            'taken_at'       => 'nullable|date',
        ]);

        $data['user_id'] = $request->user()->id;
        $item = PortfolioItem::create($data);

        return response()->json(['data' => $item, 'message' => 'Karya berhasil ditambahkan ke portofolio.'], 201);
    }

    // PATCH /portfolio/{item}
    public function update(Request $request, PortfolioItem $portfolio): JsonResponse
    {
        abort_if($portfolio->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $data = $request->validate([
            'title'          => 'sometimes|string|max:150',
            'category'       => 'sometimes|in:wedding,prewedding,portrait,editorial,family',
            'description'    => 'nullable|string',
            'thumbnail_path' => 'sometimes|string|max:500',
            'is_featured'    => 'sometimes|boolean',
            'is_visible'     => 'sometimes|boolean',
            'sort_order'     => 'sometimes|integer',
        ]);

        $portfolio->update($data);

        return response()->json(['data' => $portfolio, 'message' => 'Portofolio berhasil diperbarui.']);
    }

    // DELETE /portfolio/{item}
    public function destroy(Request $request, PortfolioItem $portfolio): JsonResponse
    {
        abort_if($portfolio->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $portfolio->delete();

        return response()->json(['data' => null, 'message' => 'Karya portofolio berhasil dihapus.']);
    }
}
