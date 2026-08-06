<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FamilyMember extends Model
{
    protected $fillable = ['name', 'color'];

    public function completions(): HasMany
    {
        return $this->hasMany(TaskCompletion::class);
    }
}
