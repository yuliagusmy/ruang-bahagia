<?php

namespace App\Console;

use App\Console\Commands\DeleteExpiredDeliveries;
use App\Console\Commands\ExpireProofingSessions;
use App\Console\Commands\RefreshGDriveTokens;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule)
    {
        // Hapus file delivery final dari Drive setelah 14 hari (02:00 WIB)
        $schedule->command(DeleteExpiredDeliveries::class)
            ->dailyAt('02:00')
            ->withoutOverlapping()
            ->runInBackground();

        // Tandai sesi proofing yang kadaluarsa (01:00 WIB)
        $schedule->command(ExpireProofingSessions::class)
            ->dailyAt('01:00')
            ->withoutOverlapping()
            ->runInBackground();

        // Refresh access_token GDrive setiap 50 menit
        $schedule->command(RefreshGDriveTokens::class)
            ->everyFiftyMinutes()
            ->withoutOverlapping()
            ->runInBackground();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
