import { useState } from 'react';
import type { ShoppingItem } from '../types';
import { useLocalStorage } from '../lib/storage';

export default function ShoppingTab() {
  const [items, setItems] = useLocalStorage<ShoppingItem[]>('shopping-items', []);
  const [text, setText] = useState('');

  const pending = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  function addItem() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), text: trimmed, done: false }]);
    setText('');
  }

  function toggleItem(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearDone() {
    setItems((prev) => prev.filter((i) => !i.done));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-3 pb-2">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Shopping List
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {items.length === 0 && (
          <p className="mt-8 text-center text-sm text-neutral-400">
            Your shopping list is empty. Add something below.
          </p>
        )}

        {pending.length > 0 && (
          <ul className="space-y-2">
            {pending.map((item) => (
              <ShoppingRow
                key={item.id}
                item={item}
                onToggle={() => toggleItem(item.id)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </ul>
        )}

        {done.length > 0 && (
          <>
            <div className="mt-4 mb-2 flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-neutral-400 uppercase">
                Checked ({done.length})
              </span>
              <button
                onClick={clearDone}
                className="text-xs font-medium text-blue-600 dark:text-blue-400"
              >
                Clear
              </button>
            </div>
            <ul className="space-y-2 pb-4">
              {done.map((item) => (
                <ShoppingRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItem(item.id)}
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
          placeholder="Add an item…"
          className="flex-1 rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-600 dark:text-neutral-100"
        />
        <button
          onClick={addItem}
          disabled={!text.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
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
        aria-label={item.done ? 'Mark as not bought' : 'Mark as bought'}
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
        aria-label="Remove item"
        className="shrink-0 rounded-full p-1.5 text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700"
      >
        ✕
      </button>
    </li>
  );
}
