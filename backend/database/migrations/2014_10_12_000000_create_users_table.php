<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');                              // nama asli fotografer
            $table->string('brand_name')->nullable();           // nama brand/studio
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('phone', 20)->nullable();
            $table->string('whatsapp', 20)->nullable();
            $table->string('instagram', 100)->nullable();
            $table->text('bio')->nullable();                    // deskripsi diri untuk halaman publik
            $table->string('avatar_path')->nullable();          // foto profil fotografer
            $table->string('watermark_path')->nullable();       // file watermark untuk proofing
            $table->string('city')->nullable();
            $table->json('notification_settings')->nullable();  // preferensi notifikasi (WA, email, in-app)
            $table->rememberToken();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('users');
    }
};
