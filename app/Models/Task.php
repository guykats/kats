<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    protected $fillable = ['title', 'audience', 'done', 'created_by_credential_id'];

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

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(WebauthnCredential::class, 'created_by_credential_id');
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
