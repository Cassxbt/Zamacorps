import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { ABIs } from '@/lib/contracts/abi';
import { injected } from 'wagmi/connectors';

const EncryptedPayrollABI = ABIs.payroll;

/**
 * Wagmi configuration for wallet connection
 * Configured for Sepolia testnet with v0.9 contract
 */
export const config = createConfig({
    chains: [sepolia],
    connectors: [
        // Injected connector - works with MetaMask, Coinbase Wallet, Rainbow, etc.
        injected(),
    ],
    transports: {
        [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/sTZ5ecoblEhM7IGB9bc_z_izbUph1Chn'),
    },
    ssr: false,
});

/**
 * Contract addresses for Sepolia Testnet
 */
export const PAYROLL_ADDRESS = process.env.NEXT_PUBLIC_PAYROLL_ADDRESS as `0x${string}`; // Updated to new payroll address
export const INCOME_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_INCOME_ORACLE_ADDRESS as `0x${string}`;
export const FHE_RELAYER = 'https://relayer.testnet.zama.org/' as const;
