'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { motion } from 'framer-motion';
import Link from 'next/link';

const CreateStreamForm = dynamic(() => import('@/components/hr/CreateStreamForm').then(mod => ({ default: mod.CreateStreamForm })), {
    loading: () => <div className="h-96 animate-pulse bg-purple-800/30 rounded-3xl" />,
    ssr: false
});

const BulkUpload = dynamic(() => import('@/components/hr/BulkUpload').then(mod => ({ default: mod.BulkUpload })), {
    loading: () => <div className="h-96 animate-pulse bg-purple-800/30 rounded-3xl" />,
    ssr: false
});

export default function HRPage() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        ← Back to Home
                    </Link>

                    <div className="flex items-center gap-4">
                        {isConnected ? (
                            <>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg text-green-300 font-medium shadow-lg"
                                >
                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                </motion.div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => disconnect()}
                                    className="px-4 py-2 bg-red-600/80 backdrop-blur-xl text-white rounded-lg hover:bg-red-700/90 font-medium shadow-lg transition-all"
                                >
                                    Disconnect
                                </motion.button>
                            </>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => connect({ connector: injected() })}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-2xl hover:shadow-blue-500/50 transition-all"
                            >
                                Connect Wallet
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 text-center"
                >
                    <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        👔 HR Dashboard
                    </h1>
                    <p className="text-gray-300 text-xl">Create encrypted salary streams for employees</p>
                </motion.div>

                {/* Content */}
                {!isConnected ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-2xl p-8 text-center shadow-2xl"
                    >
                        <p className="text-yellow-200 font-medium mb-6 text-xl">
                            Please connect your wallet to access the HR dashboard
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => connect({ connector: injected() })}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-2xl hover:shadow-blue-500/50 transition-all text-lg"
                        >
                            Connect Wallet
                        </motion.button>
                    </motion.div>
                ) : (
                    <div className="space-y-8">
                        {/* Tab Navigation */}
                        <div className="flex gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveTab('single')}
                                className={`
                  flex-1 px-6 py-4 rounded-2xl font-medium text-lg transition-all shadow-lg
                  ${activeTab === 'single'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/50'
                                        : 'bg-white/10 backdrop-blur-xl text-gray-300 hover:bg-white/20'
                                    }
                `}
                            >
                                📝 Single Employee
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveTab('bulk')}
                                className={`
                  flex-1 px-6 py-4 rounded-2xl font-medium text-lg transition-all shadow-lg
                  ${activeTab === 'bulk'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/50'
                                        : 'bg-white/10 backdrop-blur-xl text-gray-300 hover:bg-white/20'
                                    }
                `}
                            >
                                📊 Bulk Upload (CSV)
                            </motion.button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'single' ? (
                            <CreateStreamForm />
                        ) : (
                            <BulkUpload />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
