import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

// Wallet Adapter Interface (compatible with Privy, Phantom, etc.)
export interface WalletAdapter {
  address: string;
  publicKey?: PublicKey | null;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
}

// Network types
export type X402Network = 'solana' | 'solana-devnet' | 'solana-testnet';

// Payment requirement from server
export interface PaymentRequirement {
  scheme: string;
  network: string;
  asset: string;
  maxAmountRequired: string;
  payTo: string;
  resource: string;
  description: string;
  mimeType: string;
  maxTimeoutSeconds: number;
  outputSchema?: any;
  extra?: {
    tokenSymbol?: string;
    tokenName?: string;
    expiresAt?: number;
    feePayer?: string;
  };
}

// x402 offer response (HTTP 402)
export interface X402Offer {
  x402Version: number;
  accepts: PaymentRequirement[];
}

// x402 payment payload (X-PAYMENT header)
export interface X402PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    transaction: string; // base64 encoded
  };
}

// Client configuration
export interface X402ClientConfig {
  wallet: WalletAdapter;
  network: X402Network;
  rpcUrl?: string;
  maxPaymentAmount?: bigint;
}

// Server configuration
export interface X402ServerConfig {
  network: X402Network;
  treasuryAddress: string;
  facilitatorUrl: string;
  rpcUrl?: string;
  usdcMint?: string;
}

// Payment requirements options for server
export interface PaymentRequirementsOptions {
  amount: number;
  description: string;
  resource?: string;
}

// Facilitator responses
export interface FacilitatorVerifyResponse {
  isValid: boolean;
  invalidReason?: string;
}

export interface FacilitatorSettleResponse {
  success: boolean;
  transaction: string;
  errorReason?: string;
}

export interface FacilitatorSupportedResponse {
  kinds: Array<{
    network: string;
    scheme: string;
    x402Version: number;
    extra?: {
      feePayer?: string;
    };
  }>;
}

