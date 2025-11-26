import type { PublicClient } from 'viem';
import { PAYROLL_ADDRESS } from '../wagmi/config';
import { ABIs } from '@/lib/contracts/abi';
const EncryptedPayrollABI = ABIs.payroll;

export interface WithdrawalEvent {
    employee: string;
    amount: bigint;
    blockNumber: bigint;
    transactionHash: string;
    timestamp: number;
}

/**
 * Query all withdrawal events for an employee
 */
export async function getWithdrawalHistory(
    publicClient: PublicClient,
    employeeAddress: string
): Promise<WithdrawalEvent[]> {
    try {
        // Get logs for SalaryWithdrawn events
        const logs = await publicClient.getContractEvents({
            address: PAYROLL_ADDRESS,
            abi: EncryptedPayrollABI,
            eventName: 'SalaryWithdrawn',
            args: {
                employee: employeeAddress as `0x${string}`,
            },
            fromBlock: BigInt(0),
        });

        // Convert logs to withdrawal events with timestamps
        const events: WithdrawalEvent[] = [];

        for (const log of logs) {
            try {
                const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

                events.push({
                    employee: (log as any).args.employee as string,
                    amount: (log as any).args.amount as bigint,
                    blockNumber: log.blockNumber,
                    timestamp: Number(block.timestamp),
                    transactionHash: log.transactionHash,
                });
            } catch (error) {
                console.error(`Failed to fetch block ${log.blockNumber}:`, error);
            }
        }

        return events.sort((a, b) => b.timestamp - a.timestamp); // Most recent first
    } catch (error) {
        console.error('Failed to fetch withdrawal history:', error);
        return [];
    }
}

/**
 * Query all stream created events
 */
export async function getAllStreamCreatedEvents(
    publicClient: PublicClient
): Promise<Array<{
    employee: string;
    startBlock: bigint;
    blockNumber: bigint;
    transactionHash: string;
}>> {
    try {
        const logs = await publicClient.getContractEvents({
            address: PAYROLL_ADDRESS,
            abi: EncryptedPayrollABI,
            eventName: 'StreamCreated',
            fromBlock: BigInt(0),
        });

        return logs.map(log => ({
            employee: (log as any).args.employee as string,
            startBlock: (log as any).args.startBlock as bigint,
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
        }));
    } catch (error) {
        console.error('Error fetching stream creation events:', error);
        return [];
    }
}
