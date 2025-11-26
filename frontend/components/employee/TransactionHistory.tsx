'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, usePublicClient } from 'wagmi';
import { format } from 'date-fns';
import { getWithdrawalHistory, type WithdrawalEvent } from '@/lib/utils/events';
import { formatEther } from 'viem';
import { animations } from '@/lib/utils/animations';

export function TransactionHistory() {
    const { address } = useAccount();
    const publicClient = usePublicClient();

    const [history, setHistory] = useState<WithdrawalEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 10;

    useEffect(() => {
        if (address && publicClient) {
            loadHistory();
        }
    }, [address, publicClient]);

    const loadHistory = async () => {
        if (!address || !publicClient) return;

        setLoading(true);
        const events = await getWithdrawalHistory(publicClient, address);
        setHistory(events);
        setLoading(false);
    };

    const totalWithdrawn = history.reduce((sum, event) => sum + event.amount, BigInt(0));
    const paginatedHistory = history.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(history.length / PAGE_SIZE);

    return (
        <motion.div
            className="relative"
            {...animations.fadeInUp}
        >
            {/* Glassmorphism Container */}
            <div className="relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 shadow-2xl">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />

                <div className="relative p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            📜 Transaction History
                        </h2>

                        {history.length > 0 && (
                            <div className="text-right">
                                <p className="text-sm text-gray-400">Total Withdrawn</p>
                                <p className="text-2xl font-bold text-white">
                                    {weiToEth(totalWithdrawn)} ETH
                                </p>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        /* Loading State */
                        <div className="text-center py-20">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="text-6xl mb-4 inline-block"
                            >
                                ⏳
                            </motion.div>
                            <p className="text-gray-300">Loading history...</p>
                        </div>
                    ) : history.length === 0 ? (
                        /* Empty State */
                        <motion.div
                            {...animations.fadeInUp}
                            className="text-center py-20"
                        >
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="text-8xl mb-4"
                            >
                                📭
                            </motion.div>
                            <p className="text-2xl font-bold text-white mb-2">
                                No transactions yet
                            </p>
                            <p className="text-gray-400">
                                Your withdrawal history will appear here
                            </p>
                        </motion.div>
                    ) : (
                        /* Transaction Table */
                        <div className="space-y-4">
                            {/* 3D Table */}
                            <div className="overflow-hidden rounded-2xl border border-white/20">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-white font-semibold">Date</th>
                                            <th className="px-6 py-4 text-left text-white font-semibold">Block</th>
                                            <th className="px-6 py-4 text-left text-white font-semibold">Amount</th>
                                            <th className="px-6 py-4 text-left text-white font-semibold">Transaction</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedHistory.map((event, idx) => (
                                            <motion.tr
                                                key={event.transactionHash}
                                                initial={{ opacity: 0, x: -20, rotateY: -10 }}
                                                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="border-t border-white/10 hover:bg-white/5 transition-all duration-300 transform-gpu hover:scale-[1.02]"
                                            >
                                                <td className="px-6 py-4 text-gray-200">
                                                    {format(new Date(event.timestamp * 1000), 'MMM dd, yyyy')}
                                                    <div className="text-xs text-gray-400">
                                                        {format(new Date(event.timestamp * 1000), 'HH:mm:ss')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-200 font-mono">
                                                    {event.blockNumber.toString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-green-400 font-bold text-lg">
                                                        {weiToEth(event.amount)} ETH
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <a
                                                        href={`https://etherscan.io/tx/${event.transactionHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:text-blue-300 font-mono text-sm hover:underline"
                                                    >
                                                        {event.transactionHash.slice(0, 6)}...{event.transactionHash.slice(-4)}
                                                    </a>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setPage(Math.max(0, page - 1))}
                                        disabled={page === 0}
                                        className="px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
                                    >
                                        ← Previous
                                    </motion.button>

                                    <div className="flex items-center gap-2">
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <motion.button
                                                key={i}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setPage(i)}
                                                className={`
                          w-10 h-10 rounded-lg font-medium transition-all
                          ${i === page
                                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                                    }
                        `}
                                            >
                                                {i + 1}
                                            </motion.button>
                                        ))}
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                        disabled={page === totalPages - 1}
                                        className="px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
                                    >
                                        Next →
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
