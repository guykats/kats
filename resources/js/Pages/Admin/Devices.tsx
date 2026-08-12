import { useState } from 'react';
import { router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { ApprovedDevice, PendingDevice } from '../../types';
import AppLayout from '../../Layouts/AppLayout';
import ThemeToggle from '../../Components/ThemeToggle';
import { DEVICE_COLORS } from '../../lib/colors';

export default function Devices({ pending, approved }: { pending: PendingDevice[]; approved: ApprovedDevice[] }) {
    return (
        <AppLayout>
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        ניהול מכשירים
                    </h1>
                    <ThemeToggle />
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <section>
                        <h2 className="mb-2 text-sm font-medium text-neutral-500">
                            ממתינים לאישור {pending.length > 0 && `(${pending.length})`}
                        </h2>
                        {pending.length === 0 && (
                            <p className="text-sm text-neutral-400">אין בקשות ממתינות.</p>
                        )}
                        <ul className="space-y-2">
                            {pending.map((device) => (
                                <PendingRow key={device.id} device={device} />
                            ))}
                        </ul>
                    </section>

                    <section className="mt-6">
                        <h2 className="mb-2 text-sm font-medium text-neutral-500">מכשירים מאושרים</h2>
                        <ul className="space-y-2">
                            {approved.map((device) => (
                                <ApprovedRow key={device.id} device={device} />
                            ))}
                        </ul>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}

function PendingRow({ device }: { device: PendingDevice }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [color, setColor] = useState(DEVICE_COLORS[0]);

    function approve() {
        const trimmed = name.trim();
        if (!trimmed) return;
        router.post(
            `/admin/devices/${device.id}/approve`,
            { name: trimmed, color },
            { preserveScroll: true, preserveState: true },
        );
        setOpen(false);
        setName('');
    }

    return (
        <li className="rounded-lg bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
            <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-right">
                <span className="text-sm text-neutral-900 dark:text-neutral-100">
                    בקשת גישה · {formatDistanceToNow(new Date(device.created_at), { addSuffix: true, locale: he })}
                </span>
                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">אישור</span>
            </button>

            {open && (
                <div className="mt-3 flex flex-col items-center gap-3">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="שם המכשיר"
                        className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-center text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
                    />
                    <div className="flex gap-2">
                        {DEVICE_COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                aria-label={c}
                                className="h-8 w-8 rounded-full"
                                style={{
                                    background: c,
                                    outline: color === c ? '2px solid white' : undefined,
                                    boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
                                }}
                            />
                        ))}
                    </div>
                    <button
                        onClick={approve}
                        disabled={!name.trim()}
                        className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
                    >
                        אישור המכשיר
                    </button>
                </div>
            )}
        </li>
    );
}

function ApprovedRow({ device }: { device: ApprovedDevice }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(device.name);
    const [color, setColor] = useState(device.color);

    function remove() {
        router.delete(`/admin/devices/${device.id}`, { preserveScroll: true, preserveState: true });
    }

    function promote() {
        router.patch(`/admin/devices/${device.id}/promote`, {}, { preserveScroll: true, preserveState: true });
    }

    function save() {
        const trimmed = name.trim();
        if (!trimmed) return;
        router.patch(
            `/admin/devices/${device.id}`,
            { name: trimmed, color },
            { preserveScroll: true, preserveState: true },
        );
        setEditing(false);
    }

    return (
        <li className="rounded-lg bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setEditing(!editing)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-right"
                >
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: device.color }} />
                    <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {device.name}
                    </span>
                    {device.is_admin && (
                        <span className="shrink-0 rounded-full bg-neutral-300 px-2 py-0.5 text-[10px] text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                            מנהל
                        </span>
                    )}
                </button>
                <div className="flex shrink-0 items-center gap-1">
                    <button
                        onClick={() => setEditing(!editing)}
                        aria-label="עריכת מכשיר"
                        className="shrink-0 rounded-full p-1.5 text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700"
                    >
                        ✎
                    </button>
                    {!device.is_admin && (
                        <>
                            <button
                                onClick={promote}
                                className="whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium text-blue-600 active:bg-blue-100 dark:text-blue-400 dark:active:bg-blue-950"
                            >
                                הפוך למנהל
                            </button>
                            <button
                                onClick={remove}
                                aria-label="הסרת מכשיר"
                                className="shrink-0 rounded-full p-1.5 text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700"
                            >
                                ✕
                            </button>
                        </>
                    )}
                </div>
            </div>

            {editing && (
                <div className="mt-3 flex flex-col items-center gap-3">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="שם המכשיר"
                        className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-center text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
                    />
                    <div className="flex gap-2">
                        {DEVICE_COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                aria-label={c}
                                className="h-8 w-8 rounded-full"
                                style={{
                                    background: c,
                                    outline: color === c ? '2px solid white' : undefined,
                                    boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
                                }}
                            />
                        ))}
                    </div>
                    <button
                        onClick={save}
                        disabled={!name.trim()}
                        className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
                    >
                        שמירה
                    </button>
                </div>
            )}
        </li>
    );
}
