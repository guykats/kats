<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PatternLockController extends Controller
{
    private const SESSION_KEY = 'parent_unlocked_until';

    private const UNLOCK_MINUTES = 30;

    private const SETTING_KEY = 'parent_lock_pattern_hash';

    public static function isUnlocked(Request $request): bool
    {
        $until = $request->session()->get(self::SESSION_KEY);

        return $until && now()->timestamp < $until;
    }

    public function unlock(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'pattern' => ['required', 'array', 'min:4'],
            'pattern.*' => ['integer', 'min:0', 'max:8'],
        ]);

        $hash = Setting::get(self::SETTING_KEY);
        $submitted = implode('-', $validated['pattern']);

        if (! $hash || ! Hash::check($submitted, $hash)) {
            return back()->withErrors(['pattern' => 'התבנית לא נכונה, נסו שוב']);
        }

        $request->session()->put(self::SESSION_KEY, now()->addMinutes(self::UNLOCK_MINUTES)->timestamp);

        return back();
    }

    public function set(Request $request): RedirectResponse
    {
        $hasPattern = Setting::get(self::SETTING_KEY) !== null;
        abort_unless(! $hasPattern || self::isUnlocked($request), 403);

        $validated = $request->validate([
            'pattern' => ['required', 'array', 'min:4'],
            'pattern.*' => ['integer', 'min:0', 'max:8'],
        ]);

        Setting::set(self::SETTING_KEY, Hash::make(implode('-', $validated['pattern'])));
        $request->session()->put(self::SESSION_KEY, now()->addMinutes(self::UNLOCK_MINUTES)->timestamp);

        return back();
    }
}
