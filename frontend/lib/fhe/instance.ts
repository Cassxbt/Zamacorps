import type { FhevmInstance } from '@zama-fhe/relayer-sdk/web';
import { FHE_RELAYER } from '../wagmi/config';

let fhevmInstance: FhevmInstance | null = null;
let initPromise: Promise<FhevmInstance> | null = null;

/**
 * Get or create the FHEVM instance using Zama Relayer SDK
 * Uses explicit configuration for Sepolia testnet
 * CLIENT-SIDE ONLY - Dynamic import prevents SSR issues
 * 
 * @see https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/initialization
 */
export async function getFhevmInstance(): Promise<FhevmInstance> {
    // Must run in browser only
    if (typeof window === 'undefined') {
        throw new Error('FHEVM instance can only be created in browser environment');
    }

    // Return existing instance
    if (fhevmInstance) {
        return fhevmInstance;
    }

    // Return in-progress initialization (prevents double-init in React strict mode)
    if (initPromise) {
        return initPromise;
    }

    console.log('[FHE] Initializing FHEVM instance for Sepolia...');

    // Start new initialization
    initPromise = (async () => {
        try {
            // Dynamic import for client-side only
            const { createInstance, initSDK } = await import('@zama-fhe/relayer-sdk/web');

            console.log('[FHE] Initializing SDK WASM...');
            await initSDK();
            console.log('[FHE] SDK WASM initialized');

            // Official Zama pattern: network MUST be RPC URL string, NOT ethereum object
            const config = {
                chainId: 11155111,  // Sepolia
                gatewayChainId: 11155111,  // Sepolia (must match for EIP-712 signatures)
                network: 'https://eth-sepolia.g.alchemy.com/v2/sTZ5ecoblEhM7IGB9bc_z_izbUph1Chn',  // ✅ URL string only
                relayerUrl: FHE_RELAYER,
                // Contract addresses for Sepolia (verified from Zama docs)
                aclContractAddress: '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D',
                kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
                inputVerifierContractAddress: '0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0',
                verifyingContractAddressDecryption: '0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478',
                verifyingContractAddressInputVerification: '0x483b9dE06E4E4C7D35CCf5837A1668487406D955',
            };

            console.log('[FHE] Creating instance with config:', config);
            const instance = await createInstance(config);

            fhevmInstance = instance;
            initPromise = null;

            console.log('[FHE] ✅ FHEVM instance initialized successfully!');
            return instance;
        } catch (error: any) {
            console.error('[FHE] ❌ Failed to initialize FHEVM instance');
            console.error('[FHE] Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });

            // Reset state on error
            initPromise = null;
            fhevmInstance = null;

            throw error;
        }
    })();

    return initPromise;
}

/**
 * Reset the FHEVM instance (useful for testing)
 */
export function resetFhevmInstance() {
    fhevmInstance = null;
}
