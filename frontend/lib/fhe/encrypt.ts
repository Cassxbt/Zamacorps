import { getFhevmInstance } from './instance';
import { PAYROLL_ADDRESS } from '../wagmi/config';

/**
 * Encrypt a salary value (in wei) using Zama Relayer SDK
 * Returns encrypted input for contract calls
 * 
 * Based on official docs: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/input
 */
export async function encryptSalary(salaryWei: bigint, userAddress: string) {
    const instance = await getFhevmInstance();

    try {
        console.log('[FHE] Creating encrypted input buffer...');

        // Create buffer for encrypted input
        const buffer = instance.createEncryptedInput(
            PAYROLL_ADDRESS, // Contract address
            userAddress // User address allowed to import
        );

        // Add salary as euint128
        buffer.add128(salaryWei);

        console.log('[FHE] Encrypting salary...');

        // Encrypt and upload to relayer
        const ciphertexts = await buffer.encrypt();

        console.log('[FHE] Encryption successful');
        console.log('[FHE] Handles:', ciphertexts.handles);
        console.log('[FHE] Proof length:', ciphertexts.inputProof.length);

        return {
            handles: ciphertexts.handles,
            inputProof: ciphertexts.inputProof,
        };
    } catch (error: any) {
        console.error('[FHE] Encryption failed:', error);
        console.error('[FHE] Error details:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause,
            name: error.name
        });

        if (error.message?.includes('Transaction rejected')) {
            console.error('[FHE] Transaction was rejected. This usually happens if:');
            console.error('1. You clicked "Reject" in your wallet');
            console.error('2. The wallet silently blocked the request');
            console.error('3. The Relayer refused the signature');
        }

        throw new Error('Failed to encrypt salary');
    }
}

/**
 * Convert salary from USDC to wei
 */
export function salaryToWei(salaryUSDC: number): bigint {
    return BigInt(Math.floor(salaryUSDC * 1e18));
}

/**
 * Encrypt multiple salaries for bulk upload
 */
export async function encryptSalaries(salariesData: Array<{ salary: bigint; userAddress: string }>) {
    const results = [];

    for (const { salary, userAddress } of salariesData) {
        const encrypted = await encryptSalary(salary, userAddress);
        results.push(encrypted);
    }

    return results;
}
