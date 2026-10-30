<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Exercise extends Model
{
    protected $fillable = ['title', 'duration_seconds', 'details', 'image_path', 'video_path'];

    protected $appends = ['image_url', 'video_url'];

    protected function casts(): array
    {
        return [
            'duration_seconds' => 'integer',
        ];
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? Storage::disk('public')->url($this->image_path) : null;
    }

    public function getVideoUrlAttribute(): ?string
    {
        return $this->video_path ? Storage::disk('public')->url($this->video_path) : null;
    }
}
