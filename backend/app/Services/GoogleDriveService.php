<?php

namespace App\Services;

use App\Models\GoogleDriveToken;
use App\Models\User;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class GoogleDriveService
{
    private Client $http;

    private string $clientId;
    private string $clientSecret;
    private string $redirectUri;

    private const AUTH_URL  = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private const API_BASE  = 'https://www.googleapis.com/drive/v3';
    private const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

    public function __construct()
    {
        $this->http         = new Client(['timeout' => 30]);
        $this->clientId     = config('services.google.client_id');
        $this->clientSecret = config('services.google.client_secret');
        $this->redirectUri  = config('services.google.redirect');
    }

    // ── OAuth ─────────────────────────────────────────────────────────────────

    /**
     * Generate URL untuk redirect fotografer ke halaman consent Google
     */
    public function getAuthorizationUrl(int $userId, ?string $redirectTo = null, ?string $frontendOrigin = null): string
    {
        $statePayload = ['user_id' => $userId];
        if (!empty($redirectTo)) {
            $statePayload['redirect_to'] = $redirectTo;
        }
        if (!empty($frontendOrigin)) {
            $statePayload['frontend_origin'] = $frontendOrigin;
        }

        // Gunakan redirect_uri domain publik jika request berasal dari domain publik
        $effectiveRedirect = $this->redirectUri;
        if (!empty($frontendOrigin) && !str_contains($frontendOrigin, 'localhost') && !str_contains($frontendOrigin, '127.0.0.1')) {
            $effectiveRedirect = rtrim($frontendOrigin, '/') . '/api/gdrive/callback';
        }

        $params = [
            'client_id'             => $this->clientId,
            'redirect_uri'          => $effectiveRedirect,
            'response_type'         => 'code',
            'scope'                 => 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email openid',
            'access_type'           => 'offline',
            'prompt'                => 'consent',   // paksa muncul refresh_token
            'state'                 => base64_encode(json_encode($statePayload)),
        ];

        return self::AUTH_URL . '?' . http_build_query($params);
    }

    /**
     * Tukar authorization code dengan access_token + refresh_token,
     * lalu simpan ke tabel google_drive_tokens
     */
    public function exchangeCodeForToken(int $userId, string $code, ?string $redirectUri = null): GoogleDriveToken
    {
        $res = $this->http->post(self::TOKEN_URL, [
            'form_params' => [
                'code'          => $code,
                'client_id'     => $this->clientId,
                'client_secret' => $this->clientSecret,
                'redirect_uri'  => $redirectUri ?: $this->redirectUri,
                'grant_type'    => 'authorization_code',
            ],
        ]);

        $data = json_decode($res->getBody(), true);

        // Ambil email akun Google yang dihubungkan
        $gdEmail = $this->getGoogleEmail($data['access_token']);

        return GoogleDriveToken::updateOrCreate(
            ['user_id' => $userId],
            [
                'access_token'  => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'token_type'    => $data['token_type'] ?? 'Bearer',
                'expires_at'    => now()->addSeconds($data['expires_in'] - 60),
                'scope'         => $data['scope'] ?? null,
                'gdrive_email'  => $gdEmail,
            ]
        );
    }

    /**
     * Refresh access_token menggunakan refresh_token yang tersimpan.
     * Dipanggil oleh Cron Job setiap 50 menit.
     */
    public function refreshToken(GoogleDriveToken $tokenRecord): GoogleDriveToken
    {
        $res = $this->http->post(self::TOKEN_URL, [
            'form_params' => [
                'client_id'     => $this->clientId,
                'client_secret' => $this->clientSecret,
                'refresh_token' => $tokenRecord->refresh_token,
                'grant_type'    => 'refresh_token',
            ],
        ]);

        $data = json_decode($res->getBody(), true);

        $tokenRecord->update([
            'access_token' => $data['access_token'],
            'expires_at'   => now()->addSeconds($data['expires_in'] - 60),
        ]);

        return $tokenRecord->fresh();
    }

    // ── Drive Operations ──────────────────────────────────────────────────────

    /**
     * Ambil (atau buat) folder Drive untuk user dengan path:
     * Ruang Bahagia / {label}
     */
    public function getOrCreateFolder(int $userId, string $label, ?string $parentId = null): string
    {
        $token = $this->getValidToken($userId);

        // Cari folder dengan nama ini di Drive user
        $q = "name='{$label}' and mimeType='application/vnd.google-apps.folder' and trashed=false";
        if ($parentId) {
            $q .= " and '{$parentId}' in parents";
        }

        $res = $this->http->get(self::API_BASE . '/files', [
            'headers' => ['Authorization' => 'Bearer ' . $token],
            'query'   => ['q' => $q, 'fields' => 'files(id,name)', 'spaces' => 'drive'],
        ]);

        $files = json_decode($res->getBody(), true)['files'] ?? [];

        if (!empty($files)) {
            return $files[0]['id'];
        }

        // Buat folder baru
        $body = ['name' => $label, 'mimeType' => 'application/vnd.google-apps.folder'];
        if ($parentId) {
            $body['parents'] = [$parentId];
        }

        $res = $this->http->post(self::API_BASE . '/files', [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type'  => 'application/json',
            ],
            'body' => json_encode($body),
        ]);

        return json_decode($res->getBody(), true)['id'];
    }

    /**
     * Ekstrak folder ID dari berbagai format URL atau string ID Google Drive
     */
    public function extractFolderId(string $input): ?string
    {
        $input = trim($input);
        if (preg_match('/folders\/([a-zA-Z0-9_-]+)/', $input, $matches)) {
            return $matches[1];
        }
        if (preg_match('/[?&]id=([a-zA-Z0-9_-]+)/', $input, $matches)) {
            return $matches[1];
        }
        if (preg_match('/^([a-zA-Z0-9_-]{15,})$/', $input, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Ambil daftar file gambar di folder Google Drive untuk sesi proofing.
     */
    public function listImagesInFolder(int $userId, string $folderId): array
    {
        $token = $this->getValidToken($userId);

        $q = "'{$folderId}' in parents and trashed=false";
        $res = $this->http->get(self::API_BASE . '/files', [
            'headers' => ['Authorization' => 'Bearer ' . $token],
            'query'   => [
                'q'                         => $q,
                'fields'                    => 'files(id,name,mimeType,thumbnailLink,webContentLink,size)',
                'pageSize'                  => 500,
                'orderBy'                   => 'name',
                'supportsAllDrives'         => 'true',
                'includeItemsFromAllDrives' => 'true',
            ],
        ]);

        $files = json_decode($res->getBody(), true)['files'] ?? [];
        $images = [];

        foreach ($files as $file) {
            $name = $file['name'];
            $mime = $file['mimeType'] ?? '';
            $isImage = str_starts_with($mime, 'image/') || (bool) preg_match('/\.(jpe?g|png|webp|cr2|cr3|arw|nef|dng|raw|heic)$/i', $name);

            if ($isImage) {
                // Buat link preview resolusi baik
                $previewUrl = !empty($file['thumbnailLink']) 
                    ? preg_replace('/=s\d+/', '=w1200', $file['thumbnailLink'])
                    : "https://lh3.googleusercontent.com/d/{$file['id']}=w1200";

                $images[] = [
                    'id'                => $file['id'],
                    'original_filename' => $name,
                    'display_filename'  => $name,
                    'lowres_path'       => $previewUrl,
                    'thumbnail_url'     => $previewUrl,
                    'mime_type'         => $mime,
                ];
            }
        }

        return $images;
    }

    /**
     * Ambil daftar folder Google Drive fotografer
     */
    public function listFolders(int $userId): array
    {
        $token = $this->getValidToken($userId);

        $q = "mimeType='application/vnd.google-apps.folder' and trashed=false";
        $res = $this->http->get(self::API_BASE . '/files', [
            'headers' => ['Authorization' => 'Bearer ' . $token],
            'query'   => [
                'q'                         => $q,
                'fields'                    => 'files(id,name,createdTime,modifiedTime)',
                'pageSize'                  => 50,
                'orderBy'                   => 'modifiedTime desc',
                'supportsAllDrives'         => 'true',
                'includeItemsFromAllDrives' => 'true',
            ],
        ]);

        return json_decode($res->getBody(), true)['files'] ?? [];
    }

    /**
     * Upload file ke folder Drive.
     * Mengembalikan file ID Google Drive.
     */
    public function uploadFile(int $userId, string $filePath, string $fileName, string $folderId, string $mimeType = 'application/octet-stream'): string
    {
        $token = $this->getValidToken($userId);

        $metadata = json_encode([
            'name'    => $fileName,
            'parents' => [$folderId],
        ]);

        $res = $this->http->post(self::UPLOAD_URL . '?uploadType=multipart&fields=id', [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type'  => 'multipart/related; boundary=boundary123',
            ],
            'body' => implode("\r\n", [
                '--boundary123',
                'Content-Type: application/json; charset=UTF-8',
                '',
                $metadata,
                '--boundary123',
                "Content-Type: {$mimeType}",
                '',
                file_get_contents($filePath),
                '--boundary123--',
            ]),
        ]);

        return json_decode($res->getBody(), true)['id'];
    }

    /**
     * Buat share link (anyone with link can view) dan kembalikan URL-nya.
     */
    public function makeShareableLink(int $userId, string $fileId): string
    {
        $token = $this->getValidToken($userId);

        // Set permission
        $this->http->post(self::API_BASE . "/files/{$fileId}/permissions", [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type'  => 'application/json',
            ],
            'body' => json_encode(['role' => 'reader', 'type' => 'anyone']),
        ]);

        return "https://drive.google.com/file/d/{$fileId}/view";
    }

    /**
     * Hapus file dari Drive (untuk cron job cleanup delivery).
     */
    public function deleteFile(int $userId, string $fileId): void
    {
        try {
            $token = $this->getValidToken($userId);

            $this->http->delete(self::API_BASE . "/files/{$fileId}", [
                'headers' => ['Authorization' => 'Bearer ' . $token],
            ]);
        } catch (GuzzleException $e) {
            Log::warning("GDrive delete gagal untuk file {$fileId}: " . $e->getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Kembalikan access token yang valid.
     * Auto-refresh jika sudah kadaluarsa.
     */
    public function getValidToken(int $userId): string
    {
        $record = GoogleDriveToken::where('user_id', $userId)->firstOrFail();

        if ($record->isExpired()) {
            $record = $this->refreshToken($record);
        }

        return $record->access_token;
    }

    /**
     * Cek apakah fotografer sudah menghubungkan akun Google Drive.
     */
    public function isConnected(int $userId): bool
    {
        return GoogleDriveToken::where('user_id', $userId)->exists();
    }

    /**
     * Disconnect Google Drive — hapus token dari database.
     */
    public function disconnect(int $userId): void
    {
        GoogleDriveToken::where('user_id', $userId)->delete();
    }

    private function getGoogleEmail(string $accessToken): string
    {
        try {
            $res = $this->http->get('https://www.googleapis.com/oauth2/v2/userinfo', [
                'headers' => ['Authorization' => 'Bearer ' . $accessToken],
            ]);
            return json_decode($res->getBody(), true)['email'] ?? '';
        } catch (\Throwable) {
            return '';
        }
    }
}
