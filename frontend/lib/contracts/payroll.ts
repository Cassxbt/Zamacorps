/**
 * Contract Wrapper for EncryptedPayroll (v0.9)
 * Handles interactions with the FHE-enabled payroll contract  
 */

import { type WalletClient, type PublicClient, decodeEventLog } from 'viem';
import { PAYROLL_ADDRESS } from '../wagmi/config';
import { ABIs, CONTRACT_FUNCTIONS } from './abi';
const EncryptedPayrollABI = ABIs.payroll;
import { encryptSalary } from '../fhe/encrypt';


export interface StreamParams {
    employee: string;
    salaryPerBlock: bigint;
    startBlock: bigint;
    cliffBlock: bigint;
}

/**
 * Create an encrypted payroll stream (HR function)
 */
export async function createPayrollStream(
    walletClient: WalletClient,
    publicClient: PublicClient,
    params: StreamParams
): Promise<string> {


    if (!walletClient.account) {
        throw new Error('Wallet account not found');
    }

    // 1. Encrypt the salary using FHE Relayer SDK
    const encrypted = await encryptSalary(
        params.salaryPerBlock,
        walletClient.account.address // User address for encryption
    );

    // Convert handles and proof to proper hex format
    const encryptedSalaryHandle = typeof encrypted.handles[0] === 'string'
        ? encrypted.handles[0] as `0x${string}`
        : `0x${Buffer.from(encrypted.handles[0]).toString('hex')}` as `0x${string}`;

    const inputProofHex = typeof encrypted.inputProof === 'string'
        ? encrypted.inputProof as `0x${string}`
        : `0x${Buffer.from(encrypted.inputProof).toString('hex')}` as `0x${string}`;



    // 2. Submit transaction with encrypted data
    const hash = await walletClient.writeContract({
        address: PAYROLL_ADDRESS,
        abi: ABIs.payroll,
        functionName: CONTRACT_FUNCTIONS.CREATE_STREAM,
        args: [
            params.employee as `0x${string}`,
            encryptedSalaryHandle, // Converted encrypted salary handle
            inputProofHex, // Converted proof
            Number(params.startBlock),
            Number(params.cliffBlock),
        ],
    } as any);


    return hash;
}

/**
 * Get all payroll streams (for HR dashboard)
 */
export interface PayrollStream {
    streamId: number;
    employee: string;
    salaryPerBlock: string; // Encrypted, will show as hex
    startBlock: number;
    cliffBlock: number;
    lastClaimBlock: number;
    isPaused: boolean;
    isCanceled: boolean;
}

/**
 * Check if an employee already has an active stream
 * @param publicClient - Viem public client
 * @param employeeAddress - Employee's wallet address
 * @returns true if stream exists, false otherwise
 */
export async function checkStreamExists(
    publicClient: PublicClient,
    employeeAddress: string
): Promise<boolean> {
    try {
        const stream = await publicClient.readContract({
            address: PAYROLL_ADDRESS,
            abi: EncryptedPayrollABI,
            functionName: 'streams',
            args: [employeeAddress as `0x${string}`],
        }) as any;

        // Contract returns tuple as array: [salaryPerBlock, startBlock, cliffBlock, claimedAmount, isPaused, exists]
        // Check the 'exists' boolean at index 5
        if (Array.isArray(stream) && stream.length >= 6) {
            return stream[5] === true;
        }

        // Fallback: check if salaryPerBlock (index 0) is not empty
        return !!(stream && stream[0] && stream[0] !== '0x0000000000000000000000000000000000000000000000000000000000000000');
    } catch (error) {
        console.error('[checkStreamExists] Error:', error);
        return false;
    }
}

export async function getAllStreams(
    publicClient: PublicClient
): Promise<PayrollStream[]> {
    try {
        // Get total stream count from contract
        const count = await publicClient.readContract({
            address: PAYROLL_ADDRESS,
            abi: EncryptedPayrollABI,
            functionName: 'getStreamCount',
        }) as bigint;

        if (count === BigInt(0)) {
            return [];
        }

        // Get all employee addresses in one call
        const employees = await publicClient.readContract({
            address: PAYROLL_ADDRESS,
            abi: EncryptedPayrollABI,
            functionName: 'getEmployees',
            args: [BigInt(0), count], // offset 0, limit = count
        }) as string[];

        // Fetch stream data for each employee
        const streams: PayrollStream[] = [];

        for (let i = 0; i < employees.length; i++) {
            const employee = employees[i];

            try {
                const stream = await publicClient.readContract({
                    address: PAYROLL_ADDRESS,
                    abi: EncryptedPayrollABI,
                    functionName: 'streams',
                    args: [employee as `0x${string}`],
                }) as any;

                // Contract returns tuple as array: [salaryPerBlock, startBlock, cliffBlock, claimedAmount, isPaused, exists]
                // Array indices: [0, 1, 2, 3, 4, 5]
                if (stream && stream.length >= 6 && stream[5] === true) { // stream[5] = exists
                    const streamData = {
                        streamId: i,
                        employee: employee,
                        salaryPerBlock: stream[0].toString(), // [0] = salaryPerBlock
                        startBlock: Number(stream[1]) || 0,    // [1] = startBlock
                        cliffBlock: Number(stream[2]) || 0,    // [2] = cliffBlock
                        lastClaimBlock: 0,
                        isPaused: stream[4] || false,          // [4] = isPaused
                        isCanceled: false,
                    };

                    streams.push(streamData);
                }
            } catch (error) {
                console.error(`[getAllStreams] ❌ Error fetching stream for ${employee}:`, error);
            }
        }

        return streams;
    } catch (error) {
        console.error('[getAllStreams] ❌ Fatal error:', error);
        return [];
    }
}


/**
 * Request withdrawal - returns encrypted handle that needs decryption
 */
export async function requestWithdrawal(
    walletClient: WalletClient,
    publicClient: PublicClient
): Promise<{ txHash: string; handle: string }> {


    if (!walletClient.account) {
        throw new Error('Wallet account not found');
    }

    // Call requestWithdrawal - it returns a bytes32 handle
    const hash = await walletClient.writeContract({
        address: PAYROLL_ADDRESS,
        abi: EncryptedPayrollABI,
        functionName: 'requestWithdrawal',
    } as any);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Find the WithdrawalReady event log
    let handle = '';

    // Parse logs to find WithdrawalReady event
    // Event signature: WithdrawalReady(address indexed employee, bytes32 claimableHandle)
    // Topic 0 is the event signature hash

    for (const log of receipt.logs) {
        try {
            const decodedLog = decodeEventLog({
                abi: EncryptedPayrollABI,
                data: log.data,
                topics: log.topics,
            });

            if (decodedLog.eventName === 'WithdrawalReady') {
                // args: { employee: string, claimableHandle: string }
                handle = (decodedLog.args as any).claimableHandle;
                break;
            }
        } catch (e) {
            // Ignore logs that don't match our ABI
            continue;
        }
    }

    if (!handle) {
        throw new Error('Failed to retrieve withdrawal handle from transaction logs');
    }

    return { txHash: hash, handle };
}

/**
 * Submit withdrawal after off-chain decryption
 */
export async function submitWithdrawal(
    walletClient: WalletClient,
    amount: bigint
): Promise<string> {
    try {
        const hash = await walletClient.writeContract({
            address: PAYROLL_ADDRESS,
            abi: EncryptedPayrollABI,
            functionName: 'submitWithdrawal',
            args: [amount], // Use bigint directly, not Number
        } as any);

        return hash;
    } catch (error: any) {
        if (error.message?.includes('User rejected')) {
            throw new Error('Transaction rejected by user');
        }
        throw error;
    }
}

/**
 * Get stream data for an employee
 * @param publicClient Public client
 * @param employeeAddress Employee address
 * @returns Stream data (encrypted)
 */
export async function getEmployeeStream(
    publicClient: PublicClient,
    employeeAddress: string
) {
    const result = await publicClient.readContract({
        address: PAYROLL_ADDRESS,
        abi: EncryptedPayrollABI,
        functionName: CONTRACT_FUNCTIONS.GET_STREAM,
        args: [employeeAddress as `0x${string}`],
    }) as any[];

    return {
        salaryPerBlock: result[0],
        startBlock: result[1],
        cliffBlock: result[2],
        claimedAmount: result[3],
    };
}

/**
 * Check if an address has HR role
 * @param publicClient Public client
 * @param address Address to check
 * @returns True if has HR role
 */
export async function checkHRRole(
    publicClient: PublicClient,
    address: string
): Promise<boolean> {
    const hrRole = '0x' + Buffer.from('HR_ROLE').toString('hex').padStart(64, '0');

    const hasRole = await publicClient.readContract({
        address: PAYROLL_ADDRESS,
        abi: EncryptedPayrollABI,
        functionName: 'hasRole',
        args: [hrRole, address as `0x${string}`],
    }) as boolean;

    return hasRole;
}
