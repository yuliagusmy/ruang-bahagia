<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GoogleDriveToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'access_token', 'refresh_token',
        'token_type', 'expires_at', 'scope', 'gdrive_email',
    ];

    protected $hidden = ['access_token', 'refresh_token'];

    protected $casts = [
        'access_token'  => 'encrypted',
        'refresh_token' => 'encrypted',
        'expires_at'    => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }

    public function isExpired(): bool {
        return $this->expires_at->isPast();
    }
}
