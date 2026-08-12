<?php

use App\Http\Controllers\AdminDeviceController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DeployWebhookController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ParentTaskController;
use App\Http\Controllers\ParentTasksController;
use App\Http\Controllers\ShoppingController;
use App\Http\Controllers\ShoppingItemController;
use App\Http\Controllers\TaskCompletionController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TasksController;
use Illuminate\Support\Facades\Route;

Route::get('/device/register-options', [DeviceController::class, 'registerOptions'])->name('device.register-options');
Route::post('/device/register', [DeviceController::class, 'register'])->name('device.register');
Route::get('/device/unlock-options', [DeviceController::class, 'unlockOptions'])->name('device.unlock-options');
Route::post('/device/unlock', [DeviceController::class, 'unlock'])->name('device.unlock');

Route::post('/deploy-webhook', [DeployWebhookController::class, 'handle'])->name('deploy-webhook');

Route::middleware('device.approved')->group(function () {
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

    Route::get('/parent-tasks', [ParentTasksController::class, 'index'])->name('parent-tasks');
    Route::post('/parent-tasks', [ParentTaskController::class, 'store'])->name('parent-tasks.store');
    Route::delete('/parent-tasks/{task}', [ParentTaskController::class, 'destroy'])->name('parent-tasks.destroy');

    Route::get('/admin/devices', [AdminDeviceController::class, 'index'])->name('admin.devices');
    Route::post('/admin/devices/{webauthnCredential}/approve', [AdminDeviceController::class, 'approve'])->name('admin.devices.approve');
    Route::delete('/admin/devices/{webauthnCredential}', [AdminDeviceController::class, 'destroy'])->name('admin.devices.destroy');
});
