<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'title' => ['required', 'string', 'max:255'],
            'time' => ['nullable', 'date_format:H:i'],
            'recurrence' => ['nullable', 'in:none,weekly,monthly,yearly'],
            'days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);

        $device = $this->currentDevice($request);

        Event::create([
            ...$validated,
            'color' => $device->color,
            'created_by_credential_id' => $device->id,
        ]);

        return back();
    }

    public function destroy(Event $event): RedirectResponse
    {
        $event->delete();

        return back();
    }
}
