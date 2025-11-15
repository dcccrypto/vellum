/** @type {import('next').NextConfig} */
const path = require('path');
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vellum/shared'],
  // Silence workspace root tracing warning in monorepo
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  // Expose client env with sane defaults to avoid duplication in .env
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_SOLANA_CLUSTER: process.env.NEXT_PUBLIC_SOLANA_CLUSTER || process.env.SOLANA_CLUSTER || 'devnet',
    NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.RPC_URL || '',
    // Optional per-network overrides; if blank, code falls back to public endpoints
    NEXT_PUBLIC_SOLANA_RPC_MAINNET: process.env.NEXT_PUBLIC_SOLANA_RPC_MAINNET || process.env.SOLANA_MAINNET_RPC_URL || '',
    NEXT_PUBLIC_SOLANA_RPC_DEVNET: process.env.NEXT_PUBLIC_SOLANA_RPC_DEVNET || process.env.SOLANA_DEVNET_RPC_URL || '',
    NEXT_PUBLIC_USDC_MINT_ADDRESS: process.env.NEXT_PUBLIC_USDC_MINT_ADDRESS || process.env.USDC_MINT || '',
  },
};

module.exports = nextConfig;

