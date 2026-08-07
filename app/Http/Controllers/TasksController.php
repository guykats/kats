<?php

namespace App\Http\Controllers;

use App\Models\FamilyMember;
use App\Models\Task;
use Inertia\Inertia;
use Inertia\Response;

class TasksController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Tasks', [
            'tasks' => Task::where('audience', 'household')->with('completions.familyMember')->orderBy('created_at')->get(),
            'familyMembers' => FamilyMember::orderBy('id')->get(),
        ]);
    }
}
