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
            'color' => ['nullable', 'string', 'max:20'],
            'recurrence' => ['nullable', 'in:none,weekly,monthly,yearly'],
            'days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);

        Event::create($validated);

        return back();
    }

    public function destroy(Event $event): RedirectResponse
    {
        $event->delete();

        return back();
    }
}
