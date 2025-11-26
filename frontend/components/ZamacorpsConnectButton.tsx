'use client';

import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';

export function ZamacorpsConnectButton() {
    const [showOptions, setShowOptions] = useState(false);
    const { connectors, connect } = useConnect();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();

    const [mounted, setMounted] = useState(false);

    // Get only the injected (MetaMask) connector for fast loading
    const injectedConnector = connectors.find(c => c.type === 'injected');

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="px-6 py-2 bg-[#ffd209]/50 text-black/50 rounded-xl font-black text-sm cursor-wait">
                Loading...
            </button>
        );
    }

    if (isConnected && address) {
        return (
            <div className="flex items-center gap-3 px-4 py-2 bg-green-500/10 border-2 border-green-500/30 rounded-xl">
                <span className="text-sm font-medium text-green-400">
                    {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <button
                    onClick={() => disconnect()}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    if (showOptions) {
        return (
            <div className="relative">
                <div className="absolute right-0 top-full mt-2 w-64 bg-black border-2 border-[#ffd209] rounded-xl p-3 shadow-2xl z-50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-black text-white">Connect Wallet</h3>
                        <button
                            onClick={() => setShowOptions(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {injectedConnector && (
                        <button
                            onClick={() => {
                                connect({ connector: injectedConnector });
                                setShowOptions(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-[#ffd209] hover:bg-[#ffdd33] text-black rounded-lg font-bold transition-all mb-2"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                            </svg>
                            Browser Wallet
                        </button>
                    )}

                    <p className="text-xs text-slate-400 mt-2 text-center">
                        Works with MetaMask, Coinbase, Rainbow, etc.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowOptions(true)}
            className="px-6 py-2 bg-[#ffd209] hover:bg-[#ffdd33] text-black rounded-xl font-black text-sm shadow-lg hover:shadow-yellow-500/50 transition-all transform hover:scale-105"
        >
            Connect Wallet
        </button>
    );
}
