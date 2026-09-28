<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proofing_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();  // fotografer
            $table->string('pin', 6);                        // PIN 6 digit untuk akses klien
            $table->string('slug')->unique();                // URL unik: ruang-bahagia.com/proof/abc123
            $table->unsignedInteger('total_photos');         // total foto yang diupload
            $table->unsignedInteger('selection_quota');      // kuota max pilihan klien (dari paket)
            $table->unsignedInteger('selected_count')->default(0);
            $table->enum('status', [
                'draft',      // sedang proses upload/watermark
                'active',     // klien bisa akses & seleksi
                'completed',  // klien sudah selesai seleksi
                'expired',    // kedaluwarsa
            ])->default('draft');
            $table->timestamp('expires_at')->nullable();     // batas waktu seleksi
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proofing_sessions');
    }
};
