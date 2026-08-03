import { useMemo, useRef, useState } from 'react';
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
import type { FamilyEvent } from '../types';
import { useLocalStorage } from '../lib/storage';
import DayModal, { dateKey } from './DayModal';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const SWIPE_THRESHOLD = 60;

export default function CalendarTab() {
  const [events, setEvents] = useLocalStorage<FamilyEvent[]>('family-events', []);
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

  const eventsByDay = useMemo(() => {
    const map = new Map<string, FamilyEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [events]);

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

  function addEvent(title: string, time: string, color: string) {
    if (!selectedDay) return;
    const ev: FamilyEvent = {
      id: crypto.randomUUID(),
      date: dateKey(selectedDay),
      title,
      time: time || undefined,
      color,
    };
    setEvents((prev) => [...prev, ev]);
  }

  function removeEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {format(cursor, 'MMMM yyyy')}
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={goToday}
            className="rounded-full px-3 py-1 text-sm font-medium text-blue-600 active:bg-blue-50 dark:text-blue-400 dark:active:bg-blue-950"
          >
            Today
          </button>
          <button
            aria-label="Previous month"
            onClick={goPrev}
            className="rounded-full p-2 text-neutral-500 active:bg-neutral-100 dark:active:bg-neutral-800"
          >
            ‹
          </button>
          <button
            aria-label="Next month"
            onClick={goNext}
            className="rounded-full p-2 text-neutral-500 active:bg-neutral-100 dark:active:bg-neutral-800"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 px-2 text-center text-xs font-medium text-neutral-400">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div
        className="flex-1 touch-pan-y overflow-hidden px-2"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          key={format(cursor, 'yyyy-MM')}
          className="grid h-full grid-cols-7 gap-1 transition-transform"
          style={{
            transform: `translateX(${dragX}px)`,
            animation: dragX === 0 ? `${direction === 1 ? 'slideInRight' : 'slideInLeft'} 0.18s ease-out` : undefined,
          }}
        >
          {days.map((day) => {
            const key = dateKey(day);
            const dayEvents = eventsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, cursor);
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-stretch rounded-lg p-1 text-left active:bg-neutral-100 dark:active:bg-neutral-800 ${
                  inMonth ? '' : 'opacity-35'
                }`}
              >
                <span
                  className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                    isToday(day)
                      ? 'bg-blue-600 font-semibold text-white'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                <div className="mt-0.5 flex flex-col items-center gap-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: ev.color ?? '#3b82f6' }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
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
  );
}
