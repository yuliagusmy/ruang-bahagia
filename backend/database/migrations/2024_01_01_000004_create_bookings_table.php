<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_code')->unique();        // kode unik: RB-2024-001
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('package_id')->constrained()->cascadeOnDelete();
            $table->foreignId('schedule_id')->nullable()->constrained()->nullOnDelete();
            $table->date('event_date');
            $table->time('event_time');
            $table->string('event_location')->nullable();
            $table->string('event_type')->nullable();        // wedding, maternity, wisuda, dll
            $table->decimal('total_price', 12, 2);
            $table->decimal('dp_amount', 12, 2);
            $table->decimal('remaining_amount', 12, 2);
            $table->enum('status', [
                'pending',    // menunggu konfirmasi fotografer
                'confirmed',  // dikonfirmasi, menunggu DP
                'dp_paid',    // DP dibayar, jadwal terkunci
                'in_progress',// hari H / sedang shooting
                'editing',    // proses editing
                'proofing',   // klien sedang seleksi foto
                'completed',  // selesai semua
                'cancelled',  // dibatalkan
            ])->default('pending');
            $table->text('special_requests')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
