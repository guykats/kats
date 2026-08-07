import { useState } from 'react';
import { router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { Task } from '../types';
import AppLayout from '../Layouts/AppLayout';
import ThemeToggle from '../Components/ThemeToggle';

export default function Tasks({ tasks }: { tasks: Task[] }) {
    const [title, setTitle] = useState('');
    const [historyTaskId, setHistoryTaskId] = useState<number | null>(null);

    function addTask() {
        const trimmed = title.trim();
        if (!trimmed) return;
        router.post('/tasks', { title: trimmed }, { preserveScroll: true, preserveState: true });
        setTitle('');
    }

    function removeTask(id: number) {
        router.delete(`/tasks/${id}`, { preserveScroll: true, preserveState: true });
    }

    function completeTask(taskId: number) {
        router.post('/task-completions', { task_id: taskId }, { preserveScroll: true, preserveState: true });
    }

    function removeCompletion(id: number) {
        router.delete(`/task-completions/${id}`, { preserveScroll: true, preserveState: true });
    }

    return (
        <AppLayout>
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        משימות
                    </h1>
                    <ThemeToggle />
                </div>

                <div className="flex-1 overflow-y-auto px-4">
                    {tasks.length === 0 && (
                        <p className="mt-8 text-center text-sm text-neutral-400">
                            אין עדיין משימות. הוסיפו משימה למטה.
                        </p>
                    )}

                    <ul className="space-y-2 pb-4">
                        {tasks.map((task) => {
                            const latest = task.completions[0] ?? null;
                            const historyOpen = historyTaskId === task.id;

                            return (
                                <li
                                    key={task.id}
                                    className="rounded-lg bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800"
                                >
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                setHistoryTaskId(historyOpen ? null : task.id)
                                            }
                                            className="min-w-0 flex-1 text-right"
                                        >
                                            <div className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                                                {task.title}
                                            </div>
                                            <div className="truncate text-xs text-neutral-500">
                                                {latest?.device
                                                    ? `בוצע לאחרונה: ${latest.device.name} · ${formatDistanceToNow(
                                                          new Date(latest.completed_at),
                                                          { addSuffix: true, locale: he },
                                                      )}`
                                                    : 'עדיין לא בוצע'}
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => completeTask(task.id)}
                                            className="shrink-0 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                                        >
                                            ✓ בוצע
                                        </button>
                                        <button
                                            onClick={() => removeTask(task.id)}
                                            aria-label="הסר משימה"
                                            className="shrink-0 rounded-full p-1.5 text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {historyOpen && (
                                        <ul className="mt-2 space-y-1 border-t border-neutral-200 pt-2 dark:border-neutral-700">
                                            {task.completions.length === 0 && (
                                                <li className="text-xs text-neutral-400">
                                                    אין היסטוריה עדיין.
                                                </li>
                                            )}
                                            {task.completions.map((c) => (
                                                <li
                                                    key={c.id}
                                                    className="flex items-center justify-between text-xs text-neutral-500"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        {c.device && (
                                                            <span
                                                                className="h-2 w-2 shrink-0 rounded-full"
                                                                style={{ background: c.device.color }}
                                                            />
                                                        )}
                                                        {c.device?.name ?? 'מכשיר לא ידוע'} ·{' '}
                                                        {formatDistanceToNow(new Date(c.completed_at), {
                                                            addSuffix: true,
                                                            locale: he,
                                                        })}
                                                    </span>
                                                    <button
                                                        onClick={() => removeCompletion(c.id)}
                                                        aria-label="הסר רישום"
                                                        className="shrink-0 rounded-full p-1 text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700"
                                                    >
                                                        ✕
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="flex items-center gap-2 border-t border-neutral-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-neutral-800">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTask()}
                        placeholder="הוסיפו משימה…"
                        className="flex-1 rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
                    />
                    <button
                        onClick={addTask}
                        disabled={!title.trim()}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white disabled:opacity-40"
                    >
                        הוספה
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
