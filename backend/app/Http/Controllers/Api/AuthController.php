<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\GoogleAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private GoogleAuthService $googleAuth) {}

    /**
     * GET /api/auth/google/url
     * Ambil URL consent Google OAuth
     */
    public function googleUrl(Request $request): JsonResponse
    {
        $mode = $request->query('mode', 'login');
        $url = $this->googleAuth->getAuthorizationUrl($mode);

        return response()->json([
            'data'    => ['url' => $url],
            'message' => 'Google authorization URL generated.',
        ]);
    }

    /**
     * GET /api/auth/google/redirect
     * Redirect browser langsung ke Google OAuth consent
     */
    public function googleRedirect(Request $request): RedirectResponse
    {
        $mode = $request->query('mode', 'login');
        return redirect()->away($this->googleAuth->getAuthorizationUrl($mode));
    }

    /**
     * GET /api/auth/google/callback
     * Dipanggil oleh Google setelah fotografer menyetujui izin
     */
    public function googleCallback(Request $request): RedirectResponse
    {
        $frontendBase = env('FRONTEND_URL', 'http://localhost:5173');

        if ($request->has('error')) {
            $reason = $request->query('error');
            return redirect($frontendBase . '/login?auth_error=' . urlencode($reason));
        }

        $code = $request->query('code');
        if (!$code) {
            return redirect($frontendBase . '/login?auth_error=missing_code');
        }

        try {
            $result = $this->googleAuth->handleCallback($code);
            $token  = $result['token'];

            return redirect($frontendBase . '/auth/callback?token=' . urlencode($token));
        } catch (\Throwable $e) {
            Log::error('Google OAuth callback failed: ' . $e->getMessage());
            return redirect($frontendBase . '/login?auth_error=' . urlencode($e->getMessage()));
        }
    }

    /**
     * POST /api/auth/google/one-tap
     * Autentikasi dengan ID Token (Google One Tap / GIS)
     */
    public function googleOneTap(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'credential' => 'nullable|string',
            'id_token'   => 'nullable|string',
        ]);

        $tokenString = $validated['credential'] ?? $validated['id_token'] ?? null;
        if (!$tokenString) {
            return response()->json(['message' => 'ID Token Google tidak ditemukan.'], 422);
        }

        try {
            $result = $this->googleAuth->handleIdToken($tokenString);
            return response()->json([
                'token'   => $result['token'],
                'user'    => $result['user'],
                'message' => 'Autentikasi Google berhasil.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Google One Tap failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Autentikasi Google gagal: ' . $e->getMessage(),
            ], 400);
        }
    }
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:100',
            'brand_name' => 'nullable|string|max:100',
            'username'   => 'required|string|max:40|unique:users,username|regex:/^[a-zA-Z0-9_\-]+$/',
            'email'      => 'required|email|max:150|unique:users,email',
            'password'   => 'required|string|min:6',
            'phone'      => 'nullable|string|max:25',
            'city'       => 'nullable|string|max:100',
        ], [
            'username.regex'  => 'Username hanya boleh berisi huruf, angka, garis bawah (_), atau strip (-).',
            'username.unique' => 'Username ini sudah digunakan oleh fotografer lain.',
            'email.unique'    => 'Email ini sudah terdaftar.',
            'password.min'    => 'Password minimal 6 karakter.',
        ]);

        $user = User::create([
            'name'       => $validated['name'],
            'brand_name' => $validated['brand_name'] ?: ($validated['name'] . ' Photography'),
            'username'   => strtolower($validated['username']),
            'email'      => strtolower($validated['email']),
            'password'   => Hash::make($validated['password']),
            'phone'      => $validated['phone'] ?? null,
            'whatsapp'   => $validated['phone'] ?? null,
            'city'       => $validated['city'] ?? null,
        ]);

        // Berikan starter paket layanan dan galeri portofolio awal
        app(\App\Services\StarterDataService::class)->seedStarterDataForPhotographer($user);

        $token = $user->createToken('fotografer-device')->plainTextToken;

        return response()->json([
            'token'   => $token,
            'user'    => array_merge($user->only([
                'id', 'name', 'brand_name', 'username', 'email',
                'phone', 'avatar_path', 'city',
                'subscription_tier', 'subscription_status', 'subscription_expires_at',
            ]), ['is_pro' => $user->isPro()]),
            'message' => 'Registrasi fotografer berhasil.',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        // Hapus token lama agar tidak menumpuk
        $user->tokens()->delete();

        $token = $user->createToken('fotografer-device')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => array_merge($user->only([
                'id', 'name', 'brand_name', 'username', 'email',
                'phone', 'avatar_path', 'city',
                'subscription_tier', 'subscription_status', 'subscription_expires_at',
            ]), ['is_pro' => $user->isPro()]),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout berhasil.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'sometimes|string|max:100',
            'brand_name' => 'sometimes|string|max:100',
            'username'   => 'sometimes|string|max:40|regex:/^[a-zA-Z0-9_\-]+$/|unique:users,username,' . $request->user()->id,
            'phone'      => 'sometimes|string|max:20',
            'whatsapp'   => 'sometimes|string|max:20',
            'instagram'  => 'sometimes|string|max:100',
            'bio'        => 'sometimes|string|max:1000',
            'city'       => 'sometimes|string|max:100',
            'avatar_path'=> 'nullable|string|max:500',
            'notification_settings' => 'sometimes|array',
        ]);

        $request->user()->update($data);

        return response()->json($request->user()->fresh());
    }
}
