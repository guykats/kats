import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';

export default function AppLayout({ children }: PropsWithChildren) {
    return (
        <div className="mx-auto flex h-svh max-w-md flex-col bg-white dark:bg-neutral-950">
            <main className="flex-1 overflow-hidden">{children}</main>

            <nav className="grid grid-cols-3 border-t border-neutral-200 pb-[env(safe-area-inset-bottom)] dark:border-neutral-800">
                <TabLink href="/calendar" label="לוח שנה" icon="📅" />
                <TabLink href="/tasks" label="משימות" icon="✅" />
                <TabLink href="/shopping" label="קניות" icon="🛒" />
            </nav>
        </div>
    );
}

function TabLink({ href, label, icon }: { href: string; label: string; icon: string }) {
    const active = typeof window !== 'undefined' && window.location.pathname === href;

    return (
        <Link
            href={href}
            className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                active ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400'
            }`}
        >
            <span className="text-xl leading-none">{icon}</span>
            {label}
        </Link>
    );
}
