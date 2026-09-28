<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('subscription_tier', 20)->default('free')->after('city');
            $table->string('subscription_status', 20)->default('active')->after('subscription_tier');
            $table->timestamp('subscription_expires_at')->nullable()->after('subscription_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['subscription_tier', 'subscription_status', 'subscription_expires_at']);
        });
    }
};
