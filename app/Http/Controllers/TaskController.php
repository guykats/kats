<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        Task::create([
            ...$validated,
            'created_by_credential_id' => $this->currentDevice($request)->id,
        ]);

        return back();
    }

    public function update(Request $request, Task $task): RedirectResponse
    {
        $validated = $request->validate([
            'done' => ['required', 'boolean'],
        ]);

        $task->setDone($validated['done'], $this->currentDevice($request)->id);

        return back();
    }

    public function destroy(Task $task): RedirectResponse
    {
        $task->delete();

        return back();
    }
}
