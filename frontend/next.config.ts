import type { NextConfig } from "next";
import path from "path";


const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  webpack: (config, { isServer }) => {
    // Enable WebAssembly support (required for FHE SDK)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Don't bundle FHE SDK on server-side (prevents SSR errors)
    if (isServer) {
      config.externals.push('@zama-fhe/relayer-sdk/web');
    } else {
      // Client-side configuration for FHE SDK
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Explicitly handle WASM files as assets
      // This prevents Webpack from trying to resolve imports inside the WASM (like 'wbg')
      // and allows the SDK to handle instantiation manually via new URL()
      config.module.rules.push({
        test: /\.wasm$/,
        type: "asset/resource",
      });
    }

    // Ignore optional dependencies from MetaMask SDK (not needed for web)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };

    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_PAYROLL_ADDRESS: process.env.NEXT_PUBLIC_PAYROLL_ADDRESS,
    NEXT_PUBLIC_INCOME_ORACLE_ADDRESS: process.env.NEXT_PUBLIC_INCOME_ORACLE_ADDRESS,
  },
};

export default nextConfig;
