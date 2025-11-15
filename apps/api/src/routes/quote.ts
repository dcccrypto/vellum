import { Router } from 'express';
import crypto from 'node:crypto';
import { estimatePriceAtomic } from '../ai/openrouter';
import { getEnv } from '@vellum/shared';

type QuotePayload = {
  sku: string;
  model: string;
  amountAtomic: string;
  usd: number;
  breakdown: any;
  params?: Record<string, any>;
  createdAt: number;
  expiresAt: number;
};

const QUOTE_TTL_MS = 5 * 60 * 1000;

function signQuote(payload: QuotePayload, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyQuoteToken(token: string, secret: string): QuotePayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as QuotePayload;
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

const router: ReturnType<typeof Router> = Router();

router.post('/', async (req, res) => {
  try {
    const { sku, model, input, params } = req.body || {};
    if (!sku || !model) return res.status(400).json({ error: 'sku and model are required' });
    const env = getEnv();
    const est = await estimatePriceAtomic({ skuId: sku, model, input, params });
    const now = Date.now();
    const payload: QuotePayload = {
      sku,
      model,
      amountAtomic: est.atomic,
      usd: est.usd,
      breakdown: est.breakdown,
      params,
      createdAt: now,
      expiresAt: now + QUOTE_TTL_MS,
    };
    const token = signQuote(payload, env.QUOTE_SECRET);
    res.json({ quoteId: token, sku, model, amountAtomic: payload.amountAtomic, usd: payload.usd, breakdown: payload.breakdown, expiresAt: payload.expiresAt });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to create quote' });
  }
});

router.get('/:id', (req, res) => {
  const env = getEnv();
  const id = String(req.params.id || '');
  const payload = verifyQuoteToken(id, env.QUOTE_SECRET);
  if (!payload) return res.status(404).json({ error: 'Quote not found or expired' });
  res.json({ quoteId: id, sku: payload.sku, model: payload.model, amountAtomic: payload.amountAtomic, usd: payload.usd, breakdown: payload.breakdown, expiresAt: payload.expiresAt });
});

export default router as ReturnType<typeof Router>;


