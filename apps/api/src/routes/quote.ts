import { Router } from 'express';
import crypto from 'node:crypto';
import { estimatePriceAtomic } from '../ai/openrouter';

type QuoteRecord = {
  id: string;
  sku: string;
  model: string;
  amountAtomic: string;
  usd: number;
  breakdown: any;
  params?: Record<string, any>;
  inputHash: string;
  createdAt: number;
  expiresAt: number;
};

const QUOTE_TTL_MS = 5 * 60 * 1000;
const quotes = new Map<string, QuoteRecord>();

function hashInput(input: any): string {
  try {
    const str = typeof input === 'string' ? input : JSON.stringify(input);
    return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
  } catch {
    return crypto.randomBytes(8).toString('hex');
  }
}

const router: ReturnType<typeof Router> = Router();

router.post('/', async (req, res) => {
  try {
    const { sku, model, input, params } = req.body || {};
    if (!sku || !model) return res.status(400).json({ error: 'sku and model are required' });
    const est = await estimatePriceAtomic({ skuId: sku, model, input, params });
    const id = 'q_' + crypto.randomBytes(6).toString('hex');
    const now = Date.now();
    const rec: QuoteRecord = {
      id,
      sku,
      model,
      amountAtomic: est.atomic,
      usd: est.usd,
      breakdown: est.breakdown,
      params,
      inputHash: hashInput(input),
      createdAt: now,
      expiresAt: now + QUOTE_TTL_MS,
    };
    quotes.set(id, rec);
    res.json({ quoteId: id, sku, model, amountAtomic: rec.amountAtomic, usd: rec.usd, breakdown: rec.breakdown, expiresAt: rec.expiresAt });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to create quote' });
  }
});

router.get('/:id', (req, res) => {
  const id = String(req.params.id || '');
  const rec = quotes.get(id);
  if (!rec) return res.status(404).json({ error: 'Quote not found' });
  if (Date.now() > rec.expiresAt) return res.status(410).json({ error: 'Quote expired' });
  res.json({ quoteId: rec.id, sku: rec.sku, model: rec.model, amountAtomic: rec.amountAtomic, usd: rec.usd, breakdown: rec.breakdown, expiresAt: rec.expiresAt });
});

export { quotes };
export default router as ReturnType<typeof Router>;


