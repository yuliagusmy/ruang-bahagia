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
        'password',
        'phone',
        'whatsapp',
        'instagram',
        'bio',
        'avatar_path',
        'watermark_path',
        'city',
        'notification_settings',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at'      => 'datetime',
        'notification_settings'  => 'array',
    ];

    // ── Relasi ────────────────────────────────────────────────
    public function clients()        { return $this->hasMany(Client::class); }
    public function packages()       { return $this->hasMany(Package::class); }
    public function schedules()      { return $this->hasMany(Schedule::class); }
    public function bookings()       { return $this->hasMany(Booking::class); }
    public function portfolioItems() { return $this->hasMany(PortfolioItem::class); }
    public function notifications()  { return $this->hasMany(Notification::class); }
    public function googleDriveToken() { return $this->hasOne(GoogleDriveToken::class); }
}
