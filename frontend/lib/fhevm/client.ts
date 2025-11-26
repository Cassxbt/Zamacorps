/**
 * FHE Client using Zama Relayer SDK (v0.9)
 * Handles encrypted data operations via Zama Protocol
 */

import {
    createInstance,
    initSDK,
    type FhevmInstance
} from '@zama-fhe/relayer-sdk/web';
import type { PublicClient, WalletClient } from 'viem';

let fhevmInstance: FhevmInstance | null = null;
let isInitialized = false;

/**
 * Initialize the SDK (call once on app load)
 */
export async function initializeFHEVM() {
    if (isInitialized) return;
    await initSDK();
    isInitialized = true;
}

export async function getFhevmInstance(publicClient: PublicClient): Promise<FhevmInstance> {
    if (!isInitialized) {
        await initializeFHEVM();
    }

    if (!fhevmInstance) {
        // Sepolia testnet configuration
        const chainId = 11155111; // Sepolia
        const gatewayChainId = 8009; // Zama Gateway chain ID

        // Contract addresses for Sepolia (from Zama docs)
        fhevmInstance = await createInstance({
            chainId,
            gatewayChainId,
            network: publicClient,
            // Sepolia contract addresses
            kmsContractAddress: '0x9479d48FF4e1E422927Afdded85EdBBCC4Ed1ff4',
            aclContractAddress: '0xDD020B0e90FA1C928CC0a1Dc5d12d0ADbAD1e1f2',
            inputVerifierContractAddress: '0x6Dea47D57Bf64fCa01E97CB1b7a00EDeC44e51fB',
            verifyingContractAddressInputVerification: '0x6Dea47D57Bf64fCa01E97CB1b7a00EDeC44e51fB',
            verifyingContractAddressDecryption: '0x9479d48FF4e1E422927Afdded85EdBBCC4Ed1ff4',
            relayerUrl: 'https://relay.sepolia.zama.ai',
        });
    }

    return fhevmInstance;
}

export async function encryptValue(
    value: bigint,
    contractAddress: string,
    userAddress: string,
    publicClient: PublicClient
): Promise<{ handles: Uint8Array[]; inputProof: Uint8Array }> {
    try {
        const instance = await getFhevmInstance(publicClient);

        // Create encrypted input
        const input = instance.createEncryptedInput(contractAddress, userAddress);
        input.add128(value); // euint128

        // Encrypt and get proof
        const encrypted = await input.encrypt();

        return encrypted;

    } catch (error) {
        console.error('[FHEVM] Encryption failed:', error);
        throw new Error(`Failed to encrypt value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function decryptValue(
    handle: string,
    contractAddress: string,
    userAddress: string,
    walletClient: WalletClient,
    publicClient: PublicClient
): Promise<bigint> {
    try {
        const instance = await getFhevmInstance(publicClient);

        // Generate keypair for this session
        const { publicKey, privateKey } = instance.generateKeypair();

        // Create EIP-712 signature for permission
        const eip712 = instance.createEIP712(
            publicKey,
            [contractAddress],
            Math.floor(Date.now() / 1000), // current timestamp
            7 // 7 days validity
        );

        // Sign the EIP-712 message
        const signature = await walletClient.signTypedData({
            account: walletClient.account!,
            domain: eip712.domain as any,
            types: eip712.types as any,
            primaryType: eip712.primaryType,
            message: eip712.message,
        });

        // Decrypt using the signature
        const decrypted = await instance.userDecrypt(
            [{ handle, contractAddress }],
            privateKey,
            publicKey,
            signature,
            [contractAddress],
            userAddress,
            Math.floor(Date.now() / 1000),
            7
        );

        // Extract the decrypted value
        const value = Object.values(decrypted)[0];

        return BigInt(value);

    } catch (error) {
        console.error('[FHEVM] Decryption failed:', error);
        throw new Error(`Failed to decrypt value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export function resetFhevmInstance() {
    fhevmInstance = null;
}
