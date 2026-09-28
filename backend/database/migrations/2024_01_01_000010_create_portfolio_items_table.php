<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('portfolio_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->nullable();          // wedding, prewedding, portrait, dll
            $table->string('thumbnail_path');                // path gambar thumbnail
            $table->string('gdrive_file_id')->nullable();    // referensi file di GDrive
            $table->boolean('is_featured')->default(false);  // tampil di hero galeri
            $table->boolean('is_visible')->default(true);    // tampil/sembunyikan dari publik
            $table->unsignedInteger('sort_order')->default(0);
            $table->date('taken_at')->nullable();             // tanggal pemotretan
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portfolio_items');
    }
};
