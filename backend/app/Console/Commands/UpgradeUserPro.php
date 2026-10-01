<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * Artisan command: upgrade user ke Pro.
 * Jalankan: php artisan user:upgrade-pro yuliagusmy@gmail.com
 */
class UpgradeUserPro extends Command
{
    protected $signature = 'user:upgrade-pro {email : Email atau username fotografer}';
    protected $description = 'Upgrade akun fotografer ke Pro (10 tahun)';

    public function handle(): int
    {
        $input = $this->argument('email');

        // Cari berdasarkan email atau username
        $user = User::where('email', $input)
            ->orWhere('email', 'like', "%{$input}%")
            ->orWhere('username', $input)
            ->first();

        if (!$user) {
            $this->error("User tidak ditemukan: {$input}");
            return self::FAILURE;
        }

        $user->update([
            'subscription_tier'       => 'pro',
            'subscription_status'     => 'active',
            'subscription_expires_at' => now()->addYears(10),
        ]);

        $this->info("✓ Berhasil upgrade ke Pro:");
        $this->line("  Nama     : {$user->name}");
        $this->line("  Email    : {$user->email}");
        $this->line("  Username : @{$user->username}");
        $this->line("  Expires  : " . $user->subscription_expires_at->format('d M Y'));

        return self::SUCCESS;
    }
}
