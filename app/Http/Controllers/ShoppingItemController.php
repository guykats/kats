<?php

namespace App\Http\Controllers;

use App\Models\ShoppingItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ShoppingItemController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'max:255'],
            'list' => ['required', 'string', Rule::in(array_keys(ShoppingController::LISTS))],
        ]);

        ShoppingItem::create([
            ...$validated,
            'created_by_credential_id' => $this->currentDevice($request)->id,
        ]);

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
