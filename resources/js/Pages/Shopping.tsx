import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { ShoppingItem } from '../types';
import AppLayout from '../Layouts/AppLayout';

export default function Shopping({ items }: { items: ShoppingItem[] }) {
    const [text, setText] = useState('');

    const pending = items.filter((i) => !i.done);
    const done = items.filter((i) => i.done);

    function addItem() {
        const trimmed = text.trim();
        if (!trimmed) return;
        router.post(
            '/shopping-items',
            { text: trimmed },
            { preserveScroll: true, preserveState: true },
        );
        setText('');
    }

    function toggleItem(item: ShoppingItem) {
        router.patch(
            `/shopping-items/${item.id}`,
            { done: !item.done },
            { preserveScroll: true, preserveState: true },
        );
    }

    function removeItem(id: number) {
        router.delete(`/shopping-items/${id}`, { preserveScroll: true, preserveState: true });
    }

    function clearDone() {
        done.forEach((item) => removeItem(item.id));
    }

    return (
        <AppLayout>
            <div className="flex h-full flex-col">
                <div className="px-4 pt-3 pb-2">
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        רשימת קניות
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto px-4">
                    {items.length === 0 && (
                        <p className="mt-8 text-center text-sm text-neutral-400">
                            רשימת הקניות ריקה. הוסיפו פריט למטה.
                        </p>
                    )}

                    {pending.length > 0 && (
                        <ul className="space-y-2">
                            {pending.map((item) => (
                                <ShoppingRow
                                    key={item.id}
                                    item={item}
                                    onToggle={() => toggleItem(item)}
                                    onRemove={() => removeItem(item.id)}
                                />
                            ))}
                        </ul>
                    )}

                    {done.length > 0 && (
                        <>
                            <div className="mt-4 mb-2 flex items-center justify-between">
                                <span className="text-xs font-medium tracking-wide text-neutral-400">
                                    נרכשו ({done.length})
                                </span>
                                <button
                                    onClick={clearDone}
                                    className="text-xs font-medium text-blue-600 dark:text-blue-400"
                                >
                                    נקה
                                </button>
                            </div>
                            <ul className="space-y-2 pb-4">
                                {done.map((item) => (
                                    <ShoppingRow
                                        key={item.id}
                                        item={item}
                                        onToggle={() => toggleItem(item)}
                                        onRemove={() => removeItem(item.id)}
                                    />
                                ))}
                            </ul>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 border-t border-neutral-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-neutral-800">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                        placeholder="הוסיפו פריט…"
                        className="flex-1 rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
                    />
                    <button
                        onClick={addItem}
                        disabled={!text.trim()}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white disabled:opacity-40"
                    >
                        הוספה
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}

function ShoppingRow({
    item,
    onToggle,
    onRemove,
}: {
    item: ShoppingItem;
    onToggle: () => void;
    onRemove: () => void;
}) {
    return (
        <li className="flex items-center gap-3 rounded-lg bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
            <button
                onClick={onToggle}
                aria-label={item.done ? 'סמן כלא נרכש' : 'סמן כנרכש'}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs text-white ${
                    item.done
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-neutral-300 dark:border-neutral-500'
                }`}
            >
                {item.done && '✓'}
            </button>
            <span
                className={`flex-1 truncate ${
                    item.done
                        ? 'text-neutral-400 line-through'
                        : 'text-neutral-900 dark:text-neutral-100'
                }`}
            >
                {item.text}
            </span>
            <button
                onClick={onRemove}
                aria-label="הסר פריט"
                className="shrink-0 rounded-full p-1.5 text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700"
            >
                ✕
            </button>
        </li>
    );
}
