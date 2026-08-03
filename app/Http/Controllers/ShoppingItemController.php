<?php

namespace App\Http\Controllers;

use App\Models\ShoppingItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ShoppingItemController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'max:255'],
        ]);

        ShoppingItem::create($validated);

        return back();
    }

    public function update(Request $request, ShoppingItem $shoppingItem): RedirectResponse
    {
        $validated = $request->validate([
            'done' => ['required', 'boolean'],
        ]);

        $shoppingItem->update($validated);

        return back();
    }

    public function destroy(ShoppingItem $shoppingItem): RedirectResponse
    {
        $shoppingItem->delete();

        return back();
    }
}
