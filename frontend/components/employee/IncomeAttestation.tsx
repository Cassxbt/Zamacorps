'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAccount, useWalletClient } from 'wagmi';
import { INCOME_ORACLE_ADDRESS } from '@/lib/wagmi/config';
import { ABIs } from '@/lib/contracts/abi';

export function IncomeAttestation() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const { theme } = useTheme();
    const [requesting, setRequesting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string; txHash?: string } | null>(null);

    const handleRequestAttestation = async () => {
        if (!walletClient || !address) return;

        setRequesting(true);
        setStatus(null);

        try {
            const hash = await walletClient.writeContract({
                address: INCOME_ORACLE_ADDRESS,
                abi: ABIs.incomeOracle,
                functionName: 'requestAttestation',
                args: [],
            });

            setStatus({
                type: 'success',
                message: 'Income attestation requested successfully! The Oracle is processing your encrypted salary data.',
                txHash: hash
            });
        } catch (error: any) {
            console.error('[IncomeAttestation] Error:', error);
            setStatus({
                type: 'error',
                message: error.message || 'Failed to request attestation. Please try again.'
            });
        } finally {
            setRequesting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`border rounded-2xl p-8 ${theme === 'dark' ? 'bg-[#1a1a1a]/80 border-[#ffd209]/30' : 'bg-white border-slate-200'}`}
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        Income Attestation
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        Request encrypted income verification via Zama Oracle
                    </p>
                </div>
            </div>

            <div className={`p-4 rounded-xl mb-6 ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className={`text-xs ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                        <p className="font-bold mb-1">🔐 Privacy-Preserving Verification</p>
                        <p>
                            The Income Oracle performs homomorphic comparisons on your <strong>encrypted salary</strong> without ever decrypting it.
                            Your actual income amount remains private while you receive tier-based verification.
                        </p>
                    </div>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRequestAttestation}
                disabled={requesting}
                className={`w-full px-6 py-4 rounded-xl font-black text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${requesting
                    ? 'bg-slate-500/20 text-slate-500 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700  text-white hover:shadow-purple-500/50'
                    }`}
            >
                {requesting ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Requesting Attestation...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Request Income Attestation
                    </>
                )}
            </motion.button>

            {status && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${status.type === 'success'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                        }`}
                >
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${status.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
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
        </motion.div>
    );
}
