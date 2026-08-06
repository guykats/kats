import { useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    addDays,
    addMonths,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    isToday,
    startOfMonth,
    startOfWeek,
    subMonths,
} from 'date-fns';
import { he } from 'date-fns/locale';
import type { EventRecurrence, FamilyEvent } from '../types';
import AppLayout from '../Layouts/AppLayout';
import DayModal, { dateKey } from '../Components/DayModal';
import { getHebrewDayInfo } from '../lib/hebrewDate';
import { getEventsForDay, getWeekSegments } from '../lib/recurrence';

const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const SWIPE_THRESHOLD = 60;
const MAX_VISIBLE_LANES = 2;

export default function Calendar({ events }: { events: FamilyEvent[] }) {
    const [cursor, setCursor] = useState(() => new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [dragX, setDragX] = useState(0);
    const [direction, setDirection] = useState<1 | -1>(1);

    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const dragging = useRef(false);

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(cursor));
        const end = endOfWeek(endOfMonth(cursor));
        const result: Date[] = [];
        let d = start;
        while (d <= end) {
            result.push(d);
            d = addDays(d, 1);
        }
        return result;
    }, [cursor]);

    const weeks = useMemo(() => {
        const result: Date[][] = [];
        for (let i = 0; i < days.length; i += 7) {
            result.push(days.slice(i, i + 7));
        }
        return result;
    }, [days]);

    const eventsByDay = useMemo(() => {
        const map = new Map<string, FamilyEvent[]>();
        for (const day of days) {
            map.set(dateKey(day), getEventsForDay(events, day));
        }
        return map;
    }, [days, events]);

    const hebrewByDay = useMemo(() => {
        const map = new Map<string, ReturnType<typeof getHebrewDayInfo>>();
        for (const day of days) {
            map.set(dateKey(day), getHebrewDayInfo(day));
        }
        return map;
    }, [days]);

    function goPrev() {
        setDirection(-1);
        setCursor((c) => subMonths(c, 1));
    }
    function goNext() {
        setDirection(1);
        setCursor((c) => addMonths(c, 1));
    }
    function goToday() {
        setCursor(new Date());
    }

    function onTouchStart(e: React.TouchEvent) {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        dragging.current = false;
    }
    function onTouchMove(e: React.TouchEvent) {
        if (!touchStart.current) return;
        const dx = e.touches[0].clientX - touchStart.current.x;
        const dy = e.touches[0].clientY - touchStart.current.y;
        if (!dragging.current && Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        if (Math.abs(dx) > Math.abs(dy)) {
            dragging.current = true;
            setDragX(dx);
        }
    }
    function onTouchEnd() {
        if (dragging.current) {
            if (dragX <= -SWIPE_THRESHOLD) goNext();
            else if (dragX >= SWIPE_THRESHOLD) goPrev();
        }
        setDragX(0);
        touchStart.current = null;
        dragging.current = false;
    }

    function addEvent(title: string, time: string, color: string, recurrence: EventRecurrence, days: number) {
        if (!selectedDay) return;
        router.post(
            '/events',
            {
                date: dateKey(selectedDay),
                title,
                time: time || null,
                color,
                recurrence,
                days,
            },
            { preserveScroll: true, preserveState: true },
        );
    }

    function removeEvent(id: number) {
        router.delete(`/events/${id}`, { preserveScroll: true, preserveState: true });
    }

    return (
        <AppLayout>
            <div className="flex h-full flex-col bg-neutral-50 dark:bg-neutral-950">
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {format(cursor, 'MMMM yyyy', { locale: he })}
                    </h1>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={goToday}
                            className="rounded-full px-3 py-1.5 text-sm font-medium text-blue-600 active:bg-blue-50 dark:text-blue-400 dark:active:bg-blue-950"
                        >
                            היום
                        </button>
                        <button
                            aria-label="חודש קודם"
                            onClick={goPrev}
                            className="rounded-full p-2 text-lg text-neutral-500 active:bg-neutral-200 dark:active:bg-neutral-800"
                        >
                            ›
                        </button>
                        <button
                            aria-label="חודש הבא"
                            onClick={goNext}
                            className="rounded-full p-2 text-lg text-neutral-500 active:bg-neutral-200 dark:active:bg-neutral-800"
                        >
                            ‹
                        </button>
                    </div>
                </div>

                <div className="mx-3 flex-1 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800">
                    <div className="grid grid-cols-7 border-b border-neutral-100 px-2 text-center text-xs font-medium text-neutral-400 dark:border-neutral-800">
                        {WEEKDAYS.map((w, i) => (
                            <div key={i} className="py-2.5">
                                {w}
                            </div>
                        ))}
                    </div>

                    <div
                        className="h-[calc(100%-2.5rem)] touch-pan-y overflow-hidden px-2 py-1.5"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div
                            key={format(cursor, 'yyyy-MM')}
                            className="flex h-full flex-col justify-between"
                            style={{
                                transform: `translateX(${dragX}px)`,
                                animation:
                                    dragX === 0
                                        ? `${direction === 1 ? 'slideInRight' : 'slideInLeft'} 0.18s ease-out`
                                        : undefined,
                            }}
                        >
                            {weeks.map((weekDays) => {
                                const segments = getWeekSegments(events, weekDays);
                                const visibleSegments = segments.filter((s) => s.lane < MAX_VISIBLE_LANES);
                                const laneCount = Math.min(
                                    MAX_VISIBLE_LANES,
                                    segments.reduce((max, s) => Math.max(max, s.lane + 1), 0),
                                );

                                return (
                                    <div key={weekDays[0].toISOString()} className="py-1">
                                        <div className="grid grid-cols-7">
                                            {weekDays.map((day) => {
                                                const key = dateKey(day);
                                                const dayEvents = eventsByDay.get(key) ?? [];
                                                const inMonth = isSameMonth(day, cursor);
                                                const hebrewInfo = hebrewByDay.get(key);
                                                const hasHoliday = (hebrewInfo?.holidays.length ?? 0) > 0;
                                                const today = isToday(day);
                                                const isShabbat = day.getDay() === 6;
                                                const tooltip = dayEvents
                                                    .slice()
                                                    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
                                                    .map((ev) => (ev.time ? `${ev.time.slice(0, 5)} ${ev.title}` : ev.title))
                                                    .join('\n');

                                                let circleClass = 'text-neutral-700 dark:text-neutral-300';
                                                if (today) {
                                                    circleClass = 'bg-blue-600 font-semibold text-white';
                                                } else if (hasHoliday) {
                                                    circleClass =
                                                        'bg-amber-100 font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
                                                }

                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => setSelectedDay(day)}
                                                        title={tooltip || undefined}
                                                        className={`relative flex flex-col items-stretch gap-0.5 rounded-xl py-1 text-center active:bg-neutral-100 dark:active:bg-neutral-800 ${
                                                            inMonth ? '' : 'opacity-35'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm ${circleClass}`}
                                                        >
                                                            {format(day, 'd')}
                                                            {hasHoliday && today && (
                                                                <span className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-neutral-900" />
                                                            )}
                                                        </span>
                                                        <span className="text-[9px] leading-none text-neutral-400">
                                                            {hebrewInfo?.dayNumeral}
                                                        </span>
                                                        {isShabbat && hebrewInfo?.parasha && (
                                                            <span className="truncate text-[8px] leading-tight text-neutral-400">
                                                                {hebrewInfo.parasha}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {laneCount > 0 && (
                                            <div className="relative mt-1 grid grid-cols-7 gap-y-1">
                                                {visibleSegments.map((seg, i) => (
                                                    <span
                                                        key={i}
                                                        className={`h-1.5 self-start ${
                                                            seg.isTrueStart ? 'rounded-s-full' : ''
                                                        } ${seg.isTrueEnd ? 'rounded-e-full' : ''}`}
                                                        style={{
                                                            gridColumn: `${seg.startCol} / ${seg.endCol + 1}`,
                                                            gridRow: seg.lane + 1,
                                                            background: seg.event.color ?? '#3b82f6',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {selectedDay && (
                    <DayModal
                        date={selectedDay}
                        events={eventsByDay.get(dateKey(selectedDay)) ?? []}
                        onAdd={addEvent}
                        onRemove={removeEvent}
                        onClose={() => setSelectedDay(null)}
                    />
                )}
            </div>
        </AppLayout>
    );
}
