<?php

namespace App\Console\Commands;

use App\Models\GoogleDriveToken;
use App\Services\GoogleDriveService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Refresh access_token Google Drive sebelum kadaluarsa (1 jam).
 * Jadwal: Setiap 50 menit (agar tidak sempat expired)
 */
class RefreshGDriveTokens extends Command
{
    protected $signature   = 'ruangbahagia:refresh-gdrive-tokens';
    protected $description = 'Perbarui access_token Google Drive yang akan segera kadaluarsa.';

    public function __construct(private GoogleDriveService $drive)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        // Token yang akan expired dalam 10 menit ke depan
        $expiringSoon = GoogleDriveToken::where('expires_at', '<', now()->addMinutes(10))
            ->whereNotNull('refresh_token')
            ->get();

        if ($expiringSoon->isEmpty()) {
            $this->info('Tidak ada token yang perlu di-refresh.');
            return Command::SUCCESS;
        }

        $refreshed = 0;
        foreach ($expiringSoon as $token) {
            try {
                $this->drive->refreshToken($token);
                $refreshed++;
                $this->line("Token user_id #{$token->user_id} berhasil di-refresh.");
            } catch (\Throwable $e) {
                Log::error("RefreshGDriveTokens gagal untuk user #{$token->user_id}: " . $e->getMessage());
                $this->error("User #{$token->user_id} gagal refresh: " . $e->getMessage());
            }
        }

        $this->info("Selesai. {$refreshed} token di-refresh.");
        return Command::SUCCESS;
    }
}
