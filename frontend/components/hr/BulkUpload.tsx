'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletClient, usePublicClient } from 'wagmi';
import { useTheme } from 'next-themes';
import { parseEmployeeCSV, generateSampleCSV, downloadCSV, type ParsedEmployee } from '@/lib/utils/csv';
import { createPayrollStream } from '@/lib/contracts/payroll';
import { animations } from '@/lib/utils/animations';

export function BulkUpload() {
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { theme } = useTheme();

    const [employees, setEmployees] = useState<ParsedEmployee[]>([]);
    const [globalErrors, setGlobalErrors] = useState<string[]>([]);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'preview' | 'uploading' | 'complete'>('idle');
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [results, setResults] = useState<{ success: string[]; failed: string[] }>({ success: [], failed: [] });

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setUploadStatus('parsing');
        const file = acceptedFiles[0];

        const { employees: parsed, errors } = await parseEmployeeCSV(file);

        setEmployees(parsed);
        setGlobalErrors(errors);
        setUploadStatus('preview');
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        multiple: false,
    });

    const handleSubmit = async () => {
        if (!walletClient || !publicClient) return;

        const validEmployees = employees.filter(e => e.errors.length === 0);
        setUploadStatus('uploading');
        setProgress({ current: 0, total: validEmployees.length });

        const success: string[] = [];
        const failed: string[] = [];

        const currentBlock = await publicClient.getBlockNumber();

        for (let i = 0; i < validEmployees.length; i++) {
            const emp = validEmployees[i];

            try {
                const startBlock = emp.startBlock === BigInt(0) ? currentBlock + BigInt(10) : emp.startBlock;
                const cliffBlock = startBlock + emp.cliffBlocks;

                await createPayrollStream(walletClient, publicClient, {
                    employee: emp.address,
                    salaryPerBlock: emp.salaryPerBlock,
                    startBlock,
                    cliffBlock,
                });

                success.push(emp.address);
            } catch (error: any) {
                failed.push(`${emp.address}: ${error.message}`);
            }

            setProgress({ current: i + 1, total: validEmployees.length });
        }

        setResults({ success, failed });
        setUploadStatus('complete');
    };

    const handleDownloadSample = () => {
        const sample = generateSampleCSV();
        downloadCSV(sample, 'employee_template.csv');
    };

    const handleReset = () => {
        setEmployees([]);
        setGlobalErrors([]);
        setUploadStatus('idle');
        setProgress({ current: 0, total: 0 });
        setResults({ success: [], failed: [] });
    };

    return (
        <motion.div
            className="relative"
            {...animations.fadeInUp}
        >
            {/* ZACORPS Container */}
            <div className={`relative overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${theme === 'dark'
                ? 'bg-[#1a1a1a] border-[#ffd209]/20'
                : 'bg-white border-slate-200'
                }`}>
                {/* Tech Grid Background */}
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(${theme === 'dark' ? '#ffd209' : '#000'} 1px, transparent 1px), linear-gradient(90deg, ${theme === 'dark' ? '#ffd209' : '#000'} 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                    }}
                />

                <div className="relative p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className={`text-3xl font-black font-heading uppercase tracking-tight flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'
                                }`}>
                                <span className="text-[#ffd209]">⚡</span>
                                Bulk Ingestion
                            </h2>
                            <p className={`mt-1 font-mono text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                SYSTEM: READY FOR BATCH PROCESSING
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDownloadSample}
                            className={`px-4 py-2 rounded-lg border font-mono text-sm transition-all flex items-center gap-2 ${theme === 'dark'
                                ? 'bg-[#1a1a1a] border-[#ffd209]/30 text-[#ffd209] hover:bg-[#ffd209]/10'
                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-[#ffd209] hover:text-[#ffd209]'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            TEMPLATE.CSV
                        </motion.button>
                    </div>

                    <AnimatePresence mode="wait">
                        {uploadStatus === 'idle' && (
                            <motion.div
                                key="dropzone"
                                {...animations.fadeInUp}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                {/* Technical Dropzone */}
                                <div
                                    {...getRootProps()}
                                    className={`
                                        relative group cursor-pointer
                                        rounded-xl border-2 border-dashed p-16
                                        transition-all duration-300
                                        ${isDragActive
                                            ? 'border-[#ffd209] bg-[#ffd209]/10 scale-[1.02] shadow-[0_0_30px_rgba(255,210,9,0.2)]'
                                            : theme === 'dark'
                                                ? 'border-slate-700 bg-black/20 hover:border-[#ffd209]/50 hover:bg-black/40'
                                                : 'border-slate-300 bg-slate-50 hover:border-[#ffd209]/50 hover:bg-slate-100'
                                        }
                                    `}
                                >
                                    <input {...getInputProps()} />

                                    {/* Corner Markers */}
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#ffd209] -mt-1 -ml-1" />
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#ffd209] -mt-1 -mr-1" />
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#ffd209] -mb-1 -ml-1" />
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#ffd209] -mb-1 -mr-1" />

                                    <div className="flex flex-col items-center justify-center text-center">
                                        <motion.div
                                            animate={{
                                                y: [0, -10, 0],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                            className={`mb-6 p-4 rounded-full border ${theme === 'dark'
                                                ? 'bg-[#ffd209]/10 border-[#ffd209]/20'
                                                : 'bg-[#ffd209]/10 border-[#ffd209]/30'
                                                }`}
                                        >
                                            <svg className="w-12 h-12 text-[#ffd209]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </motion.div>

                                        <p className={`text-xl font-bold mb-2 font-heading tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-900'
                                            }`}>
                                            {isDragActive ? 'INITIALIZING UPLOAD...' : 'DROP DATA FILE'}
                                        </p>
                                        <p className={`font-mono text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                                            }`}>
                                            OR CLICK TO BROWSE LOCAL SYSTEM
                                        </p>
                                        <div className={`mt-6 px-3 py-1 rounded border text-xs font-mono ${theme === 'dark'
                                            ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                                            : 'bg-slate-100 border-slate-200 text-slate-500'
                                            }`}>
                                            ACCEPTED FORMAT: .CSV
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {(uploadStatus === 'preview' || uploadStatus === 'parsing') && (
                            <motion.div
                                key="preview"
                                {...animations.fadeInUp}
                            >
                                {/* Errors */}
                                {globalErrors.length > 0 && (
                                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                                        <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <h3 className="font-bold text-red-400 mb-1 font-mono text-sm">PARSING ERRORS DETECTED</h3>
                                            <ul className="text-red-300/80 text-xs font-mono space-y-1">
                                                {globalErrors.map((error, i) => (
                                                    <li key={i}>[ERR_0{i + 1}] {error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Preview Table */}
                                <div className={`overflow-hidden rounded-xl border ${theme === 'dark'
                                    ? 'border-slate-800 bg-black/20'
                                    : 'border-slate-200 bg-slate-50'
                                    }`}>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className={`border-b ${theme === 'dark'
                                                    ? 'border-slate-800 bg-black/40'
                                                    : 'border-slate-200 bg-slate-100'
                                                    }`}>
                                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">ID</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Target Address</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Rate/Block</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Cliff</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Validation</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800/50' : 'divide-slate-200'
                                                }`}>
                                                {employees.map((emp, idx) => (
                                                    <motion.tr
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.03 }}
                                                        className={`
                                                            group transition-colors
                                                            ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-white'}
                                                            ${emp.errors.length > 0 ? 'bg-red-500/5' : ''}
                                                        `}
                                                    >
                                                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{String(idx + 1).padStart(3, '0')}</td>
                                                        <td className={`px-4 py-3 font-mono text-sm transition-colors ${theme === 'dark'
                                                            ? 'text-slate-300 group-hover:text-[#ffd209]'
                                                            : 'text-slate-700 group-hover:text-black'
                                                            }`}>
                                                            {emp.address}
                                                        </td>
                                                        <td className={`px-4 py-3 font-mono text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                                                            }`}>
                                                            <span className={theme === 'dark' ? 'text-[#ffd209]' : 'text-black font-bold'}>
                                                                {(Number(emp.salaryPerBlock) / 1e18).toFixed(6)}
                                                            </span> ETH
                                                        </td>
                                                        <td className={`px-4 py-3 font-mono text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                                            }`}>
                                                            {emp.cliffBlocks.toString()} BLK
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {emp.errors.length === 0 ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20 font-mono">
                                                                    VALID
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 font-mono">
                                                                    INVALID
                                                                </span>
                                                            )}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4 mt-8">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleReset}
                                        className={`px-6 py-3 rounded-lg border font-bold transition-all uppercase tracking-wide text-sm ${theme === 'dark'
                                            ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                                            : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        Abort
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSubmit}
                                        disabled={employees.filter(e => e.errors.length === 0).length === 0}
                                        className="flex-1 px-6 py-3 rounded-lg bg-[#ffd209] text-black font-black shadow-lg hover:shadow-[#ffd209]/20 hover:bg-[#ffdb4d] disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wide text-sm flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Execute Batch ({employees.filter(e => e.errors.length === 0).length})
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {uploadStatus === 'uploading' && (
                            <motion.div
                                key="uploading"
                                {...animations.fadeInUp}
                                className="text-center py-16"
                            >
                                <div className="relative w-24 h-24 mx-auto mb-8">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className={`absolute inset-0 border-4 rounded-full border-t-[#ffd209] ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                                            }`}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center text-2xl">
                                        ⚙️
                                    </div>
                                </div>

                                <h3 className={`text-2xl font-black mb-2 font-heading uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'
                                    }`}>
                                    Processing Batch
                                </h3>
                                <p className={`font-mono text-sm mb-8 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                                    }`}>
                                    INTERACTING WITH BLOCKCHAIN...
                                </p>

                                {/* Industrial Progress Bar */}
                                <div className={`w-full h-6 rounded border overflow-hidden relative ${theme === 'dark' ? 'bg-black border-slate-800' : 'bg-slate-100 border-slate-300'
                                    }`}>
                                    {/* Striped Pattern */}
                                    <div className="absolute inset-0 opacity-10"
                                        style={{ backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%, transparent 50%, #fff 50%, #fff 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }}
                                    />

                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                                        className="h-full bg-[#ffd209] shadow-[0_0_20px_rgba(255,210,9,0.5)]"
                                    />
                                </div>

                                <div className="flex justify-between mt-2 font-mono text-xs text-slate-400">
                                    <span>SEQ: {String(progress.current).padStart(3, '0')}</span>
                                    <span>TOT: {String(progress.total).padStart(3, '0')}</span>
                                </div>
                            </motion.div>
                        )}

                        {uploadStatus === 'complete' && (
                            <motion.div
                                key="complete"
                                {...animations.fadeInUp}
                            >
                                {/* Success */}
                                {results.success.length > 0 && (
                                    <div className="mb-6 p-6 rounded-lg bg-green-500/5 border border-green-500/20">
                                        <h3 className="font-bold text-green-500 text-lg mb-4 font-heading uppercase flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Operation Successful ({results.success.length})
                                        </h3>
                                        <div className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                            {results.success.map((addr, i) => (
                                                <div key={i} className="flex items-center gap-2 text-green-600/80 text-xs font-mono p-1 hover:bg-green-500/10 rounded">
                                                    <span className="text-green-500">➜</span> {addr}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Failures */}
                                {results.failed.length > 0 && (
                                    <div className="mb-6 p-6 rounded-lg bg-red-500/5 border border-red-500/20">
                                        <h3 className="font-bold text-red-500 text-lg mb-4 font-heading uppercase flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Operation Failed ({results.failed.length})
                                        </h3>
                                        <div className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                            {results.failed.map((msg, i) => (
                                                <div key={i} className="flex items-center gap-2 text-red-600/80 text-xs font-mono p-1 hover:bg-red-500/10 rounded">
                                                    <span className="text-red-500">➜</span> {msg}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleReset}
                                    className="w-full px-6 py-4 rounded-lg bg-[#ffd209] text-black font-black shadow-lg hover:shadow-[#ffd209]/20 hover:bg-[#ffdb4d] transition-all uppercase tracking-wide text-sm"
                                >
                                    Initialize New Batch
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
