// Legacy utilities - kept for backwards compatibility
// New code should use @vellum/shared/src/x402-solana instead

import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';

/**
 * Check USDC balance for a wallet
 * @deprecated Consider migrating to x402-solana utilities
 */
export async function checkUSDCBalance(
  wallet: { publicKey?: PublicKey | null },
  connection: Connection,
  requiredAtomic: string
): Promise<{ hasEnough: boolean; balance: bigint; required: bigint; mintAddress?: string; ataAddress?: string }> {
  if (!wallet?.publicKey) throw new Error('Wallet not connected');

  const usdcMintAddress = process.env.NEXT_PUBLIC_USDC_MINT_ADDRESS;
  if (!usdcMintAddress) throw new Error('USDC mint address not configured');

  const usdcMint = new PublicKey(usdcMintAddress);
  const ata = getAssociatedTokenAddressSync(usdcMint, wallet.publicKey, false, TOKEN_PROGRAM_ID);

  try {
    const info = await connection.getAccountInfo(ata);
    if (!info) {
      return {
        hasEnough: false,
        balance: 0n,
        required: BigInt(requiredAtomic),
        mintAddress: usdcMintAddress,
        ataAddress: ata.toBase58(),
      };
    }
    const bal = await connection.getTokenAccountBalance(ata);
    const balance = BigInt(bal.value.amount);
    const required = BigInt(requiredAtomic);
    return { hasEnough: balance >= required, balance, required, mintAddress: usdcMintAddress, ataAddress: ata.toBase58() };
  } catch {
    return {
      hasEnough: false,
      balance: 0n,
      required: BigInt(requiredAtomic),
      mintAddress: usdcMintAddress,
      ataAddress: ata.toBase58(),
    };
  }
}
