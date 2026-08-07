<?php

namespace App\Http\Middleware;

use App\Models\WebauthnCredential;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureDeviceApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $device = WebauthnCredential::current($request);

        if (! $device || ! $device->isApproved()) {
            return Inertia::render('DeviceGate', [
                'status' => $device ? 'pending' : 'unauthenticated',
                'isBootstrap' => ! WebauthnCredential::exists(),
            ])->toResponse($request);
        }

        return $next($request);
    }
}
