<?php

namespace App\Http\Controllers;

use App\Models\TaskCompletion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TaskCompletionController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'task_id' => ['required', 'exists:tasks,id'],
        ]);

        TaskCompletion::create([
            ...$validated,
            'webauthn_credential_id' => $this->currentDevice($request)->id,
            'completed_at' => now(),
        ]);

        return back();
    }

    public function destroy(TaskCompletion $taskCompletion): RedirectResponse
    {
        $taskCompletion->delete();

        return back();
    }
}
