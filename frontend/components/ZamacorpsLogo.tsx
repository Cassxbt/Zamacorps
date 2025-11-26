'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface ZamacorpsLogoProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function ZamacorpsLogo({ size = 'md', className = '' }: ZamacorpsLogoProps) {
    const [mounted, setMounted] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent flash by not rendering until theme is ready
    if (!mounted) {
        return (
            <div className={`bg-black rounded-lg flex items-center shadow-lg border border-yellow-500/20 ${className}`}>
                <span className={`font-black tracking-tighter font-heading ${size === 'sm' ? 'text-xl px-3 py-1' : size === 'lg' ? 'text-5xl px-6 py-3' : 'text-3xl px-4 py-2'}`}>
                    {/* Placeholder with same dimensions */}
                    <span className="opacity-0">ZAMACORPS</span>
                </span>
            </div>
        );
    }

    const sizeClasses = {
        sm: 'text-xl px-3 py-1',
        md: 'text-3xl px-4 py-2',
        lg: 'text-5xl px-6 py-3'
    };

    // Light mode: yellow + black, Dark mode: yellow + white
    const zebraGradient = theme === 'dark'
        ? 'repeating-linear-gradient(45deg, #ffd209, #ffd209 10px, #fff 10px, #fff 20px)'
        : 'repeating-linear-gradient(45deg, #ffd209, #ffd209 10px, #000 10px, #000 20px)';

    return (
        <div className={`bg-black rounded-lg flex items-center shadow-lg border border-yellow-500/20 ${className}`}>
            <span
                className={`font-black tracking-tighter font-heading ${sizeClasses[size]}`}
                style={{
                    backgroundImage: zebraGradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent',
                    filter: 'drop-shadow(0 2px 0px rgba(255, 210, 9, 0.3))'
                }}
            >
                ZAMACORPS
            </span>
        </div>
    );
}
