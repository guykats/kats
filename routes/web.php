<?php

use App\Http\Controllers\CalendarController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ShoppingController;
use App\Http\Controllers\ShoppingItemController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/calendar');

Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar');
Route::post('/events', [EventController::class, 'store'])->name('events.store');
Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('events.destroy');

Route::get('/shopping', [ShoppingController::class, 'index'])->name('shopping');
Route::post('/shopping-items', [ShoppingItemController::class, 'store'])->name('shopping-items.store');
Route::patch('/shopping-items/{shoppingItem}', [ShoppingItemController::class, 'update'])->name('shopping-items.update');
Route::delete('/shopping-items/{shoppingItem}', [ShoppingItemController::class, 'destroy'])->name('shopping-items.destroy');
