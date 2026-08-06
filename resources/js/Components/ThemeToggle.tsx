import { useEffect, useState } from 'react';
import { applyTheme, getStoredTheme, type Theme } from '../lib/theme';

export default function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        setTheme(getStoredTheme());
    }, []);

    function toggle() {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        applyTheme(next);
    }

    return (
        <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'החלף למצב בהיר' : 'החלף למצב כהה'}
            className="rounded-full p-2 text-lg text-neutral-500 active:bg-neutral-200 dark:active:bg-neutral-800"
        >
            {theme === 'dark' ? '☀️' : '🌙'}
        </button>
    );
}
