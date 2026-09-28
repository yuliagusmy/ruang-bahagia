<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Booking extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'booking_code', 'user_id', 'client_id', 'package_id', 'schedule_id',
        'event_date', 'event_time', 'event_location', 'event_type',
        'total_price', 'dp_amount', 'remaining_amount',
        'status', 'special_requests',
    ];

    protected $casts = [
        'event_date'       => 'date',
        'total_price'      => 'decimal:2',
        'dp_amount'        => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'deleted_at'       => 'datetime',
    ];

    // Auto-generate booking code sebelum create
    protected static function booted(): void {
        static::creating(function (Booking $booking) {
            $booking->booking_code ??= 'RB-' . date('Y') . '-' . str_pad(
                static::whereYear('created_at', date('Y'))->count() + 1,
                4, '0', STR_PAD_LEFT
            );
        });
    }

    // ── Relasi ────────────────────────────────────────────────
    public function user()            { return $this->belongsTo(User::class); }
    public function client()          { return $this->belongsTo(Client::class); }
    public function package()         { return $this->belongsTo(Package::class); }
    public function schedule()        { return $this->belongsTo(Schedule::class); }
    public function payments()        { return $this->hasMany(Payment::class); }
    public function proofingSession() { return $this->hasOne(ProofingSession::class); }
    public function delivery()        { return $this->hasOne(Delivery::class); }

    // ── Scope ─────────────────────────────────────────────────
    public function scopeByStatus($query, string $status) {
        return $query->where('status', $status);
    }

    public function scopeUpcoming($query) {
        return $query->where('event_date', '>=', now()->toDateString())
                     ->orderBy('event_date');
    }

    // ── Helpers ───────────────────────────────────────────────
    public function totalPaid(): float {
        return (float) $this->payments()->where('status', 'paid')->sum('amount');
    }

    public function isFullyPaid(): bool {
        return $this->totalPaid() >= (float) $this->total_price;
    }
}
