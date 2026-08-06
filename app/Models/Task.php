<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    protected $fillable = ['title'];

    public function completions(): HasMany
    {
        return $this->hasMany(TaskCompletion::class)->orderByDesc('completed_at');
    }
}
