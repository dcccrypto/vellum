import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  X402ServerConfig,
  PaymentRequirementsOptions,
  PaymentRequirement,
  X402PaymentPayload,
  X402Offer,
  FacilitatorVerifyResponse,
  FacilitatorSettleResponse,
  FacilitatorSupportedResponse,
} from '../types';
import { getNetworkRpcUrl, getUsdcMint } from '../utils';

export class X402PaymentHandler {
  private network: string;
  private treasuryAddress: string;
  private facilitatorUrl: string;
  private connection: Connection;
  private usdcMint: string;
  private feePayerCache?: string;
  private feePayerCacheTime = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(config: X402ServerConfig) {
    this.network = config.network;
    this.treasuryAddress = config.treasuryAddress;
    this.facilitatorUrl = config.facilitatorUrl;
    
    const rpcUrl = getNetworkRpcUrl(config.network, config.rpcUrl);
    this.connection = new Connection(rpcUrl, 'confirmed');
    
    this.usdcMint = config.usdcMint || getUsdcMint(config.network);
  }

  /**
   * Extract X-PAYMENT header from request
   */
  extractPayment(headers: Headers | Record<string, string | string[] | undefined>): X402PaymentPayload | null {
    let headerValue: string | undefined;

    if (headers instanceof Headers) {
      headerValue = headers.get('x-payment') || undefined;
    } else {
      const value = headers['x-payment'];
      headerValue = Array.isArray(value) ? value[0] : value;
    }

    if (!headerValue) {
      return null;
    }

    try {
      const decoded = Buffer.from(headerValue, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Create payment requirements object
   */
  async createPaymentRequirements(options: PaymentRequirementsOptions): Promise<PaymentRequirement> {
    // Get fee payer from facilitator
    const feePayer = await this.getFeePayer();

    // Calculate treasury ATA
    const treasuryPubkey = new PublicKey(this.treasuryAddress);
    const usdcMintPubkey = new PublicKey(this.usdcMint);
    const treasuryAta = getAssociatedTokenAddressSync(
      usdcMintPubkey,
      treasuryPubkey,
      false,
      TOKEN_PROGRAM_ID
    );

    return {
      scheme: 'exact',
      network: this.network,
      asset: this.usdcMint,
      maxAmountRequired: options.amount.toString(),
      payTo: treasuryAta.toBase58(),
      resource: options.resource || '',
      description: options.description,
      mimeType: 'application/json',
      maxTimeoutSeconds: 600,
      extra: {
        tokenSymbol: 'USDC',
        tokenName: 'USD Coin',
        ...(feePayer && { feePayer }),
      },
    };
  }

  /**
   * Create 402 response
   */
  async create402Response(options: PaymentRequirementsOptions): Promise<{ status: number; body: X402Offer }> {
    const requirements = await this.createPaymentRequirements(options);
    
    return {
      status: 402,
      body: {
        x402Version: 1,
        accepts: [requirements],
      },
    };
  }

  /**
   * Verify payment with facilitator
   */
  async verifyPayment(
    paymentHeader: X402PaymentPayload,
    requirements: PaymentRequirement
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.facilitatorUrl}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentPayload: paymentHeader,
          paymentRequirements: requirements,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const result: FacilitatorVerifyResponse = await response.json();
      return result.isValid === true;
    } catch (error) {
      console.error('Verify payment failed:', error);
      return false;
    }
  }

  /**
   * Settle payment with facilitator
   */
  async settlePayment(
    paymentHeader: X402PaymentPayload,
    requirements: PaymentRequirement
  ): Promise<string> {
    const response = await fetch(`${this.facilitatorUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentPayload: paymentHeader,
        paymentRequirements: requirements,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.errorReason || `Settle failed: HTTP ${response.status}`);
    }

    const result: FacilitatorSettleResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.errorReason || 'Settlement failed');
    }

    return result.transaction;
  }

  /**
   * Get fee payer from facilitator (cached)
   */
  private async getFeePayer(): Promise<string | undefined> {
    const now = Date.now();

    // Return cached if still valid
    if (this.feePayerCache && (now - this.feePayerCacheTime) < this.CACHE_TTL) {
      return this.feePayerCache;
    }

    try {
      const response = await fetch(`${this.facilitatorUrl}/supported`);
      
      if (!response.ok) {
        console.warn('Failed to fetch supported networks from facilitator');
        return undefined;
      }

      const data: FacilitatorSupportedResponse = await response.json();
      const networkKind = data.kinds?.find(k => k.network === this.network);
      
      this.feePayerCache = networkKind?.extra?.feePayer;
      this.feePayerCacheTime = now;
      
      return this.feePayerCache;
    } catch (error) {
      console.error('Failed to get fee payer:', error);
      return undefined;
    }
  }
}

