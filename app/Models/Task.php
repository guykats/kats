<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Task extends Model
{
    protected $fillable = ['title', 'audience', 'done', 'created_by_credential_id'];

    protected $appends = ['completed_by'];

    protected function casts(): array
    {
        return [
            'done' => 'boolean',
        ];
    }

    public function completions(): HasMany
    {
        return $this->hasMany(TaskCompletion::class)->orderByDesc('completed_at');
    }

    public function latestCompletion(): HasOne
    {
        return $this->hasOne(TaskCompletion::class)->latestOfMany('completed_at');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(WebauthnCredential::class, 'created_by_credential_id');
    }

    public function getCompletedByAttribute(): ?WebauthnCredential
    {
        return $this->latestCompletion?->device;
    }

    /** Logs a completion only when checking a task off — unchecking is just reopening it. */
    public function setDone(bool $done, int $deviceId): void
    {
        $this->update(['done' => $done]);

        if ($done) {
            $this->completions()->create([
                'webauthn_credential_id' => $deviceId,
                'completed_at' => now(),
            ]);
        }
    }
}
