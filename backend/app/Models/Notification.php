<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'title', 'body', 'type',
        'data', 'notifiable_type', 'notifiable_id', 'read_at',
    ];

    protected $casts = [
        'data'    => 'array',
        'read_at' => 'datetime',
    ];

    public function user()       { return $this->belongsTo(User::class); }
    public function notifiable() { return $this->morphTo(); }

    public function markAsRead(): void {
        $this->update(['read_at' => now()]);
    }

    public function scopeUnread($query) {
        return $query->whereNull('read_at');
    }
}
