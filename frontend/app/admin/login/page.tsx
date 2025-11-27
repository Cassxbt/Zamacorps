'use client';

import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { ZamacorpsConnectButton } from '@/components/ZamacorpsConnectButton';

export default function AdminLoginPage() {
    const { isConnected } = useAccount();
    const router = useRouter();
    const { theme } = useTheme();

    useEffect(() => {
        if (isConnected) {
            router.push('/admin');
        }
    }, [isConnected, router]);

    return (
        <div className={`min-h-[calc(100vh-6rem)] flex items-center justify-center p-4 transition-colors duration-300 ${theme === 'dark'
            ? 'bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f]'
            : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
            }`}>
            <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center">

                {/* Left Column: Info */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <h1 className={`text-4xl md:text-5xl font-black leading-tight font-heading ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                        }`}>
                        Secure Management for <br />
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
                            Encrypted Payroll
                        </span>
                    </h1>
                    <p className={`text-sm max-w-md leading-relaxed font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                        Access the Zama dashboard to manage salary streams, view real-time analytics, and configure organizational settings with complete privacy.
                    </p>

                    <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#ffd209] rounded-full animate-pulse" />
                            <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Sepolia Testnet</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#ffd209] rounded-full" />
                            <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>FHE Encrypted</span>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Login Card */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`border rounded-3xl p-8 shadow-2xl transition-colors duration-300 ${theme === 'dark'
                        ? 'bg-[#1a1a1a]/80 border-[#ffd209]/30 backdrop-blur-xl'
                        : 'bg-white border-slate-200'
                        }`}
                >
                    <h2 className={`text-2xl font-black mb-8 text-center font-heading ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                        }`}>Admin Sign In</h2>

                    <div className="space-y-4">
                        <ZamacorpsConnectButton />

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className={`w-full border-t ${theme === 'dark' ? 'border-[#ffd209]/20' : 'border-slate-200'
                                    }`}></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className={`px-2 ${theme === 'dark' ? 'bg-[#1a1a1a] text-slate-500' : 'bg-white text-slate-500'
                                    }`}>Or continue with</span>
                            </div>
                        </div>

                        {/* Email Login (Placeholder) */}
                        <button
                            disabled
                            className={`w-full border rounded-xl p-4 flex items-center justify-center gap-3 cursor-not-allowed transition-colors ${theme === 'dark'
                                ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">Enterprise Email</span>
                            <span className={`text-xs px-2 py-0.5 rounded ml-auto ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                                }`}>Coming Soon</span>
                        </button>
                    </div>

                    <p className={`mt-8 text-center text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                        }`}>
                        By connecting, you agree to ZACORPS <a href="#" className="text-[#ffd209] hover:underline">Terms of Service</a> and <a href="#" className="text-[#ffd209] hover:underline">Privacy Policy</a>.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
