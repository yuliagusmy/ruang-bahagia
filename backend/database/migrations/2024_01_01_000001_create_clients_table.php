<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // fotografer pemilik data
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('instagram', 100)->nullable();
            $table->enum('status', [
                'inquiry',    // baru tanya-tanya
                'dp_paid',    // DP sudah dibayar
                'shooting',   // sedang/sudah sesi foto
                'editing',    // sedang editing
                'proofing',   // sedang seleksi foto
                'completed',  // selesai, file dikirim
                'cancelled',  // dibatalkan
            ])->default('inquiry');
            $table->text('notes')->nullable(); // catatan fotografer
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
