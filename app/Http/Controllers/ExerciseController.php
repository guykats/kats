<?php

namespace App\Http\Controllers;

use App\Models\Exercise;
use App\Models\ExerciseCompletion;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ExerciseController extends Controller
{
    public function index(): Response
    {
        $exercises = Exercise::orderBy('created_at')->get();
        $today = Exercise::appToday();

        $doneTodayIds = ExerciseCompletion::where('date', $today->toDateString())
            ->pluck('exercise_id')
            ->all();

        $exercises->each(function (Exercise $exercise) use ($doneTodayIds) {
            $exercise->done_today = in_array($exercise->id, $doneTodayIds, true);
        });

        return Inertia::render('Stretches', [
            'exercises' => $exercises,
            'weekStatus' => $this->buildWeekStatus($today, $exercises->count()),
        ]);
    }

    public function toggleComplete(Exercise $exercise): RedirectResponse
    {
        $date = Exercise::appToday()->toDateString();

        $completion = $exercise->completions()->where('date', $date)->first();

        if ($completion) {
            $completion->delete();
        } else {
            $exercise->completions()->create(['date' => $date]);
        }

        return back();
    }

    /** Builds a Sunday–Saturday view of which days this week had every exercise checked off. */
    private function buildWeekStatus(Carbon $today, int $totalExercises): array
    {
        $startOfWeek = $today->copy()->startOfWeek(Carbon::SUNDAY);
        $labels = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

        // toBase() skips the model's date cast, so the grouped rows keep plain string dates.
        $counts = ExerciseCompletion::query()
            ->toBase()
            ->whereBetween('date', [
                $startOfWeek->toDateString(),
                $startOfWeek->copy()->addDays(6)->toDateString(),
            ])
            ->selectRaw('date, count(distinct exercise_id) as c')
            ->groupBy('date')
            ->pluck('c', 'date');

        $days = [];
        for ($i = 0; $i < 7; $i++) {
            $date = $startOfWeek->copy()->addDays($i)->toDateString();
            $days[] = [
                'date' => $date,
                'label' => $labels[$i],
                'done' => $totalExercises > 0 && ($counts[$date] ?? 0) >= $totalExercises,
                'is_today' => $date === $today->toDateString(),
            ];
        }

        return $days;
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'duration_seconds' => ['nullable', 'integer', 'min:1', 'max:3600'],
            'details' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'max:5120'],
            'video' => [
                'nullable',
                'mimetypes:video/mp4,video/quicktime,video/webm,video/x-m4v,video/3gpp,video/x-matroska,video/mpeg',
                'max:20480',
            ],
            'youtube_url' => ['nullable', 'string', 'max:500'],
            'youtube_start' => ['nullable', 'integer', 'min:0'],
            'youtube_end' => ['nullable', 'integer', 'min:1', 'gt:youtube_start'],
        ], [
            'video.mimetypes' => 'סוג הקובץ לא נתמך. נסו לייצא את הסרטון כ-MP4.',
            'video.max' => 'הסרטון גדול מדי (מקסימום 20MB).',
            'image.max' => 'התמונה גדולה מדי (מקסימום 5MB).',
            'youtube_end.gt' => 'זמן הסיום חייב להיות אחרי זמן ההתחלה.',
        ]);

        $youtubeId = null;
        if (! empty($validated['youtube_url'])) {
            $youtubeId = Exercise::parseYoutubeId($validated['youtube_url']);
            if (! $youtubeId) {
                throw ValidationException::withMessages(['youtube_url' => 'לא זיהינו קישור יוטיוב תקין.']);
            }
        }

        Exercise::create([
            'title' => $validated['title'],
            'duration_seconds' => $validated['duration_seconds'] ?? null,
            'details' => $validated['details'] ?? null,
            'image_path' => $request->hasFile('image') ? $request->file('image')->store('exercises', 'public') : null,
            'video_path' => $request->hasFile('video') ? $request->file('video')->store('exercises', 'public') : null,
            'youtube_id' => $youtubeId,
            'youtube_start_seconds' => $youtubeId ? ($validated['youtube_start'] ?? null) : null,
            'youtube_end_seconds' => $youtubeId ? ($validated['youtube_end'] ?? null) : null,
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
