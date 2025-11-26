'use client';

import { useState, useEffect } from 'react';
import { usePublicClient, useWalletClient, useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { PAYROLL_ADDRESS } from '@/lib/wagmi/config';
import { ABIs } from '@/lib/contracts/abi';
const EncryptedPayrollABI = ABIs.payroll;

export function RoleManagement() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { theme } = useTheme();

    const [newHRAddress, setNewHRAddress] = useState('');
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string; txHash?: string } | null>(null);

    // Check if connected user is admin
    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!address || !publicClient) return;

            try {
                const defaultAdminRole = await publicClient.readContract({
                    address: PAYROLL_ADDRESS,
                    abi: EncryptedPayrollABI,
                    functionName: 'DEFAULT_ADMIN_ROLE',
                });

                const hasRole = await publicClient.readContract({
                    address: PAYROLL_ADDRESS,
                    abi: EncryptedPayrollABI,
                    functionName: 'hasRole',
                    args: [defaultAdminRole, address as `0x${string}`],
                });

                setIsAdmin(hasRole as boolean);
            } catch (error) {
                console.error('Failed to check admin status:', error);
                setIsAdmin(false);
            }
        };

        checkAdminStatus();
    }, [address, publicClient]);

    const handleGrantHRRole = async () => {
        if (!walletClient || !publicClient) return;

        setLoading(true);
        setStatus(null);

        try {
            const hrRole = await publicClient.readContract({
                address: PAYROLL_ADDRESS,
                abi: EncryptedPayrollABI,
                functionName: 'HR_ROLE',
            });

            const hash = await walletClient.writeContract({
                address: PAYROLL_ADDRESS,
                abi: EncryptedPayrollABI,
                functionName: 'grantRole',
                args: [hrRole, newHRAddress as `0x${string}`],
            });

            setStatus({
                type: 'success',
                message: `HR role granted successfully!`,
                txHash: hash
            });
            setNewHRAddress('');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to grant role';
            setStatus({ type: 'error', message: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    if (isAdmin === null) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#ffd209] border-t-transparent rounded-full animate-spin" />
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Checking admin permissions...</p>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
            >
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-red-500/10' : 'bg-red-500/20'}`}>
                    <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className={`text-3xl font-black mb-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Access Denied</h3>
                <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    You need DEFAULT_ADMIN_ROLE to access role management
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Grant HR Role Section */}
            <div className={`border rounded-2xl p-6 ${theme === 'dark' ? 'bg-[#1a1a1a]/50 border-[#ffd209]/20' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#ffd209]/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#ffd209]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <div>
                        <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Grant HR Role</h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Give an address permission to manage salary streams</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                            Employee Wallet Address
                        </label>
                        <input
                            type="text"
                            value={newHRAddress}
                            onChange={(e) => setNewHRAddress(e.target.value)}
                            placeholder="0x..."
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#ffd209] focus:border-[#ffd209] transition-all font-mono ${theme === 'dark'
                                ? 'bg-black/30 border-[#ffd209]/20 text-white placeholder-slate-500'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                                }`}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGrantHRRole}
                        disabled={!newHRAddress || loading}
                        className="w-full px-6 py-4 rounded-xl bg-[#ffd209] hover:bg-[#ffdd33] text-black font-black shadow-lg hover:shadow-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                Granting Role...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Grant HR Role
                            </>
                        )}
                    </motion.button>
                </div>
            </div>

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
                            <p className={`text-sm font-medium ${status.type === 'success' ? 'text-green-200' : 'text-red-200'}`}>
                                {status.message}
                            </p>
                            {status.txHash && status.type === 'success' && (
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${status.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-green-400 hover:text-green-300 underline mt-1 inline-flex items-center gap-1"
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

            {/* Role Information */}
            <div className={`border rounded-2xl p-6 ${theme === 'dark' ? 'bg-[#1a1a1a]/50 border-[#ffd209]/20' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Role Hierarchy</h3>
                </div>
                <ul className={`space-y-2 text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span><strong className="font-bold">DEFAULT_ADMIN</strong> can grant/revoke HR_ROLE</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span><strong className="font-bold">HR_ROLE</strong> can create, pause, resume, and cancel salary streams</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span><strong className="font-bold">Employees</strong> can only withdraw from their own streams</span>
                    </li>
                </ul>
            </div>

            {/* Quick Action Tip */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${theme === 'dark' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'}`}>
                <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div className="flex-1">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                        <strong>Tip:</strong> After granting HR role, the user can manage streams from the <strong>HR Dashboard</strong>.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
