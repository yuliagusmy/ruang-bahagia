<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PortfolioItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'title', 'description', 'category',
        'thumbnail_path', 'photos', 'gdrive_file_id', 'is_featured',
        'is_visible', 'sort_order', 'taken_at',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_visible'  => 'boolean',
        'photos'      => 'array',
        'taken_at'    => 'date',
        'deleted_at'  => 'datetime',
    ];

    protected $appends = ['photo_count'];

    public function user() { return $this->belongsTo(User::class); }

    public function scopeVisible($query)  { return $query->where('is_visible', true); }
    public function scopeFeatured($query) { return $query->where('is_featured', true); }

    public function getPhotosAttribute($value): array
    {
        if ($value) {
            $decoded = is_array($value) ? $value : json_decode($value, true);
            if (!empty($decoded)) {
                return $decoded;
            }
        }
        return $this->thumbnail_path ? [$this->thumbnail_path] : [];
    }

    public function getPhotoCountAttribute(): int
    {
        return count($this->photos);
    }
}
