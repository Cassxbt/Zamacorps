'use client';

import { useState, useEffect } from 'react';
import { useWalletClient, usePublicClient, useAccount } from 'wagmi';
import { requestWithdrawal, submitWithdrawal, getEmployeeStream } from '@/lib/contracts/payroll';
import { decryptClaimable } from '@/lib/fhe/decrypt';
import { PAYROLL_ADDRESS } from '@/lib/wagmi/config';
import { formatEther } from 'viem';
import { motion } from 'framer-motion';

export function WithdrawPanel() {
    const animations = {
        fadeInUp: {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5 }
        }
    };

    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();

    const [status, setStatus] = useState<'idle' | 'requesting' | 'decrypting' | 'submitting' | 'success' | 'error'>('idle');
    const [decryptedAmount, setDecryptedAmount] = useState<bigint | null>(null);
    const [txHash, setTxHash] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [currentBlock, setCurrentBlock] = useState<bigint>(BigInt(0));
    const [streamData, setStreamData] = useState<any>(null);
    const [debugMode, setDebugMode] = useState(false);

    // Load stream data on mount
    useEffect(() => {
        if (address && publicClient) {
            loadStreamData();

            // Update current block every 12 seconds
            const interval = setInterval(async () => {
                const block = await publicClient.getBlockNumber();
                setCurrentBlock(block);
            }, 12000);

            return () => clearInterval(interval);
        }
    }, [address, publicClient]);

    const loadStreamData = async () => {
        if (!address || !publicClient) return;

        try {
            const data = await getEmployeeStream(publicClient, address);
            setStreamData(data);

            const block = await publicClient.getBlockNumber();
            setCurrentBlock(block);
        } catch (err) {
            console.error('Failed to load stream:', err);
        }
    };

    // v0.9 FHE withdrawal flow with Relayer SDK
    const handleWithdraw = async () => {
        if (!walletClient || !publicClient || !address) {
            setError('Wallet not connected');
            return;
        }

        setStatus('requesting');
        setError('');
        setDecryptedAmount(null);

        try {
            // Step 1: Request withdrawal - get encrypted handle
            console.log('[Withdraw] Step 1: Requesting withdrawal...');
            setStatus('requesting');

            const { txHash: requestTxHash, handle: encryptedHandle } = await requestWithdrawal(walletClient, publicClient);
            console.log('[Withdraw] Got encrypted handle from tx:', requestTxHash);

            // Step 2: Decrypt using Zama Relayer SDK
            console.log('[Withdraw] Step 2: Decrypting with Relayer...');
            setStatus('decrypting');

            const amount = await decryptClaimable(encryptedHandle, address);
            console.log('[Withdraw] Decrypted amount:', amount);
            setDecryptedAmount(amount);

            // Step 3: Submit the decrypted amount
            console.log('[Withdraw] Step 3: Submitting withdrawal...');
            setStatus('submitting');

            const hash = await submitWithdrawal(walletClient, amount);
            setTxHash(hash);

            console.log('[Withdraw] Withdrawal complete! Tx:', hash);
            setStatus('success');

            // Reload stream data
            setTimeout(() => loadStreamData(), 2000);

        } catch (err: any) {
            console.error('[Withdraw] Error:', err);
            setError(err.message || 'Withdrawal failed');
            setStatus('error');
        }
    };

    // Calculate estimated claimable (client-side approximation)
    const estimateClaimable = () => {
        if (!streamData || !currentBlock) return BigInt(0);

        try {
            const startBlock = BigInt(streamData.startBlock || 0);
            const cliffBlock = BigInt(streamData.cliffBlock || 0);
            const salaryPerBlock = BigInt(streamData.salaryPerBlock || 0);
            const claimedAmount = BigInt(streamData.claimedAmount || 0);

            // Check if past cliff
            if (currentBlock < cliffBlock) return BigInt(0);

            // Calculate accrued
            const blocksPassed = currentBlock - startBlock;
            const accrued = salaryPerBlock * blocksPassed;

            // Calculate claimable
            const claimable = accrued - claimedAmount;

            return claimable > 0 ? claimable : BigInt(0);
        } catch (e) {
            return BigInt(0);
        }
    };

    if (!address) {
        return (
            <motion.div
                {...animations.fadeInUp}
                className="backdrop-blur-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl p-8 border border-white/20 shadow-2xl"
            >
                <p className="text-white/70 text-center">
                    Connect your wallet to manage withdrawals
                </p>
            </motion.div>
        );
    }

    const estimatedClaimable = estimateClaimable();

    return (
        <motion.div
            {...animations.fadeInUp}
            className="backdrop-blur-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl p-8 border border-white/20 shadow-2xl"
        >
            <h2 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Withdraw Salary
            </h2>

            {streamData && (
                <div className="space-y-4 mb-8">
                    <div className="flex justify-end mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs text-white/40 font-mono uppercase">Debug: Show Encrypted</span>
                            <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                                <input
                                    type="checkbox"
                                    name="toggle"
                                    id="debug-toggle"
                                    className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out translate-x-1 checked:translate-x-5 checked:bg-[#ffd209]"
                                    checked={debugMode}
                                    onChange={() => setDebugMode(!debugMode)}
                                />
                                <div className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer border-2 ${debugMode ? 'bg-slate-800 border-[#ffd209]' : 'bg-slate-800 border-slate-600'}`}></div>
                            </div>
                        </label>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                        <span className="text-white/60">Estimated Claimable:</span>
                        <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text">
                            {formatEther(estimatedClaimable)} ETH
                        </span>
                    </div>

                    {debugMode && (
                        <div className="p-4 bg-black/40 rounded-xl border border-yellow-500/20 font-mono text-xs overflow-hidden">
                            <p className="text-[#ffd209] mb-2 font-bold uppercase">Encrypted On-Chain Data (Zama Ethos)</p>
                            <div className="space-y-2 text-white/50 break-all">
                                <div>
                                    <span className="text-white/30">Salary Handle:</span><br />
                                    {streamData.salaryPerBlock.toString()}
                                </div>
                                <div>
                                    <span className="text-white/30">Claimed Handle:</span><br />
                                    {streamData.claimedAmount.toString()}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                        <span className="text-white/60">Current Block:</span>
                        <span className="text-white font-mono">
                            {currentBlock.toString()}
                        </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                        <span className="text-white/60">Cliff Block:</span>
                        <span className="text-white font-mono">
                            {streamData.cliffBlock?.toString() || 'N/A'}
                        </span>
                    </div>
                </div>
            )}

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWithdraw}
                disabled={status !== 'idle' || estimatedClaimable === BigInt(0)}
                className="w-full py-4 px-8 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl transition-all"
            >
                {status === 'idle' && 'Withdraw'}
                {status === 'requesting' && '1/3 Requesting...'}
                {status === 'decrypting' && '2/3 Decrypting...'}
                {status === 'submitting' && '3/3 Submitting...'}
                {status === 'success' && '✓ Withdrawal Complete'}
                {status === 'error' && 'Try Again'}
            </motion.button>

            {decryptedAmount !== null && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30"
                >
                    <p className="text-green-300 text-center font-semibold">
                        Withdrew: {formatEther(decryptedAmount)} ETH
                    </p>
                </motion.div>
            )}

            {txHash && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-white/5 rounded-xl"
                >
                    <p className="text-white/60 text-sm mb-2">Transaction:</p>
                    <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-mono break-all"
                    >
                        {txHash}
                    </a>
                </motion.div>
            )}

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-red-500/20 rounded-xl border border-red-500/30"
                >
                    <p className="text-red-300 text-center">{error}</p>
                </motion.div>
            )}

            <div className="mt-8 p-6 bg-white/5 rounded-xl">
                <h3 className="text-white font-semibold mb-3">How it works (v0.9):</h3>
                <ol className="text-white/70 text-sm space-y-2 list-decimal list-inside">
                    <li>Request your claimable amount from contract</li>
                    <li>Decrypt encrypted amount using Zama Relayer (off-chain)</li>
                    <li>Submit decrypted amount to receive funds</li>
                </ol>
            </div>
        </motion.div>
    );
}
