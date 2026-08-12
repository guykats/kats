import { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import type { CurrentDevice, Task } from '../types';
import AppLayout from '../Layouts/AppLayout';
import ThemeToggle from '../Components/ThemeToggle';

export default function ParentTasks({ tasks: initialTasks }: { tasks: Task[] }) {
    const [tasks, setTasks] = useState(initialTasks);
    useEffect(() => setTasks(initialTasks), [initialTasks]);

    const currentDevice = usePage().props.device as CurrentDevice | null;
    const [title, setTitle] = useState('');

    const pending = tasks.filter((t) => !t.done);
    const done = tasks.filter((t) => t.done);

    function addTask() {
        const trimmed = title.trim();
        if (!trimmed) return;
        router.post('/parent-tasks', { title: trimmed }, { preserveScroll: true, preserveState: true });
        setTitle('');
    }

    function toggleTask(task: Task) {
        const nextDone = !task.done;
        setTasks((prev) =>
            prev.map((t) =>
                t.id === task.id
                    ? {
                          ...t,
                          done: nextDone,
                          completed_by: nextDone && currentDevice
                              ? { id: 0, name: currentDevice.name, color: currentDevice.color }
                              : t.completed_by,
                      }
                    : t,
            ),
        );
        router.patch(`/parent-tasks/${task.id}`, { done: nextDone }, { preserveScroll: true, preserveState: true });
    }

    function removeTask(id: number) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        router.delete(`/parent-tasks/${id}`, { preserveScroll: true, preserveState: true });
    }

    function resetDone() {
        done.forEach((task) => toggleTask(task));
    }

    return (
        <AppLayout>
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        🔒 משימות הורים
                    </h1>
                    <ThemeToggle />
                </div>

                <div className="flex-1 overflow-y-auto px-4">
                    {tasks.length === 0 && (
                        <p className="mt-8 text-center text-sm text-neutral-400">
                            אין עדיין משימות. הוסיפו משימה למטה.
                        </p>
                    )}

                    {pending.length > 0 && (
                        <ul className="space-y-2">
                            {pending.map((task) => (
                                <TaskRow
                                    key={task.id}
                                    task={task}
                                    onToggle={() => toggleTask(task)}
                                    onRemove={() => removeTask(task.id)}
                                />
                            ))}
                        </ul>
                    )}

                    {done.length > 0 && (
                        <>
                            <div className="mt-4 mb-2 flex items-center justify-between">
                                <span className="text-xs font-medium tracking-wide text-neutral-400">
                                    בוצעו ({done.length})
                                </span>
                                <button
                                    onClick={resetDone}
                                    className="text-xs font-medium text-blue-600 dark:text-blue-400"
                                >
                                    איפוס
                                </button>
                            </div>
                            <ul className="space-y-2 pb-4">
                                {done.map((task) => (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        onToggle={() => toggleTask(task)}
                                        onRemove={() => removeTask(task.id)}
                                    />
                                ))}
                            </ul>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 border-t border-neutral-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-neutral-800">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTask()}
                        placeholder="הוסיפו משימת הורים…"
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

function TaskRow({
    task,
    onToggle,
    onRemove,
}: {
    task: Task;
    onToggle: () => void;
    onRemove: () => void;
}) {
    return (
        <li className="flex items-center gap-3 rounded-lg bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
            <button
                onClick={onToggle}
                aria-label={task.done ? 'סמן כלא בוצע' : 'סמן כבוצע'}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs text-white ${
                    task.done
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-neutral-300 dark:border-neutral-500'
                }`}
            >
                {task.done && '✓'}
            </button>
            <span
                className={`min-w-0 flex-1 truncate ${
                    task.done
                        ? 'text-neutral-400 line-through'
                        : 'text-neutral-900 dark:text-neutral-100'
                }`}
            >
                {task.title}
            </span>
            {task.done && task.completed_by && (
                <span
                    className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: `${task.completed_by.color}22`, color: task.completed_by.color }}
                >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: task.completed_by.color }} />
                    {task.completed_by.name}
                </span>
            )}
            <button
                onClick={onRemove}
                aria-label="הסר משימה"
                className="shrink-0 rounded-full p-1.5 text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700"
            >
                ✕
            </button>
        </li>
    );
}
