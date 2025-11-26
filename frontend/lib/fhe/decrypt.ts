import { getFhevmInstance } from './instance';
import { PAYROLL_ADDRESS } from '../wagmi/config';
import { BrowserProvider } from 'ethers';

/**
 * Decrypt a claimable amount using Zama Relayer SDK
 * Implements the official user decryption pattern from Zama documentation
 * @see https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption
 */
export async function decryptClaimable(
    handle: string,
    userAddress: string
): Promise<bigint> {
    const instance = await getFhevmInstance();

    try {
        // Step 1: Generate NaCl keypair for re-encryption
        const keypair = instance.generateKeypair();

        // Step 2: Prepare parameters
        const handleContractPairs = [{
            handle: handle,
            contractAddress: PAYROLL_ADDRESS,
        }];

        const startTimeStamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = '10'; // Validity period (string)
        const contractAddresses = [PAYROLL_ADDRESS];

        // Step 3: Create EIP-712 typed data for signature
        const eip712 = instance.createEIP712(
            keypair.publicKey,
            contractAddresses,
            startTimeStamp,
            durationDays
        );

        // Step 4: Get ethers signer and request signature
        if (!window.ethereum) {
            throw new Error('No ethereum provider found');
        }

        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const signature = await signer.signTypedData(
            eip712.domain,
            { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
            eip712.message
        );

        // Step 5: Call userDecrypt with all parameters
        let result: Record<string, bigint> | null = null;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                attempts++;

                result = await instance.userDecrypt(
                    handleContractPairs,
                    keypair.privateKey,
                    keypair.publicKey,
                    signature.replace('0x', ''),
                    contractAddresses,
                    userAddress,
                    startTimeStamp,
                    durationDays
                ) as Record<string, bigint>;

                // If successful, break the loop
                break;
            } catch (err: any) {
                console.warn(`[FHE] Attempt ${attempts} failed:`, err.message);

                // Only retry on ACL/Authorization errors (Relayer latency)
                const isAuthError = err.message?.includes('not authorized') ||
                    err.message?.includes('ACL') ||
                    err.message?.includes('Permission denied');

                if (isAuthError && attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    continue;
                }

                // If it's another error or we're out of attempts, throw
                throw err;
            }
        }

        if (!result) {
            throw new Error('Decryption failed after multiple attempts');
        }

        // Extract decrypted value from result object
        const decryptedValue = result[handle];

        if (decryptedValue === undefined) {
            throw new Error('Decryption failed: No value returned for handle');
        }

        return BigInt(decryptedValue);

    } catch (error: any) {
        console.error('[FHE] ❌ Decryption failed:', error);
        console.error('[FHE] Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });

        // User-friendly error messages
        if (error.message?.includes('user rejected') || error.code === 'ACTION_REJECTED') {
            throw new Error('Signature rejected. Please approve the decryption signature to continue.');
        }
        if (error.message?.includes('Permission denied') || error.message?.includes('ACL') || error.message?.includes('FHE.allow')) {
            throw new Error('Permission denied. The contract must call FHE.allow() for your address. (Relayer may still be syncing)');
        }
        if (error.message?.includes('Invalid signature')) {
            throw new Error('Invalid signature. Please try again.');
        }

        throw new Error(`Decryption error: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Convert wei to USDC
 */
export function weiToUSDC(wei: bigint): number {
    return Number(wei) / 1e18;
}

/**
 * Format wei as currency string
 */
export function formatCurrency(wei: bigint): string {
    const usdc = weiToUSDC(wei);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(usdc);
}
