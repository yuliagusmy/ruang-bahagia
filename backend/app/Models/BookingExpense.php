<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingExpense extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'user_id',
        'category',
        'title',
        'amount',
        'expense_date',
        'notes',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'expense_date' => 'date',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function categories(): array
    {
        return [
            'studio_rental' => 'Sewa Studio',
            'assistant_fee' => 'Honor Asisten / Kru',
            'transport'     => 'Transport & BBM',
            'printing'      => 'Cetak Album & Lab',
            'props'         => 'Properti & Wardrobe',
            'other'         => 'Lain-lain',
        ];
    }
}
