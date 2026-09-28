<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProofingPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'proofing_session_id', 'original_filename', 'display_filename',
        'lowres_path', 'gdrive_file_id', 'sort_order', 'status',
    ];

    public function session()   { return $this->belongsTo(ProofingSession::class, 'proofing_session_id'); }
    public function selection() { return $this->hasOne(ProofingSelection::class); }

    public function scopeReady($query) { return $query->where('status', 'ready'); }
}
