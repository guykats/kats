<?php

namespace App\Http\Controllers;

use App\Models\ShoppingItem;
use Inertia\Inertia;
use Inertia\Response;

class ShoppingController extends Controller
{
    public const LISTS = [
        'default' => 'סופר',
        'maxstock' => 'מקסטוק',
        'misc' => 'שונות',
        'sodhataam' => 'סוד הטעם',
    ];

    public function index(string $list): Response
    {
        return Inertia::render('Shopping', [
            'list' => $list,
            'items' => ShoppingItem::where('list', $list)->with('createdBy')->orderBy('created_at')->get(),
        ]);
    }
}
