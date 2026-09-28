<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('gdrive_folder_id')->nullable();  // folder GDrive untuk high-res files
            $table->string('download_link')->nullable();     // link download untuk klien
            $table->string('download_pin', 6)->nullable();   // PIN untuk akses download
            $table->unsignedInteger('file_count')->default(0);
            $table->enum('status', [
                'preparing',  // fotografer sedang upload
                'ready',      // siap diunduh klien
                'downloaded', // sudah diunduh
                'deleted',    // file sudah dihapus otomatis (cron job)
            ])->default('preparing');
            $table->timestamp('available_at')->nullable();   // kapan link aktif
            $table->timestamp('expires_at')->nullable();     // auto-delete setelah 14 hari
            $table->timestamp('deleted_at_gdrive')->nullable(); // timestamp saat file dihapus dari GDrive
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
