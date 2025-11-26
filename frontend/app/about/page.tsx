'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function AboutPage() {
    const [mounted, setMounted] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    return (
        <div className={`min-h-screen overflow-hidden transition-colors duration-300 ${theme === 'dark'
            ? 'bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f]'
            : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
            }`}>

            {/* Hero Section */}
            <section className="relative py-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className={`absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-yellow-500/10' : 'bg-yellow-400/20'
                        }`} />
                    <div className={`absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-yellow-400/10' : 'bg-yellow-300/20'
                        }`} />
                </div>

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-block px-5 py-2 bg-[#ffd209]/10 border border-[#ffd209]/30 rounded-full text-[#ffd209] text-sm font-black uppercase tracking-wider mb-6 font-heading"
                    >
                        Powered by Zama FHE
                    </motion.div>
                    <motion.h1
                        {...fadeInUp}
                        className={`text-5xl md:text-7xl font-black mb-8 font-heading ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                            }`}
                    >
                        Privacy is Not Optional. <br />
                        <span
                            className="inline-block font-black tracking-tighter font-heading"
                            style={{
                                backgroundImage: mounted && theme === 'dark'
                                    ? 'repeating-linear-gradient(45deg, #ffd209, #ffd209 10px, #fff 10px, #fff 20px)'
                                    : 'repeating-linear-gradient(45deg, #ffd209, #ffd209 10px, #000 10px, #000 20px)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                color: 'transparent',
                                filter: 'drop-shadow(0 2px 0px rgba(255, 210, 9, 0.3))'
                            }}
                        >
                            It's Mathematical.
                        </span>
                    </motion.h1>
                    <motion.p
                        {...fadeInUp}
                        transition={{ delay: 0.2 }}
                        className={`text-lg max-w-3xl mx-auto leading-relaxed font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                            }`}
                    >
                        We are revolutionizing payroll by enabling computations on encrypted data.
                        Organizations can stream salaries without ever seeing the amounts, ensuring complete confidentiality for everyone.
                    </motion.p>
                </div>
            </section>

            {/* Mission Section */}
            <section id="mission" className={`py-20 px-6 border-t ${theme === 'dark' ? 'border-[#ffd209]/10' : 'border-slate-200'
                }`}>
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className={`text-4xl font-black mb-6 font-heading ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                            }`}>Our Mission</h2>
                        <p className={`text-lg mb-6 leading-relaxed font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                            In the age of transparency, financial privacy remains a critical right.
                            Traditional payroll systems expose sensitive data to multiple intermediaries.
                        </p>
                        <p className={`text-lg leading-relaxed font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                            ZAMACORPS exists to bridge the gap between blockchain transparency and individual privacy.
                            We believe you shouldn't have to choose between on-chain efficiency and keeping your salary private.
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className={`relative h-[400px] rounded-3xl border flex items-center justify-center overflow-hidden ${theme === 'dark'
                                ? 'bg-[#1a1a1a]/80 border-[#ffd209]/30'
                                : 'bg-white border-slate-200'
                            }`}
                    >
                        <div className="relative z-10">
                            <svg className={`w-40 h-40 ${theme === 'dark' ? 'text-[#ffd209]' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <div className={`absolute inset-0 opacity-10 ${theme === 'dark' ? 'bg-[#ffd209]/5' : 'bg-black/5'}`} />
                    </motion.div>
                </div>
            </section>

            {/* Technology Section */}
            <section id="tech" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className={`text-4xl font-black mb-4 font-heading ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                            }`}>How It Works</h2>
                        <p className={`font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            Fully Homomorphic Encryption (FHE) explained simply.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: (
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                ),
                                title: "Encrypt",
                                desc: "Data is encrypted on the client side before it ever leaves your device. The server only sees ciphertext."
                            },
                            {
                                icon: (
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                ),
                                title: "Compute",
                                desc: "Our smart contracts perform calculations (like tax deductions) directly on the encrypted data without decrypting it."
                            },
                            {
                                icon: (
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                    </svg>
                                ),
                                title: "Decrypt",
                                desc: "Only the authorized recipient (the employee) holds the private key to decrypt and view the final result."
                            }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2 }}
                                className={`border rounded-2xl p-8 transition-all group hover:scale-105 ${theme === 'dark'
                                        ? 'bg-[#1a1a1a]/80 border-[#ffd209]/30 hover:border-[#ffd209]/50'
                                        : 'bg-white border-slate-200 hover:border-[#ffd209]/50'
                                    }`}
                            >
                                <div className={`mb-6 text-[#ffd209] group-hover:scale-110 transition-transform`}>
                                    {item.icon}
                                </div>
                                <h3 className={`text-xl font-black mb-4 font-heading ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                                    }`}>{item.title}</h3>
                                <p className={`leading-relaxed font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                                    }`}>{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Privacy First Section */}
            <section id="privacy" className={`py-20 px-6 border-t ${theme === 'dark' ? 'border-[#ffd209]/10' : 'border-slate-200'
                }`}>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className={`text-4xl font-black mb-6 font-heading ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                            }`}>
                            <span
                                className="inline-block font-black tracking-tighter font-heading"
                                style={{
                                    backgroundImage: mounted && theme === 'dark'
                                        ? 'repeating-linear-gradient(45deg, #ffd209, #ffd209 10px, #fff 10px, #fff 20px)'
                                        : 'repeating-linear-gradient(45deg, #ffd209, #ffd209 10px, #000 10px, #000 20px)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    color: 'transparent',
                                    filter: 'drop-shadow(0 2px 0px rgba(255, 210, 9, 0.3))'
                                }}
                            >
                                Privacy First
                            </span>
                        </h2>
                        <p className={`text-lg max-w-2xl mx-auto font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                            Your financial data remains encrypted at all times. Not even we can see your salary.
                        </p>
                    </div>

                    <div className={`max-w-4xl mx-auto p-8 rounded-3xl border-l-4 border-[#ffd209] ${theme === 'dark'
                            ? 'bg-[#1a1a1a]/80 border border-[#ffd209]/30'
                            : 'bg-white border border-slate-200'
                        }`}>
                        <ul className="space-y-4">
                            {[
                                "Zero-knowledge architecture - our servers never see plaintext",
                                "Client-side encryption using FHEVM-native primitives",
                                "On-chain privacy guarantees via fully homomorphic smart contracts",
                                "Open-source codebase for complete transparency"
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-[#ffd209] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className={`font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
}
