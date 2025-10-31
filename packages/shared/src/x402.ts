import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getEnv } from './env';
import { getSkuById } from './catalog';
import { getSupportedNetworks, getFeePayer } from './payai';

/**
 * Map Solana cluster to x402 network identifier
 */
function getSolanaNetworkId(cluster: string): string {
  switch (cluster) {
    case 'mainnet-beta':
      return 'solana';
    case 'devnet':
      return 'solana-devnet';
    case 'testnet':
      return 'solana-testnet';
    default:
      throw new Error(`Unsupported Solana cluster: ${cluster}`);
  }
}

/**
 * Derive USDC Associated Token Account (ATA) for vault owner
 * Uses proper SPL Token getAssociatedTokenAddressSync
 */
export function getVaultUsdcAta(): string {
  const env = getEnv();
  
  // If explicitly set, use it
  if (env.VAULT_USDC_ATA) {
    return env.VAULT_USDC_ATA;
  }
  
  // Otherwise derive from VAULT_OWNER and USDC_MINT using SPL Token utility
  const owner = new PublicKey(env.VAULT_OWNER);
  const mint = new PublicKey(env.USDC_MINT);
  
  const ata = getAssociatedTokenAddressSync(
    mint,
    owner,
    false, // allowOwnerOffCurve
    TOKEN_PROGRAM_ID // Classic SPL Token program, NOT Token-2022
  );
  
  return ata.toBase58();
}

/**
 * Build input schema descriptor for outputSchema.input
 */
function buildInputSchemaDescriptor(skuId: string): Record<string, string> {
  const sku = getSkuById(skuId);
  
  // Convert zod schema to simple descriptor
  // This is a simplified approach - expand as needed
  const schemaMap: Record<string, Record<string, string>> = {
    'img-gen-basic': { prompt: 'string' },
    'meme-maker': { imageUrl: 'string', template: 'string', top: 'string', bottom: 'string' },
    'bg-remove': { imageUrl: 'string' },
    'upscale-2x': { imageUrl: 'string' },
    'favicon': { imageUrl: 'string' },
    'urlsum': { url: 'string' },
    'pdf2txt': { pdfUrl: 'string' },
  };
  
  return schemaMap[skuId] || {};
}

// === LOCKED: 402 REQUIREMENTS SHAPE — DO NOT EDIT ===
/**
 * Build payment requirements object for x402
 * This MUST be identical for both 402 response and PayAI verify/settle calls
 * Now async to fetch feePayer from facilitator
 */
export async function buildPaymentRequirements(skuId: string) {
  const env = getEnv();
  const sku = getSkuById(skuId);
  const networkId = getSolanaNetworkId(env.SOLANA_CLUSTER);

  // Fetch fee payer from facilitator
  let feePayer: string | undefined;
  try {
    const supported = await getSupportedNetworks(env.FACILITATOR_URL);
    feePayer = getFeePayer(supported, networkId);
    
    if (!feePayer) {
      const availableNetworks = Array.isArray(supported?.kinds) 
        ? supported.kinds.map((k: any) => k.network) 
        : [];
      console.warn(`⚠️ No fee payer found for network ${networkId} in facilitator response`);
      console.warn(`Available networks:`, availableNetworks);
    } else {
      console.log(`✅ Got facilitator fee payer for ${networkId}: ${feePayer}`);
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch facilitator fee payer:', error.message);
    console.error('Full error:', error);
    // Proceed without fee payer - will fail at client but with better error message
  }
  
  // If we still don't have a fee payer, log the issue
  if (!feePayer) {
    console.error(`🚨 CRITICAL: No fee payer available for network ${networkId}`);
    console.error(`This will cause client-side errors. Check facilitator URL: ${env.FACILITATOR_URL}`);
  }

  // CRITICAL: payTo must be WALLET address (not ATA) - client derives ATA from wallet
  return {
    scheme: 'exact' as const,
    network: networkId,
    asset: env.USDC_MINT,
    maxAmountRequired: sku.priceAtomic,
    payTo: env.VAULT_OWNER, // WALLET address, not ATA
    // Fix resource URL: remove /x402/pay if already present, then add it
    resource: `${env.PUBLIC_MINT_URL.replace(/\/x402\/pay\/?$/, '')}/x402/pay?sku=${skuId}`,
    description: sku.description,
    mimeType: 'application/json' as const,
    maxTimeoutSeconds: 600,
    outputSchema: {
      input: {
        type: 'http' as const,
        method: 'POST' as const,
        bodyFields: buildInputSchemaDescriptor(skuId),
      },
      output: {
        type: 'object' as const,
        properties: sku.outputSchema,
      },
    },
    extra: {
      tokenSymbol: 'USDC',
      tokenName: 'USD Coin (Solana)',
      expiresAt: Number(env.OFFER_EXPIRES_AT),
      ...(feePayer && { feePayer }), // Include feePayer if available
    },
  };
}

/**
 * Build complete x402 offer response
 */
export const buildOffer = async (skuId: string) => ({
  x402Version: 1,
  accepts: [await buildPaymentRequirements(skuId)]
});
// === END LOCKED SECTION ===

export type PaymentRequirements = Awaited<ReturnType<typeof buildPaymentRequirements>>;

