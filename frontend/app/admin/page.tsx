'use client';

import dynamic from 'next/dynamic';
import { useAccount, usePublicClient } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { getAllStreams, type PayrollStream } from '@/lib/contracts/payroll';

const RoleManagement = dynamic(() => import('@/components/admin/RoleManagement').then(mod => mod.RoleManagement), {
    loading: () => <div className="h-96 animate-pulse bg-slate-800/50 rounded-2xl" />,
    ssr: false
});

const ConnectButton = dynamic(() => import('@/components/ConnectButton').then(mod => ({ default: mod.ConnectButton })), {
    loading: () => <div className="h-10 w-32 bg-[#ffd209]/20 rounded-xl animate-pulse" />,
    ssr: false
});

export default function AdminPage() {
    const { isConnected } = useAccount();
    const publicClient = usePublicClient();
    const [typingText, setTypingText] = useState('');
    const [mounted, setMounted] = useState(false);
    const [streams, setStreams] = useState<PayrollStream[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeView, setActiveView] = useState<'overview' | 'streams' | 'roles'>('overview');
    const { theme } = useTheme();
    const fullText = "Welcome back, Administrator.";

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isConnected) {
            let i = 0;
            const interval = setInterval(() => {
                setTypingText(fullText.slice(0, i));
                i++;
                if (i > fullText.length) clearInterval(interval);
            }, 50);
            return () => clearInterval(interval);
        }
    }, [isConnected]);

    // Fetch streams for analytics
    useEffect(() => {
        async function fetchStreams() {
            if (!publicClient || !isConnected) return;

            setLoading(true);
            try {
                const allStreams = await getAllStreams(publicClient);
                setStreams(allStreams);
            } catch (error) {
                console.error('[Admin] Error fetching streams:', error);
            } finally {
                setLoading(false);
            }
        }

        if (mounted && isConnected) {
            fetchStreams();
        }
    }, [publicClient, isConnected, mounted]);

    // Calculate analytics
    const activeStreams = streams.filter(s => !s.isCanceled && !s.isPaused);
    const pausedStreams = streams.filter(s => s.isPaused && !s.isCanceled);
    const totalStreams = streams.length;

    return (
        <div className={`min-h-screen overflow-hidden relative transition-colors duration-300 ${theme === 'dark'
            ? 'bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f]'
            : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
            }`}>
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className={`absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-yellow-500/10' : 'bg-yellow-400/20'
                    }`} />
                <div className={`absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-yellow-400/10' : 'bg-yellow-300/20'
                    }`} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-8">
                {/* Header */}
                <nav className="flex justify-between items-center mb-12">
                    <Link href="/" className={`group flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
                        }`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-[#1a1a1a] group-hover:bg-[#ffd209]/20' : 'bg-slate-200 group-hover:bg-[#ffd209]/20'
                            }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </div>
                        <span className="font-medium">Back to Home</span>
                    </Link>

                    <div className="flex items-center gap-6">
                        <ConnectButton />
                    </div>
                </nav>

                {/* Main */}
                <AnimatePresence mode="wait">
                    {mounted && isConnected ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                        >
                            {/* Welcome */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                                <h1 className={`text-4xl md:text-5xl font-black mb-4 h-14 font-heading ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                                    }`}>
                                    <span
                                        className="inline-block font-black tracking-tighter font-heading"
                                        style={{
                                            backgroundImage: theme === 'dark'
                                                ? 'repeating-linear-gradient(45deg, #ffd209, #ffd209 10px, #fff 10px, #fff 20px)'
                                                : 'repeating-linear-gradient(45deg, #ffd209, #ffd209 10px, #000 10px, #000 20px)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                            color: 'transparent',
                                            filter: 'drop-shadow(0 2px 0px rgba(255, 210, 9, 0.3))'
                                        }}
                                    >
                                        {typingText}
                                    </span>
                                    <span className="animate-pulse text-[#ffd209]">|</span>
                                </h1>
                                <p className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                                    }`}>
                                    System administration and role management
                                </p>
                            </motion.div>

                            {/* Tabs */}
                            <div className="flex gap-4 flex-wrap">
                                {[
                                    { id: 'overview', label: 'System Overview', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>) },
                                    { id: 'streams', label: 'Stream Analytics', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>) },
                                    { id: 'roles', label: 'Role Management', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>) }
                                ].map((tab) => (
                                    <motion.button
                                        key={tab.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setActiveView(tab.id as any)}
                                        className={`flex-1 min-w-[200px] px-6 py-4 rounded-2xl font-black text-base transition-all shadow-lg ${activeView === tab.id
                                            ? 'bg-[#ffd209] text-black shadow-yellow-500/50'
                                            : (theme === 'dark' ? 'bg-[#1a1a1a]/80 text-slate-300 hover:bg-[#1a1a1a] border border-[#ffd209]/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200')
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            {tab.icon}
                                            {tab.label}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Content */}
                            <AnimatePresence mode="wait">
                                {activeView === 'overview' && (
                                    <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                                        {/* Stats */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            {[
                                                { label: "Total Streams", value: loading ? "..." : totalStreams.toString(), subtitle: "All time", icon: (<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>), color: "text-blue-400" },
                                                { label: "Active", value: loading ? "..." : activeStreams.length.toString(), subtitle: "Currently paying", icon: (<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>), color: "text-green-400" },
                                                { label: "Paused", value: loading ? "..." : pausedStreams.length.toString(), subtitle: "Temporarily stopped", icon: (<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>), color: "text-yellow-400" },
                                                { label: "Encrypted", value: "100%", subtitle: "FHE protected", icon: (<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>), color: "text-[#ffd209]" }
                                            ].map((stat, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    whileHover={{ y: -5 }}
                                                    className={`relative overflow-hidden border rounded-2xl p-6 group transition-all ${theme === 'dark'
                                                        ? 'bg-[#1a1a1a]/80 border-[#ffd209]/30 hover:border-[#ffd209]/50'
                                                        : 'bg-white border-slate-200 hover:border-[#ffd209]/50'
                                                        }`}
                                                >
                                                    <div className="relative z-10">
                                                        <div className={`${stat.color} mb-4 group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                                                        <div className={`text-sm font-medium uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                                                            }`}>{stat.label}</div>
                                                        <div className={`text-3xl font-black font-heading ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                                                            }`}>{stat.value}</div>
                                                        <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{stat.subtitle}</div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Quick Actions */}
                                        <div className={`border rounded-2xl p-6 ${theme === 'dark' ? 'bg-[#1a1a1a]/80 border-[#ffd209]/30' : 'bg-white border-slate-200'}`}>
                                            <h3 className={`text-lg font-black mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                                                <svg className="w-5 h-5 text-[#ffd209]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                Quick Actions
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Link href="/hr" className="px-4 py-3 bg-[#ffd209] hover:bg-[#ffdd33] text-black rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-yellow-500/50">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                    Go to HR Dashboard
                                                </Link>
                                                <button
                                                    onClick={() => setActiveView('roles')}
                                                    className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    Manage Roles
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeView === 'streams' && (
                                    <motion.div key="streams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`border rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#1a1a1a]/80 border-[#ffd209]/30' : 'bg-white border-slate-200'}`}>
                                        <div className={`p-6 border-b ${theme === 'dark' ? 'border-[#ffd209]/10' : 'border-slate-200'}`}>
                                            <h2 className={`text-xl font-black font-heading flex items-center gap-2 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                                                <svg className="w-5 h-5 text-[#ffd209]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                All Streams (Read-Only)
                                            </h2>
                                            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                                System-wide view. Use HR Dashboard to manage streams.
                                            </p>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'bg-black/30 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                                                    <tr>
                                                        <th className="px-6 py-4 font-medium">Employee</th>
                                                        <th className="px-6 py-4 font-medium">Salary (FHE)</th>
                                                        <th className="px-6 py-4 font-medium">Start Block</th>
                                                        <th className="px-6 py-4 font-medium">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#ffd209]/10' : 'divide-slate-200'}`}>
                                                    {loading ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                                <div className="flex flex-col items-center gap-3">
                                                                    <div className="w-8 h-8 border-4 border-[#ffd209] border-t-transparent rounded-full animate-spin" />
                                                                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Loading streams...</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : streams.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                                                    No streams found. Create one in HR Dashboard.
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        streams.map((stream, idx) => (
                                                            <tr key={idx} className={`${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-colors`}>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffd209] to-yellow-600 flex items-center justify-center text-xs font-black text-black">
                                                                            {stream.employee.charAt(2).toUpperCase()}
                                                                        </div>
                                                                        <div className={`font-mono text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                                                            {stream.employee.length > 12 ? `${stream.employee.slice(0, 6)}...${stream.employee.slice(-4)}` : stream.employee}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <svg className="w-4 h-4 text-[#ffd209]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                        </svg>
                                                                        <span className="font-mono text-[#ffd209] font-medium">***ENCRYPTED***</span>
                                                                    </div>
                                                                </td>
                                                                <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                                                    #{stream.startBlock.toString()}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stream.isCanceled
                                                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                                        : stream.isPaused
                                                                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                                        }`}>
                                                                        {stream.isCanceled ? 'Canceled' : stream.isPaused ? 'Paused' : 'Active'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </motion.div>
                                )}

                                {activeView === 'roles' && (
                                    <motion.div key="roles" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`border rounded-2xl p-8 ${theme === 'dark' ? 'bg-[#1a1a1a]/80 border-[#ffd209]/30' : 'bg-white border-slate-200'}`}>
                                        <RoleManagement />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-12 rounded-3xl text-center backdrop-blur-xl shadow-2xl border ${theme === 'dark' ? 'bg-[#1a1a1a]/80 border-[#ffd209]/20' : 'bg-white border-slate-200'}`}
                        >
                            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-[#ffd209]/10' : 'bg-[#ffd209]/20'}`}>
                                <svg className="w-10 h-10 text-[#ffd209]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className={`text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Connect Your Wallet</h2>
                            <p className={`text-lg mb-8 max-w-md mx-auto ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                                Connect to access Admin Dashboard and manage system roles
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
