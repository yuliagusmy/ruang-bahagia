<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendBookingReminders extends Command
{
    protected $signature   = 'ruangbahagia:send-h1-reminders';
    protected $description = 'Kirim notifikasi pengingat WhatsApp H-1 secara otomatis kepada klien sesi pemotretan esok hari.';

    public function __construct(private WhatsAppService $whatsapp)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $tomorrow = now()->addDay()->toDateString();

        $bookings = Booking::with(['user', 'client', 'package'])
            ->whereDate('event_date', $tomorrow)
            ->whereIn('status', ['confirmed', 'dp_paid'])
            ->whereNull('h1_reminder_sent_at')
            ->get();

        if ($bookings->isEmpty()) {
            $this->info("Tidak ada jadwal booking untuk tanggal {$tomorrow} yang membutuhkan reminder H-1.");
            return Command::SUCCESS;
        }

        $sentCount = 0;
        foreach ($bookings as $booking) {
            $clientName = $booking->client?->name ?? 'Klien';
            $photographer = $booking->user;

            if (!$photographer) {
                continue;
            }

            $notifSettings = $photographer->notification_settings ?? [];
            if (isset($notifSettings['wa_auto_h1_reminder']) && !$notifSettings['wa_auto_h1_reminder']) {
                $this->line("Fotografer {$photographer->name} menonaktifkan auto reminder H-1. Skip booking #{$booking->booking_code}.");
                continue;
            }

            $this->line("Mengirim pengingat H-1 ke {$clientName} (#{$booking->booking_code})...");
            $result = $this->whatsapp->sendH1Reminder($booking);

            if ($result['success'] ?? false) {
                $booking->update(['h1_reminder_sent_at' => now()]);
                $sentCount++;
                $this->info("✓ Berhasil dikirim ke {$clientName} ({$result['mode']}).");
            } else {
                $this->warn("✗ Gagal mengirim ke {$clientName}: " . ($result['message'] ?? 'Error tidak diketahui'));
            }
        }

        $this->info("Selesai. Total {$sentCount} dari {$bookings->count()} pengingat H-1 berhasil diproses.");
        return Command::SUCCESS;
    }
}
