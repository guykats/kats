<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Inertia\Inertia;
use Inertia\Response;

class ParentTasksController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('ParentTasks', [
            'tasks' => Task::where('audience', 'parents')
                ->with('latestCompletion.device')
                ->orderBy('created_at')
                ->get(['id', 'title', 'done']),
        ]);
    }
}
