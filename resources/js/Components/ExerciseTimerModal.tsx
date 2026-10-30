import { useEffect, useRef, useState } from 'react';
import type { Exercise } from '../types';

type Status = 'ready' | 'running' | 'paused' | 'done';

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BEEP_WINDOW = 5;

export default function ExerciseTimerModal({
    exercise,
    hasNext,
    onNext,
    onClose,
}: {
    exercise: Exercise;
    hasNext: boolean;
    onNext: () => void;
    onClose: () => void;
}) {
    const [status, setStatus] = useState<Status>('ready');
    const [remaining, setRemaining] = useState(exercise.duration_seconds);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
    const lastBeepedRef = useRef<number | null>(null);

    function ensureAudioContext() {
        if (!audioCtxRef.current) {
            const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            audioCtxRef.current = new Ctx();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }

    function beep(frequency = 880, duration = 150) {
        try {
            const ctx = ensureAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = frequency;
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
            osc.start();
            osc.stop(ctx.currentTime + duration / 1000);
        } catch {
            // audio not available — timer still works visually
        }
    }

    async function requestWakeLock() {
        try {
            const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } };
            wakeLockRef.current = (await nav.wakeLock?.request('screen')) ?? null;
        } catch {
            // wake lock unsupported or denied — not critical
        }
    }

    function releaseWakeLock() {
        wakeLockRef.current?.release().catch(() => {});
        wakeLockRef.current = null;
    }

    useEffect(() => {
        if (status !== 'running') return;

        const interval = setInterval(() => {
            setRemaining((prev) => {
                const next = prev - 1;
                if (next <= BEEP_WINDOW && next > 0 && lastBeepedRef.current !== next) {
                    lastBeepedRef.current = next;
                    beep();
                }
                if (next <= 0) {
                    beep(440, 350);
                    if (navigator.vibrate) navigator.vibrate(200);
                    return 0;
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    useEffect(() => {
        if (remaining === 0 && status === 'running') {
            setStatus('done');
            releaseWakeLock();
        }
    }, [remaining, status]);

    useEffect(() => () => releaseWakeLock(), []);

    function handlePlayPause() {
        ensureAudioContext();
        if (status === 'ready' || status === 'paused') {
            setStatus('running');
            requestWakeLock();
        } else if (status === 'running') {
            setStatus('paused');
            releaseWakeLock();
        }
    }

    const progress = remaining / exercise.duration_seconds;
    const offset = CIRCUMFERENCE * (1 - progress);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-neutral-950">
            <div className="flex items-center justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <button
                    onClick={onClose}
                    aria-label="סגירה"
                    className="rounded-full p-2 text-2xl text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-800"
                >
                    ✕
                </button>
            </div>

            <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto px-6 pb-8 text-center">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{exercise.title}</h1>

                {exercise.image_url && (
                    <img src={exercise.image_url} alt="" className="max-h-48 rounded-xl object-cover" />
                )}
                {exercise.video_url && (
                    <video src={exercise.video_url} controls className="max-h-48 rounded-xl" />
                )}
                {exercise.details && (
                    <p className="max-w-sm text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {exercise.details}
                    </p>
                )}

                {status !== 'done' && (
                    <div className="relative mt-2 flex h-56 w-56 shrink-0 items-center justify-center">
                        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
                            <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="currentColor" strokeWidth={10} className="text-neutral-200 dark:text-neutral-800" />
                            <circle
                                cx="100"
                                cy="100"
                                r={RADIUS}
                                fill="none"
                                stroke={remaining <= BEEP_WINDOW ? '#ef4444' : '#3b82f6'}
                                strokeWidth={10}
                                strokeLinecap="round"
                                strokeDasharray={CIRCUMFERENCE}
                                strokeDashoffset={offset}
                                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                            />
                        </svg>
                        <span className="absolute text-5xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                            {remaining}
                        </span>
                    </div>
                )}

                {status === 'done' && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                        <div className="animate-[popIn_0.4s_ease-out] text-7xl">{hasNext ? '✅' : '🎉'}</div>
                        {!hasNext && (
                            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                כל הכבוד, סיימתם את כל התרגילים!
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-4 border-t border-neutral-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-neutral-800">
                {status !== 'done' ? (
                    <button
                        onClick={handlePlayPause}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg active:opacity-80"
                        aria-label={status === 'running' ? 'השהיה' : 'התחלה'}
                    >
                        {status === 'running' ? '⏸️' : '▶️'}
                    </button>
                ) : hasNext ? (
                    <button
                        onClick={onNext}
                        className="rounded-full bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow-lg active:opacity-80"
                    >
                        התרגיל הבא ←
                    </button>
                ) : (
                    <button
                        onClick={onClose}
                        className="rounded-full bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow-lg active:opacity-80"
                    >
                        סיום
                    </button>
                )}
            </div>
        </div>
    );
}
