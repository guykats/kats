<?php

namespace App\Http\Controllers;

use App\Models\WebauthnCredential;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDeviceController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($this->currentDevice($request)->is_admin, 403);

        return Inertia::render('Admin/Devices', [
            'pending' => WebauthnCredential::whereNull('approved_at')->orderBy('created_at')->get(['id', 'created_at']),
            'approved' => WebauthnCredential::whereNotNull('approved_at')->orderBy('approved_at')->get(['id', 'name', 'color', 'is_admin', 'approved_at']),
        ]);
    }

    public function approve(Request $request, WebauthnCredential $webauthnCredential): RedirectResponse
    {
        abort_unless($this->currentDevice($request)->is_admin, 403);
        abort_if($webauthnCredential->isApproved(), 409);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'color' => ['required', 'string', 'max:20'],
        ]);

        $webauthnCredential->update([...$validated, 'approved_at' => now()]);

        return back();
    }

    public function promote(Request $request, WebauthnCredential $webauthnCredential): RedirectResponse
    {
        abort_unless($this->currentDevice($request)->is_admin, 403);
        abort_unless($webauthnCredential->isApproved(), 422, 'יש לאשר את המכשיר לפני שהופכים אותו למנהל');

        $webauthnCredential->update(['is_admin' => true]);

        return back();
    }

    public function destroy(Request $request, WebauthnCredential $webauthnCredential): RedirectResponse
    {
        $device = $this->currentDevice($request);
        abort_unless($device->is_admin, 403);
        abort_if($webauthnCredential->id === $device->id, 422, 'לא ניתן להסיר את המכשיר הנוכחי');

        $webauthnCredential->delete();

        return back();
    }
}
