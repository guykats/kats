<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShoppingItem extends Model
{
    protected $fillable = ['text', 'done'];

    protected function casts(): array
    {
        return [
            'done' => 'boolean',
        ];
    }
}
