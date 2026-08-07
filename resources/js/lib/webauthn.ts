function base64UrlToBuffer(base64url: string): Uint8Array {
    const padded = base64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64url.length / 4) * 4, '=');
    const binary = atob(padded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
    const binary = Array.from(new Uint8Array(buffer), (byte) => String.fromCharCode(byte)).join('');
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeCreationOptions(json: any): PublicKeyCredentialCreationOptions {
    return {
        ...json,
        challenge: base64UrlToBuffer(json.challenge),
        user: { ...json.user, id: base64UrlToBuffer(json.user.id) },
        excludeCredentials: (json.excludeCredentials ?? []).map((c: any) => ({
            ...c,
            id: base64UrlToBuffer(c.id),
        })),
    };
}

function decodeRequestOptions(json: any): PublicKeyCredentialRequestOptions {
    return {
        ...json,
        challenge: base64UrlToBuffer(json.challenge),
        allowCredentials: (json.allowCredentials ?? []).map((c: any) => ({
            ...c,
            id: base64UrlToBuffer(c.id),
        })),
    };
}

function csrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

async function postJson(url: string, body: unknown): Promise<Response> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? 'האימות נכשל');
    }
    return response;
}

export type RegisterResult = { approved: boolean };

/** `name`/`color` only matter for the very first device (it self-approves as admin). */
export async function registerDevice(name?: string, color?: string): Promise<RegisterResult> {
    const optionsRes = await fetch('/device/register-options');
    if (!optionsRes.ok) throw new Error('לא ניתן להתחיל הרשמה');
    const publicKey = decodeCreationOptions(await optionsRes.json());

    const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
    if (!credential) throw new Error('ההרשמה נכשלה');
    const response = credential.response as AuthenticatorAttestationResponse;

    const res = await postJson('/device/register', {
        clientDataJSON: bufferToBase64Url(response.clientDataJSON),
        attestationObject: bufferToBase64Url(response.attestationObject),
        name,
        color,
    });
    return res.json();
}

export async function unlockDevice(): Promise<RegisterResult> {
    const optionsRes = await fetch('/device/unlock-options');
    if (!optionsRes.ok) throw new Error('לא נמצאו מכשירים רשומים');
    const publicKey = decodeRequestOptions(await optionsRes.json());

    const assertion = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
    if (!assertion) throw new Error('האימות נכשל');
    const response = assertion.response as AuthenticatorAssertionResponse;

    const res = await postJson('/device/unlock', {
        id: bufferToBase64Url(assertion.rawId),
        clientDataJSON: bufferToBase64Url(response.clientDataJSON),
        authenticatorData: bufferToBase64Url(response.authenticatorData),
        signature: bufferToBase64Url(response.signature),
    });
    return res.json();
}

export function isWebAuthnSupported(): boolean {
    return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}
