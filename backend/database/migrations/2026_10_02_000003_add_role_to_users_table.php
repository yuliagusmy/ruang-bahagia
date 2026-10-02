<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 30)->default('photographer')->after('password');
        });

        // Set user id 1 dan user fotografer pertama sebagai admin untuk akses awal
        DB::table('users')->where('id', 1)->update(['role' => 'admin']);
        // Jika user id 2 ada dan id 1 tidak ada atau sebaliknya, pastikan ada yang berstatus admin
        $firstUser = DB::table('users')->first();
        if ($firstUser) {
            DB::table('users')->where('id', $firstUser->id)->update(['role' => 'admin']);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
