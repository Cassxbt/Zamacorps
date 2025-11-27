'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Show visible placeholder until mounted
    if (!mounted) {
        return (
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 border border-yellow-500/40 animate-pulse" />
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-lg transition-all border-2 ${theme === 'dark'
                ? 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/50 hover:border-yellow-500/70'
                : 'bg-gray-800/80 hover:bg-gray-800/90 border-gray-700 hover:border-gray-600'
                }`}
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                // Sun icon for dark mode (shows you can switch TO light)
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                // Moon icon for light mode (shows you can switch TO dark)
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
    );
}
