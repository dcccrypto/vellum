// src/lib/x402-solana/client/index.ts (fixed)
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  WalletAdapter,
  X402ClientConfig,
  X402Offer,
  X402PaymentPayload,
  PaymentRequirement,
} from '../types';
import { getNetworkRpcUrl, getUsdcMint, safeJson } from '../utils';

export class X402Client {
  private wallet: WalletAdapter;
  private connection: Connection;
  private network: string;
  private maxPaymentAmount?: bigint;
  private usdcMint: string;

  constructor(config: X402ClientConfig) {
    this.wallet = config.wallet;
    this.network = config.network;
    this.maxPaymentAmount = config.maxPaymentAmount;

    const rpcUrl = getNetworkRpcUrl(config.network, config.rpcUrl);
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.usdcMint = getUsdcMint(config.network); // resolves EPjF... on mainnet, devnet mint on devnet
  }

  /** Make a fetch request with automatic 402 payment handling */
  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const res = await fetch(input, init);
    if (res.status !== 402) return res;

    const offer: X402Offer = await safeJson(res);
    const requirement = offer?.accepts?.[0];
    if (!requirement) throw new Error('Invalid 402 response: missing payment requirements');

    // Safety check: amount <= client cap
    const amount = BigInt(requirement.maxAmountRequired);
    if (this.maxPaymentAmount && amount > this.maxPaymentAmount) {
      throw new Error(`Payment amount ${amount} exceeds safety limit ${this.maxPaymentAmount}`);
    }

    const paymentHeader = await this.createPaymentTransaction(requirement);

    // merge headers safely
    const headers = new Headers(init?.headers || {});
    headers.set('X-PAYMENT', paymentHeader);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

    const paymentResponse = await fetch(input, { ...init, headers });
    if (!paymentResponse.ok) {
      const data = await safeJson(paymentResponse);
      throw new Error(data.error || `Payment failed: HTTP ${paymentResponse.status}`);
    }
    return paymentResponse;
  }

  /** Create and sign a LEGACY Solana transaction with exactly one TransferChecked */
  private async createPaymentTransaction(requirement: PaymentRequirement): Promise<string> {
    // Wallet + network checks
    const publicKey = this.wallet.publicKey || (this.wallet.address ? new PublicKey(this.wallet.address) : undefined);
    if (!publicKey) throw new Error('Wallet not connected');
    if (!this.wallet.signTransaction) throw new Error('Wallet does not support signing');
    if (requirement.network !== this.network) {
      throw new Error(`Network mismatch: expected ${this.network}, got ${requirement.network}`);
    }

    // Fee payer from facilitator (required)
    const feePayerStr = requirement.extra?.feePayer;
    if (!feePayerStr) throw new Error('Missing feePayer in payment requirements (extra.feePayer)');
    const feePayer = new PublicKey(feePayerStr);

    // Validate mint matches client’s network
    if (requirement.asset !== this.usdcMint) {
      throw new Error(`USDC mint mismatch: server=${requirement.asset}, client=${this.usdcMint}`);
    }

    // IMPORTANT: requirement.payTo must be the MERCHANT WALLET (not ATA)
    const usdcMint = new PublicKey(requirement.asset);
    const merchantWallet = new PublicKey(requirement.payTo);

    // Source (payer) + Destination (merchant) ATAs — derived from wallets
    const sourceAta = getAssociatedTokenAddressSync(usdcMint, publicKey, false, TOKEN_PROGRAM_ID);
    const destAta = getAssociatedTokenAddressSync(usdcMint, merchantWallet, false, TOKEN_PROGRAM_ID);

    // Optional: ensure source ATA exists (better UX)
    const srcInfo = await this.connection.getAccountInfo(sourceAta);
    if (!srcInfo) {
      throw new Error('Your USDC token account (ATA) does not exist. Receive USDC once to initialize it.');
    }

    const amountAtomic = BigInt(requirement.maxAmountRequired); // exact match required
    if (amountAtomic <= 0n) throw new Error('Invalid amount');

    // Build exactly one TransferChecked instruction (Tokenkeg… program, not Token-2022)
    const transferIx = createTransferCheckedInstruction(
      sourceAta,           // source ATA
      usdcMint,            // mint
      destAta,             // destination ATA (derived from merchant wallet)
      publicKey,           // owner (signer)
      amountAtomic,        // amount in micro USDC
      6,                   // USDC decimals
      [],                  // multisig signers
      TOKEN_PROGRAM_ID
    );

    // Legacy transaction with facilitator as fee payer
    const { blockhash } = await this.connection.getLatestBlockhash('finalized');
    const tx = new Transaction({ feePayer, recentBlockhash: blockhash }).add(transferIx);

    // Sign ONLY as token owner; facilitator will co-sign & submit
    const signed = await this.wallet.signTransaction(tx);

    // Serialize partially signed tx (no fee payer sig yet)
    const bytes = signed.serialize({ requireAllSignatures: false, verifySignatures: false });
    const txBase64 = Buffer.from(bytes).toString('base64');

    // X-PAYMENT header payload
    const payload: X402PaymentPayload = {
      x402Version: 1,
      scheme: requirement.scheme || 'exact',
      network: requirement.network, // 'solana' or 'solana-devnet'
      payload: { transaction: txBase64 },
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
}

/** Factory */
export function createX402Client(config: X402ClientConfig): X402Client {
  return new X402Client(config);
}
