<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    protected $fillable = ['title', 'audience', 'created_by_credential_id'];

    public function completions(): HasMany
    {
        return $this->hasMany(TaskCompletion::class)->orderByDesc('completed_at');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(WebauthnCredential::class, 'created_by_credential_id');
    }
}
