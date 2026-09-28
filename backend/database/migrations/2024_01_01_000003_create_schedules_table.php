<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->enum('status', [
                'available', // slot terbuka, bisa dibooking
                'blocked',   // fotografer blokir manual (misal: libur)
                'booked',    // terkunci karena DP sudah dibayar
            ])->default('available');
            $table->string('location')->nullable();          // lokasi sesi foto
            $table->text('notes')->nullable();
            $table->timestamps();

            // mencegah overlap slot
            $table->unique(['user_id', 'date', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
