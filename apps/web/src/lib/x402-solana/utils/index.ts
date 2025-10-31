// USDC conversion utilities (6 decimals)

export function usdToMicroUsdc(usd: number): number {
  return Math.floor(usd * 1_000_000);
}

export function microUsdcToUsd(microUsdc: number): number {
  return microUsdc / 1_000_000;
}

export function formatUSDC(amountAtomic: string | number): string {
  const amount = typeof amountAtomic === 'string' ? BigInt(amountAtomic) : BigInt(amountAtomic);
  const usd = Number(amount) / 1_000_000;
  return `$${usd.toFixed(4)}`;
}

// Network mapping
export function getNetworkRpcUrl(network: string, customRpc?: string): string {
  if (customRpc) return customRpc;
  
  switch (network) {
    case 'solana':
      return process.env.NEXT_PUBLIC_SOLANA_RPC_MAINNET || 'https://api.mainnet-beta.solana.com';
    case 'solana-devnet':
      return process.env.NEXT_PUBLIC_SOLANA_RPC_DEVNET || 'https://api.devnet.solana.com';
    case 'solana-testnet':
      return 'https://api.testnet.solana.com';
    default:
      throw new Error(`Unknown network: ${network}`);
  }
}

export function getUsdcMint(network: string, customMint?: string): string {
  if (customMint) return customMint;
  
  switch (network) {
    case 'solana':
      return 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    case 'solana-devnet':
      return '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'; // Devnet USDC
    default:
      throw new Error(`No USDC mint configured for network: ${network}`);
  }
}

// Safe JSON parsing
export async function safeJson(res: Response): Promise<any> {
  try {
    const clone = res.clone();
    return await clone.json();
  } catch {
    return {};
  }
}

