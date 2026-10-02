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
        // 1. Lengkapi tabel booking_expenses (sebelumnya stub kosong)
        if (Schema::hasTable('booking_expenses')) {
            Schema::table('booking_expenses', function (Blueprint $table) {
                if (!Schema::hasColumn('booking_expenses', 'booking_id')) {
                    $table->foreignId('booking_id')->nullable()->constrained('bookings')->cascadeOnDelete();
                }
                if (!Schema::hasColumn('booking_expenses', 'user_id')) {
                    $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
                }
                if (!Schema::hasColumn('booking_expenses', 'category')) {
                    $table->string('category', 50)->default('other'); // studio_rental, assistant_fee, transport, printing, props, other
                }
                if (!Schema::hasColumn('booking_expenses', 'title')) {
                    $table->string('title')->default('Pengeluaran Proyek');
                }
                if (!Schema::hasColumn('booking_expenses', 'amount')) {
                    $table->decimal('amount', 12, 2)->default(0);
                }
                if (!Schema::hasColumn('booking_expenses', 'expense_date')) {
                    $table->date('expense_date')->nullable();
                }
                if (!Schema::hasColumn('booking_expenses', 'notes')) {
                    $table->text('notes')->nullable();
                }
            });
        }

        // 2. Tambah flag tracking h1_reminder_sent_at di tabel bookings
        if (Schema::hasTable('bookings') && !Schema::hasColumn('bookings', 'h1_reminder_sent_at')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->timestamp('h1_reminder_sent_at')->nullable()->after('special_requests');
            });
        }

        // 3. Tabel push_subscriptions untuk Web Push Notifications browser/PWA
        if (!Schema::hasTable('push_subscriptions')) {
            Schema::create('push_subscriptions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->text('endpoint');
                $table->text('p256dh')->nullable();
                $table->text('auth')->nullable();
                $table->string('user_agent')->nullable();
                $table->timestamps();

                $table->index(['user_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');

        if (Schema::hasTable('bookings') && Schema::hasColumn('bookings', 'h1_reminder_sent_at')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->dropColumn('h1_reminder_sent_at');
            });
        }

        if (Schema::hasTable('booking_expenses')) {
            Schema::table('booking_expenses', function (Blueprint $table) {
                $table->dropColumn(['booking_id', 'user_id', 'category', 'title', 'amount', 'expense_date', 'notes']);
            });
        }
    }
};
