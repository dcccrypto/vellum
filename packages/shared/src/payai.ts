import { fetch } from 'undici';
import { PaymentRequirements } from './x402';
import { Transaction } from '@solana/web3.js';

// Cache for facilitator supported networks
let supportedCache: any = null;
let supportedCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function postJson(url: string, body: any) {
  console.log(`📤 POST ${url}`);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  console.log(`📥 Response status: ${res.status}`);
  
  const json: any = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    console.error('❌ Request failed:', json);
    throw new Error(json?.error || json?.errorReason || `HTTP ${res.status}`);
  }
  
  // For verify: check isValid, for settle: check success
  if (json?.isValid === false || json?.success === false) {
    const errorMsg = json?.invalidReason || json?.errorReason || 'Payment verification/settlement failed';
    console.error('❌ Payment failed:', errorMsg);
    throw new Error(errorMsg);
  }
  
  console.log('✅ Request successful');
  return json;
}

export function verify(facilitatorUrl: string, paymentPayload: any, paymentRequirements: PaymentRequirements) {
  console.log('🔍 Starting verify request');
  console.log('📋 Payment Payload Structure:', {
    x402Version: paymentPayload.x402Version,
    scheme: paymentPayload.scheme,
    network: paymentPayload.network,
    hasPayload: !!paymentPayload.payload,
    hasTransaction: !!paymentPayload.payload?.transaction,
    transactionLength: paymentPayload.payload?.transaction?.length,
    transactionPreview: paymentPayload.payload?.transaction?.substring(0, 100) + '...',
  });
  
  // CRITICAL DEBUG: Deserialize the LEGACY transaction to see what the facilitator will see
  if (paymentPayload.payload?.transaction) {
    try {
      const txBytes = Buffer.from(paymentPayload.payload.transaction, 'base64');
      const tx = Transaction.from(txBytes);
      console.log('🔍 DESERIALIZED LEGACY TRANSACTION FOR FACILITATOR:', {
        instructionCount: tx.instructions.length,
        feePayer: tx.feePayer?.toBase58(),
        recentBlockhash: tx.recentBlockhash,
        signaturesCount: tx.signatures.length,
        instructions: tx.instructions.map((ix, idx) => ({
          index: idx,
          programId: ix.programId.toBase58(),
          keys: ix.keys.map(k => ({
            pubkey: k.pubkey.toBase58(),
            isSigner: k.isSigner,
            isWritable: k.isWritable,
          })),
          dataLength: ix.data.length,
        })),
      });
    } catch (e: any) {
      console.error('❌ Failed to deserialize transaction:', e.message);
    }
  }
  
  console.log('📋 Payment Requirements:', {
    scheme: paymentRequirements.scheme,
    network: paymentRequirements.network,
    asset: paymentRequirements.asset,
    maxAmountRequired: paymentRequirements.maxAmountRequired,
    payTo: paymentRequirements.payTo,
  });
  return postJson(`${facilitatorUrl}/verify`, { paymentPayload, paymentRequirements });
}

export function settle(facilitatorUrl: string, paymentPayload: any, paymentRequirements: PaymentRequirements) {
  console.log('💰 Starting settle request');
  return postJson(`${facilitatorUrl}/settle`, { paymentPayload, paymentRequirements });
}

/**
 * Get supported networks and fee payers from facilitator
 * Cached for 5 minutes to reduce API calls
 */
export async function getSupportedNetworks(facilitatorUrl: string) {
  const now = Date.now();
  
  // Return cached if still valid
  if (supportedCache && (now - supportedCacheTime) < CACHE_TTL) {
    console.log('✅ Using cached supported networks');
    return supportedCache;
  }
  
  console.log('📤 GET /supported from facilitator');
  const res = await fetch(`${facilitatorUrl}/supported`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch supported networks: HTTP ${res.status}`);
  }
  
  const data: any = await res.json();
  supportedCache = data;
  supportedCacheTime = now;
  
  // Extract network list from kinds array
  const networkList = Array.isArray(data.kinds) 
    ? data.kinds.map((k: any) => k.network) 
    : [];
  
  console.log('✅ Fetched supported networks:', {
    count: networkList.length,
    networks: networkList,
  });
  
  return data;
}

/**
 * Get the fee payer address for a specific network
 * Parses the facilitator's /supported response which has a "kinds" array
 */
export function getFeePayer(supported: any, network: string): string | undefined {
  // Facilitator returns { kinds: [ { network, scheme, x402Version, extra: { feePayer } } ] }
  const kinds = supported?.kinds;
  if (!Array.isArray(kinds)) {
    console.error('Invalid /supported response: no kinds array');
    return undefined;
  }
  
  // Find the matching network in the kinds array
  const networkKind = kinds.find((kind: any) => kind.network === network);
  
  if (!networkKind) {
    console.warn(`Network ${network} not found in facilitator's supported kinds`);
    return undefined;
  }
  
  // Return the feePayer from extra (if present)
  return networkKind.extra?.feePayer;
}
