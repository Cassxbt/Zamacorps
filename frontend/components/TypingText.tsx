'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';

const TEXTS = [
    'For Everyone',
    'For You',
    'For The Family',
    'For Fortune500',
    'For Veterans',
];

export function TypingText() {
    const [textIndex, setTextIndex] = useState(0);
    const [displayText, setDisplayText] = useState('');
    const [count, setCount] = useState(0);
    const [mounted, setMounted] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const currentText = TEXTS[textIndex];
        const timeout = setTimeout(() => {
            if (count < currentText.length) {
                setDisplayText(currentText.substring(0, count + 1));
                setCount(count + 1);
            } else {
                setTimeout(() => {
                    setCount(0);
                    setDisplayText('');
                    setTextIndex((textIndex + 1) % TEXTS.length);
                }, 2000);
            }
        }, 100);

        return () => clearTimeout(timeout);
    }, [textIndex, count]);


    // Light mode: yellow + black stripes, Dark mode: yellow + white stripes
    const textStyle = mounted && theme === 'dark'
        ? {
            backgroundImage: 'repeating-linear-gradient(45deg, #ffd209, #ffd209 10px, #fff 10px, #fff 20px)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 2px 0px rgba(255, 210, 9, 0.3))'
        }
        : {
            backgroundImage: 'repeating-linear-gradient(45deg, #ffd209, #ffd209 10px, #000 10px, #000 20px)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 2px 0px rgba(255, 210, 9, 0.3))'
        };

    return (
        <span className="inline-flex">
            <motion.span
                className="font-black tracking-tighter font-heading"
                style={textStyle}
            >
                {displayText}
            </motion.span>
            <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="w-[4px] h-[1em] bg-yellow-500 ml-1 inline-block"
            />
        </span>
    );
}
