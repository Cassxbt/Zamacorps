import type { FhevmInstance } from '@zama-fhe/relayer-sdk/web';
import { FHE_RELAYER } from '../wagmi/config';

let fhevmInstance: FhevmInstance | null = null;

/**
 * Get or create the FHEVM instance using Zama Relayer SDK
 * Uses explicit configuration for Sepolia testnet
 * CLIENT-SIDE ONLY - Dynamic import prevents SSR issues
 */
export async function getFhevmInstance(): Promise<FhevmInstance> {
    // Must run in browser only
    if (typeof window === 'undefined') {
        throw new Error('FHEVM instance can only be created in browser environment');
    }

    if (fhevmInstance) {
        return fhevmInstance;
    }

    console.log('[FHE] Initializing FHEVM instance for Sepolia...');
    console.log('[FHE] Environment check - fetch:', typeof fetch, 'global:', typeof global);

    try {
        // Dynamic import for client-side only
        const { createInstance, initSDK } = await import('@zama-fhe/relayer-sdk/web');

        console.log('[FHE] Initializing SDK WASM...');
        await initSDK();
        console.log('[FHE] SDK WASM initialized');

        // Use manual config with working relayer URL from config
        const config = {
            chainId: 11155111,  // Sepolia
            gatewayChainId: 10901,  // Gateway chain ID
            network: window.ethereum || 'https://eth-sepolia.g.alchemy.com/v2/sTZ5ecoblEhM7IGB9bc_z_izbUph1Chn',
            // Relayer URL from config
            relayerUrl: FHE_RELAYER,
            // Updated contract addresses for Sepolia 2025 from official Zama docs
            aclContractAddress: '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D',
            kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC', // FIXED: Updated from old address
            inputVerifierContractAddress: '0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0',
            verifyingContractAddressDecryption: '0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478',
            verifyingContractAddressInputVerification: '0x483b9dE06E4E4C7D35CCf5837A1668487406D955',
        };

        console.log('[FHE] Creating instance with config:', config);
        fhevmInstance = await createInstance(config);
        console.log('[FHE] ✅ FHEVM instance initialized successfully!');
        return fhevmInstance;
    } catch (error: any) {
        console.error('[FHE] ❌ Failed to initialize FHEVM instance');
        console.error('[FHE] Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

/**
 * Reset the FHEVM instance (useful for testing)
 */
export function resetFhevmInstance() {
    fhevmInstance = null;
}
