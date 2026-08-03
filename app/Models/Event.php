<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = ['date', 'title', 'time', 'color'];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
        ];
    }
}
