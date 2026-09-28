<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('google_drive_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('access_token');                    // token akses saat ini
            $table->text('refresh_token');                   // token untuk refresh otomatis
            $table->string('token_type')->default('Bearer');
            $table->timestamp('expires_at');                 // waktu kedaluwarsa access_token
            $table->string('scope')->nullable();             // scope yang di-grant (drive, drive.file, dll)
            $table->string('gdrive_email')->nullable();      // email Google akun fotografer
            $table->timestamps();

            $table->unique('user_id');                       // satu fotografer = satu koneksi GDrive
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('google_drive_tokens');
    }
};
