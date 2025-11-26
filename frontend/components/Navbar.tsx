'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const ZamacorpsLogo = dynamic(() => import('./ZamacorpsLogo').then(mod => ({ default: mod.ZamacorpsLogo })), {
    loading: () => <div className="bg-black rounded-lg px-4 py-2"><span className="font-black text-xl font-heading">ZAMACORPS</span></div>,
    ssr: false
});

const ThemeToggle = dynamic(() => import('./ThemeToggle').then(mod => ({ default: mod.ThemeToggle })), {
    loading: () => <div className="w-10 h-10" />,
    ssr: false
});

export function Navbar() {
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const { theme } = useTheme();

    // Prevent hydration mismatch
    useState(() => {
        setMounted(true);
    });

    if (!mounted) {
        return (
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-black/50 border border-white/10 rounded-2xl px-6 py-3 flex items-center justify-between shadow-2xl backdrop-blur-md h-[72px]">
                        <div className="w-32 h-8 bg-white/10 rounded-lg animate-pulse" />
                        <div className="hidden md:flex gap-8">
                            <div className="w-16 h-4 bg-white/10 rounded animate-pulse" />
                            <div className="w-16 h-4 bg-white/10 rounded animate-pulse" />
                            <div className="w-20 h-4 bg-white/10 rounded animate-pulse" />
                        </div>
                        <div className="w-10 h-10 bg-white/10 rounded-lg animate-pulse" />
                    </div>
                </div>
            </nav>
        );
    }

    const navLinks = [
        { name: 'HOME', href: '/' },
        { name: 'ADMIN', href: '/admin/login' },
    ];

    const aboutLinks = [
        {
            name: 'Our Mission',
            href: '/about#mission',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            name: 'Zama Technology',
            href: '/about#tech',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            )
        },
        {
            name: 'Privacy First',
            href: '/about#privacy',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
            )
        },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="max-w-7xl mx-auto">
                <div className={`
                    ${theme === 'dark' ? 'bg-[#ffd209]' : 'bg-black'}
                    border
                    ${theme === 'dark' ? 'border-black/20' : 'border-yellow-500/30'}
                    rounded-2xl px-6 py-3 flex items-center justify-between shadow-2xl transition-colors duration-300
                `}>
                    {/* Logo */}
                    <Link href="/" className="group">
                        <ZamacorpsLogo size="md" className="group-hover:shadow-xl transition-all group-hover:border-yellow-500/50" />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`text-sm font-bold tracking-wider transition-colors
                                    ${theme === 'dark'
                                        ? pathname === link.href
                                            ? 'text-black'
                                            : 'text-black/70 hover:text-white'
                                        : pathname === link.href
                                            ? 'text-yellow-400'
                                            : 'text-slate-200 hover:text-yellow-400'
                                    }
                                `}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* About Dropdown - CSS only, no framer-motion */}
                        <div
                            className="relative"
                            onMouseEnter={() => setIsAboutOpen(true)}
                            onMouseLeave={() => setIsAboutOpen(false)}
                        >
                            <button className={`text-sm font-bold tracking-wider transition-colors flex items-center gap-1
                                ${theme === 'dark'
                                    ? pathname.startsWith('/about')
                                        ? 'text-black'
                                        : 'text-black/70 hover:text-white'
                                    : pathname.startsWith('/about')
                                        ? 'text-yellow-400'
                                        : 'text-slate-200 hover:text-yellow-400'
                                }
                            `}>
                                ABOUT US
                                <svg className={`w-4 h-4 transition-transform ${isAboutOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* CSS-only dropdown - instant, no JS animation library */}
                            <div className={`absolute top-full right-0 mt-2 w-64 border rounded-xl shadow-2xl overflow-hidden p-2 transition-all duration-200 ${theme === 'dark'
                                ? 'bg-[#ffd209] border-black/20'
                                : 'bg-black border-slate-700'
                                } ${isAboutOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'}`}>
                                {aboutLinks.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${theme === 'dark'
                                            ? 'text-black hover:text-white'
                                            : 'text-white hover:text-yellow-400'
                                            }`}
                                    >
                                        <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Theme Toggle */}
                        <ThemeToggle />
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-3">
                        <ThemeToggle />
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`p-2 ${theme === 'dark' ? 'text-black' : 'text-white'}`}
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Panel */}
                {isMobileMenuOpen && (
                    <div className={`md:hidden absolute top-full left-0 right-0 mt-4 mx-6 rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#ffd209] border border-black/20' : 'bg-black border border-yellow-500/30'
                        }`}>
                        <div className="p-4 space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`block px-4 py-3 rounded-lg font-bold text-sm transition-all ${theme === 'dark'
                                        ? pathname === link.href
                                            ? 'bg-black text-white'
                                            : 'text-black hover:bg-black/10'
                                        : pathname === link.href
                                            ? 'bg-yellow-500 text-black'
                                            : 'text-white hover:bg-white/10'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}

                            {/* About links in mobile */}
                            <div className="pt-2 border-t border-black/10">
                                <div className={`text-xs font-bold px-4 py-2 ${theme === 'dark' ? 'text-black/60' : 'text-white/60'}`}>
                                    ABOUT US
                                </div>
                                {aboutLinks.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${theme === 'dark'
                                            ? 'text-black hover:bg-black/10'
                                            : 'text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <span>{item.icon}</span>
                                        <span className="text-sm">{item.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
