import { useState } from 'react';
import CalendarTab from './components/CalendarTab';
import ShoppingTab from './components/ShoppingTab';

type Tab = 'calendar' | 'shopping';

function App() {
  const [tab, setTab] = useState<Tab>('calendar');

  return (
    <div className="mx-auto flex h-svh max-w-md flex-col bg-white dark:bg-neutral-950">
      <main className="flex-1 overflow-hidden">
        {tab === 'calendar' ? <CalendarTab /> : <ShoppingTab />}
      </main>

      <nav className="grid grid-cols-2 border-t border-neutral-200 pb-[env(safe-area-inset-bottom)] dark:border-neutral-800">
        <TabButton
          label="Calendar"
          icon="📅"
          active={tab === 'calendar'}
          onClick={() => setTab('calendar')}
        />
        <TabButton
          label="Shopping"
          icon="🛒"
          active={tab === 'shopping'}
          onClick={() => setTab('shopping')}
        />
      </nav>
    </div>
  );
}

function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
        active ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400'
      }`}
    >
      <span className="text-xl leading-none">{icon}</span>
      {label}
    </button>
  );
}

export default App;
