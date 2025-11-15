import { Router } from 'express';
import crypto from 'node:crypto';

type ShareRecord = {
  id: string;
  sku: string;
  model: string;
  createdAt: number;
  expiresAt: number;
  payload: any;
};

const SHARE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const shares = new Map<string, ShareRecord>();

const router: ReturnType<typeof Router> = Router();

router.post('/', (req, res) => {
  try {
    const { sku, model, result } = req.body || {};
    if (!sku || !result) return res.status(400).json({ error: 'sku and result are required' });
    const id = 's_' + crypto.randomBytes(6).toString('hex');
    const now = Date.now();
    const rec: ShareRecord = {
      id,
      sku,
      model: model || 'unknown',
      createdAt: now,
      expiresAt: now + SHARE_TTL_MS,
      payload: result,
    };
    shares.set(id, rec);
    res.json({ id, url: `/r/${id}`, expiresAt: rec.expiresAt });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to create share' });
  }
});

router.get('/:id', (req, res) => {
  const id = String(req.params.id || '');
  const rec = shares.get(id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  if (Date.now() > rec.expiresAt) return res.status(410).json({ error: 'Expired' });
  res.json({ id: rec.id, sku: rec.sku, model: rec.model, createdAt: rec.createdAt, expiresAt: rec.expiresAt, result: rec.payload });
});

export default router as ReturnType<typeof Router>;


