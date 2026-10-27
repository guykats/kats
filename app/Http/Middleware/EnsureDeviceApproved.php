<?php

namespace App\Http\Middleware;

use App\Models\WebauthnCredential;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureDeviceApproved
{
    /**
     * TEMPORARY: when true, skips device registration/approval entirely — anyone who
     * opens the site gets a transparently auto-provisioned, pre-approved admin device
     * instead of hitting the DeviceGate. Flip back to false to restore normal gating.
     */
    private const BYPASS_DEVICE_AUTH = true;

    public function handle(Request $request, Closure $next): Response
    {
        $device = WebauthnCredential::current($request);

        if (self::BYPASS_DEVICE_AUTH) {
            if (! $device) {
                $device = WebauthnCredential::create([
                    'credential_id' => 'bypass-'.Str::uuid(),
                    'public_key' => '',
                    'name' => 'אורח',
                    'color' => '#3b82f6',
                    'is_admin' => true,
                    'approved_at' => now(),
                ]);
                $request->session()->put('device_credential_id', $device->id);
            } elseif (! $device->isApproved()) {
                $device->update(['is_admin' => true, 'approved_at' => now()]);
            }

            return $next($request);
        }

        if (! $device || ! $device->isApproved()) {
            return Inertia::render('DeviceGate', [
                'status' => $device ? 'pending' : 'unauthenticated',
                'isBootstrap' => ! WebauthnCredential::exists(),
            ])->toResponse($request);
        }

        return $next($request);
    }
}
