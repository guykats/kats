<?php

namespace App\Http\Middleware;

use App\Http\Controllers\PatternLockController;
use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureParentUnlocked
{
    public function handle(Request $request, Closure $next): Response
    {
        if (PatternLockController::isUnlocked($request)) {
            return $next($request);
        }

        return Inertia::render('ParentLockGate', [
            'hasPattern' => Setting::get('parent_lock_pattern_hash') !== null,
        ])->toResponse($request);
    }
}
