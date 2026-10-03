<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class GDriveController extends Controller
{
    public function __construct(private GoogleDriveService $drive) {}

    /**
     * GET /api/gdrive/status
     * Cek apakah fotografer sudah menghubungkan Google Drive
     */
    public function status(Request $request): JsonResponse
    {
        $userId    = $request->user()->id;
        $connected = $this->drive->isConnected($userId);

        $data = ['connected' => $connected];

        if ($connected) {
            $token = \App\Models\GoogleDriveToken::where('user_id', $userId)->first();
            $data['gdrive_email'] = $token->gdrive_email;
            $data['expires_at']   = $token->expires_at?->toIso8601String();
        }

        return response()->json(['data' => $data]);
    }

    /**
     * GET /api/gdrive/connect
     * Redirect fotografer ke halaman consent Google OAuth
     */
    public function connect(Request $request): JsonResponse
    {
        $redirectTo = $request->query('redirect_to');
        $frontendOrigin = $request->query('origin');
        $url = $this->drive->getAuthorizationUrl($request->user()->id, $redirectTo, $frontendOrigin);

        return response()->json(['data' => ['auth_url' => $url]]);
    }

    /**
     * GET /api/gdrive/callback (dipanggil Google setelah consent)
     * Tukar code dengan token, redirect ke frontend
     */
    public function callback(Request $request): RedirectResponse
    {
        $state = json_decode(base64_decode($request->query('state', '')), true);
        $frontendBase = !empty($state['frontend_origin'])
            ? rtrim($state['frontend_origin'], '/')
            : env('FRONTEND_URL', 'https://www.ruangbahagia.web.id');

        // Pastikan ke domain www agar tidak terkena 308 redirect di level edge Vercel
        if (str_contains($frontendBase, 'ruangbahagia.web.id') && !str_contains($frontendBase, 'www.ruangbahagia.web.id')) {
            $frontendBase = str_replace('ruangbahagia.web.id', 'www.ruangbahagia.web.id', $frontendBase);
        }

        $targetPath = !empty($state['redirect_to']) ? $state['redirect_to'] : '/proofing';
        $sep = str_contains($targetPath, '?') ? '&' : '?';

        // Helper untuk membuat authParams agar fotografer TIDAK PERNAH ter-logout
        $buildAuthParams = function () use ($state) {
            if (empty($state['user_id'])) return '';
            $user = \App\Models\User::find((int) $state['user_id']);
            if (!$user) return '';
            $sanctumToken = $user->createToken('auth-token')->plainTextToken;
            return '&auth_token=' . urlencode($sanctumToken) . '&user=' . urlencode(json_encode([
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'username'    => $user->username,
                'brand_name'  => $user->brand_name,
                'avatar_path' => $user->avatar_path,
                'is_pro'      => $user->is_pro,
            ]));
        };

        // Tangani error dari Google (misal user membatalkan consent)
        if ($request->has('error')) {
            return redirect($frontendBase . $targetPath . $sep . 'gdrive=error&reason=' . urlencode($request->query('error')) . $buildAuthParams());
        }

        $code = $request->query('code');

        if (!$code || empty($state['user_id'])) {
            return redirect($frontendBase . $targetPath . $sep . 'gdrive=error&reason=invalid_state' . $buildAuthParams());
        }

        $effectiveRedirect = !empty($state['frontend_origin']) && !str_contains($state['frontend_origin'], 'localhost') && !str_contains($state['frontend_origin'], '127.0.0.1')
            ? rtrim(str_replace('://www.', '://', $state['frontend_origin']), '/') . '/api/gdrive/callback'
            : config('services.google.redirect');

        try {
            $this->drive->exchangeCodeForToken((int) $state['user_id'], $code, $effectiveRedirect);

            return redirect($frontendBase . $targetPath . $sep . 'gdrive=success' . $buildAuthParams());
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('GDrive callback error: ' . $e->getMessage());
            return redirect($frontendBase . $targetPath . $sep . 'gdrive=error&reason=token_exchange_failed' . $buildAuthParams());
        }
    }

    /**
     * GET /api/gdrive/folders
     * Daftar folder di Google Drive fotografer
     */
    public function folders(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        if (!$this->drive->isConnected($userId)) {
            return response()->json(['message' => 'Google Drive belum terhubung.'], 400);
        }

        try {
            $folders = $this->drive->listFolders($userId);
            return response()->json([
                'data'    => $folders,
                'message' => 'Daftar folder berhasil dimuat.',
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Gagal mengambil daftar folder: ' . $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/gdrive/disconnect
     * Hapus token Google Drive fotografer dari database
     */
    public function disconnect(Request $request): JsonResponse
    {
        $this->drive->disconnect($request->user()->id);

        return response()->json(['message' => 'Google Drive berhasil diputus.']);
    }
}
