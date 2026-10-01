<?php

namespace App\Console\Commands;

use App\Models\ProofingSession;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Tandai sesi proofing yang melewati tanggal kedaluwarsa sebagai 'expired'.
 * Jadwal: Harian pukul 01:00
 */
class ExpireProofingSessions extends Command
{
    protected $signature   = 'ruangbahagia:expire-proofing-sessions';
    protected $description = 'Tandai ProofingSession yang melewati expires_at sebagai expired.';

    public function handle(): int
    {
        $expired = ProofingSession::where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->get();

        if ($expired->isEmpty()) {
            $this->info('Tidak ada sesi proofing yang kadaluarsa.');
            return Command::SUCCESS;
        }

        $count = 0;
        foreach ($expired as $session) {
            try {
                $session->update(['status' => 'expired']);
                $count++;
                $this->line("ProofingSession #{$session->id} (slug: {$session->slug}) ditandai expired.");
            } catch (\Throwable $e) {
                Log::error("ExpireProofingSessions gagal untuk session #{$session->id}: " . $e->getMessage());
                $this->error("Session #{$session->id} gagal: " . $e->getMessage());
            }
        }

        $this->info("Selesai. {$count} sesi proofing ditandai expired.");
        return Command::SUCCESS;
    }
}
