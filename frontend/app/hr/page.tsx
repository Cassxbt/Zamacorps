'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { getAllStreams, type PayrollStream } from '@/lib/contracts/payroll';
import { pauseStream, resumeStream, cancelStream } from '@/lib/contracts/streamManagement';
import { PAYROLL_ADDRESS } from '@/lib/wagmi/config';
import { ABIs } from '@/lib/contracts/abi';
const EncryptedPayrollABI = ABIs.payroll;
import { ToastContainer, type ToastProps } from '@/components/ui/Toast';

// Lazy load heavy components for performance
const CreateStreamForm = dynamic(() => import('@/components/hr/CreateStreamForm').then(mod => ({ default: mod.CreateStreamForm })), {
    loading: () => <div className="h-96 animate-pulse bg-[#1a1a1a]/50 rounded-3xl" />,
    ssr: false
});

const BulkUpload = dynamic(() => import('@/components/hr/BulkUpload').then(mod => ({ default: mod.BulkUpload })), {
    loading: () => <div className="h-96 animate-pulse bg-[#1a1a1a]/50 rounded-3xl" />,
    ssr: false
});

const ConnectButton = dynamic(() => import('@/components/ConnectButton').then(mod => ({ default: mod.ConnectButton })), {
    loading: () => <div className="h-10 w-32 bg-[#ffd209]/20 rounded-xl animate-pulse" />,
    ssr: false
});

// Mock data for demo
const MOCK_STREAMS = [
    { id: 1, employee: '0x742d35...6a8c', role: 'Sr. Engineer', salary: '***ENCRYPTED***', status: 'Active', nextPayout: '2h 15m' },
    { id: 2, employee: '0x8f2ca1...3d2f', role: 'Designer', salary: '***ENCRYPTED***', status: 'Active', nextPayout: '4h 32m' },
    { id: 3, employee: '0x1ab4c7...9e1b', role: 'Product Manager', salary: '***ENCRYPTED***', status: 'Pending', nextPayout: '1d 8h' },
];

export default function HRPage() {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'bulk'>('overview');
    const [mounted, setMounted] = useState(false);
    const [streams, setStreams] = useState<PayrollStream[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDemo, setShowDemo] = useState(false);
    const [employeeAddresses, setEmployeeAddresses] = useState<string>('');
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [toasts, setToasts] = useState<Array<ToastProps & { id: number }>>([]);
    const [toastIdCounter, setToastIdCounter] = useState(0); // Counter for unique toast IDs
    const { theme } = useTheme();

    // Toast management with unique IDs
    const addToast = (message: string, type: ToastProps['type'], txHash?: string) => {
        const id = toastIdCounter;
        setToastIdCounter(prev => prev + 1);
        setToasts(prev => [...prev, { id, message, type, txHash, onClose: () => { } }]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // Manual fetch by employee addresses
    const fetchStreamsByAddresses = async () => {
        if (!publicClient || !employeeAddresses.trim()) {
            return;
        }

        setLoading(true);
        try {
            const addresses = employeeAddresses
                .split(',')
                .map(addr => addr.trim())
                .filter(addr => addr.startsWith('0x'));



            const fetchedStreams: PayrollStream[] = [];

            for (const address of addresses) {
                try {
                    const stream = await publicClient.readContract({
                        address: PAYROLL_ADDRESS,
                        abi: EncryptedPayrollABI,
                        functionName: 'streams',
                        args: [address as `0x${string}`],
                    }) as any;

                    // Just check if we got ANY response from the contract
                    // Don't check for zero values since FHE types are encrypted handles
                    if (stream && stream.salaryPerBlock) {
                        fetchedStreams.push({
                            streamId: fetchedStreams.length,
                            employee: address,
                            salaryPerBlock: stream.salaryPerBlock.toString(),
                            startBlock: Number(stream.startBlock) || 0,
                            cliffBlock: Number(stream.cliffBlock) || 0,
                            lastClaimBlock: 0,
                            isPaused: false,
                            isCanceled: false,
                        });
                    }
                } catch (error) {
                    console.error(`[HR] Error fetching stream for ${address}:`, error);
                }
            }

            setStreams(fetchedStreams);
        } catch (error) {
            console.error('[HR] Error fetching streams:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch real streams from blockchain (V2 uses instant enumeration)
    useEffect(() => {
        async function fetchStreams() {
            if (!publicClient || showDemo) return;

            setLoading(true);
            try {
                const realStreams = await getAllStreams(publicClient);
                setStreams(realStreams);
            } catch (error) {
                console.error('[HR] Error fetching streams:', error);
            } finally {
                setLoading(false);
            }
        }

        if (isConnected && mounted && !showDemo) {
            fetchStreams();
        }
    }, [publicClient, isConnected, mounted, showDemo]);

    // Handle stream management actions
    const handlePauseStream = async (employee: string) => {
        setOpenMenuId(null);

        if (!walletClient) {
            addToast('Please connect your wallet', 'error');
            return;
        }

        try {
            addToast('Pausing stream...', 'info');
            const hash = await pauseStream(walletClient, employee);
            addToast(`Stream paused successfully!`, 'success', hash);

            // Refresh streams
            if (publicClient) {
                const updated = await getAllStreams(publicClient);
                setStreams(updated);
            }
        } catch (error: any) {
            console.error('Error pausing stream:', error);
            addToast(error.message || 'Failed to pause stream', 'error');
        }
    };

    const handleResumeStream = async (employee: string) => {
        setOpenMenuId(null);

        if (!walletClient) {
            addToast('Please connect your wallet', 'error');
            return;
        }

        try {
            addToast('Resuming stream...', 'info');
            const hash = await resumeStream(walletClient, employee);
            addToast(`Stream resumed successfully!`, 'success', hash);

            // Refresh streams
            if (publicClient) {
                const updated = await getAllStreams(publicClient);
                setStreams(updated);
            }
        } catch (error: any) {
            console.error('Error resuming stream:', error);
            addToast(error.message || 'Failed to resume stream', 'error');
        }
    };

    const handleCancelStream = async (employee: string) => {
        setOpenMenuId(null);

        if (!confirm(`Are you sure you want to cancel the stream for ${employee}? This action cannot be undone.`)) {
            return;
        }

        if (!walletClient) {
            addToast('Please connect your wallet', 'error');
            return;
        }

        try {
            addToast('Canceling stream...', 'warning');
            const hash = await cancelStream(walletClient, employee);
            addToast(`Stream canceled successfully!`, 'success', hash);

            // Refresh streams
            if (publicClient) {
                const updated = await getAllStreams(publicClient);
                setStreams(updated);
            }
        } catch (error: any) {
            console.error('Error canceling stream:', error);
            addToast(error.message || 'Failed to cancel stream', 'error');
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />

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

                    {/* Welcome Section */}
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
                                HR Management
                            </span>
                        </h1>
                        <p className={`text-xl font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                            }`}>Manage encrypted salary streams with full privacy</p>
                        <p className="text-[#ffd209] text-sm mt-2 font-medium">Powered by ZAMACORPS FHE Technology</p>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {mounted && isConnected && address ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-8"
                            >
                                {/* Stats Grid - Only show on overview */}
                                {activeTab === 'overview' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { label: "Active Streams", value: showDemo ? "3" : streams.length.toString(), icon: (<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>) },
                                            { label: "Total Salaries/Month", value: "***ENCRYPTED***", icon: (<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
                                            { label: "Next Payout", value: "2 hrs", icon: (<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) }
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
                                                    <div className="text-[#ffd209] mb-4 group-hover:scale-110 transition-transform">{stat.icon}</div>
                                                    <div className={`text-sm font-medium uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                                                        }`}>{stat.label}</div>
                                                    <div className={`text-3xl font-black font-heading ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                                                        }`}>{stat.value}</div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* Tab Navigation */}
                                <div className="flex gap-4 flex-wrap">
                                    {[
                                        { id: 'overview', label: 'Stream Overview', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>) },
                                        { id: 'create', label: 'Create Stream', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>) },
                                        { id: 'bulk', label: 'Bulk Upload', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>) }
                                    ].map((tab) => (
                                        <motion.button
                                            key={tab.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`
                                            flex-1 min-w-[200px] px-6 py-4 rounded-2xl font-black text-base transition-all shadow-lg
                                            ${activeTab === tab.id
                                                    ? 'bg-[#ffd209] text-black shadow-yellow-500/50'
                                                    : (theme === 'dark' ? 'bg-[#1a1a1a]/80 text-slate-300 hover:bg-[#1a1a1a] border border-[#ffd209]/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200')
                                                }
                                        `}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {tab.icon}
                                                {tab.label}
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <AnimatePresence mode="wait">
                                    {activeTab === 'overview' && (
                                        <motion.div
                                            key="overview"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className={`border rounded-2xl overflow-hidden ${theme === 'dark'
                                                ? 'bg-[#1a1a1a]/80 border-[#ffd209]/30'
                                                : 'bg-white border-slate-200'
                                                }`}
                                        >
                                            <div className={`p-6 border-b flex justify-between items-center ${theme === 'dark' ? 'border-[#ffd209]/10' : 'border-slate-200'
                                                }`}>
                                                <div className="flex items-center gap-3">
                                                    <h2 className={`text-xl font-black font-heading flex items-center gap-2 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                                                        }`}>
                                                        <svg className="w-5 h-5 text-[#ffd209]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        Active Salary Streams
                                                    </h2>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {/* Demo/Active Toggle */}
                                                    <button
                                                        onClick={() => setShowDemo(!showDemo)}
                                                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${showDemo
                                                            ? 'bg-[#ffd209] text-black'
                                                            : (theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-200 text-slate-700 hover:bg-slate-300')
                                                            }`}
                                                    >
                                                        {showDemo ? (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                            </svg>
                                                        )}
                                                        {showDemo ? 'Demo Mode' : 'Live Data'}
                                                    </button>
                                                    {/* Refresh Button */}
                                                    {!showDemo && (
                                                        <button
                                                            onClick={async () => {
                                                                if (!publicClient) return;
                                                                setLoading(true);
                                                                try {
                                                                    const realStreams = await getAllStreams(publicClient);
                                                                    setStreams(realStreams);
                                                                } catch (error) {
                                                                    console.error('[HR] Error refreshing streams:', error);
                                                                } finally {
                                                                    setLoading(false);
                                                                }
                                                            }}
                                                            disabled={loading}
                                                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                        >
                                                            {loading ? '⏳' : '🔄'} Refresh
                                                        </button>
                                                    )}
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                        <span className="text-sm font-medium text-green-400">{showDemo ? '3' : streams.length} Active</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Manual Address Input - Only show in Live Data mode */}
                                            {!showDemo && (
                                                <div className={`p-4 border-b ${theme === 'dark' ? 'bg-[#1a1a1a]/50 border-[#ffd209]/10' : 'bg-slate-50 border-slate-200'}`}>
                                                    <div className="flex gap-3">
                                                        <div className="flex-1">
                                                            <input
                                                                type="text"
                                                                value={employeeAddresses}
                                                                onChange={(e) => setEmployeeAddresses(e.target.value)}
                                                                placeholder="Enter employee addresses (comma-separated, e.g., 0x123..., 0x456...)"
                                                                className={`w-full px-4 py-2 rounded-lg border font-mono text-sm transition-all ${theme === 'dark'
                                                                    ? 'bg-black/30 border-[#ffd209]/30 text-white placeholder-slate-500 focus:border-[#ffd209]'
                                                                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#ffd209]'
                                                                    } focus:outline-none focus:ring-2 focus:ring-[#ffd209]/20`}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={fetchStreamsByAddresses}
                                                            disabled={loading || !employeeAddresses.trim()}
                                                            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${theme === 'dark' ? 'bg-[#ffd209] text-black hover:bg-[#ffd209]/90' : 'bg-[#ffd209] text-black hover:bg-[#ffd209]/90'
                                                                } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
                                                        >
                                                            {loading ? (
                                                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                                </svg>
                                                            )}
                                                            {loading ? 'Searching...' : 'Find Streams'}
                                                        </button>
                                                    </div>
                                                    <p className={`mt-2 text-xs flex items-center gap-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                                                        </svg>
                                                        Tip: Enter the employee addresses you created streams for, separated by commas
                                                    </p>
                                                </div>
                                            )}

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'bg-black/30 text-slate-400' : 'bg-slate-50 text-slate-600'
                                                        }`}>
                                                        <tr>
                                                            <th className="px-6 py-4 font-medium">Employee</th>
                                                            <th className="px-6 py-4 font-medium">Role</th>
                                                            <th className="px-6 py-4 font-medium">Salary</th>
                                                            <th className="px-6 py-4 font-medium">Status</th>
                                                            <th className="px-6 py-4 font-medium">Next Payout</th>
                                                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#ffd209]/10' : 'divide-slate-200'
                                                        }`}>
                                                        {loading ? (
                                                            <tr>
                                                                <td colSpan={6} className="px-6 py-12 text-center">
                                                                    <div className="flex flex-col items-center gap-3">
                                                                        <div className="w-8 h-8 border-4 border-[#ffd209] border-t-transparent rounded-full animate-spin" />
                                                                        <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Loading streams...</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : (showDemo ? MOCK_STREAMS : streams).length === 0 ? (
                                                            <tr>
                                                                <td colSpan={6} className="px-6 py-12 text-center">
                                                                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                                                        No active streams found. Create one above!
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            (showDemo ? MOCK_STREAMS.map(s => ({ ...s, streamId: s.id })) : streams).map((stream) => (
                                                                <tr key={showDemo ? stream.streamId : stream.streamId} className={`group ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                                                                    } transition-colors`}>
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffd209] to-yellow-600 flex items-center justify-center text-xs font-black text-black">
                                                                                {stream.employee.charAt(2).toUpperCase()}
                                                                            </div>
                                                                            <div className={`font-mono text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                                                                                }`}>{stream.employee.length > 12 ? `${stream.employee.slice(0, 6)}...${stream.employee.slice(-4)}` : stream.employee}</div>
                                                                        </div>
                                                                    </td>
                                                                    <td className={`px-6 py-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                                                                        }`}>{showDemo ? (stream as any).role : '-'}</td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <svg className="w-4 h-4 text-[#ffd209]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                            </svg>
                                                                            <span className="font-mono text-[#ffd209] font-medium">
                                                                                {showDemo ? (stream as any).salary : '***ENCRYPTED***'}
                                                                            </span>
                                                                            {!showDemo && (
                                                                                <span
                                                                                    className={`text-xs cursor-help ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}
                                                                                    title={`Encrypted Salary Handle: ${stream.salaryPerBlock}`}
                                                                                >
                                                                                    (FHE)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${showDemo
                                                                            ? ((stream as any).status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20')
                                                                            : (stream.isCanceled ? 'bg-red-500/10 text-red-400 border border-red-500/20' : stream.isPaused ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20')
                                                                            }`}>
                                                                            {showDemo ? (stream as any).status : stream.isCanceled ? 'Canceled' : stream.isPaused ? 'Paused' : 'Active'}
                                                                        </span>
                                                                    </td>
                                                                    <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                                                                        }`}>
                                                                        {showDemo ? (stream as any).nextPayout : (
                                                                            <div className="flex items-center gap-2">
                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                </svg>
                                                                                <span>Every block</span>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <div className="relative">
                                                                            <button
                                                                                onClick={() => setOpenMenuId(openMenuId === stream.streamId ? null : stream.streamId)}
                                                                                className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-black hover:bg-slate-100'
                                                                                    }`}
                                                                                title="Stream Actions"
                                                                            >
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                                                </svg>
                                                                            </button>
                                                                            {/* Dropdown Menu - Click-based */}
                                                                            {openMenuId === stream.streamId && (
                                                                                <div
                                                                                    className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border z-20 ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#ffd209]/30' : 'bg-white border-slate-200'}`}
                                                                                    onMouseLeave={() => setOpenMenuId(null)}
                                                                                >
                                                                                    <div className="py-2">
                                                                                        {!stream.isPaused && (
                                                                                            <button
                                                                                                onClick={() => handlePauseStream(stream.employee)}
                                                                                                className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-3 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
                                                                                            >
                                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                                </svg>
                                                                                                Pause Stream
                                                                                            </button>
                                                                                        )}
                                                                                        {stream.isPaused && (
                                                                                            <button
                                                                                                onClick={() => handleResumeStream(stream.employee)}
                                                                                                className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-3 ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
                                                                                            >
                                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                                </svg>
                                                                                                Resume Stream
                                                                                            </button>
                                                                                        )}
                                                                                        <button
                                                                                            onClick={() => handleCancelStream(stream.employee)}
                                                                                            className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-3 text-red-400 ${theme === 'dark' ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                                                                                        >
                                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                            </svg>
                                                                                            Cancel Stream
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'create' && (
                                        <motion.div
                                            key="create"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                        >
                                            <CreateStreamForm />
                                        </motion.div>
                                    )}

                                    {activeTab === 'bulk' && (
                                        <motion.div
                                            key="bulk"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                        >
                                            <BulkUpload />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-12 rounded-3xl text-center backdrop-blur-xl shadow-2xl border ${theme === 'dark'
                                    ? 'bg-[#1a1a1a]/80 border-[#ffd209]/20'
                                    : 'bg-white border-slate-200'
                                    }`}
                            >
                                <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-[#ffd209]/10' : 'bg-[#ffd209]/20'
                                    }`}>
                                    <svg className="w-10 h-10 text-[#ffd209]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h2 className={`text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'
                                    }`}>Connect Your Wallet</h2>
                                <p className={`text-lg mb-8 max-w-md mx-auto ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                                    }`}>
                                    Please connect your wallet to access the HR Dashboard and manage encrypted salary streams.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
