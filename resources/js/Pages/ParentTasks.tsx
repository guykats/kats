import { useState } from 'react';
import { router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { FamilyMember, ParentTasksPageProps, Task } from '../types';
import AppLayout from '../Layouts/AppLayout';
import ThemeToggle from '../Components/ThemeToggle';
import { getCookie, setCookie } from '../lib/cookie';
import { isWebAuthnSupported, registerParentLock, unlockParentLock } from '../lib/webauthn';

const LAST_MEMBER_COOKIE = 'lastFamilyMemberId';

export default function ParentTasks(props: ParentTasksPageProps) {
    if (!props.unlocked) {
        return <LockScreen hasCredential={props.hasCredential} />;
    }

    return <UnlockedTasks tasks={props.tasks} familyMembers={props.familyMembers} />;
}

function LockScreen({ hasCredential }: { hasCredential: boolean }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supported = isWebAuthnSupported();

    async function handleUnlock() {
        setBusy(true);
        setError(null);
        try {
            if (hasCredential) {
                await unlockParentLock();
            } else {
                await registerParentLock();
            }
            router.reload();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'משהו השתבש');
        } finally {
            setBusy(false);
        }
    }

    return (
        <AppLayout>
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="text-5xl">🔒</div>
                <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    משימות הורים
                </h1>
                <p className="text-sm text-neutral-500">
                    {hasCredential
                        ? 'האזור נעול. פתחו עם Face ID או טביעת אצבע.'
                        : 'הגדירו נעילה עם Face ID או טביעת אצבע כדי להמשיך.'}
                </p>

                {!supported && (
                    <p className="text-sm text-red-500">
                        המכשיר או הדפדפן הזה לא תומכים באימות ביומטרי.
                    </p>
                )}

                {supported && (
                    <button
                        onClick={handleUnlock}
                        disabled={busy}
                        className="rounded-full bg-blue-600 px-6 py-3 font-medium text-white disabled:opacity-40"
                    >
                        {busy ? 'מאמת…' : hasCredential ? '🔓 פתיחה' : '👆 הגדרת נעילה'}
                    </button>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        </AppLayout>
    );
}

function UnlockedTasks({
    tasks,
    familyMembers,
}: {
    tasks: Task[];
    familyMembers: FamilyMember[];
}) {
    const [title, setTitle] = useState('');
    const [lastMemberId, setLastMemberId] = useState<number | null>(() => {
        const stored = getCookie(LAST_MEMBER_COOKIE);
        return stored ? Number(stored) : null;
    });
    const [pickerTaskId, setPickerTaskId] = useState<number | null>(null);
    const [historyTaskId, setHistoryTaskId] = useState<number | null>(null);

    function addTask() {
        const trimmed = title.trim();
        if (!trimmed) return;
        router.post('/parent-tasks', { title: trimmed }, { preserveScroll: true, preserveState: true });
        setTitle('');
    }

    function removeTask(id: number) {
        router.delete(`/parent-tasks/${id}`, { preserveScroll: true, preserveState: true });
    }

    function completeTask(taskId: number, memberId: number) {
        setLastMemberId(memberId);
        setCookie(LAST_MEMBER_COOKIE, String(memberId));
        setPickerTaskId(null);
        router.post(
            '/task-completions',
            { task_id: taskId, family_member_id: memberId },
            { preserveScroll: true, preserveState: true },
        );
    }

    function removeCompletion(id: number) {
        router.delete(`/task-completions/${id}`, { preserveScroll: true, preserveState: true });
    }

    const lastMember = familyMembers.find((m) => m.id === lastMemberId) ?? null;

    return (
        <AppLayout>
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        🔓 משימות הורים
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
                            const pickerOpen = pickerTaskId === task.id;
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
                                                {latest
                                                    ? `בוצע לאחרונה: ${latest.family_member.name} · ${formatDistanceToNow(
                                                          new Date(latest.completed_at),
                                                          { addSuffix: true, locale: he },
                                                      )}`
                                                    : 'עדיין לא בוצע'}
                                            </div>
                                        </button>

                                        <button
                                            onClick={() =>
                                                lastMember
                                                    ? completeTask(task.id, lastMember.id)
                                                    : setPickerTaskId(task.id)
                                            }
                                            className="shrink-0 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                                        >
                                            ✓ {lastMember ? lastMember.name : 'בוצע'}
                                        </button>
                                        <button
                                            onClick={() =>
                                                setPickerTaskId(pickerOpen ? null : task.id)
                                            }
                                            aria-label="בחר מי ביצע"
                                            className="shrink-0 rounded-full p-1.5 text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700"
                                        >
                                            ⌄
                                        </button>
                                        <button
                                            onClick={() => removeTask(task.id)}
                                            aria-label="הסר משימה"
                                            className="shrink-0 rounded-full p-1.5 text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {pickerOpen && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {familyMembers.map((member) => (
                                                <button
                                                    key={member.id}
                                                    onClick={() => completeTask(task.id, member.id)}
                                                    className="rounded-full px-3 py-1 text-xs font-medium"
                                                    style={{
                                                        background: `${member.color}22`,
                                                        color: member.color,
                                                        outline:
                                                            member.id === lastMemberId
                                                                ? `2px solid ${member.color}`
                                                                : undefined,
                                                    }}
                                                >
                                                    {member.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}

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
                                                    <span>
                                                        {c.family_member.name} ·{' '}
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
