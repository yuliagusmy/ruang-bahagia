<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proofing_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proofing_session_id')->constrained()->cascadeOnDelete();
            $table->string('original_filename');             // nama file asli, misal: IMG_001.CR2
            $table->string('display_filename');              // nama tampilan untuk Lightroom export
            $table->string('lowres_path');                   // path file low-res + watermark (Google Drive)
            $table->string('gdrive_file_id')->nullable();    // ID file di Google Drive
            $table->unsignedInteger('sort_order')->default(0);
            $table->enum('status', [
                'processing', // sedang diproses (resize + watermark)
                'ready',      // siap tampil ke klien
                'failed',     // gagal proses
            ])->default('processing');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proofing_photos');
    }
};
