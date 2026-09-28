<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id', 'user_id', 'gdrive_folder_id', 'download_link',
        'download_pin', 'file_count', 'status',
        'available_at', 'expires_at', 'deleted_at_gdrive',
    ];

    protected $casts = [
        'available_at'      => 'datetime',
        'expires_at'        => 'datetime',
        'deleted_at_gdrive' => 'datetime',
    ];

    public function booking() { return $this->belongsTo(Booking::class); }
    public function user()    { return $this->belongsTo(User::class); }

    // Cek apakah sudah melewati 14 hari sejak available
    public function shouldAutoDelete(): bool {
        return $this->expires_at && $this->expires_at->isPast()
            && $this->status !== 'deleted';
    }
}
