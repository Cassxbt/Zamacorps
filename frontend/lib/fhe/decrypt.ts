import { getFhevmInstance } from './instance';
import { BrowserProvider } from 'ethers';

/**
 * Decrypt an encrypted value using user's signature
 * Follows official Zama pattern: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption
 * 
 * @param handle - Encrypted value handle (bytes32 from contract)
 * @param contractAddress - Contract address where the value is stored
 * @param userAddress - User's address (must have ACL permission)
 * @returns Decrypted value as bigint
 */
export async function decryptValue(
    handle: string,
    contractAddress: string,
    userAddress: string
): Promise<bigint> {
    console.log('[FHE-DECRYPT] 🔓 Starting value decryption...');
    console.log('[FHE-DECRYPT] Input - Handle:', handle);
    console.log('[FHE-DECRYPT] Input - Contract:', contractAddress);
    console.log('[FHE-DECRYPT] Input - User:', userAddress);

    try {
        // Step 1: Get FHEVM instance
        console.log('[FHE-DECRYPT] Step 1/6: Getting FHEVM instance...');
        const instance = await getFhevmInstance();
        console.log('[FHE-DECRYPT] ✅ Instance retrieved');

        // Step 2: Get signer
        console.log('[FHE-DECRYPT] Step 2/6: Getting wallet signer...');
        if (!window.ethereum) {
            throw new Error('No ethereum provider found');
        }
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        console.log('[FHE-DECRYPT] ✅ Signer retrieved');

        // Step 3: Generate keypair
        console.log('[FHE-DECRYPT] Step 3/6: Generating NaCl keypair...');
        const keypair = instance.generateKeypair();
        console.log('[FHE-DECRYPT] ✅ Keypair generated');

        // Step 4: Create EIP-712 typed data
        console.log('[FHE-DECRYPT] Step 4/6: Creating EIP-712 signature request...');
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = '10';

        const eip712 = instance.createEIP712(
            keypair.publicKey,
            [contractAddress],
            timestamp,
            durationDays
        );
        console.log('[FHE-DECRYPT] ✅ EIP-712 data created');
        console.log('[FHE-DECRYPT] Timestamp:', timestamp);
        console.log('[FHE-DECRYPT] Duration:', durationDays, 'days');

        // Step 5: Request user signature
        console.log('[FHE-DECRYPT] Step 5/6: Requesting user signature...');
        const signature = await signer.signTypedData(
            eip712.domain,
            { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
            eip712.message
        );
        console.log('[FHE-DECRYPT] ✅ Signature obtained');

        // Step 6: Call userDecrypt
        console.log('[FHE-DECRYPT] Step 6/6: Calling relayer to decrypt...');
        const result = await instance.userDecrypt(
            [{ handle, contractAddress }],
            keypair.privateKey,
            keypair.publicKey,
            signature.replace('0x', ''),
            [contractAddress],
            userAddress,
            timestamp,
            durationDays
        ) as Record<string, bigint>;
        console.log('[FHE-DECRYPT] ✅ Relayer call successful');

        // Extract value
        const decryptedValue = result[handle];
        if (decryptedValue === undefined) {
            throw new Error('Decryption returned no value for handle');
        }

        console.log('[FHE-DECRYPT] Decrypted value:', decryptedValue.toString());
        console.log('[FHE-DECRYPT] 🎉 Value decryption complete');

        return BigInt(decryptedValue);

    } catch (error: unknown) {
        console.error('[FHE-DECRYPT] ❌ FATAL: Decryption failed');
        console.error('[FHE-DECRYPT] Error type:', typeof error);
        console.error('[FHE-DECRYPT] Error:', error);

        if (error instanceof Error) {
            console.error('[FHE-DECRYPT] Error message:', error.message);
            console.error('[FHE-DECRYPT] Error stack:', error.stack);
        }

        throw new Error(`Value decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
