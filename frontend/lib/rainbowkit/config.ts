import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const rainbowKitConfig = getDefaultConfig({
    appName: 'ZAMACORPS',
    projectId: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', // WalletConnect Cloud project ID (placeholder)
    chains: [sepolia],
    ssr: true,
});
