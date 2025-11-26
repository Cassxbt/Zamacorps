'use client';

import { useState } from 'react';
import { useWalletClient, usePublicClient, useAccount, useSwitchChain } from 'wagmi';
import { getWalletClient } from '@wagmi/core';
import { createPayrollStream, checkStreamExists } from '@/lib/contracts/payroll';
import { parseEther } from 'viem';
import { useTheme } from 'next-themes';
import { sepolia } from 'wagmi/chains';
import { config } from '@/lib/wagmi/config';

export function CreateStreamForm() {
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { isConnected, address, connector, chain } = useAccount();
    const { switchChain } = useSwitchChain();
    const { theme } = useTheme();

    const [formData, setFormData] = useState({
        employee: '',
        salaryEth: '',
        startBlock: '',
        cliffBlocks: '100',
    });

    const [status, setStatus] = useState<'idle' | 'encrypting' | 'submitting' | 'success' | 'error'>('idle');
    const [txHash, setTxHash] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [checkingDuplicate, setCheckingDuplicate] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('encrypting');
        setError('');
        setDuplicateWarning('');

        try {
            // Check for duplicate stream BEFORE encrypting
            if (publicClient && formData.employee) {
                const exists = await checkStreamExists(publicClient, formData.employee);
                if (exists) {
                    throw new Error('Stream already exists for this employee. Each employee can only have one active stream.');
                }
            }
            // Debug logging
            console.log('[CreateStream] Debug info:', {
                isConnected,
                hasWalletClient: !!walletClient,
                hasPublicClient: !!publicClient,
                address,
                chain: chain?.name,
                chainId: chain?.id,
                connector: connector?.name
            });

            // More robust wallet check
            if (!isConnected || !address) {
                throw new Error('Wallet not connected. Please connect your wallet first.');
            }

            // Check chain and auto-switch if needed
            if (chain?.id !== sepolia.id) {
                console.log(`[CreateStream] Wrong chain (${chain?.name}), switching to Sepolia...`);
                if (switchChain) {
                    try {
                        await switchChain({ chainId: sepolia.id });
                        // Wait a moment for the switch to complete
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (switchError: any) {
                        if (switchError.message?.includes('User rejected')) {
                            throw new Error('Please switch to Sepolia Testnet to create streams.');
                        }
                        throw new Error(`Failed to switch to Sepolia: ${switchError.message}`);
                    }
                } else {
                    throw new Error('Please manually switch to Sepolia Testnet in your wallet.');
                }
            }

            // Try to get wallet client
            let activeWalletClient = walletClient;
            if (!activeWalletClient) {
                console.log('[CreateStream] Wallet client not available from hook, trying getWalletClient...');
                try {
                    activeWalletClient = await getWalletClient(config, {
                        chainId: sepolia.id
                    });
                } catch (err) {
                    console.error('Failed to get wallet client:', err);
                }
            }

            if (!activeWalletClient) {
                throw new Error('Wallet client not ready. Please disconnect and reconnect your wallet.');
            }

            if (!publicClient) {
                throw new Error('Network connection not ready. Please refresh the page.');
            }

            // Check for duplicate stream BEFORE proceeding
            console.log('[CreateStream] Checking for duplicate stream...');
            const streamExists = await checkStreamExists(publicClient, formData.employee);
            console.log('[CreateStream] Stream exists check result:', streamExists);

            if (streamExists) {
                throw new Error(`This employee (${formData.employee.slice(0, 6)}...${formData.employee.slice(-4)}) already has an active stream. Please cancel the existing stream first or use a different employee address.`);
            }

            // Parse inputs
            const salaryPerBlock = parseEther(formData.salaryEth);
            const currentBlock = await publicClient.getBlockNumber() || BigInt(0);
            const startBlock = formData.startBlock
                ? BigInt(formData.startBlock)
                : currentBlock + BigInt(10);
            const cliffBlock = startBlock + BigInt(formData.cliffBlocks);

            setStatus('submitting');

            // Create encrypted stream
            const hash = await createPayrollStream(activeWalletClient, publicClient, {
                employee: formData.employee,
                salaryPerBlock,
                startBlock,
                cliffBlock,
            });

            setTxHash(hash);
            setStatus('success');

            // Reset form
            setFormData({
                employee: '',
                salaryEth: '',
                startBlock: '',
                cliffBlocks: '100',
            });
        } catch (err: any) {
            console.error('Error creating stream:', err);
            setError(err.message || 'Failed to create stream');
            setStatus('error');
        }
    };

    return (
        <div className={`border rounded-2xl p-8 max-w-3xl mx-auto ${theme === 'dark'
            ? 'bg-[#1a1a1a]/80 border-[#ffd209]/30'
            : 'bg-white border-slate-200'
            }`}>
            <h2 className={`text-3xl font-black mb-2 font-heading ${theme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                Create Salary Stream
            </h2>
            <p className={`text-sm mb-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>All salary data will be encrypted using FHE before sending to blockchain</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Employee Address */}
                <div>
                    <label className={`block text-sm font-bold mb-2 font-heading ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                        }`}>
                        Employee Wallet Address
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="0x..."
                        value={formData.employee}
                        onChange={(e) => {
                            setFormData({ ...formData, employee: e.target.value });
                            setDuplicateWarning('');
                        }}
                        onBlur={async () => {
                            // Check if stream exists when user leaves the field
                            if (publicClient && formData.employee.startsWith('0x')) {
                                setCheckingDuplicate(true);
                                const exists = await checkStreamExists(publicClient, formData.employee);
                                if (exists) {
                                    setDuplicateWarning('⚠️ This employee already has an active stream!');
                                }
                                setCheckingDuplicate(false);
                            }
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#ffd209] focus:border-[#ffd209] transition-all font-mono ${theme === 'dark'
                            ? 'bg-black/30 border-[#ffd209]/20 text-white placeholder-slate-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                            }`}
                    />
                    {checkingDuplicate && (
                        <p className="mt-2 text-sm text-[#ffd209] flex items-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Checking for existing stream...
                        </p>
                    )}
                    {duplicateWarning && (
                        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-sm text-red-400 font-medium">{duplicateWarning}</p>
                            <p className="text-xs text-red-300 mt-1">Please use a different employee address.</p>
                        </div>
                    )}
                </div>

                {/* Salary */}
                <div>
                    <label className={`block text-sm font-bold mb-2 font-heading ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                        }`}>
                        Salary Per Block (ETH)
                    </label>
                    <input
                        type="number"
                        required
                        step="0.000001"
                        min="0"
                        placeholder="0.001"
                        value={formData.salaryEth}
                        onChange={(e) => setFormData({ ...formData, salaryEth: e.target.value })}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#ffd209] focus:border-[#ffd209] transition-all ${theme === 'dark'
                            ? 'bg-black/30 border-[#ffd209]/20 text-white placeholder-slate-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                            }`}
                    />
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-[#ffd209]/10 border border-[#ffd209]/30 rounded-lg">
                        <svg className="w-4 h-4 text-[#ffd209]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="text-sm text-[#ffd209] font-medium">
                            This will be encrypted using FHE before sending to blockchain
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Start Block */}
                    <div>
                        <label className={`block text-sm font-bold mb-2 font-heading ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                            }`}>
                            Start Block (optional)
                        </label>
                        <input
                            type="number"
                            placeholder="Auto: Current + 10"
                            value={formData.startBlock}
                            onChange={(e) => setFormData({ ...formData, startBlock: e.target.value })}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#ffd209] focus:border-[#ffd209] transition-all ${theme === 'dark'
                                ? 'bg-black/30 border-[#ffd209]/20 text-white placeholder-slate-500'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                                }`}
                        />
                    </div>

                    {/* Cliff Period */}
                    <div>
                        <label className={`block text-sm font-bold mb-2 font-heading ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                            }`}>
                            Cliff Period (blocks)
                        </label>
                        <input
                            type="number"
                            required
                            min="0"
                            value={formData.cliffBlocks}
                            onChange={(e) => setFormData({ ...formData, cliffBlocks: e.target.value })}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#ffd209] focus:border-[#ffd209] transition-all ${theme === 'dark'
                                ? 'bg-black/30 border-[#ffd209]/20 text-white placeholder-slate-500'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                                }`}
                        />
                        <div className="flex justify-between items-start mt-2">
                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                                Blocks before vesting starts
                            </p>
                            {formData.cliffBlocks && (
                                <p className="text-xs font-mono text-[#ffd209]">
                                    ≈ {(() => {
                                        const totalSeconds = Number(formData.cliffBlocks) * 12;
                                        const hours = Math.floor(totalSeconds / 3600);
                                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                                        const seconds = totalSeconds % 60;

                                        const parts = [];
                                        if (hours > 0) parts.push(`${hours}h`);
                                        if (minutes > 0) parts.push(`${minutes}m`);
                                        if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

                                        return parts.join(' ');
                                    })()}
                                    <span className="opacity-50 ml-1">(@ 12s/block)</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={status === 'submitting' || !!duplicateWarning}
                    className="w-full bg-[#ffd209] hover:bg-[#ffdd33] text-black py-4 px-6 rounded-xl font-black text-lg disabled:bg-slate-400 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-yellow-500/50 flex items-center justify-center gap-2"
                >
                    {status === 'encrypting' && (
                        <>
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Encrypting Salary...
                        </>
                    )}
                    {status === 'submitting' && (
                        <>
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Creating Stream...
                        </>
                    )}
                    {status === 'idle' && 'Create Encrypted Stream'}
                    {status === 'success' && '✅ Stream Created!'}
                    {status === 'error' && '❌ Try Again'}
                </button>
            </form>

            {/* Status Messages */}
            {txHash && (
                <div className="mt-6 p-4 bg-green-500/10 border-2 border-green-500/30 rounded-xl">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                        <strong>Success!</strong> Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </p>
                    <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm mt-2 inline-block font-medium hover:underline ${theme === 'dark' ? 'text-[#ffd209]' : 'text-yellow-600'}`}
                    >
                        View on Etherscan →
                    </a>
                </div>
            )}

            {error && (
                <div className="mt-6 p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>
                        <strong>Error:</strong> {error}
                    </p>
                </div>
            )}
        </div>
    );
}
