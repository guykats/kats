<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class WebauthnCredential extends Model
{
    protected $fillable = ['credential_id', 'public_key', 'sign_count'];

    public static function sessionIsUnlocked(Request $request): bool
    {
        $unlockedAt = $request->session()->get('parent_unlocked_at');

        return $unlockedAt && now()->diffInMinutes($unlockedAt) < 10;
    }
}
