<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_id', 64)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('plan', 20); // 'monthly' | 'yearly'
            $table->decimal('amount', 12, 2);
            $table->string('status', 30)->default('pending'); // 'pending', 'settlement', 'expire', 'cancel', 'failed'
            $table->string('snap_token')->nullable();
            $table->text('snap_redirect_url')->nullable();
            $table->string('payment_type', 40)->nullable(); // 'qris', 'bank_transfer', 'gopay', etc.
            $table->json('payment_details')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_orders');
    }
};
