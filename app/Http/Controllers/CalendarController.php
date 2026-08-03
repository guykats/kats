<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Calendar', [
            'events' => Event::orderBy('date')->orderBy('time')->get(),
        ]);
    }
}
