<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    // GET /clients?status=dp_paid&search=budi
    public function index(Request $request): JsonResponse
    {
        $clients = Client::where('user_id', $request->user()->id)
            ->when($request->status, fn($q) => $q->byStatus($request->status))
            ->when($request->search, fn($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%");
            }))
            ->withCount('bookings')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($clients);
    }

    // POST /clients
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'      => 'required|string|max:100',
            'email'     => 'nullable|email|max:150',
            'phone'     => 'required|string|max:20',
            'instagram' => 'nullable|string|max:100',
            'notes'     => 'nullable|string',
        ]);

        $data['user_id'] = $request->user()->id;
        $data['status']  = 'inquiry';

        $client = Client::create($data);

        return response()->json($client, 201);
    }

    // GET /clients/{client}
    public function show(Request $request, Client $client): JsonResponse
    {
        $this->authorizeOwner($client, $request);

        return response()->json(
            $client->load(['bookings.package', 'bookings.payments'])
        );
    }

    // PATCH /clients/{client}
    public function update(Request $request, Client $client): JsonResponse
    {
        $this->authorizeOwner($client, $request);

        $data = $request->validate([
            'name'      => 'sometimes|string|max:100',
            'email'     => 'nullable|email|max:150',
            'phone'     => 'sometimes|string|max:20',
            'instagram' => 'nullable|string|max:100',
            'status'    => 'sometimes|in:inquiry,dp_paid,shooting,editing,proofing,completed,cancelled',
            'notes'     => 'nullable|string',
        ]);

        $client->update($data);

        return response()->json($client);
    }

    // DELETE /clients/{client}
    public function destroy(Request $request, Client $client): JsonResponse
    {
        $this->authorizeOwner($client, $request);

        $client->delete();

        return response()->json(['message' => 'Klien dihapus.']);
    }

    private function authorizeOwner(Client $client, Request $request): void
    {
        abort_if($client->user_id !== $request->user()->id, 403, 'Akses ditolak.');
    }
}
