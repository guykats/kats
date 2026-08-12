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

        Task::create([
            ...$validated,
            'audience' => 'parents',
            'created_by_credential_id' => $this->currentDevice($request)->id,
        ]);

        return back();
    }

    public function update(Request $request, Task $task): RedirectResponse
    {
        abort_unless($task->audience === 'parents', 404);

        $validated = $request->validate([
            'done' => ['required', 'boolean'],
        ]);

        $task->setDone($validated['done'], $this->currentDevice($request)->id);

        return back();
    }

    public function destroy(Task $task): RedirectResponse
    {
        abort_unless($task->audience === 'parents', 404);

        $task->delete();

        return back();
    }
}
