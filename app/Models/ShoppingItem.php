<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShoppingItem extends Model
{
    protected $fillable = ['text', 'done', 'list', 'created_by_credential_id'];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(WebauthnCredential::class, 'created_by_credential_id');
    }

    protected function casts(): array
    {
        return [
            'done' => 'boolean',
        ];
    }
}
