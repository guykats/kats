<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebauthnCredential extends Model
{
    protected $fillable = ['credential_id', 'public_key', 'sign_count'];
}
