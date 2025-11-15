import { Request, Response } from 'express';
import { X402PaymentHandler } from '@vellum/shared';
import {
  getSkuById,
  validateSkuInput,
  ValidationError,
  getEnv,
} from '@vellum/shared';
import { logEvent } from '../logger';
import { getCached, setCached } from '../cache';
import { fulfillSku } from '../fulfillment';
import { estimatePriceAtomic } from '../ai/openrouter';
import { quotes } from './quote';

// Lazy-initialized x402 payment handler
let x402: X402PaymentHandler | null = null;

function getX402Handler(): X402PaymentHandler {
  if (!x402) {
    const env = getEnv();
    // Use mainnet for production
    x402 = new X402PaymentHandler({
      network: 'solana',
      treasuryAddress: env.VAULT_OWNER,
      facilitatorUrl: env.FACILITATOR_URL,
    });
    console.log('✅ X402PaymentHandler initialized for mainnet-beta');
  }
  return x402;
}

export async function handleX402Pay(req: Request, res: Response) {
  const startTime = Date.now();
  const skuId = String(req.query.sku || '');
  const model = String(req.query.model || 'openrouter/auto');
  const quoteId = req.query.quoteId ? String(req.query.quoteId) : undefined;
  const idempotencyKey = req.header('Idempotency-Key') || undefined;
  const idemStore = (global as any).__IDEM_STORE || ((global as any).__IDEM_STORE = new Map<string, any>());
  
  console.log('\n🎯 ===== NEW X402 REQUEST =====');
  console.log('📋 SKU:', skuId);
  console.log('🧠 Model:', model);
  console.log('🔗 URL:', req.url);
  console.log('📊 Method:', req.method);
  console.log('🌐 Origin:', req.headers.origin);
  
  // Validate SKU
  if (!skuId) {
    console.error('❌ Missing SKU parameter');
    return res.status(400).json({ error: 'SKU parameter required' });
  }
  
  let sku;
  try {
    sku = getSkuById(skuId);
    console.log('✅ SKU validated:', {
      name: sku.name,
      price: sku.priceAtomic,
      description: sku.description,
    });
  } catch (error) {
    console.error('❌ Invalid SKU:', skuId);
    return res.status(400).json({ error: 'Invalid SKU' });
  }

  // Get x402 handler and env
  const x402 = getX402Handler();
  const env = getEnv();
  
  // Extract payment header
  console.log('🔍 Checking for X-PAYMENT header...');
  const paymentHeader = x402.extractPayment(req.headers);
  
  if (paymentHeader) {
    console.log('✅ X-PAYMENT header found:', {
      x402Version: paymentHeader.x402Version,
      scheme: paymentHeader.scheme,
      network: paymentHeader.network,
      hasPayload: !!paymentHeader.payload,
      hasTransaction: !!paymentHeader.payload?.transaction,
    });
  } else {
    console.log('❌ No X-PAYMENT header - will return 402');
  }
  
  // No payment header: return 402 with payment requirements
  if (!paymentHeader) {
    console.log('💳 Creating 402 payment response...');
    // Dynamic pricing for AI SKUs; prefer provided quoteId
    let amountAtomic = sku.priceAtomic;
    if (quoteId) {
      const q = quotes.get(quoteId);
      if (!q) return res.status(400).json({ error: 'Invalid quoteId' });
      if (Date.now() > q.expiresAt) return res.status(410).json({ error: 'Quote expired' });
      if (q.sku !== skuId || q.model !== model) return res.status(400).json({ error: 'Quote mismatch' });
      amountAtomic = q.amountAtomic;
    } else if (['urlsum', 'img-gen-basic', 'meme-maker', 'bg-remove'].includes(skuId)) {
      try {
        const est = await estimatePriceAtomic({ skuId, model, input: req.body });
        amountAtomic = est.atomic;
      } catch (e) {
        console.warn('⚠️  Pricing estimate failed, falling back to static price:', (e as any)?.message);
      }
    }
    logEvent('402_issued', {
      sku: skuId,
      amountAtomic,
      duration: Date.now() - startTime,
    });

    // Fix resource URL: remove /x402/pay if already present, then add it
    const baseUrl = env.PUBLIC_MINT_URL.replace(/\/x402\/pay\/?$/, '');
    const response = await x402.create402Response({
      amount: Number(amountAtomic),
      description: sku.description,
      resource: `${baseUrl}/x402/pay?sku=${skuId}&model=${encodeURIComponent(model)}${quoteId ? `&quoteId=${encodeURIComponent(quoteId)}` : ''}`,
    });

    console.log('✅ 402 response created:', {
      network: response.body.accepts[0]?.network,
      amount: response.body.accepts[0]?.maxAmountRequired,
      payTo: response.body.accepts[0]?.payTo,
      feePayer: response.body.accepts[0]?.extra?.feePayer,
    });
    console.log('===== END REQUEST (402) =====\n');

    return res
      .status(response.status)
      .set('Access-Control-Allow-Origin', '*')
      .set('Access-Control-Expose-Headers', 'X-PAYMENT-RESPONSE')
      .json(response.body);
  }
  
  // Create payment requirements for verify/settle
  // CRITICAL: Must match exactly the accepts[0] shape from 402 response
  console.log('📋 Creating payment requirements for verification...');
  // Fix resource URL: remove /x402/pay if already present, then add it
  const baseUrl = env.PUBLIC_MINT_URL.replace(/\/x402\/pay\/?$/, '');
  let amountAtomic = sku.priceAtomic;
  if (quoteId) {
    const q = quotes.get(quoteId);
    if (!q) return res.status(400).json({ error: 'Invalid quoteId' });
    if (Date.now() > q.expiresAt) return res.status(410).json({ error: 'Quote expired' });
    if (q.sku !== skuId || q.model !== model) return res.status(400).json({ error: 'Quote mismatch' });
    amountAtomic = q.amountAtomic;
  } else if (['urlsum', 'img-gen-basic', 'meme-maker', 'bg-remove'].includes(skuId)) {
    try {
      const est = await estimatePriceAtomic({ skuId, model, input: req.body });
      amountAtomic = est.atomic;
    } catch { /* keep static */ }
  }
  const paymentRequirements = await x402.createPaymentRequirements({
    amount: Number(amountAtomic),
    description: sku.description,
    resource: `${baseUrl}/x402/pay?sku=${skuId}&model=${encodeURIComponent(model)}${quoteId ? `&quoteId=${encodeURIComponent(quoteId)}` : ''}`,
  });

  console.log('📋 Payment requirements:', {
    network: paymentRequirements.network,
    amount: paymentRequirements.maxAmountRequired,
    payTo: paymentRequirements.payTo,
    scheme: paymentRequirements.scheme,
  });

  // Verify payment
  let verified = false;
  try {
    console.log('🔍 Starting verify with facilitator:', env.FACILITATOR_URL);
    const verifyStartTime = Date.now();
    verified = await x402.verifyPayment(paymentHeader, paymentRequirements);
    
    if (!verified) {
      console.error('❌ Payment verification failed');
      console.log('===== END REQUEST (VERIFY FAILED) =====\n');
      logEvent('verify_fail', {
        sku: skuId,
        duration: Date.now() - verifyStartTime,
      });
      
      return res
        .status(402)
        .set('Access-Control-Allow-Origin', '*')
        .set('Access-Control-Expose-Headers', 'X-PAYMENT-RESPONSE')
        .json({ error: 'Invalid payment' });
    }
    
    console.log('✅ Verify successful');
    console.log('⏱️  Verify duration:', Date.now() - verifyStartTime, 'ms');
    logEvent('verify_ok', {
      sku: skuId,
      duration: Date.now() - verifyStartTime,
    });
  } catch (error) {
    console.error('❌ Payment verification exception:', error);
    console.log('===== END REQUEST (VERIFY ERROR) =====\n');
    logEvent('error', {
      sku: skuId,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Verification failed',
    });
    
    return res
      .status(402)
      .set('Access-Control-Allow-Origin', '*')
      .set('Access-Control-Expose-Headers', 'X-PAYMENT-RESPONSE')
      .json({ error: 'Payment verification failed' });
  }

  // Settle payment
  let txSig: string;
  try {
    console.log('💰 Starting settle with facilitator');
    const settleStartTime = Date.now();
    txSig = await x402.settlePayment(paymentHeader, paymentRequirements);
    
    console.log('✅ Settle successful!');
    console.log('📝 Transaction signature:', txSig);
    console.log('🔗 Explorer: https://solscan.io/tx/' + txSig);
    console.log('⏱️  Settle duration:', Date.now() - settleStartTime, 'ms');
    logEvent('settle_ok', {
      sku: skuId,
      txSig,
      duration: Date.now() - settleStartTime,
    });
  } catch (error) {
    console.error('❌ Payment settlement exception:', error);
    console.log('===== END REQUEST (SETTLE ERROR) =====\n');
    logEvent('error', {
      sku: skuId,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Settlement failed',
    });
    
    return res
      .status(402)
      .set('Access-Control-Allow-Origin', '*')
      .set('Access-Control-Expose-Headers', 'X-PAYMENT-RESPONSE')
      .json({ error: 'Payment settlement failed' });
  }

  // Check idempotency cache
  console.log('🔍 Checking cache for transaction:', txSig);
  const cached = getCached(txSig);
  if (idempotencyKey && idemStore.has(idempotencyKey)) {
    const cachedResp = idemStore.get(idempotencyKey);
    console.log('✅ Returning idempotent cached result');
    return res
      .status(200)
      .set('Access-Control-Allow-Origin', '*')
      .set('Access-Control-Expose-Headers', 'X-PAYMENT-RESPONSE')
      .set('X-PAYMENT-RESPONSE', cachedResp.header)
      .json(cachedResp.body);
  }
  if (cached) {
    console.log('✅ Found cached result - returning immediately');
    console.log('===== END REQUEST (CACHED) =====\n');
    logEvent('fulfilled', {
      sku: skuId,
      txSig,
      duration: Date.now() - startTime,
    });
    
    const bodyJson = { success: true, txSig, ...cached };
    // Keep header minimal to avoid overflowing header size limits
    const headerJson = { success: true, txSig, signedUrl: (cached as any)?.signedUrl };
    const headerValue = Buffer.from(JSON.stringify(headerJson)).toString('base64');
    
    return res
      .status(200)
      .set('Access-Control-Allow-Origin', '*')
      .set('Access-Control-Expose-Headers', 'X-PAYMENT-RESPONSE')
      .set('X-PAYMENT-RESPONSE', headerValue)
      .json(bodyJson);
  }

  console.log('📦 No cache found - fulfilling order...');

  // Validate input
  try {
    console.log('🔍 Validating input...');
    const validatedInput = validateSkuInput(skuId, req.body, sku.inputSchema);
    console.log('✅ Input validated');
    
    // Fulfill order
    console.log('🎨 Fulfilling order...');
    const fulfillStartTime = Date.now();
    const resultJson = await fulfillSku(skuId, validatedInput, txSig, model);
    
    console.log('✅ Order fulfilled successfully');
    console.log('⏱️  Fulfill duration:', Date.now() - fulfillStartTime, 'ms');
    console.log('⏱️  Total request duration:', Date.now() - startTime, 'ms');
    console.log('===== END REQUEST (SUCCESS) =====\n');
    
    logEvent('fulfilled', {
      sku: skuId,
      txSig,
      duration: Date.now() - fulfillStartTime,
    });
    
    // Cache result
    setCached(txSig, resultJson);
    
    // Return result with header
    const bodyJson = { success: true, txSig, ...resultJson };
    // Keep header minimal to avoid large base64 in headers
    const headerJson = { success: true, txSig, signedUrl: (resultJson as any)?.signedUrl };
    const headerValue = Buffer.from(JSON.stringify(headerJson)).toString('base64');
    
    const responseObj = res
      .status(200)
      .set('Access-Control-Allow-Origin', '*')
      .set('Access-Control-Expose-Headers', 'X-PAYMENT-RESPONSE')
      .set('X-PAYMENT-RESPONSE', headerValue)
      .json(bodyJson);
    if (idempotencyKey) {
      idemStore.set(idempotencyKey, { header: headerValue, body: bodyJson });
    }
    return responseObj;
      
  } catch (error) {
    console.error('❌ Error during fulfillment:', error);
    console.log('===== END REQUEST (ERROR) =====\n');
    logEvent('error', {
      sku: skuId,
      txSig,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: error.message,
        details: error.errors,
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
