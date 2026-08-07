<?php

namespace App\Http\Controllers;

use App\Models\WebauthnCredential;
use Illuminate\Http\Request;

abstract class Controller
{
    /** Guaranteed non-null on any route behind the device.approved middleware. */
    protected function currentDevice(Request $request): WebauthnCredential
    {
        return WebauthnCredential::current($request);
    }
}
