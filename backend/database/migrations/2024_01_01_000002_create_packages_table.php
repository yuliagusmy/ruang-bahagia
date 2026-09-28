<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');                          // contoh: "Paket Silver", "Paket Wedding"
            $table->text('description')->nullable();
            $table->unsignedInteger('duration_hours');       // durasi sesi foto (jam)
            $table->unsignedInteger('photo_quota');          // jumlah foto final yang diterima klien
            $table->unsignedInteger('selection_quota');      // jumlah foto yang bisa diseleksi klien
            $table->unsignedInteger('revision_count')->default(1);
            $table->decimal('price', 12, 2);
            $table->decimal('dp_amount', 12, 2);             // nominal DP minimum
            $table->boolean('is_active')->default(true);
            $table->json('inclusions')->nullable();          // array string, misal ["cetak 4R", "softcopy"]
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
