'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { formatEther } from 'viem';
import { PAYROLL_ADDRESS } from '@/lib/wagmi/config';
import { ABIs } from '@/lib/contracts/abi';
import { calculateBlockCountdown, formatCountdown, getEstimatedCliffTime } from '@/lib/utils/countdown';
import { IncomeAttestation } from '@/components/employee/IncomeAttestation';
import { requestWithdrawal, submitWithdrawal } from '@/lib/contracts/payroll';
import { decryptValue } from '@/lib/fhe/decrypt';
const EncryptedPayrollABI = ABIs.payroll;

const ConnectButton = dynamic(() => import('@/components/ConnectButton').then(mod => ({ default: mod.ConnectButton })), {
    loading: () => <div className="h-10 w-32 bg-[#ffd209]/20 rounded-xl animate-pulse" />,
    ssr: false
});

interface StreamData {
    salaryPerBlock: string;
    startBlock: bigint;
    cliffBlock: bigint;
    claimedAmount: bigint;
    isPaused: boolean;
    exists: boolean;
}

export default function EmployeePage() {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const { theme } = useTheme();

    const [mounted, setMounted] = useState(false);
    const [stream, setStream] = useState<StreamData | null>(null);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState<string>('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string; txHash?: string } | null>(null);
    const [currentBlock, setCurrentBlock] = useState<bigint>(BigInt(0));


    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch employee stream
    useEffect(() => {
        async function fetchStream() {
            if (!publicClient || !address || !isConnected) return;

            setLoading(true);
            try {
                const streamData = await publicClient.readContract({
                    address: PAYROLL_ADDRESS,
                    abi: EncryptedPayrollABI,
                    functionName: 'streams',
                    args: [address as `0x${string}`],
                }) as any;

                const block = await publicClient.getBlockNumber();
                setCurrentBlock(block);

                if (Array.isArray(streamData) && streamData.length >= 6) {
                    setStream({
                        salaryPerBlock: streamData[0],
                        startBlock: streamData[1],
                        cliffBlock: streamData[2],
                        claimedAmount: streamData[3],
                        isPaused: streamData[4],
                        exists: streamData[5],
                    });
                }
            } catch (error) {
                console.error('[Employee] Error fetching stream:', error);
            } finally {
                setLoading(false);
            }
        }

        if (mounted && isConnected) {
            fetchStream();
            // Refresh every 12 seconds (assuming ~12s blocks)
            const interval = setInterval(fetchStream, 12000);
            return () => clearInterval(interval);
        }
    }, [publicClient, address, isConnected, mounted]);


    const handleWithdraw = async () => {
        if (!walletClient || !address || !publicClient) return;

        setWithdrawing(true);
        setStatus(null);

        try {
            // Step 1: Request withdrawal - returns encrypted handle
            setStatus({
                type: 'success',
                message: 'Step 1/3: Requesting withdrawal from contract...'
            });

            const { txHash, handle } = await requestWithdrawal(walletClient, publicClient);

            // Step 2: Decrypt the encrypted amount
            setStatus({
                type: 'success',
                message: 'Step 2/3: Decrypting salary amount...',
                txHash
            });

            const decryptedAmount = await decryptValue(handle, PAYROLL_ADDRESS, address);

            // Step 3: Submit the decrypted amount
            setStatus({
                type: 'success',
                message: `Step 3/3: Withdrawing ${(Number(decryptedAmount) / 1e18).toFixed(6)} ETH...`
            });

            const submitHash = await submitWithdrawal(walletClient, decryptedAmount);

            setStatus({
                type: 'success',
                message: `Successfully withdrew ${(Number(decryptedAmount) / 1e18).toFixed(6)} ETH!`,
                txHash: submitHash
            });

            // Refresh stream data
            setTimeout(async () => {
                if (publicClient && address) {
                    const streamData = await publicClient.readContract({
                        address: PAYROLL_ADDRESS,
                        abi: EncryptedPayrollABI,
                        functionName: 'streams',
                        args: [address as `0x${string}`],
                    }) as any;

                    if (Array.isArray(streamData) && streamData.length >= 6) {
                        setStream({
                            salaryPerBlock: streamData[0],
                            startBlock: streamData[1],
                            cliffBlock: streamData[2],
                            claimedAmount: streamData[3],
                            isPaused: streamData[4],
                            exists: streamData[5],
                        });
                    }
                }
            }, 3000);
        } catch (error: any) {
            console.error('[Employee] Withdrawal error:', error);
            setStatus({
                type: 'error',
                message: error.message || 'Failed to withdraw. Please try again.'
            });
        } finally {
            setWithdrawing(false);
        }
    };

    // Accurate countdown - now works with plaintext cliff blocks!
    useEffect(() => {
        if (!stream?.exists || !stream.cliffBlock || !currentBlock) {
            setCountdown('');
            return;
        }

        // Calculate blocks remaining
        const blocksRemaining = Number(stream.cliffBlock) - Number(currentBlock);

        if (blocksRemaining <= 0) {
            setCountdown("Ready to withdraw!");
            return;
        }

        // Estimate total seconds (12s per block)
        const totalSeconds = blocksRemaining * 12;
        const targetTime = Date.now() + (totalSeconds * 1000);

        const updateCountdown = () => {
            const now = Date.now();
            const diff = Math.max(0, targetTime - now);

            if (diff === 0) {
                setCountdown("Ready to withdraw!");
                return;
            }

            const seconds = Math.floor(diff / 1000);
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;

            const parts = [];
            if (days > 0) parts.push(`${days}d`);
            if (hours > 0 || days > 0) parts.push(`${hours}h`);
            if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
            if ((days === 0 && hours === 0) || parts.length === 0) parts.push(`${secs}s`);

            setCountdown(parts.join(' '));
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [stream, currentBlock]);



    const canWithdraw = stream?.exists && !stream?.isPaused && currentBlock >= stream?.cliffBlock;

    return (
        <div className={`min-h-screen overflow-hidden relative transition-colors duration-300 ${theme === 'dark'
            ? 'bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f]'
            : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
            }`}>
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className={`absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-yellow-500/10' : 'bg-yellow-400/20'}`} />
                <div className={`absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-yellow-400/10' : 'bg-yellow-300/20'}`} />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto p-6 md:p-8">
                {/* Header */}
                <nav className="flex justify-between items-center mb-12">
                    <Link href="/" className={`group flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-[#1a1a1a] group-hover:bg-[#ffd209]/20' : 'bg-slate-200 group-hover:bg-[#ffd209]/20'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </div>
                        <span className="font-medium">Back to Home</span>
                    </Link>

                    <ConnectButton />
                </nav>

                {/* Main Content */}
                <AnimatePresence mode="wait">
                    {mounted && isConnected && address ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                        >
                            {/* Welcome */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                                <h1 className={`text-4xl md:text-5xl font-black mb-4 font-heading ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                                    <span
                                        className="inline-block tracking-tighter"
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
                                        Your Salary Stream
                                    </span>
                                </h1>
                                <p className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Encrypted and secure, powered by Zama FHE
                                </p>
                            </motion.div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="w-16 h-16 border-4 border-[#ffd209] border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Loading your stream...</p>
                                </div>
                            ) : !stream?.exists ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`border rounded-3xl p-12 text-center ${theme === 'dark' ? 'bg-[#1a1a1a]/80 border-[#ffd209]/20' : 'bg-white border-slate-200'}`}
                                >
                                    <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-yellow-500/10' : 'bg-yellow-500/20'}`}>
                                        <svg className="w-10 h-10 text-[#ffd209]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className={`text-2xl font-black mb-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>No Stream Found</h3>
                                    <p className={`text-lg mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                        You don't have an active salary stream yet.
                                    </p>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Contact your HR department to set up your encrypted salary stream.
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Stream Status */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className={`border rounded-2xl p-6 ${theme === 'dark' ? 'bg-[#1a1a1a]/80 border-[#ffd209]/30' : 'bg-white border-slate-200'}`}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className={`text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Status</div>
                                                <div className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stream.isPaused
                                                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                        : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                        }`}>
                                                        {stream.isPaused ? 'Paused' : 'Active'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                                            {stream.isPaused ? 'Your stream is currently paused by HR' : 'Earning every block'}
                                        </p>
                                    </motion.div>

                                    {/* Salary (Encrypted) */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className={`border rounded-2xl p-6 ${theme === 'dark' ? 'bg-[#1a1a1a]/80 border-[#ffd209]/30' : 'bg-white border-slate-200'}`}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ffd209]/20 to-yellow-500/20 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-[#ffd209]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className={`text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Salary/Block</div>
                                                <div className="text-lg font-black text-[#ffd209]">***ENCRYPTED***</div>
                                            </div>
                                        </div>
                                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                                            Protected by Zama FHE
                                        </p>
                                    </motion.div>

                                    {/* Block Info */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className={`border rounded-2xl p-6 ${theme === 'dark' ? 'bg-[#1a1a1a]/80 border-[#ffd209]/30' : 'bg-white border-slate-200'}`}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className={`text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Current Block</div>
                                                <div className={`text-lg font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                                    #{currentBlock.toString()}
                                                </div>
                                            </div>
                                        </div>
                                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} overflow-hidden break-all`}>
                                            Cliff: #{stream.cliffBlock.toString()}
                                        </p>
                                    </motion.div>
                                </div>
                            )}

                            {/* Withdraw Section */}
                            {stream?.exists && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className={`border rounded-2xl p-8 ${theme === 'dark' ? 'bg-[#1a1a1a]/80 border-[#ffd209]/30' : 'bg-white border-slate-200'}`}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-[#ffd209]/20 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-[#ffd209]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Withdraw Salary</h3>
                                            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {canWithdraw ? 'Your salary is ready to withdraw' : 'Waiting for cliff period to end'}
                                            </p>
                                            {!canWithdraw && stream && countdown && (
                                                <div className="mt-3 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-[#ffd209] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className={`text-xs font-mono font-bold ${theme === 'dark' ? 'text-[#ffd209]' : 'text-yellow-600'}`}>
                                                        {countdown}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={canWithdraw ? { scale: 1.02 } : {}}
                                        whileTap={canWithdraw ? { scale: 0.98 } : {}}
                                        onClick={handleWithdraw}
                                        disabled={!canWithdraw || withdrawing}
                                        className={`w-full px-6 py-4 rounded-xl font-black text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${canWithdraw
                                            ? 'bg-[#ffd209] hover:bg-[#ffdd33] text-black hover:shadow-yellow-500/50'
                                            : 'bg-slate-500/20 text-slate-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {withdrawing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                                Withdrawing...
                                            </>
                                        ) : canWithdraw ? (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Withdraw Now
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                Locked Until Cliff
                                            </>
                                        )}
                                    </motion.button>
                                </motion.div>
                            )}

                            {/* Status Messages */}
                            <AnimatePresence>
                                {status && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className={`p-4 rounded-xl border flex items-start gap-3 ${status.type === 'success'
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : 'bg-red-500/10 border-red-500/30'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${status.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                            {status.type === 'success' ? (
                                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${status.type === 'success'
                                                ? theme === 'dark' ? 'text-green-200' : 'text-green-700'
                                                : theme === 'dark' ? 'text-red-200' : 'text-red-700'
                                                }`}>
                                                {status.message}
                                            </p>
                                            {status.txHash && status.type === 'success' && (
                                                <a
                                                    href={`https://sepolia.etherscan.io/tx/${status.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`text-xs underline mt-1 inline-flex items-center gap-1 ${theme === 'dark'
                                                        ? 'text-green-400 hover:text-green-300'
                                                        : 'text-green-600 hover:text-green-700'
                                                        }`}
                                                >
                                                    View on Etherscan
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setStatus(null)}
                                            className={`text-sm ${status.type === 'success' ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'}`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
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
                                Connect your wallet to access your encrypted salary stream
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
