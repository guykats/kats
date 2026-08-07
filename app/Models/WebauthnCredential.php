<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class WebauthnCredential extends Model
{
    protected $fillable = ['credential_id', 'public_key', 'sign_count', 'name', 'color', 'is_admin', 'approved_at'];

    protected function casts(): array
    {
        return [
            'is_admin' => 'boolean',
            'approved_at' => 'datetime',
        ];
    }

    public function isApproved(): bool
    {
        return $this->approved_at !== null;
    }

    /** The device tied to the current browser session, if any — regardless of approval state. */
    public static function current(Request $request): ?self
    {
        $id = $request->session()->get('device_credential_id');

        return $id ? self::find($id) : null;
    }
}
