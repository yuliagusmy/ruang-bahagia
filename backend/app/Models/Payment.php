<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number', 'booking_id', 'user_id', 'type',
        'amount', 'method', 'status', 'proof_image_path',
        'transaction_id', 'paid_at', 'notes',
    ];

    protected $casts = [
        'amount'  => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    protected static function booting(): void {
        static::creating(function (Payment $payment) {
            $payment->invoice_number ??= 'INV-' . date('Y') . '-' . str_pad(
                static::whereYear('created_at', date('Y'))->count() + 1,
                4, '0', STR_PAD_LEFT
            );
        });
    }

    public function booking() { return $this->belongsTo(Booking::class); }
    public function user()    { return $this->belongsTo(User::class); }

    // Tandai lunas + catat waktu pembayaran
    public function markAsPaid(): void {
        $this->update(['status' => 'paid', 'paid_at' => now()]);
    }
}
