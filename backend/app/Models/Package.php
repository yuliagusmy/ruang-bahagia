<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Package extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'name', 'description', 'duration_hours',
        'photo_quota', 'selection_quota', 'revision_count',
        'price', 'dp_amount', 'is_active', 'inclusions',
    ];

    protected $casts = [
        'user_id'     => 'integer',
        'inclusions'  => 'array',
        'is_active'   => 'boolean',
        'price'       => 'decimal:2',
        'dp_amount'   => 'decimal:2',
        'deleted_at'  => 'datetime',
    ];

    public function user()     { return $this->belongsTo(User::class); }
    public function bookings() { return $this->hasMany(Booking::class); }
    public function addons()   { return $this->hasMany(PackageAddon::class); }

    public function scopeActive($query) {
        return $query->where('is_active', true);
    }
}
