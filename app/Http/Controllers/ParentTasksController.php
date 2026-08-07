<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParentTasksController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($this->currentDevice($request)->is_admin, 403);

        return Inertia::render('ParentTasks', [
            'tasks' => Task::where('audience', 'parents')
                ->with(['completions.device', 'createdBy'])
                ->orderBy('created_at')
                ->get(),
        ]);
    }
}
