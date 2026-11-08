<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class Exercise extends Model
{
    protected $fillable = [
        'title',
        'duration_seconds',
        'details',
        'image_path',
        'video_path',
        'youtube_id',
        'youtube_start_seconds',
        'youtube_end_seconds',
    ];

    protected $appends = ['image_url', 'video_url', 'youtube_embed_url'];

    protected function casts(): array
    {
        return [
            'duration_seconds' => 'integer',
            'youtube_start_seconds' => 'integer',
            'youtube_end_seconds' => 'integer',
        ];
    }

    public function completions(): HasMany
    {
        return $this->hasMany(ExerciseCompletion::class);
    }

    /** The "day" for streak purposes, which only flips over at 6am local time rather than midnight. */
    public static function appToday(): Carbon
    {
        $now = now('Asia/Jerusalem');

        return ($now->hour < 6 ? $now->subDay() : $now)->startOfDay();
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? Storage::disk('public')->url($this->image_path) : null;
    }

    public function getVideoUrlAttribute(): ?string
    {
        return $this->video_path ? Storage::disk('public')->url($this->video_path) : null;
    }

    public function getYoutubeEmbedUrlAttribute(): ?string
    {
        if (! $this->youtube_id) {
            return null;
        }

        $params = ['rel' => 0, 'modestbranding' => 1];
        if ($this->youtube_start_seconds !== null) {
            $params['start'] = $this->youtube_start_seconds;
        }
        if ($this->youtube_end_seconds !== null) {
            $params['end'] = $this->youtube_end_seconds;
        }

        return 'https://www.youtube-nocookie.com/embed/'.$this->youtube_id.'?'.http_build_query($params);
    }

    /** Extracts the 11-character video ID from any common YouTube URL shape, or null if it doesn't look like one. */
    public static function parseYoutubeId(string $url): ?string
    {
        if (preg_match('#(?:youtube(?:-nocookie)?\.com/(?:watch\?v=|embed/|v/|shorts/)|youtu\.be/)([a-zA-Z0-9_-]{11})#', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
