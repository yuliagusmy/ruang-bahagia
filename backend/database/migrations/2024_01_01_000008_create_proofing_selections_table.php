<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proofing_selections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proofing_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('proofing_photo_id')->constrained()->cascadeOnDelete();
            $table->enum('action', ['selected', 'skipped']); // swipe kanan = selected, swipe kiri = skipped
            $table->timestamp('selected_at');
            $table->timestamps();

            // satu foto hanya bisa di-swipe satu kali per sesi
            $table->unique(['proofing_session_id', 'proofing_photo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proofing_selections');
    }
};
