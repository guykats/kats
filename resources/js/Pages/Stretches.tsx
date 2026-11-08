import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import type { Exercise, WeekStatusDay } from '../types';
import AppLayout from '../Layouts/AppLayout';
import ThemeToggle from '../Components/ThemeToggle';
import ExerciseTimerModal from '../Components/ExerciseTimerModal';

export default function Stretches({
    exercises: initialExercises,
    weekStatus: initialWeekStatus,
}: {
    exercises: Exercise[];
    weekStatus: WeekStatusDay[];
}) {
    const [exercises, setExercises] = useState(initialExercises);
    useEffect(() => setExercises(initialExercises), [initialExercises]);

    const [weekStatus, setWeekStatus] = useState(initialWeekStatus);
    useEffect(() => setWeekStatus(initialWeekStatus), [initialWeekStatus]);

    const [addOpen, setAddOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    function toggleExercise(exercise: Exercise) {
        const nextDone = !exercise.done_today;
        const updated = exercises.map((e) => (e.id === exercise.id ? { ...e, done_today: nextDone } : e));
        setExercises(updated);

        const allDone = updated.length > 0 && updated.every((e) => e.done_today);
        setWeekStatus((prev) => prev.map((d) => (d.is_today ? { ...d, done: allDone } : d)));

        router.post(`/exercises/${exercise.id}/toggle`, {}, { preserveScroll: true, preserveState: true });
    }

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
                    <WeekStatusBar days={weekStatus} />

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
                                    onClick={() => toggleExercise(exercise)}
                                    aria-label={exercise.done_today ? 'סמן כלא בוצע היום' : 'סמן כבוצע היום'}
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs text-white ${
                                        exercise.done_today
                                            ? 'border-blue-600 bg-blue-600'
                                            : 'border-neutral-300 dark:border-neutral-500'
                                    }`}
                                >
                                    {exercise.done_today && '✓'}
                                </button>
                                <button
                                    onClick={() => setActiveIndex(i)}
                                    className="flex min-w-0 flex-1 items-center gap-3 text-right"
                                >
                                    {exercise.image_url ? (
                                        <img src={exercise.image_url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                                    ) : exercise.youtube_id ? (
                                        <img
                                            src={`https://img.youtube.com/vi/${exercise.youtube_id}/mqdefault.jpg`}
                                            alt=""
                                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                                        />
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

function WeekStatusBar({ days }: { days: WeekStatusDay[] }) {
    const doneCount = days.filter((d) => d.done).length;

    return (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
            <div className="flex gap-2">
                {days.map((day) => (
                    <div key={day.date} className="flex flex-col items-center gap-1">
                        <span
                            className={`text-[10px] font-medium ${
                                day.is_today ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400'
                            }`}
                        >
                            {day.label}
                        </span>
                        <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] text-white ${
                                day.done
                                    ? 'border-blue-600 bg-blue-600'
                                    : day.is_today
                                      ? 'border-blue-400 dark:border-blue-500'
                                      : 'border-neutral-300 dark:border-neutral-600'
                            }`}
                        >
                            {day.done && '✓'}
                        </span>
                    </div>
                ))}
            </div>
            <span className="shrink-0 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {doneCount}/7 השבוע
            </span>
        </div>
    );
}

function AddExerciseForm({ onClose }: { onClose: () => void }) {
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('');
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [details, setDetails] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [video, setVideo] = useState<File | null>(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [youtubeStart, setYoutubeStart] = useState('');
    const [youtubeEnd, setYoutubeEnd] = useState('');
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<Record<string, string> | null>(null);

    function submit() {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;
        const seconds = duration.trim() ? parseInt(duration, 10) : null;
        if (duration.trim() && (!seconds || seconds < 1)) return;

        setBusy(true);
        setErrors(null);
        router.post(
            '/exercises',
            {
                title: trimmedTitle,
                duration_seconds: seconds,
                details: details.trim() || null,
                image: image ?? undefined,
                video: video ?? undefined,
                youtube_url: youtubeUrl.trim() || null,
                youtube_start: youtubeStart.trim() ? parseInt(youtubeStart, 10) : null,
                youtube_end: youtubeEnd.trim() ? parseInt(youtubeEnd, 10) : null,
            },
            {
                preserveScroll: true,
                preserveState: true,
                forceFormData: true,
                onFinish: () => setBusy(false),
                onSuccess: onClose,
                onError: (receivedErrors) => {
                    setErrors(
                        Object.keys(receivedErrors).length
                            ? receivedErrors
                            : { general: 'ההוספה נכשלה — ייתכן שהקובץ גדול מדי. נסו קובץ קטן יותר.' },
                    );
                },
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

                    <input
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="קישור ליוטיוב (אופציונלי)"
                        dir="ltr"
                        className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-left text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
                    />
                    {youtubeUrl.trim() && (
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={0}
                                value={youtubeStart}
                                onChange={(e) => setYoutubeStart(e.target.value)}
                                placeholder="0"
                                className="w-20 rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-center text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
                            />
                            <span className="text-sm text-neutral-500">עד</span>
                            <input
                                type="number"
                                min={1}
                                value={youtubeEnd}
                                onChange={(e) => setYoutubeEnd(e.target.value)}
                                placeholder="שניות"
                                className="w-20 rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-center text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
                            />
                            <span className="text-sm text-neutral-500">(אופציונלי)</span>
                        </div>
                    )}
                </div>
            )}

            {errors && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                    {Object.values(errors).map((message, i) => (
                        <p key={i}>{message}</p>
                    ))}
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
