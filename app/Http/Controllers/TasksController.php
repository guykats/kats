<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Inertia\Inertia;
use Inertia\Response;

class TasksController extends Controller
{
    public const LISTS = [
        'default' => 'שוטף',
        'shabbat' => 'הכנות לשבת',
    ];

    public function index(string $list): Response
    {
        return Inertia::render('Tasks', [
            'list' => $list,
            'tasks' => Task::where('audience', 'household')
                ->where('list', $list)
                ->with('latestCompletion.device')
                ->orderBy('created_at')
                ->get(['id', 'title', 'done']),
        ]);
    }
}
