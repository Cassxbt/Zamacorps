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
            console.log('[FHE-INIT] Step 3/3: Creating FHEVMinstance...');

            // Use official Sepolia config from SDK
            // This includes ALL required addresses in the correct format
            const { SepoliaConfig } = await import('@zama-fhe/relayer-sdk/web');

            const config = {
                ...SepoliaConfig, // Official Zama Sepolia addresses
                network: 'https://eth-sepolia.g.alchemy.com/v2/sTZ5ecoblEhM7IGB9bc_z_izbUph1Chn',
                relayerUrl: 'https://relayer.testnet.zama.org/',
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
