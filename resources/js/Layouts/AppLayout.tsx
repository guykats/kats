import { Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import type { CurrentDevice } from '../types';

export default function AppLayout({ children }: PropsWithChildren) {
    const device = usePage().props.device as CurrentDevice | null;

    return (
        <div className="mx-auto flex h-svh max-w-md flex-col bg-white dark:bg-neutral-950">
            <main className="flex-1 overflow-hidden">{children}</main>

            <nav className="flex overflow-x-auto border-t border-neutral-200 pb-[env(safe-area-inset-bottom)] dark:border-neutral-800">
                <TabLink href="/calendar" label="לוח שנה" icon="📅" />
                <TabLink href="/tasks" label="משימות" icon="✅" />
                {device?.isAdmin && <TabLink href="/parent-tasks" label="הורים" icon="🔒" />}
                <TabLink href="/shopping" label="קניות" icon="🛒" />
            </nav>
        </div>
    );
}

function TabLink({ href, label, icon }: { href: string; label: string; icon: string }) {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const active = pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            className={`flex min-w-[64px] flex-1 shrink-0 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                active ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400'
            }`}
        >
            <span className="text-xl leading-none">{icon}</span>
            {label}
        </Link>
    );
}
