<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ParentTaskController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        Task::create([...$validated, 'audience' => 'parents']);

        return back();
    }

    public function destroy(Task $task): RedirectResponse
    {
        abort_unless($task->audience === 'parents', 404);

        $task->delete();

        return back();
    }
}
