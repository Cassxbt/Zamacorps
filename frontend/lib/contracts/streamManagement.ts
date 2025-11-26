import type { WalletClient, PublicClient } from 'viem';
import { sepolia } from 'viem/chains';
import { PAYROLL_ADDRESS } from '../wagmi/config';
import { ABIs } from './abi';
const EncryptedPayrollABI = ABIs.payroll;

/**
 * Pause a salary stream (HR only)
 */
export async function pauseStream(
    walletClient: WalletClient,
    employeeAddress: string
): Promise<string> {
    const hash = await walletClient.writeContract({
        address: PAYROLL_ADDRESS,
        abi: EncryptedPayrollABI,
        functionName: 'pauseStream',
        args: [employeeAddress as `0x${string}`],
        chain: sepolia,
    });

    return hash;
}

/**
 * Resume a paused salary stream (HR only)
 */
export async function resumeStream(
    walletClient: WalletClient,
    employeeAddress: string
): Promise<string> {
    const hash = await walletClient.writeContract({
        address: PAYROLL_ADDRESS,
        abi: EncryptedPayrollABI,
        functionName: 'resumeStream',
        args: [employeeAddress as `0x${string}`],
        chain: sepolia,
    });

    return hash;
}

/**
 * Cancel a salary stream permanently (HR only)
 */
export async function cancelStream(
    walletClient: WalletClient,
    employeeAddress: string
): Promise<string> {
    const hash = await walletClient.writeContract({
        address: PAYROLL_ADDRESS,
        abi: EncryptedPayrollABI,
        functionName: 'cancelStream',
        args: [employeeAddress as `0x${string}`],
        chain: sepolia,
    });

    return hash;
}
