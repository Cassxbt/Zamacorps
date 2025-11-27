import { getFhevmInstance } from './instance';

/**
 * Encrypt salary for FHE stream creation
 * Follows official Zama pattern: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/input
 * 
 * @param salaryWei - Salary in wei (as bigint)
 * @param userAddress - Address that will use this encrypted input
 * @param contractAddress - Contract address that will receive the input
 * @returns Object with handles and inputProof for contract submission
 */
export async function encryptSalary(
    salaryWei: bigint,
    userAddress: string,
    contractAddress: string
): Promise<{ handles: Uint8Array[]; inputProof: string }> {
    // console.log('[FHE-ENCRYPT] 🔐 Starting salary encryption...');
    // console.log('[FHE-ENCRYPT] Input - Salary (wei):', salaryWei.toString());
    // console.log('[FHE-ENCRYPT] Input - User address:', userAddress);
    // console.log('[FHE-ENCRYPT] Input - Contract address:', contractAddress);

    try {
        // Step 1: Get FHEVM instance
        // console.log('[FHE-ENCRYPT] Step 1/4: Getting FHEVM instance...');
        const instance = await getFhevmInstance();
        // console.log('[FHE-ENCRYPT] ✅ Instance retrieved');

        // Step 2: Create encrypted input buffer
        // console.log('[FHE-ENCRYPT] Step 2/4: Creating encrypted input buffer...');
        const input = instance.createEncryptedInput(contractAddress, userAddress);
        // console.log('[FHE-ENCRYPT] ✅ Buffer created');

        // Step 3: Add salary as euint128
        // console.log('[FHE-ENCRYPT] Step 3/4: Adding salary to buffer (euint128)...');
        input.add128(salaryWei);
        // console.log('[FHE-ENCRYPT] ✅ Salary added to buffer');

        // Step 4: Encrypt
        // console.log('[FHE-ENCRYPT] Step 4/4: Encrypting...');
        const encrypted = await input.encrypt();
        // console.log('[FHE-ENCRYPT] ✅ Encryption successful');

        // console.log('[FHE-ENCRYPT] Output - Handles count:', encrypted.handles.length);
        // console.log('[FHE-ENCRYPT] Output - Proof length:', encrypted.inputProof.length);

        // console.log('[FHE-ENCRYPT] 🎉 Salary encryption complete');

        return {
            handles: encrypted.handles,
            inputProof: encrypted.inputProof,
        };

    } catch (error: unknown) {
        console.error('[FHE-ENCRYPT] ❌ FATAL: Encryption failed');
        console.error('[FHE-ENCRYPT] Error type:', typeof error);
        console.error('[FHE-ENCRYPT] Error:', error);

        if (error instanceof Error) {
            console.error('[FHE-ENCRYPT] Error message:', error.message);
            console.error('[FHE-ENCRYPT] Error stack:', error.stack);
        }

        throw new Error(`Salary encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Convert salary from ETH string to wei bigint
 */
export function salaryToWei(salaryETH: string): bigint {
    // console.log('[FHE-ENCRYPT] Converting salary to wei:', salaryETH);
    const wei = BigInt(Math.floor(parseFloat(salaryETH) * 1e18));
    // console.log('[FHE-ENCRYPT] Converted to wei:', wei.toString());
    return wei;
}
