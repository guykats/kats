import { useState } from 'react';
import { router } from '@inertiajs/react';
import PatternLock from '../Components/PatternLock';

type Props = {
    hasPattern: boolean;
};

export default function ParentLockGate({ hasPattern }: Props) {
    return hasPattern ? <UnlockScreen /> : <SetupScreen />;
}

function Screen({ icon, title, subtitle, children }: { icon: string; title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="mx-auto flex h-svh max-w-md flex-col items-center justify-center gap-4 bg-white px-6 text-center dark:bg-neutral-950">
            <div className="text-5xl">{icon}</div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{title}</h1>
            <p className="text-sm text-neutral-500">{subtitle}</p>
            {children}
        </div>
    );
}

function UnlockScreen() {
    const [attemptKey, setAttemptKey] = useState(0);
    const [showError, setShowError] = useState(false);
    const [busy, setBusy] = useState(false);

    function handleComplete(pattern: number[]) {
        setBusy(true);
        router.post(
            '/parent-lock/unlock',
            { pattern },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    setBusy(false);
                    setShowError(true);
                    setTimeout(() => {
                        setShowError(false);
                        setAttemptKey((k) => k + 1);
                    }, 400);
                },
                onSuccess: () => setBusy(false),
            },
        );
    }

    return (
        <Screen icon="🔒" title="קוד הורים" subtitle={busy ? 'בודק…' : 'ציירו את התבנית לכניסה'}>
            <PatternLock key={attemptKey} onComplete={handleComplete} error={showError} />
            {showError && <p className="text-sm text-red-500">התבנית לא נכונה, נסו שוב</p>}
        </Screen>
    );
}

function SetupScreen() {
    const [first, setFirst] = useState<number[] | null>(null);
    const [mismatch, setMismatch] = useState(false);
    const [attemptKey, setAttemptKey] = useState(0);
    const [busy, setBusy] = useState(false);

    function handleComplete(pattern: number[]) {
        if (!first) {
            setFirst(pattern);
            setAttemptKey((k) => k + 1);
            return;
        }

        const same = first.length === pattern.length && first.every((v, i) => v === pattern[i]);
        if (!same) {
            setMismatch(true);
            setFirst(null);
            setAttemptKey((k) => k + 1);
            setTimeout(() => setMismatch(false), 1500);
            return;
        }

        setBusy(true);
        router.post('/parent-lock/set', { pattern }, { preserveScroll: true, preserveState: true });
    }

    return (
        <Screen
            icon="🔒"
            title="הגדרת קוד הורים"
            subtitle={
                busy
                    ? 'שומר…'
                    : mismatch
                      ? 'התבניות לא תאמו, נסו שוב מההתחלה'
                      : first
                        ? 'ציירו שוב לאישור'
                        : 'ציירו תבנית חדשה (לפחות 4 נקודות) — תגנו כך על טאב הורים ועל פאנל הניהול'
            }
        >
            <PatternLock key={attemptKey} onComplete={handleComplete} error={mismatch} />
        </Screen>
    );
}
