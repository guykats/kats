<?php

namespace App\Http\Middleware;

use App\Models\WebauthnCredential;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $device = WebauthnCredential::current($request);

        return [
            ...parent::share($request),
            'device' => $device && $device->isApproved() ? [
                'name' => $device->name,
                'color' => $device->color,
                'isAdmin' => $device->is_admin,
            ] : null,
        ];
    }
}
