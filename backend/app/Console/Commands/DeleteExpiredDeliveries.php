<?php

namespace App\Console\Commands;

use App\Models\Delivery;
use App\Services\GoogleDriveService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Hapus folder delivery final dari Google Drive setelah 14 hari (melewati expires_at).
 * Jadwal: Harian pukul 02:00
 */
class DeleteExpiredDeliveries extends Command
{
    protected $signature   = 'ruangbahagia:delete-expired-deliveries';
    protected $description = 'Hapus folder delivery final dari Google Drive setelah melewati expires_at (14 hari).';

    public function __construct(private GoogleDriveService $drive)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        // Cari delivery yang sudah melewati expires_at, masih punya folder GDrive, dan belum dihapus
        $deliveries = Delivery::whereNotNull('gdrive_folder_id')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->whereNull('deleted_at_gdrive')
            ->whereNotIn('status', ['deleted'])
            ->get();

        if ($deliveries->isEmpty()) {
            $this->info('Tidak ada delivery kadaluarsa yang perlu dihapus.');
            return Command::SUCCESS;
        }

        $deleted = 0;
        foreach ($deliveries as $delivery) {
            try {
                // Ambil user_id langsung dari delivery (tersimpan di tabel)
                $userId = $delivery->user_id;

                if (!$userId) {
                    $this->warn("Delivery #{$delivery->id}: user_id tidak ditemukan, skip.");
                    continue;
                }

                // Hapus folder dari Google Drive
                $this->drive->deleteFile($userId, $delivery->gdrive_folder_id);

                // Update record — tandai sudah dihapus
                $delivery->update([
                    'gdrive_folder_id'  => null,
                    'download_link'     => null,
                    'status'            => 'deleted',
                    'deleted_at_gdrive' => now(),
                ]);

                $deleted++;
                $this->line("Delivery #{$delivery->id} berhasil dihapus dari Drive.");
            } catch (\Throwable $e) {
                Log::error("DeleteExpiredDeliveries gagal untuk delivery #{$delivery->id}: " . $e->getMessage());
                $this->error("Delivery #{$delivery->id} gagal: " . $e->getMessage());
            }
        }

        $this->info("Selesai. {$deleted} dari {$deliveries->count()} delivery dihapus.");
        return Command::SUCCESS;
    }
}
