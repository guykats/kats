import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import type { EventRecurrence, FamilyEvent } from '../types';
import { getHebrewDayInfo } from '../lib/hebrewDate';

const COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];

const RECURRENCE_OPTIONS: { value: EventRecurrence; label: string }[] = [
    { value: 'none', label: 'לא חוזר' },
    { value: 'weekly', label: 'כל שבוע' },
    { value: 'monthly', label: 'כל חודש' },
    { value: 'yearly', label: 'כל שנה' },
];

const RECURRENCE_LABELS: Record<EventRecurrence, string> = {
    none: 'לא חוזר',
    weekly: 'כל שבוע',
    monthly: 'כל חודש',
    yearly: 'כל שנה',
};

type Props = {
    date: Date;
    events: FamilyEvent[];
    onAdd: (title: string, time: string, color: string, recurrence: EventRecurrence, days: number) => void;
    onRemove: (id: number) => void;
    onClose: () => void;
};

export default function DayModal({ date, events, onAdd, onRemove, onClose }: Props) {
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('');
    const [color, setColor] = useState(COLORS[3]);
    const [recurrence, setRecurrence] = useState<EventRecurrence>('none');
    const [days, setDays] = useState('1');

    const sorted = [...events].sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    const hebrewInfo = useMemo(() => getHebrewDayInfo(date), [date]);

    function handleAdd() {
        const trimmed = title.trim();
        if (!trimmed) return;
        const parsedDays = Math.max(1, parseInt(days, 10) || 1);
        onAdd(trimmed, time, color, recurrence, parsedDays);
        setTitle('');
        setTime('');
        setRecurrence('none');
        setDays('1');
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl animate-[slideUp_0.2s_ease-out] dark:bg-neutral-900"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {format(date, 'EEEE, d בMMMM', { locale: he })}
                </h2>
                <div className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                    <span>{hebrewInfo.fullDate}</span>
                    {hebrewInfo.holidays.map((holiday) => (
                        <span
                            key={holiday}
                            className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        >
                            {holiday}
                        </span>
                    ))}
                    {hebrewInfo.parasha && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                            פרשת {hebrewInfo.parasha}
                        </span>
                    )}
                </div>

                <div className="mb-4 max-h-56 space-y-2 overflow-y-auto">
                    {sorted.length === 0 && (
                        <p className="text-sm text-neutral-500">אין עדיין אירועים.</p>
                    )}
                    {sorted.map((ev) => (
                        <div
                            key={ev.id}
                            className="flex items-center justify-between rounded-lg bg-neutral-100 px-3 py-2 dark:bg-neutral-800"
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ background: ev.color ?? COLORS[3] }}
                                />
                                <div className="truncate">
                                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                        {ev.title}
                                    </span>
                                    {ev.time && (
                                        <span className="ms-2 text-sm text-neutral-500">
                                            {ev.time.slice(0, 5)}
                                        </span>
                                    )}
                                    {ev.recurrence !== 'none' && (
                                        <span className="ms-2 text-xs text-neutral-400">
                                            ⟲ {RECURRENCE_LABELS[ev.recurrence]}
                                        </span>
                                    )}
                                    {ev.days > 1 && (
                                        <span className="ms-2 text-xs text-neutral-400">
                                            ({ev.days} ימים)
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                aria-label="הסר אירוע"
                                onClick={() => onRemove(ev.id)}
                                className="shrink-0 rounded-full p-1.5 text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                <div className="space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="הוסף אירוע"
                        className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <div className="flex items-center gap-2">
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
                        />
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min={1}
                                max={365}
                                value={days}
                                onChange={(e) => setDays(e.target.value)}
                                className="w-14 rounded-lg border border-neutral-300 bg-transparent px-2 py-2 text-center text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
                            />
                            <span className="text-xs text-neutral-400">ימים</span>
                        </div>
                        <div className="flex flex-1 justify-end gap-1.5">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    aria-label={`צבע ${c}`}
                                    onClick={() => setColor(c)}
                                    className="h-7 w-7 rounded-full"
                                    style={{
                                        background: c,
                                        outline: color === c ? '2px solid white' : undefined,
                                        outlineOffset: color === c ? '-3px' : undefined,
                                        boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        {RECURRENCE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setRecurrence(opt.value)}
                                className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${
                                    recurrence === opt.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={!title.trim()}
                        className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white disabled:opacity-40"
                    >
                        הוספת אירוע
                    </button>
                </div>
            </div>
        </div>
    );
}

export function dateKey(date: Date) {
    return format(date, 'yyyy-MM-dd');
}

export function keyToDate(key: string) {
    return parseISO(key);
}
