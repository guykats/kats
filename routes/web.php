<?php

use App\Http\Controllers\CalendarController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ShoppingController;
use App\Http\Controllers\ShoppingItemController;
use App\Http\Controllers\TaskCompletionController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TasksController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/calendar');

Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar');
Route::post('/events', [EventController::class, 'store'])->name('events.store');
Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('events.destroy');

Route::get('/shopping', [ShoppingController::class, 'index'])->name('shopping');
Route::post('/shopping-items', [ShoppingItemController::class, 'store'])->name('shopping-items.store');
Route::patch('/shopping-items/{shoppingItem}', [ShoppingItemController::class, 'update'])->name('shopping-items.update');
Route::delete('/shopping-items/{shoppingItem}', [ShoppingItemController::class, 'destroy'])->name('shopping-items.destroy');

Route::get('/tasks', [TasksController::class, 'index'])->name('tasks');
Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
Route::post('/task-completions', [TaskCompletionController::class, 'store'])->name('task-completions.store');
Route::delete('/task-completions/{taskCompletion}', [TaskCompletionController::class, 'destroy'])->name('task-completions.destroy');
