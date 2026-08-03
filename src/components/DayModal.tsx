import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { FamilyEvent } from '../types';

const COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];

type Props = {
  date: Date;
  events: FamilyEvent[];
  onAdd: (title: string, time: string, color: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
};

export default function DayModal({ date, events, onAdd, onRemove, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [color, setColor] = useState(COLORS[3]);

  const sorted = [...events].sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));

  function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, time, color);
    setTitle('');
    setTime('');
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
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {format(date, 'EEEE, MMM d')}
        </h2>

        <div className="mb-4 max-h-56 space-y-2 overflow-y-auto">
          {sorted.length === 0 && (
            <p className="text-sm text-neutral-500">No events yet.</p>
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
                    <span className="ml-2 text-sm text-neutral-500">{ev.time}</span>
                  )}
                </div>
              </div>
              <button
                aria-label="Remove event"
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
            placeholder="Add an event"
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
            <div className="flex flex-1 justify-end gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full ring-offset-2"
                  style={{
                    background: c,
                    boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
                    outline: color === c ? '2px solid white' : undefined,
                    outlineOffset: color === c ? '-3px' : undefined,
                  }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white disabled:opacity-40"
          >
            Add event
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
