<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ProofingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id', 'user_id', 'title', 'client_name',
        'client_phone', 'client_email', 'gdrive_folder_url',
        'pin', 'slug', 'total_photos', 'selection_quota',
        'selected_count', 'status', 'expires_at',
    ];

    protected $hidden = ['pin'];

    protected $casts = [
        'booking_id'      => 'integer',
        'user_id'         => 'integer',
        'total_photos'    => 'integer',
        'selection_quota' => 'integer',
        'selected_count'  => 'integer',
        'expires_at'      => 'datetime',
    ];

    public function getDisplayTitleAttribute(): string
    {
        if (!empty($this->title)) {
            return $this->title;
        }
        if ($this->booking?->package?->name) {
            return 'Sesi ' . $this->booking->package->name;
        }
        return 'Sesi Foto ' . ($this->created_at ? $this->created_at->format('d M Y') : '');
    }

    public function getDisplayClientNameAttribute(): string
    {
        return $this->client_name ?: ($this->booking?->client?->name ?: 'Klien');
    }

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
