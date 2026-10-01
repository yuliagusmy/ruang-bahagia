<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubscriptionOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'user_id',
        'plan',
        'amount',
        'status',
        'snap_token',
        'snap_redirect_url',
        'payment_type',
        'payment_details',
        'paid_at',
    ];

    protected $casts = [
        'user_id'         => 'integer',
        'amount'          => 'decimal:2',
        'payment_details' => 'array',
        'paid_at'         => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isPaid(): bool
    {
        return in_array($this->status, ['settlement', 'capture']);
    }
}
