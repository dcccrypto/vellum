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

    console.log('\n🔍 ===== EXTRACTING X-PAYMENT HEADER =====');
    console.log('📋 Header value length:', headerValue.length);
    console.log('📋 Header value preview:', headerValue.substring(0, 100) + '...');

    try {
      const decoded = Buffer.from(headerValue, 'base64').toString('utf8');
      console.log('📋 Decoded JSON length:', decoded.length);
      console.log('📋 Decoded JSON preview:', decoded.substring(0, 200) + '...');
      
      const payload = JSON.parse(decoded);
      console.log('\n📋 Extracted Payment Payload:');
      console.log(JSON.stringify({
        x402Version: payload.x402Version,
        scheme: payload.scheme,
        network: payload.network,
        payload: {
          transaction: payload.payload?.transaction 
            ? `${payload.payload.transaction.substring(0, 50)}... (${payload.payload.transaction.length} chars)`
            : 'missing',
        },
      }, null, 2));
      console.log('===== END EXTRACT PAYMENT =====\n');
      
      return payload;
    } catch (error) {
      console.error('\n❌ Failed to decode X-PAYMENT header:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
      }
      console.log('===== END EXTRACT PAYMENT (ERROR) =====\n');
      return null;
    }
  }

  /**
   * Create payment requirements object
   * CRITICAL: payTo must be WALLET address (not ATA) - client derives ATA from wallet
   */
  async createPaymentRequirements(options: PaymentRequirementsOptions): Promise<PaymentRequirement> {
    // Get fee payer from facilitator
    const feePayer = await this.getFeePayer();

    // CRITICAL: payTo must be WALLET address, not ATA
    // Client will derive the ATA from this wallet address

    return {
      scheme: 'exact',
      network: this.network,
      asset: this.usdcMint,
      maxAmountRequired: options.amount.toString(),
      payTo: this.treasuryAddress, // WALLET address, not ATA
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
      const verifyUrl = `${this.facilitatorUrl}/verify`;
      const requestBody = {
        paymentPayload: paymentHeader,
        paymentRequirements: requirements,
      };

      console.log('\n🔍 ===== VERIFY REQUEST TO FACILITATOR =====');
      console.log('📤 Endpoint:', verifyUrl);
      console.log('📋 Request Body (EXACT):');
      console.log(JSON.stringify(requestBody, null, 2));
      
      console.log('\n📋 Payment Payload Details:');
      console.log(JSON.stringify({
        x402Version: paymentHeader.x402Version,
        scheme: paymentHeader.scheme,
        network: paymentHeader.network,
        payload: {
          transaction: paymentHeader.payload?.transaction 
            ? `${paymentHeader.payload.transaction.substring(0, 50)}... (${paymentHeader.payload.transaction.length} chars)`
            : 'missing',
        },
      }, null, 2));
      
      console.log('\n📋 Payment Requirements Details:');
      console.log(JSON.stringify({
        scheme: requirements.scheme,
        network: requirements.network,
        asset: requirements.asset,
        maxAmountRequired: requirements.maxAmountRequired,
        payTo: requirements.payTo,
        resource: requirements.resource,
        description: requirements.description,
        mimeType: requirements.mimeType,
        maxTimeoutSeconds: requirements.maxTimeoutSeconds,
        extra: requirements.extra,
      }, null, 2));
      
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('\n📥 Response Status:', response.status);
      console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      let result: FacilitatorVerifyResponse;
      
      try {
        result = JSON.parse(responseText) as FacilitatorVerifyResponse;
      } catch {
        console.error('❌ Failed to parse response as JSON:', responseText);
        return false;
      }

      console.log('\n📥 Response Body (EXACT):');
      console.log(JSON.stringify(result, null, 2));

      if (!response.ok) {
        console.error('❌ Verify failed - HTTP error:', response.status);
        console.error('❌ Error details:', result);
        console.log('===== END VERIFY (FAILED) =====\n');
        return false;
      }

      const isValid = result.isValid === true;
      console.log(`✅ Verify result: ${isValid ? 'VALID' : 'INVALID'}`);
      if (!isValid && result.invalidReason) {
        console.log('❌ Invalid reason:', result.invalidReason);
      }
      console.log('===== END VERIFY =====\n');

      return isValid;
    } catch (error) {
      console.error('\n❌ Verify payment exception:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      console.log('===== END VERIFY (EXCEPTION) =====\n');
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
    const settleUrl = `${this.facilitatorUrl}/settle`;
    const requestBody = {
      paymentPayload: paymentHeader,
      paymentRequirements: requirements,
    };

    console.log('\n💰 ===== SETTLE REQUEST TO FACILITATOR =====');
    console.log('📤 Endpoint:', settleUrl);
    console.log('📋 Request Body (EXACT):');
    console.log(JSON.stringify(requestBody, null, 2));
    
    console.log('\n📋 Payment Payload Details:');
    console.log(JSON.stringify({
      x402Version: paymentHeader.x402Version,
      scheme: paymentHeader.scheme,
      network: paymentHeader.network,
      payload: {
        transaction: paymentHeader.payload?.transaction 
          ? `${paymentHeader.payload.transaction.substring(0, 50)}... (${paymentHeader.payload.transaction.length} chars)`
          : 'missing',
      },
    }, null, 2));
    
    console.log('\n📋 Payment Requirements Details:');
    console.log(JSON.stringify({
      scheme: requirements.scheme,
      network: requirements.network,
      asset: requirements.asset,
      maxAmountRequired: requirements.maxAmountRequired,
      payTo: requirements.payTo,
      resource: requirements.resource,
      description: requirements.description,
      mimeType: requirements.mimeType,
      maxTimeoutSeconds: requirements.maxTimeoutSeconds,
      extra: requirements.extra,
    }, null, 2));
    
    const response = await fetch(settleUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    console.log('\n📥 Response Status:', response.status);
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    let result: FacilitatorSettleResponse;
    
    try {
      result = JSON.parse(responseText) as FacilitatorSettleResponse;
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', responseText);
      throw new Error(`Settle failed: Invalid JSON response - ${responseText.substring(0, 200)}`);
    }

    console.log('\n📥 Response Body (EXACT):');
    console.log(JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('❌ Settle failed - HTTP error:', response.status);
      console.error('❌ Error details:', result);
      const errorReason = (result as any).errorReason || `HTTP ${response.status}`;
      console.log('===== END SETTLE (FAILED) =====\n');
      throw new Error(errorReason);
    }
    
    if (!result.success) {
      console.error('❌ Settle unsuccessful:', result.errorReason);
      console.log('===== END SETTLE (UNSUCCESSFUL) =====\n');
      throw new Error(result.errorReason || 'Settlement failed');
    }

    console.log('✅ Settlement successful!');
    console.log('📝 Transaction signature:', result.transaction);
    console.log('🔗 Explorer: https://solscan.io/tx/' + result.transaction);
    console.log('===== END SETTLE (SUCCESS) =====\n');
    
    return result.transaction;
  }

  /**
   * Get fee payer from facilitator (cached)
   */
  private async getFeePayer(): Promise<string | undefined> {
    const now = Date.now();

    // Return cached if still valid
    if (this.feePayerCache && (now - this.feePayerCacheTime) < this.CACHE_TTL) {
      console.log('✅ Using cached fee payer:', this.feePayerCache);
      return this.feePayerCache;
    }

    try {
      const supportedUrl = `${this.facilitatorUrl}/supported`;
      console.log('\n🔍 ===== FETCHING FEE PAYER FROM FACILITATOR =====');
      console.log('📤 Endpoint:', supportedUrl);
      
      const response = await fetch(supportedUrl);
      
      console.log('📥 Response Status:', response.status);
      console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch supported networks:', errorText);
        console.log('===== END FEE PAYER FETCH (FAILED) =====\n');
        return undefined;
      }

      const responseText = await response.text();
      let data: FacilitatorSupportedResponse;
      
      try {
        data = JSON.parse(responseText) as FacilitatorSupportedResponse;
      } catch {
        console.error('❌ Failed to parse /supported response:', responseText);
        return undefined;
      }

      console.log('\n📥 Response Body (EXACT):');
      console.log(JSON.stringify(data, null, 2));

      const networkKind = data.kinds?.find(k => k.network === this.network);
      
      if (!networkKind) {
        console.warn(`⚠️ Network ${this.network} not found in supported networks`);
        console.log('Available networks:', data.kinds?.map(k => k.network));
        console.log('===== END FEE PAYER FETCH (NOT FOUND) =====\n');
        return undefined;
      }

      this.feePayerCache = networkKind.extra?.feePayer;
      this.feePayerCacheTime = now;
      
      if (this.feePayerCache) {
        console.log('✅ Fee payer found:', this.feePayerCache);
      } else {
        console.warn('⚠️ Fee payer not found in network kind extra:', networkKind);
      }
      console.log('===== END FEE PAYER FETCH =====\n');
      
      return this.feePayerCache;
    } catch (error) {
      console.error('\n❌ Exception fetching fee payer:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      console.log('===== END FEE PAYER FETCH (EXCEPTION) =====\n');
      return undefined;
    }
  }
}

