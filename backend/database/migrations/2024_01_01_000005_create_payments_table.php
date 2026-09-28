<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();      // INV-2024-001
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['dp', 'installment', 'full', 'refund']);
            $table->decimal('amount', 12, 2);
            $table->enum('method', [
                'transfer_bank',
                'qris',
                'tunai',
                'e_wallet',   // GoPay, OVO, Dana, dll
            ])->nullable();
            $table->enum('status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
            $table->string('proof_image_path')->nullable();  // bukti transfer
            $table->string('transaction_id')->nullable();    // ID dari payment gateway jika ada
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
