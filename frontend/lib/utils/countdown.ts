/**
 * Utility to calculate countdown to cliff block
 * Assumes ~12 second average block time on Sepolia
 * 
 * CRITICAL FIX: Convert BigInt to number BEFORE any arithmetic operations
 */

const SEPOLIA_BLOCK_TIME_SECONDS = 12;

export interface CountdownTime {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    isReached: boolean;
}

/**
 * Calculate countdown from current block to cliff block
 * 
 * KEY STRATEGY: Convert BigInt to number FIRST, then do arithmetic
 * This completely avoids any BigInt operations that could cause type mixing
 */
export function calculateBlockCountdown(
    currentBlock: bigint,
    cliffBlock: bigint
): CountdownTime {
    // Convert BOTH BigInts to numbers FIRST
    // This is the only way to completely avoid BigInt type mixing issues
    const currentBlockNum = Number(currentBlock);
    const cliffBlockNum = Number(cliffBlock);

    // Now do ALL arithmetic with regular numbers only
    const blocksRemaining = cliffBlockNum - currentBlockNum;

    // Check if cliff has been reached (pure number comparison)
    if (blocksRemaining <= 0) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            totalSeconds: 0,
            isReached: true
        };
    }

    // Calculate total time remaining
    const totalSeconds = blocksRemaining * SEPOLIA_BLOCK_TIME_SECONDS;

    // Break down into days, hours, minutes, seconds
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    return {
        days,
        hours,
        minutes,
        seconds,
        totalSeconds,
        isReached: false
    };
}

/**
 * Format countdown as human-readable string
 */
export function formatCountdown(countdown: CountdownTime): string {
    if (countdown.isReached) {
        return "Ready to withdraw!";
    }

    const parts: string[] = [];

    if (countdown.days > 0) {
        parts.push(`${countdown.days}d`);
    }
    if (countdown.hours > 0 || countdown.days > 0) {
        parts.push(`${countdown.hours}h`);
    }
    if (countdown.minutes > 0 || countdown.hours > 0 || countdown.days > 0) {
        parts.push(`${countdown.minutes}m`);
    }

    // Only show seconds if less than 1 hour remaining
    if (countdown.days === 0 && countdown.hours === 0) {
        parts.push(`${countdown.seconds}s`);
    }

    return parts.join(' ');
}

/**
 * Get estimated timestamp when cliff will be reached
 */
export function getEstimatedCliffTime(countdown: CountdownTime): Date {
    const now = new Date();
    const futureTime = new Date(now.getTime() + (countdown.totalSeconds * 1000));
    return futureTime;
}
