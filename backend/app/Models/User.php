<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'brand_name',
        'username',
        'email',
        'google_id',
        'password',
        'phone',
        'whatsapp',
        'instagram',
        'bio',
        'avatar_path',
        'watermark_path',
        'city',
        'notification_settings',
        'subscription_tier',
        'subscription_status',
        'subscription_expires_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at'       => 'datetime',
        'subscription_expires_at' => 'datetime',
        'notification_settings'   => 'array',
    ];

    protected $appends = ['is_pro'];

    /**
     * Cek apakah fotografer memiliki tier Pro aktif
     */
    public function isPro(): bool
    {
        if ($this->subscription_tier !== 'pro') {
            return false;
        }

        if ($this->subscription_expires_at && $this->subscription_expires_at->isPast()) {
            return false;
        }

        return true;
    }

    public function getIsProAttribute(): bool
    {
        return $this->isPro();
    }

    // ── Relasi ────────────────────────────────────────────────
    public function clients()        { return $this->hasMany(Client::class); }
    public function packages()       { return $this->hasMany(Package::class); }
    public function schedules()      { return $this->hasMany(Schedule::class); }
    public function bookings()       { return $this->hasMany(Booking::class); }
    public function portfolioItems() { return $this->hasMany(PortfolioItem::class); }
    public function notifications()  { return $this->hasMany(Notification::class); }
    public function googleDriveToken() { return $this->hasOne(GoogleDriveToken::class); }
}
