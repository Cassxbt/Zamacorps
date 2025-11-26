'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

// Lazy load TypingText for faster initial load
const TypingText = dynamic(() => import('@/components/TypingText').then(mod => ({ default: mod.TypingText })), {
  loading: () => <span className="font-black tracking-tighter font-heading">For Everyone</span>,
  ssr: false
});

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`min-h-screen overflow-hidden relative transition-colors duration-300 ${theme === 'dark'
      ? 'bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f]'
      : 'bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50'
      }`}>
      {/* Simplified Background Elements - removed animate-pulse */}
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none ${theme === 'dark' ? 'bg-yellow-500/10' : 'bg-blue-400/20'
        }`} />
      <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl pointer-events-none ${theme === 'dark' ? 'bg-yellow-400/10' : 'bg-green-400/20'
        }`} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className={`text-5xl md:text-7xl font-black mb-6 tracking-tight font-heading ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
              }`}>
              Private Payroll
              <br />
              <TypingText />
            </h1>
            <p className={`text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
              We empower organizations with <span className={theme === 'dark' ? 'text-slate-200 font-semibold' : 'text-slate-700 font-semibold'}>Fully Homomorphic Encryption</span> to process payroll on-chain while keeping salaries completely private.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="px-6 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Cards Grid with 4 cards - 2 rows on mobile, single row on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-0 md:-space-x-12 relative items-center justify-center px-4 md:px-0">
            {/* Admin Card - Rotated LEFT */}
            <Link href="/admin/login" prefetch={true}>
              <div className="relative group h-[480px] w-full overflow-hidden rounded-[40px] transform md:rotate-[-6deg] md:translate-y-8 hover:rotate-0 hover:translate-y-0 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:z-20 border-4 border-white cursor-pointer">
                {/* Yellow Dashed Arc - TOP LEFT */}
                <div className="absolute -top-12 -left-12 w-48 h-48 pointer-events-none z-30">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path
                      d="M 5,95 Q 5,5 95,5"
                      fill="none"
                      stroke="#ffd209"
                      strokeWidth="3"
                      strokeDasharray="8,8"
                      opacity="0.7"
                    />
                  </svg>
                </div>

                {/* Background Image */}
                <div className="absolute inset-0 bg-cover bg-center transform scale-110 group-hover:scale-100 transition-transform duration-500" style={{ backgroundImage: 'url(/images/admin-card.png)' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-10 text-left z-20">
                  <p className="text-sm text-[#ffd209] mb-3 font-black uppercase tracking-[0.3em] font-heading">FOR</p>
                  <h2 className="text-5xl font-black text-white mb-6 font-heading tracking-tight leading-none">Admin</h2>
                  <button className="self-start px-10 py-4 bg-[#ffd209] hover:bg-[#ffdd33] text-black rounded-2xl font-black text-lg shadow-lg hover:shadow-yellow-500/50 transition-all transform hover:scale-105 flex items-center gap-3">
                    Access Portal
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </button>
                </div>
              </div>
            </Link>

            {/* HR Management Card - NEW! Slight left rotation */}
            <Link href="/hr" prefetch={true}>
              <div className="relative group h-[500px] w-full overflow-hidden rounded-[40px] transform md:rotate-[-2deg] md:translate-y-4 hover:rotate-0 hover:translate-y-0 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:z-20 border-4 border-[#ffd209] cursor-pointer">
                {/* Vibrant Yellow Circle Accent - TOP */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#ffd209] rounded-full blur-2xl opacity-40 pointer-events-none z-30" />

                {/* Decorative Dots Pattern */}
                <div className="absolute top-6 right-6 grid grid-cols-3 gap-2 pointer-events-none z-30">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-[#ffd209] rounded-full opacity-60" />
                  ))}
                </div>

                {/* Background Image */}
                <div className="absolute inset-0 bg-cover bg-center transform scale-110 group-hover:scale-100 transition-transform duration-500" style={{ backgroundImage: 'url(/images/hr-card.png)' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/95 via-indigo-900/70 to-transparent" />
                </div>

                {/* Animated Border Glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 rounded-[36px] border-2 border-[#ffd209] animate-pulse" />
                </div>

                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-10 text-left z-20">
                  <p className="text-sm text-[#ffd209] mb-3 font-black uppercase tracking-[0.3em] font-heading">FOR</p>
                  <h2 className="text-5xl font-black text-white mb-6 font-heading tracking-tight leading-none">
                    HR
                    <span className="block text-3xl mt-1 text-[#ffd209]">Management</span>
                  </h2>
                  <button className="self-start px-10 py-4 bg-gradient-to-r from-[#ffd209] via-[#ffdd33] to-[#ffd209] hover:from-[#ffdd33] hover:via-[#ffd209] hover:to-[#ffdd33] text-black rounded-2xl font-black text-lg shadow-lg hover:shadow-yellow-500/70 transition-all transform hover:scale-105 flex items-center gap-3">
                    Create Streams
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </button>
                </div>
              </div>
            </Link>

            {/* Employee Card - Slight right rotation */}
            <Link href="/employee/login" prefetch={true}>
              <div className="relative group h-[500px] w-full overflow-hidden rounded-[40px] transform md:rotate-[2deg] md:translate-y-4 hover:rotate-0 hover:translate-y-0 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:z-20 border-4 border-white cursor-pointer">
                {/* Yellow Dashed Arc - TOP CENTER */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 pointer-events-none z-30">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path
                      d="M 10,90 Q 50,10 90,90"
                      fill="none"
                      stroke="#ffd209"
                      strokeWidth="3"
                      strokeDasharray="8,8"
                      opacity="0.7"
                    />
                  </svg>
                </div>

                {/* Background Image */}
                <div className="absolute inset-0 bg-cover bg-center transform scale-110 group-hover:scale-100 transition-transform duration-500" style={{ backgroundImage: 'url(/images/employee-card.png)' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-10 text-left z-20">
                  <p className="text-sm text-[#ffd209] mb-3 font-black uppercase tracking-[0.3em] font-heading">FOR</p>
                  <h2 className="text-5xl font-black text-white mb-6 font-heading tracking-tight leading-none">Employee</h2>
                  <button className="self-start px-10 py-4 bg-black hover:bg-black/90 text-[#ffd209] border-2 border-[#ffd209] rounded-2xl font-black text-lg shadow-lg hover:shadow-yellow-500/30 transition-all transform hover:scale-105 flex items-center gap-3">
                    Access Dashboard
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                </div>
              </div>
            </Link>

            {/* Pension Card - Rotated RIGHT */}
            <div className="relative group h-[480px] w-full overflow-hidden rounded-[40px] transform md:rotate-[6deg] md:-translate-y-8 hover:rotate-0 hover:translate-y-0 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:z-20 border-4 border-white cursor-not-allowed">
              {/* Yellow Dashed Arc - TOP RIGHT */}
              <div className="absolute -top-12 -right-12 w-48 h-48 pointer-events-none z-30">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path
                    d="M 95,95 Q 95,5 5,5"
                    fill="none"
                    stroke="#ffd209"
                    strokeWidth="3"
                    strokeDasharray="8,8"
                    opacity="0.5"
                  />
                </svg>
              </div>

              {/* Background Image */}
              <div className="absolute inset-0 bg-cover bg-center transform scale-110 group-hover:scale-100 transition-transform duration-500 grayscale group-hover:grayscale-0" style={{ backgroundImage: 'url(/images/pension-card.png)' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
              </div>

              {/* Coming Soon Badge */}
              <div className="absolute top-8 right-8 z-30">
                <div className="px-6 py-3 bg-black/70 backdrop-blur-md border-2 border-yellow-500/40 text-yellow-400 text-sm font-black rounded-full shadow-lg uppercase tracking-wider">
                  COMING SOON
                </div>
              </div>

              {/* Content */}
              <div className="relative h-full flex flex-col justify-end p-10 text-left z-20 opacity-80 group-hover:opacity-100 transition-opacity">
                <p className="text-sm text-[#ffd209] mb-3 font-black uppercase tracking-[0.3em] font-heading">FOR</p>
                <h2 className="text-5xl font-black text-white mb-6 font-heading tracking-tight leading-none">Pensioners</h2>
                <button disabled className="self-start px-10 py-4 bg-gray-600/70 backdrop-blur-md rounded-2xl text-white font-black text-lg shadow-lg cursor-not-allowed flex items-center gap-3 opacity-60">
                  Employers
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div >
      </section >

      {/* Info Section - ZAMACORPS Themed */}
      < motion.div
        initial={{ opacity: 0, y: 30 }
        }
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className={`mt-8 p-8 rounded-3xl border-l-4 border-[#ffd209] max-w-7xl mx-auto ${theme === 'dark'
          ? 'bg-[#1a1a1a]/80 border border-[#ffd209]/30'
          : 'bg-slate-50 border border-slate-200'
          }`}
      >
        <div>
          <h3 className={`text-2xl font-black mb-3 font-heading ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
            }`}>
            Powered by Fully Homomorphic Encryption
          </h3>
          <p className={`leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
            All salary calculations happen on encrypted data using Zama&apos;s cutting-edge FHE technology.
            HR never sees individual salaries, employees can only decrypt their own balances,
            and all operations execute securely on the Sepolia testnet. Welcome to the future of private payroll.
          </p>
        </div>
      </motion.div >

      {/* Tech Stack Footer */}
      < motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="mt-12 text-center pb-12"
      >
        <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
          }`}>
          Built with <span className={theme === 'dark' ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>Next.js</span> • <span className={theme === 'dark' ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>Wagmi</span> • <span className={theme === 'dark' ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>Viem</span> • <span className={theme === 'dark' ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>Zama FHEVM</span> • <span className={theme === 'dark' ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>Hardhat</span>
        </p>
      </motion.div >
    </div >
  );
}
