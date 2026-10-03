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
        'status', 'special_requests', 'h1_reminder_sent_at',
    ];

    protected $casts = [
        'user_id'              => 'integer',
        'client_id'            => 'integer',
        'package_id'           => 'integer',
        'schedule_id'          => 'integer',
        'event_date'           => 'date',
        'total_price'          => 'decimal:2',
        'dp_amount'            => 'decimal:2',
        'remaining_amount'     => 'decimal:2',
        'h1_reminder_sent_at'  => 'datetime',
        'deleted_at'           => 'datetime',
    ];

    // Auto-generate booking code acak (non-sekuensial) sebelum create untuk mencegah IDOR / scraping
    protected static function booted(): void {
        static::creating(function (Booking $booking) {
            if (!$booking->booking_code) {
                do {
                    $code = 'RB-' . date('Y') . '-' . strtoupper(Str::random(6));
                } while (static::where('booking_code', $code)->exists());

                $booking->booking_code = $code;
            }
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
    public function addons()          { return $this->hasMany(BookingAddon::class); }
    public function expenses()        { return $this->hasMany(BookingExpense::class); }
    public function testimonial()     { return $this->hasOne(Testimonial::class); }

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
