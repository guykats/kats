<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Event extends Model
{
    protected $fillable = ['date', 'title', 'time', 'color', 'recurrence', 'days', 'created_by_credential_id'];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(WebauthnCredential::class, 'created_by_credential_id');
    }

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
        ];
    }
}
