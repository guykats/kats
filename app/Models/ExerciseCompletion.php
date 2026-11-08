<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExerciseCompletion extends Model
{
    protected $fillable = ['exercise_id', 'date'];

    // Deliberately uncast: 'date' is always set/read as a plain Y-m-d string.
    // Laravel's 'date' cast would store it as a full "Y-m-d 00:00:00" value,
    // which breaks the plain-string comparisons and GROUP BY used below.

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
