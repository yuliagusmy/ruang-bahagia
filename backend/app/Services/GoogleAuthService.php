<?php

namespace App\Services;

use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GoogleAuthService
{
    private Client $http;
    private string $clientId;
    private string $clientSecret;
    private string $redirectUri;

    private const AUTH_URL     = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const TOKEN_URL    = 'https://oauth2.googleapis.com/token';
    private const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
    private const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

    public function __construct()
    {
        $this->http         = new Client(['timeout' => 20]);
        $this->clientId     = config('services.google.client_id', '');
        $this->clientSecret = config('services.google.client_secret', '');
        $this->redirectUri  = config('services.google.auth_redirect') 
            ?: (config('app.url') . '/api/auth/google/callback');
    }

    /**
     * URL consent Google OAuth untuk fotografer
     */
    public function getAuthorizationUrl(string $mode = 'login'): string
    {
        $params = [
            'client_id'             => $this->clientId,
            'redirect_uri'          => $this->redirectUri,
            'response_type'         => 'code',
            'scope'                 => 'openid email profile',
            'access_type'           => 'online',
            'prompt'                => 'select_account',
            'state'                 => base64_encode(json_encode([
                'mode'      => $mode,
                'timestamp' => time(),
            ])),
        ];

        return self::AUTH_URL . '?' . http_build_query($params);
    }

    /**
     * Tukar code OAuth dari Google dengan data profil & Sanctum token
     */
    public function handleCallback(string $code): array
    {
        $res = $this->http->post(self::TOKEN_URL, [
            'form_params' => [
                'code'          => $code,
                'client_id'     => $this->clientId,
                'client_secret' => $this->clientSecret,
                'redirect_uri'  => $this->redirectUri,
                'grant_type'    => 'authorization_code',
            ],
        ]);

        $tokenData = json_decode($res->getBody(), true);
        $accessToken = $tokenData['access_token'] ?? null;

        if (!$accessToken) {
            throw new \RuntimeException('Gagal memperoleh access token dari Google.');
        }

        // Ambil profil fotografer dari Google
        $userRes = $this->http->get(self::USERINFO_URL, [
            'headers' => ['Authorization' => 'Bearer ' . $accessToken],
        ]);

        $googleProfile = json_decode($userRes->getBody(), true);

        return $this->authenticateOrRegisterUser($googleProfile);
    }

    /**
     * Autentikasi menggunakan ID Token (Google One Tap / Google Identity Services)
     */
    public function handleIdToken(string $idToken): array
    {
        $res = $this->http->get(self::TOKENINFO_URL, [
            'query' => ['id_token' => $idToken],
        ]);

        $payload = json_decode($res->getBody(), true);

        if (empty($payload['email']) || empty($payload['sub'])) {
            throw new \RuntimeException('ID Token Google tidak valid.');
        }

        $googleProfile = [
            'id'      => $payload['sub'],
            'email'   => $payload['email'],
            'name'    => $payload['name'] ?? explode('@', $payload['email'])[0],
            'picture' => $payload['picture'] ?? null,
        ];

        return $this->authenticateOrRegisterUser($googleProfile);
    }

    /**
     * Cari fotografer berdasarkan Google ID atau Email. Jika belum ada, daftarkan otomatis.
     */
    private function authenticateOrRegisterUser(array $profile): array
    {
        $googleId = $profile['id'] ?? null;
        $email    = strtolower(trim($profile['email'] ?? ''));
        $name     = trim($profile['name'] ?? 'Fotografer');
        $picture  = $profile['picture'] ?? null;

        if (empty($email)) {
            throw new \RuntimeException('Email akun Google tidak ditemukan.');
        }

        // 1. Cek apakah sudah ada akun berdasarkan google_id
        $user = null;
        if ($googleId) {
            $user = User::where('google_id', $googleId)->first();
        }

        // 2. Jika tidak ketemu, cari berdasarkan email
        if (!$user) {
            $user = User::where('email', $email)->first();
            if ($user) {
                // Link Google ID ke akun yang sudah terdaftar
                $user->google_id = $googleId;
                if (!$user->avatar_path && $picture) {
                    $user->avatar_path = $picture;
                }
                if (!$user->email_verified_at) {
                    $user->email_verified_at = now();
                }
                $user->save();
            }
        }

        // 3. Jika belum terdaftar, buat akun fotografer baru
        if (!$user) {
            $username = $this->generateUniqueUsername($email, $name);

            $user = User::create([
                'name'              => $name,
                'brand_name'        => $name . ' Photography',
                'username'          => $username,
                'email'             => $email,
                'google_id'         => $googleId,
                'email_verified_at' => now(),
                'password'          => Hash::make(Str::random(32)),
                'avatar_path'       => $picture,
                'subscription_tier' => 'free',
            ]);

            Log::info("Akun fotografer baru didaftarkan lewat Google: @{$username} ({$email})");
        }

        // Buat Sanctum token
        $token = $user->createToken('fotografer-device')->plainTextToken;

        return [
            'token' => $token,
            'user'  => array_merge($user->only([
                'id', 'name', 'brand_name', 'username', 'email',
                'phone', 'avatar_path', 'city',
                'subscription_tier', 'subscription_status', 'subscription_expires_at',
            ]), ['is_pro' => $user->isPro()]),
        ];
    }

    /**
     * Buat handle username unik dari email atau nama
     */
    private function generateUniqueUsername(string $email, string $name): string
    {
        // Ambil prefix email atau nama
        $raw = explode('@', $email)[0];
        $base = strtolower(preg_replace('/[^a-z0-9_]/', '', str_replace(['.', '-', ' '], '_', $raw)));

        if (strlen($base) < 3) {
            $base = strtolower(preg_replace('/[^a-z0-9_]/', '', str_replace(' ', '_', $name)));
        }

        if (strlen($base) < 3) {
            $base = 'fotografer_' . Str::random(4);
        }

        // Potong max 35 karakter agar ada ruang untuk angka
        $base = substr($base, 0, 35);
        $candidate = $base;
        $counter = 1;

        while (User::where('username', $candidate)->exists()) {
            $candidate = $base . $counter;
            $counter++;
        }

        return $candidate;
    }
}
