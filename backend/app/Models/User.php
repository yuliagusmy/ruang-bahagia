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
        'role',
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

    protected $appends = ['is_pro', 'is_trial', 'trial_days_remaining', 'is_admin'];

    public const TRIAL_DAYS = 10;

    /**
     * Cek apakah fotografer masih dalam masa uji coba gratis (10 hari sejak pendaftaran)
     */
    public function isTrial(): bool
    {
        // Jika sudah resmi berlangganan pro berbayar dan belum expired, bukan trial lagi
        if ($this->subscription_tier === 'pro' && (!$this->subscription_expires_at || $this->subscription_expires_at->isFuture())) {
            return false;
        }

        $trialEnd = $this->created_at 
            ? $this->created_at->copy()->addDays(self::TRIAL_DAYS)
            : now()->addDays(self::TRIAL_DAYS);

        return now()->lt($trialEnd);
    }

    /**
     * Hitung sisa hari masa uji coba gratis (maks 20 hari)
     */
    public function trialDaysRemaining(): int
    {
        $trialEnd = $this->created_at 
            ? $this->created_at->copy()->addDays(self::TRIAL_DAYS)
            : now()->addDays(self::TRIAL_DAYS);

        if (now()->gte($trialEnd)) {
            return 0;
        }

        return max(1, (int) ceil(now()->diffInSeconds($trialEnd) / 86400));
    }

    /**
     * Cek apakah fotografer memiliki tier Pro aktif (via Masa Uji Coba 20 Hari maupun Langganan Berbayar)
     */
    public function isPro(): bool
    {
        // 1. Selama masa uji coba gratis 20 hari, seluruh fitur Pro aktif otomatis
        if ($this->isTrial()) {
            return true;
        }

        // 2. Langganan Pro berbayar aktif
        if ($this->subscription_tier === 'pro') {
            if (!$this->subscription_expires_at || $this->subscription_expires_at->isFuture()) {
                return true;
            }
        }

        return false;
    }

    public function getIsProAttribute(): bool
    {
        return $this->isPro();
    }

    public function getIsTrialAttribute(): bool
    {
        return $this->isTrial();
    }

    public function getTrialDaysRemainingAttribute(): int
    {
        return $this->trialDaysRemaining();
    }

    public function getIsAdminAttribute(): bool
    {
        return $this->isAdmin();
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin' || $this->email === 'yuliagusmy@gmail.com';
    }

    // ── Relasi ────────────────────────────────────────────────
    public function clients()             { return $this->hasMany(Client::class); }
    public function packages()            { return $this->hasMany(Package::class); }
    public function schedules()           { return $this->hasMany(Schedule::class); }
    public function bookings()            { return $this->hasMany(Booking::class); }
    public function proofingSessions()    { return $this->hasMany(ProofingSession::class); }
    public function subscriptionOrders()  { return $this->hasMany(SubscriptionOrder::class); }
    public function portfolioItems()      { return $this->hasMany(PortfolioItem::class); }
    public function notifications()       { return $this->hasMany(Notification::class); }
    public function googleDriveToken()    { return $this->hasOne(GoogleDriveToken::class); }
}
