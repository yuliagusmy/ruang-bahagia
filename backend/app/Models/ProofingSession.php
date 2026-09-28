<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ProofingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id', 'user_id', 'pin', 'slug',
        'total_photos', 'selection_quota', 'selected_count',
        'status', 'expires_at',
    ];

    protected $hidden = ['pin'];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    protected static function booted(): void {
        static::creating(function (ProofingSession $session) {
            $session->slug ??= Str::random(10);
            $session->pin  ??= str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        });
    }

    public function booking() { return $this->belongsTo(Booking::class); }
    public function user()    { return $this->belongsTo(User::class); }
    public function photos()  { return $this->hasMany(ProofingPhoto::class); }
    public function selections() { return $this->hasMany(ProofingSelection::class); }

    public function readyPhotos() {
        return $this->photos()->where('status', 'ready');
    }

    public function selectedPhotos() {
        return $this->selections()->where('action', 'selected')->with('photo');
    }

    public function isExpired(): bool {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function remainingQuota(): int {
        return max(0, $this->selection_quota - $this->selected_count);
    }
}
