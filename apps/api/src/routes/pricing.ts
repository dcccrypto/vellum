import { Router } from 'express';
import { estimatePriceAtomic } from '../ai/openrouter';

const router: ReturnType<typeof Router> = Router();

router.post('/estimate', async (req, res) => {
  try {
    const { sku, model, input, params } = req.body || {};
    if (!sku || !model) {
      return res.status(400).json({ error: 'sku and model are required' });
    }
    const result = await estimatePriceAtomic({ skuId: sku, model, input, params });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to estimate pricing' });
  }
});

export default router as ReturnType<typeof Router>;


