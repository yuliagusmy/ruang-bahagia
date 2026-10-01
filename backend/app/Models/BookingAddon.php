<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BookingAddon extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'package_addon_id',
        'name',
        'price',
        'quantity',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'quantity' => 'integer',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function addon()
    {
        return $this->belongsTo(PackageAddon::class, 'package_addon_id');
    }
}
