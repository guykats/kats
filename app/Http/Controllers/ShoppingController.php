<?php

namespace App\Http\Controllers;

use App\Models\ShoppingItem;
use Inertia\Inertia;
use Inertia\Response;

class ShoppingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Shopping', [
            'items' => ShoppingItem::orderBy('created_at')->get(),
        ]);
    }
}
