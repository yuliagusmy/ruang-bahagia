<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('proofing_sessions')) {
            Schema::table('proofing_sessions', function (Blueprint $table) {
                if (!Schema::hasColumn('proofing_sessions', 'title')) {
                    $table->string('title')->nullable()->after('user_id');
                }
                if (!Schema::hasColumn('proofing_sessions', 'client_name')) {
                    $table->string('client_name')->nullable()->after('title');
                }
                if (!Schema::hasColumn('proofing_sessions', 'client_phone')) {
                    $table->string('client_phone')->nullable()->after('client_name');
                }
                if (!Schema::hasColumn('proofing_sessions', 'client_email')) {
                    $table->string('client_email')->nullable()->after('client_phone');
                }
                if (!Schema::hasColumn('proofing_sessions', 'gdrive_folder_url')) {
                    $table->text('gdrive_folder_url')->nullable()->after('client_email');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('proofing_sessions')) {
            Schema::table('proofing_sessions', function (Blueprint $table) {
                $columns = ['title', 'client_name', 'client_phone', 'client_email', 'gdrive_folder_url'];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('proofing_sessions', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
