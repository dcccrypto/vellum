import { Router } from 'express';
import { listModels, getModelsCached } from '../ai/openrouter';

const router: ReturnType<typeof Router> = Router();

function skuToKind(sku: string): 'text' | 'image' | 'image-edit' | null {
  switch (sku) {
    case 'urlsum':
      return 'text';
    case 'img-gen-basic':
    case 'meme-maker':
      return 'image';
    case 'bg-remove':
      return 'image-edit';
    default:
      return null;
  }
}

router.get('/', async (req, res) => {
  try {
    const sku = String(req.query.sku || '');
    const kind = skuToKind(sku);
    if (!sku || !kind) {
      return res.status(400).json({ error: 'Invalid or unsupported sku' });
    }
    const models = await listModels(kind);
    const { cacheAgeMs } = await getModelsCached();
    res.json({ models, cacheAgeMs });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to list models' });
  }
});

export default router as ReturnType<typeof Router>;


