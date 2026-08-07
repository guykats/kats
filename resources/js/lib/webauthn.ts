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

export async function registerParentLock(): Promise<void> {
    const optionsRes = await fetch('/parent-lock/register-options');
    if (!optionsRes.ok) throw new Error('לא ניתן להתחיל הרשמה');
    const publicKey = decodeCreationOptions(await optionsRes.json());

    const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
    if (!credential) throw new Error('ההרשמה נכשלה');
    const response = credential.response as AuthenticatorAttestationResponse;

    await postJson('/parent-lock/register', {
        clientDataJSON: bufferToBase64Url(response.clientDataJSON),
        attestationObject: bufferToBase64Url(response.attestationObject),
    });
}

export async function unlockParentLock(): Promise<void> {
    const optionsRes = await fetch('/parent-lock/unlock-options');
    if (!optionsRes.ok) throw new Error('לא הוגדרה נעילה');
    const publicKey = decodeRequestOptions(await optionsRes.json());

    const assertion = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
    if (!assertion) throw new Error('הפתיחה נכשלה');
    const response = assertion.response as AuthenticatorAssertionResponse;

    await postJson('/parent-lock/unlock', {
        id: bufferToBase64Url(assertion.rawId),
        clientDataJSON: bufferToBase64Url(response.clientDataJSON),
        authenticatorData: bufferToBase64Url(response.authenticatorData),
        signature: bufferToBase64Url(response.signature),
    });
}

export function isWebAuthnSupported(): boolean {
    return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}
