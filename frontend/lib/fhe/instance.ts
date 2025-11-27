import type { FhevmInstance } from '@zama-fhe/relayer-sdk/web';

let fhevmInstance: FhevmInstance | null = null;
let initPromise: Promise<FhevmInstance> | null = null;

/**
 * FHEVM Instance Manager
 * Follows official Zama pattern: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/initialization
 * 
 * CRITICAL: This must be initialized before any encryption/decryption
 */
export async function getFhevmInstance(): Promise<FhevmInstance> {
    console.log('[FHE-INIT] 🔄 getFhevmInstance called');

    // SSR Check
    if (typeof window === 'undefined') {
        const error = new Error('[FHE-INIT] ❌ Cannot create FHEVM instance in server environment');
        console.error(error);
        throw error;
    }

    // Return cached instance
    if (fhevmInstance) {
        console.log('[FHE-INIT] ✅ Returning cached instance');
        return fhevmInstance;
    }

    // Return in-progress initialization
    if (initPromise) {
        console.log('[FHE-INIT] ⏳ Initialization in progress, returning existing promise');
        return initPromise;
    }

    console.log('[FHE-INIT] 🚀 Starting new initialization...');

    initPromise = (async () => {
        try {
            // Step 1: Import SDK
            console.log('[FHE-INIT] Step 1/3: Importing Zama SDK...');
            const { createInstance, initSDK } = await import('@zama-fhe/relayer-sdk/web');
            console.log('[FHE-INIT] ✅ SDK imported successfully');

            // Step 2: Initialize WASM
            console.log('[FHE-INIT] Step 2/3: Initializing WASM...');
            await initSDK();
            console.log('[FHE-INIT] ✅ WASM initialized successfully');

            // Step 3: Create instance with config
            console.log('[FHE-INIT] Step 3/3: Creating FHEVM instance...');

            // Official Zama Sepolia coprocessor addresses from ZamaConfig.sol
            // Source: blockchain/fhevmTemp/@fhevm/solidity/config/ZamaConfig.sol line 61-67
            const config = {
                chainId: 11155111,
                gatewayChainId: 11155111,
                network: 'https://eth-sepolia.g.alchemy.com/v2/sTZ5ecoblEhM7IGB9bc_z_izbUph1Chn',
                relayerUrl: 'https://relayer.testnet.zama.org/',
                // CRITICAL: These MUST match the official Zama deployment
                aclContractAddress: '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D', // ✅ Official ACL
                coprocessorContractAddress: '0x92C920834Ec8941d2C77D188936E1f7A6f49c127', // ✅ Official Coprocessor
                kmsVerifierContractAddress: '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A', // ✅ Official KMSVerifier
            };

            console.log('[FHE-INIT] Config:', JSON.stringify(config, null, 2));

            const instance = await createInstance(config);
            console.log('[FHE-INIT] ✅ Instance created successfully');

            fhevmInstance = instance;
            initPromise = null;

            console.log('[FHE-INIT] 🎉 FHEVM initialization complete');
            return instance;

        } catch (error: unknown) {
            console.error('[FHE-INIT] ❌ FATAL: Initialization failed');
            console.error('[FHE-INIT] Error type:', typeof error);
            console.error('[FHE-INIT] Error:', error);

            if (error instanceof Error) {
                console.error('[FHE-INIT] Error message:', error.message);
                console.error('[FHE-INIT] Error stack:', error.stack);
            }

            // Reset state
            initPromise = null;
            fhevmInstance = null;

            throw new Error(`FHEVM initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    })();

    return initPromise;
}

/**
 * Reset instance (for testing/debugging)
 */
export function resetFhevmInstance() {
    console.log('[FHE-INIT] 🔄 Resetting FHEVM instance');
    fhevmInstance = null;
    initPromise = null;
}
