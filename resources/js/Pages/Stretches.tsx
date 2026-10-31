import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { Exercise } from '../types';
import AppLayout from '../Layouts/AppLayout';
import ThemeToggle from '../Components/ThemeToggle';
import ExerciseTimerModal from '../Components/ExerciseTimerModal';

export default function Stretches({ exercises }: { exercises: Exercise[] }) {
    const [addOpen, setAddOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    function removeExercise(id: number) {
        router.delete(`/exercises/${id}`, { preserveScroll: true, preserveState: true });
    }

    return (
        <AppLayout>
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">מתיחות</h1>
                    <ThemeToggle />
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {exercises.length === 0 && !addOpen && (
                        <p className="mt-8 text-center text-sm text-neutral-400">
                            אין עדיין תרגילים. הוסיפו תרגיל למטה.
                        </p>
                    )}

                    <ul className="space-y-2">
                        {exercises.map((exercise, i) => (
                            <li
                                key={exercise.id}
                                className="flex items-center gap-3 rounded-lg bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800"
                            >
                                <button
                                    onClick={() => setActiveIndex(i)}
                                    className="flex min-w-0 flex-1 items-center gap-3 text-right"
                                >
                                    {exercise.image_url ? (
                                        <img src={exercise.image_url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                                    ) : (
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-200 text-lg dark:bg-neutral-700">
                                            🧘
                                        </span>
                                    )}
                                    <span className="min-w-0 flex-1 truncate font-medium text-neutral-900 dark:text-neutral-100">
                                        {exercise.title}
                                    </span>
                                    <span className="shrink-0 text-xs text-neutral-400">
                                        {exercise.duration_seconds != null ? `${exercise.duration_seconds} שנ'` : 'ללא טיימר'}
                                    </span>
                                </button>
                                <button
                                    onClick={() => removeExercise(exercise.id)}
                                    aria-label="הסר תרגיל"
                                    className="shrink-0 rounded-full p-1.5 text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4">
                        {!addOpen ? (
                            <button
                                onClick={() => setAddOpen(true)}
                                className="w-full rounded-lg border border-dashed border-neutral-300 py-2.5 text-sm font-medium text-blue-600 dark:border-neutral-700 dark:text-blue-400"
                            >
                                + הוספת תרגיל
                            </button>
                        ) : (
                            <AddExerciseForm onClose={() => setAddOpen(false)} />
                        )}
                    </div>
                </div>
            </div>

            {activeIndex !== null && exercises[activeIndex] && (
                <ExerciseTimerModal
                    key={exercises[activeIndex].id}
                    exercise={exercises[activeIndex]}
                    hasNext={activeIndex < exercises.length - 1}
                    onNext={() => setActiveIndex((i) => (i !== null ? i + 1 : null))}
                    onClose={() => setActiveIndex(null)}
                />
            )}
        </AppLayout>
    );
}

function AddExerciseForm({ onClose }: { onClose: () => void }) {
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('');
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [details, setDetails] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [video, setVideo] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);

    function submit() {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;
        const seconds = duration.trim() ? parseInt(duration, 10) : null;
        if (duration.trim() && (!seconds || seconds < 1)) return;

        setBusy(true);
        router.post(
            '/exercises',
            {
                title: trimmedTitle,
                duration_seconds: seconds,
                details: details.trim() || null,
                image: image ?? undefined,
                video: video ?? undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                forceFormData: true,
                onFinish: () => setBusy(false),
                onSuccess: onClose,
            },
        );
    }

    return (
        <div className="flex flex-col gap-3 rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="שם התרגיל"
                className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
            />
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-24 rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-center text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
                />
                <span className="text-sm text-neutral-500">שניות</span>
            </div>

            {!detailsOpen ? (
                <button
                    onClick={() => setDetailsOpen(true)}
                    className="text-right text-sm font-medium text-blue-600 dark:text-blue-400"
                >
                    + הוספת פרטים (אופציונלי)
                </button>
            ) : (
                <div className="flex flex-col gap-2">
                    <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="טקסט עם הסבר על התרגיל…"
                        rows={3}
                        className="resize-none rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
                    />
                    <label className="flex items-center justify-between rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-600 dark:text-neutral-300">
                        <span>{image ? image.name : 'הוספת תמונה'}</span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                        />
                        <span className="text-blue-600 dark:text-blue-400">בחירה</span>
                    </label>
                    <label className="flex items-center justify-between rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-600 dark:text-neutral-300">
                        <span>{video ? video.name : 'הוספת סרטון'}</span>
                        <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
                        />
                        <span className="text-blue-600 dark:text-blue-400">בחירה</span>
                    </label>
                </div>
            )}

            <div className="flex gap-2">
                <button
                    onClick={submit}
                    disabled={!title.trim() || busy}
                    className="flex-1 rounded-lg bg-blue-600 py-2.5 font-medium text-white disabled:opacity-40"
                >
                    {busy ? 'מוסיף…' : 'הוספה'}
                </button>
                <button
                    onClick={onClose}
                    className="rounded-lg px-4 py-2.5 font-medium text-neutral-500 dark:text-neutral-400"
                >
                    ביטול
                </button>
            </div>
        </div>
    );
}
