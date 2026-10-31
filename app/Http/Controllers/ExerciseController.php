<?php

namespace App\Http\Controllers;

use App\Models\Exercise;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ExerciseController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Stretches', [
            'exercises' => Exercise::orderBy('created_at')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'duration_seconds' => ['nullable', 'integer', 'min:1', 'max:3600'],
            'details' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'max:5120'],
            'video' => ['nullable', 'mimetypes:video/mp4,video/quicktime,video/webm', 'max:20480'],
        ]);

        Exercise::create([
            'title' => $validated['title'],
            'duration_seconds' => $validated['duration_seconds'] ?? null,
            'details' => $validated['details'] ?? null,
            'image_path' => $request->hasFile('image') ? $request->file('image')->store('exercises', 'public') : null,
            'video_path' => $request->hasFile('video') ? $request->file('video')->store('exercises', 'public') : null,
        ]);

        return back();
    }

    public function destroy(Exercise $exercise): RedirectResponse
    {
        if ($exercise->image_path) {
            Storage::disk('public')->delete($exercise->image_path);
        }
        if ($exercise->video_path) {
            Storage::disk('public')->delete($exercise->video_path);
        }

        $exercise->delete();

        return back();
    }
}
