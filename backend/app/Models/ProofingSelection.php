<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProofingSelection extends Model
{
    use HasFactory;

    protected $fillable = [
        'proofing_session_id', 'proofing_photo_id', 'action', 'selected_at',
    ];

    protected $casts = [
        'selected_at' => 'datetime',
    ];

    public function session() { return $this->belongsTo(ProofingSession::class, 'proofing_session_id'); }
    public function photo()   { return $this->belongsTo(ProofingPhoto::class, 'proofing_photo_id'); }
}
