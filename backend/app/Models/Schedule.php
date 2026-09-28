<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'date', 'start_time', 'end_time',
        'status', 'location', 'notes',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function user()    { return $this->belongsTo(User::class); }
    public function booking() { return $this->hasOne(Booking::class); }

    public function scopeAvailable($query) {
        return $query->where('status', 'available');
    }

    public function scopeForMonth($query, string $yearMonth) {
        return $query->where('date', 'like', "$yearMonth%");
    }

    // Lock slot saat DP dibayar
    public function lock(): void {
        $this->update(['status' => 'booked']);
    }
}
