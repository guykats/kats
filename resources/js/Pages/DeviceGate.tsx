import { useState } from 'react';
import { router } from '@inertiajs/react';
import { DEVICE_COLORS } from '../lib/colors';
import { isWebAuthnSupported, registerDevice, unlockDevice } from '../lib/webauthn';

type Props = {
    status: 'unauthenticated' | 'pending';
    isBootstrap: boolean;
};

export default function DeviceGate({ status, isBootstrap }: Props) {
    if (status === 'pending') {
        return (
            <Screen icon="⏳" title="ממתין לאישור">
                <p className="text-sm text-neutral-500">
                    בקשת הגישה שלך נשלחה. ברגע שמכשיר מנהל יאשר אותך, תוכלו להיכנס
                    לאפליקציה מכאן — אין צורך לעשות שום דבר נוסף.
                </p>
                <button
                    onClick={() => router.reload()}
                    className="rounded-full bg-neutral-200 px-5 py-2 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                >
                    בדיקה מחדש
                </button>
            </Screen>
        );
    }

    return <UnauthenticatedGate isBootstrap={isBootstrap} />;
}

function Screen({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
    return (
        <div className="mx-auto flex h-svh max-w-md flex-col items-center justify-center gap-4 bg-white px-6 text-center dark:bg-neutral-950">
            <div className="text-5xl">{icon}</div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{title}</h1>
            {children}
        </div>
    );
}

function UnauthenticatedGate({ isBootstrap }: { isBootstrap: boolean }) {
    const [name, setName] = useState('אדמין');
    const [color, setColor] = useState(DEVICE_COLORS[3]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supported = isWebAuthnSupported();

    async function handleRegister() {
        setBusy(true);
        setError(null);
        try {
            await registerDevice(name.trim() || 'אדמין', color);
            router.reload();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'משהו השתבש');
        } finally {
            setBusy(false);
        }
    }

    async function handleUnlock() {
        setBusy(true);
        setError(null);
        try {
            await unlockDevice();
            router.reload();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'משהו השתבש');
        } finally {
            setBusy(false);
        }
    }

    return (
        <Screen icon={isBootstrap ? '👑' : '🔒'} title={isBootstrap ? 'הגדרת המכשיר הראשי' : 'מכשיר לא מזוהה'}>
            {!supported && (
                <p className="text-sm text-red-500">המכשיר או הדפדפן הזה לא תומכים באימות ביומטרי.</p>
            )}

            {supported && isBootstrap && (
                <div className="flex w-full flex-col items-center gap-4">
                    <p className="text-sm text-neutral-500">
                        זהו המכשיר הראשון באפליקציה — הוא יהפוך למנהל וידע לאשר מכשירים
                        נוספים בהמשך. בחרו שם וצבע שיופיעו על משימות ואירועים שתוסיפו.
                    </p>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="השם שלך"
                        className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-center text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
                    />
                    <div className="flex gap-2">
                        {DEVICE_COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                aria-label={c}
                                className="h-9 w-9 rounded-full"
                                style={{
                                    background: c,
                                    outline: color === c ? '2px solid white' : undefined,
                                    boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
                                }}
                            />
                        ))}
                    </div>
                    <button
                        onClick={handleRegister}
                        disabled={busy}
                        className="rounded-full bg-blue-600 px-6 py-3 font-medium text-white disabled:opacity-40"
                    >
                        {busy ? 'מגדיר…' : '👆 הפוך למנהל עם Face ID / טביעת אצבע'}
                    </button>
                </div>
            )}

            {supported && !isBootstrap && (
                <div className="flex w-full flex-col items-center gap-3">
                    <p className="text-sm text-neutral-500">
                        המכשיר הזה עדיין לא מאושר. בקשו גישה, או אמתו את עצמכם אם המכשיר
                        הזה כבר אושר בעבר.
                    </p>
                    <button
                        onClick={handleRegister}
                        disabled={busy}
                        className="w-full rounded-full bg-blue-600 px-6 py-3 font-medium text-white disabled:opacity-40"
                    >
                        {busy ? 'שולח…' : '👆 בקשת גישה עם Face ID / טביעת אצבע'}
                    </button>
                    <button
                        onClick={handleUnlock}
                        disabled={busy}
                        className="w-full rounded-full bg-neutral-200 px-6 py-3 font-medium text-neutral-700 disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-200"
                    >
                        {busy ? 'מאמת…' : '🔓 כבר אושרתי, אמתו אותי'}
                    </button>
                </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
        </Screen>
    );
}
