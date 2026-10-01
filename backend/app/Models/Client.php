<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'name', 'email', 'phone',
        'instagram', 'status', 'notes',
    ];

    protected $casts = [
        'user_id'    => 'integer',
        'deleted_at' => 'datetime',
    ];

    // ── Relasi ────────────────────────────────────────────────
    public function user()     { return $this->belongsTo(User::class); }
    public function bookings() { return $this->hasMany(Booking::class); }

    // ── Scope ─────────────────────────────────────────────────
    public function scopeByStatus($query, string $status) {
        return $query->where('status', $status);
    }
}
