<?php

namespace App\Http\Controllers;

use App\Models\FamilyMember;
use App\Models\Task;
use App\Models\WebauthnCredential;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParentTasksController extends Controller
{
    public function index(Request $request): Response
    {
        $hasCredential = WebauthnCredential::exists();
        $unlocked = $hasCredential && WebauthnCredential::sessionIsUnlocked($request);

        if (! $unlocked) {
            return Inertia::render('ParentTasks', [
                'unlocked' => false,
                'hasCredential' => $hasCredential,
            ]);
        }

        return Inertia::render('ParentTasks', [
            'unlocked' => true,
            'hasCredential' => true,
            'tasks' => Task::where('audience', 'parents')->with('completions.familyMember')->orderBy('created_at')->get(),
            'familyMembers' => FamilyMember::orderBy('id')->get(),
        ]);
    }
}
