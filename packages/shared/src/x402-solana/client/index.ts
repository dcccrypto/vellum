// x402-client.ts
import {
  Connection,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction,
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
    this.usdcMint = getUsdcMint(config.network);
  }

  async fetch(input: string | URL, init?: RequestInit): Promise<Response> {
    console.log('🌐 x402 Client: Making request to', input);
    const response = await fetch(input, init);
    console.log('📥 x402 Client: Response status:', response.status);

    if (response.status !== 402) {
      console.log('✅ x402 Client: No payment required, returning response');
      return response;
    }

    console.log('💳 x402 Client: Payment required (402), processing...');
    const offer: X402Offer = await safeJson(response);

    console.log('\n📥 ===== 402 RESPONSE RECEIVED =====');
    console.log(JSON.stringify(offer, null, 2));

    const requirement = offer.accepts?.[0];
    if (!requirement) throw new Error('Invalid 402 response: missing payment requirements');

    console.log('\n📋 Payment Requirement Details:');
    console.log(JSON.stringify({
      scheme: requirement.scheme,
      network: requirement.network,
      asset: requirement.asset,
      maxAmountRequired: requirement.maxAmountRequired,
      payTo: requirement.payTo,
      resource: requirement.resource,
      description: requirement.description,
      mimeType: requirement.mimeType,
      maxTimeoutSeconds: requirement.maxTimeoutSeconds,
      extra: requirement.extra,
    }, null, 2));
    console.log('===== END 402 RESPONSE =====\n');

    if (this.maxPaymentAmount) {
      const amount = BigInt(requirement.maxAmountRequired);
      if (amount > this.maxPaymentAmount) {
        throw new Error(`Payment amount ${amount} exceeds safety limit ${this.maxPaymentAmount}`);
      }
      console.log('✅ x402 Client: Amount within safety limit');
    }

    console.log('🔐 x402 Client: Creating and signing payment transaction...');
    const paymentHeader = await this.createPaymentTransaction(requirement);
    console.log('✅ x402 Client: Payment transaction signed');

    console.log('\n📤 ===== RETRYING REQUEST WITH PAYMENT =====');
    const paymentResponse = await fetch(input, {
      ...init,
      headers: {
        ...init?.headers,
        'X-PAYMENT': paymentHeader,
      },
    });

    console.log('\n📥 ===== PAYMENT RESPONSE RECEIVED =====');
    console.log('📥 Status:', paymentResponse.status, paymentResponse.statusText);
    console.log('📥 Headers:', Object.fromEntries(paymentResponse.headers.entries()));

    if (!paymentResponse.ok) {
      const errorData = await safeJson(paymentResponse);
      console.error('\n❌ Payment failed - Response Body:');
      console.error(JSON.stringify(errorData, null, 2));
      console.log('===== END PAYMENT (FAILED) =====\n');
      throw new Error(errorData.error || `Payment failed: HTTP ${paymentResponse.status}`);
    }

    const responseData = await safeJson(paymentResponse);
    console.log('\n✅ Payment successful!');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('===== END PAYMENT (SUCCESS) =====\n');

    return paymentResponse;
  }

  /**
   * Build EXACT (legacy) tx with facilitator fee payer and instruction order:
   * 1) ComputeBudget::SetComputeUnitLimit(40_000)
   * 2) ComputeBudget::SetComputeUnitPrice(1)
   * 3) createAssociatedTokenAccount (IF recipient’s ATA missing)
   * 4) Token::TransferChecked
   *
   * Treats `payTo` as the **recipient WALLET**, derives ATA from it.
   * - Fee payer is the facilitator (co-signs later)
   * - Client signs as token owner and (if needed) ATA payer (funds rent)
   */
  private async buildExactPaymentLegacyTx(
    payerOwner: PublicKey,
    requirement: PaymentRequirement
  ): Promise<Transaction> {
    console.log('\n🔧 ===== BUILDING LEGACY EXACT PAYMENT TRANSACTION =====');

    // facilitator fee payer
    const feePayerStr = requirement.extra?.feePayer;
    if (!feePayerStr) throw new Error('Missing feePayer in payment requirements');
    const feePayer = new PublicKey(feePayerStr);

    // USDC mint + recipient wallet → recipient ATA
    const usdcMint = new PublicKey(requirement.asset);
    const recipientWallet = new PublicKey(requirement.payTo); // wallet (NOT ATA)
    const recipientAta = getAssociatedTokenAddressSync(
      usdcMint,
      recipientWallet,
      false, // allowOwnerOffCurve
      TOKEN_PROGRAM_ID
    );

    // source ATA (payer's USDC)
    const sourceAta = getAssociatedTokenAddressSync(
      usdcMint,
      payerOwner,
      false, // allowOwnerOffCurve
      TOKEN_PROGRAM_ID
    );

    const amount = BigInt(requirement.maxAmountRequired);

    console.log('📋 Addresses:');
    console.log('  payerOwner:', payerOwner.toBase58());
    console.log('  sourceAta:', sourceAta.toBase58());
    console.log('  recipientWallet (payTo):', recipientWallet.toBase58());
    console.log('  recipientAta:', recipientAta.toBase58());
    console.log('  amountAtomic:', amount.toString());
    console.log('  feePayer (facilitator):', feePayer.toBase58());

    // recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash('finalized');
    console.log('  Blockhash:', blockhash);

    const tx = new Transaction({
      feePayer,            // facilitator is tx fee payer
      recentBlockhash: blockhash,
    });

    // 1) ComputeBudget::SetComputeUnitLimit(40_000)
    tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 40_000 }));

    // 2) ComputeBudget::SetComputeUnitPrice(1)
    tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }));

    // 3) IF recipient ATA missing → createAssociatedTokenAccount
    const recipientAtaInfo = await this.connection.getAccountInfo(recipientAta);
    const needsCreateAta = recipientAtaInfo === null;
    if (needsCreateAta) {
      // payer (of rent) = user (payerOwner). This requires payerOwner signature (which we have).
      tx.add(
        createAssociatedTokenAccountInstruction(
          payerOwner,            // payer of rent
          recipientAta,          // ATA address
          recipientWallet,       // owner of ATA
          usdcMint               // mint
        )
      );
    }

    // 4) Token::TransferChecked (source → recipient ATA)
    tx.add(
      createTransferCheckedInstruction(
        sourceAta,
        usdcMint,
        recipientAta,
        payerOwner,              // owner (signer)
        amount,
        6,                       // USDC decimals
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Log instruction order
    console.log('🧱 Instruction order (program ids):');
    tx.instructions.forEach((ix, i) => console.log(`${i + 1}. ${ix.programId.toBase58()}`));

    // Validate length: 3 (no ATA) or 4 (with ATA)
    const expected = needsCreateAta ? 4 : 3;
    if (tx.instructions.length !== expected) {
      throw new Error(`Expected ${expected} instructions, got ${tx.instructions.length}`);
    }

    // Validate order quick checks
    if (tx.instructions[0].programId.equals(ComputeBudgetProgram.programId) === false)
      throw new Error('First ix must be ComputeBudget (limit)');
    if (tx.instructions[1].programId.equals(ComputeBudgetProgram.programId) === false)
      throw new Error('Second ix must be ComputeBudget (price)');
    const lastIxIdx = expected - 1;
    if (!tx.instructions[lastIxIdx].programId.equals(TOKEN_PROGRAM_ID))
      throw new Error('Last ix must be Token::TransferChecked');

    console.log('✅ Built legacy tx with correct instruction order and length:', expected);
    console.log('===== END BUILD TRANSACTION =====\n');
    return tx;
  }

  private async createPaymentTransaction(requirement: PaymentRequirement): Promise<string> {
    const ownerPubkey = this.wallet.publicKey || new PublicKey(this.wallet.address);
    if (!ownerPubkey) throw new Error('Wallet not connected');
    if (!this.wallet.signTransaction) throw new Error('Wallet does not support signing');

    console.log('🔍 x402 Client: Validating payment requirements...');
    if (requirement.network !== this.network) {
      throw new Error(`Network mismatch: expected ${this.network}, got ${requirement.network}`);
    }
    const amountAtomic = BigInt(requirement.maxAmountRequired);
    if (amountAtomic.toString() !== requirement.maxAmountRequired) {
      throw new Error(`Amount mismatch: ${amountAtomic} !== ${requirement.maxAmountRequired}`);
    }

    // Build legacy tx with required instruction order
    const tx = await this.buildExactPaymentLegacyTx(ownerPubkey, requirement);

    // You sign (as owner, and ATA payer if needed). Facilitator will co-sign as fee payer.
    console.log('\n✍️  x402 Client: Requesting wallet signature...');
    const signed = await this.wallet.signTransaction(tx);
    console.log('✅ x402 Client: Transaction signed by wallet');

    // Serialize partially-signed legacy tx
    console.log('📦 Serializing transaction...');
    const raw = signed.serialize({
      requireAllSignatures: false, // facilitator co-signs
      verifySignatures: false,
    });
    const txBase64 = Buffer.from(raw).toString('base64');

    const payload: X402PaymentPayload = {
      x402Version: 1,
      scheme: requirement.scheme || 'exact',
      network: requirement.network,
      payload: { transaction: txBase64 },
    };

    console.log('\n📦 ===== X402 PAYMENT PAYLOAD CREATED =====');
    console.log(JSON.stringify({
      x402Version: payload.x402Version,
      scheme: payload.scheme,
      network: payload.network,
      payload: { transaction: `${txBase64.slice(0, 50)}... (${txBase64.length} chars)` },
    }, null, 2));
    console.log('===== END PAYMENT PAYLOAD =====\n');

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
}

export function createX402Client(config: X402ClientConfig): X402Client {
  return new X402Client(config);
}
