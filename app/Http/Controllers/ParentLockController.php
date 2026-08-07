<?php

namespace App\Http\Controllers;

use App\Models\WebauthnCredential;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use lbuchs\WebAuthn\WebAuthn;
use lbuchs\WebAuthn\WebAuthnException;

class ParentLockController extends Controller
{
    private function webAuthn(Request $request): WebAuthn
    {
        return new WebAuthn('משפחת קץ', $request->getHost(), null, true);
    }

    private static function base64UrlDecode(string $value): string
    {
        return base64_decode(str_pad(strtr($value, '-_', '+/'), strlen($value) % 4 === 0 ? strlen($value) : strlen($value) + 4 - strlen($value) % 4, '='));
    }

    private static function base64UrlEncode(string $binary): string
    {
        return rtrim(strtr(base64_encode($binary), '+/', '-_'), '=');
    }

    /**
     * Adding a device is only unrestricted for the very first one (bootstrapping the
     * lock). Once a credential exists, registering another device requires already
     * being unlocked with an existing one — otherwise anyone who finds this endpoint
     * could add their own device without ever passing the lock.
     */
    private function canRegister(Request $request): bool
    {
        return ! WebauthnCredential::exists() || WebauthnCredential::sessionIsUnlocked($request);
    }

    public function registerOptions(Request $request): JsonResponse
    {
        abort_unless($this->canRegister($request), 403, 'יש כבר נעילה מוגדרת — יש לפתוח קודם עם מכשיר קיים');

        $webAuthn = $this->webAuthn($request);

        $args = $webAuthn->getCreateArgs('parent', 'הורה', 'הורה', 60, false, 'required');
        // Session serialization is JSON, which can't carry raw binary — store the challenge as base64.
        $request->session()->put('webauthn_challenge', base64_encode($webAuthn->getChallenge()->getBinaryString()));

        return response()->json($args->publicKey);
    }

    public function register(Request $request): JsonResponse
    {
        abort_unless($this->canRegister($request), 403, 'יש כבר נעילה מוגדרת — יש לפתוח קודם עם מכשיר קיים');

        $validated = $request->validate([
            'clientDataJSON' => ['required', 'string'],
            'attestationObject' => ['required', 'string'],
        ]);

        $challenge = $request->session()->pull('webauthn_challenge');
        abort_if(! $challenge, 422, 'תוקף ההרשמה פג, נסו שוב');

        try {
            $data = $this->webAuthn($request)->processCreate(
                self::base64UrlDecode($validated['clientDataJSON']),
                self::base64UrlDecode($validated['attestationObject']),
                base64_decode($challenge),
                requireUserVerification: true,
            );
        } catch (WebAuthnException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        WebauthnCredential::create([
            'credential_id' => self::base64UrlEncode($data->credentialId),
            'public_key' => $data->credentialPublicKey,
            'sign_count' => $data->signatureCounter ?? 0,
        ]);

        $request->session()->put('parent_unlocked_at', now());

        return response()->json(['ok' => true]);
    }

    public function unlockOptions(Request $request): JsonResponse
    {
        $webAuthn = $this->webAuthn($request);

        $credentialIds = WebauthnCredential::pluck('credential_id')
            ->map(fn (string $id) => self::base64UrlDecode($id))
            ->all();

        abort_if($credentialIds === [], 404, 'לא הוגדרה נעילה');

        $args = $webAuthn->getGetArgs($credentialIds, 60, requireUserVerification: 'required');
        $request->session()->put('webauthn_challenge', base64_encode($webAuthn->getChallenge()->getBinaryString()));

        return response()->json($args->publicKey);
    }

    public function unlock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'string'],
            'clientDataJSON' => ['required', 'string'],
            'authenticatorData' => ['required', 'string'],
            'signature' => ['required', 'string'],
        ]);

        $challenge = $request->session()->pull('webauthn_challenge');
        abort_if(! $challenge, 422, 'תוקף הבקשה פג, נסו שוב');

        $credential = WebauthnCredential::where('credential_id', $validated['id'])->first();
        abort_unless($credential, 422, 'האימות לא נמצא');

        $webAuthn = $this->webAuthn($request);

        try {
            $webAuthn->processGet(
                self::base64UrlDecode($validated['clientDataJSON']),
                self::base64UrlDecode($validated['authenticatorData']),
                self::base64UrlDecode($validated['signature']),
                $credential->public_key,
                base64_decode($challenge),
                $credential->sign_count,
                requireUserVerification: true,
            );
        } catch (WebAuthnException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $credential->update(['sign_count' => $webAuthn->getSignatureCounter() ?? $credential->sign_count]);
        $request->session()->put('parent_unlocked_at', now());

        return response()->json(['ok' => true]);
    }
}
