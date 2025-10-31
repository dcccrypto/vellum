import { getEnv } from './env';
import { z } from 'zod';

export interface SkuDefinition {
  id: string;
  name: string;
  description: string;
  priceAtomic: string;
  inputSchema: z.ZodType<any>;
  outputSchema: Record<string, string>;
}

// Input schemas
export const imgGenBasicInput = z.object({
  prompt: z.string().min(1),
});

export const memeMakerInput = z.object({
  prompt: z.string().min(1),
});

export const bgRemoveInput = z
  .object({
    imageUrl: z.string().url().optional(),
    imageBase64: z.string().optional(),
  })
  .refine((v) => !!(v.imageUrl || v.imageBase64), {
    message: 'Provide imageUrl or imageBase64',
    path: ['imageUrl'],
  });

export const upscale2xInput = z
  .object({
    imageUrl: z.string().url().optional(),
    imageBase64: z.string().optional(),
  })
  .refine((v) => !!(v.imageUrl || v.imageBase64), {
    message: 'Provide imageUrl or imageBase64',
    path: ['imageUrl'],
  });

export const faviconInput = z.object({
  imageUrl: z.string().url().optional(),
  imageBase64: z.string().optional(),
}).refine((v) => !!(v.imageUrl || v.imageBase64), {
  message: 'Provide imageUrl or imageBase64',
  path: ['imageUrl'],
});

export const urlsumInput = z.object({
  url: z.string().min(1, 'URL is required').transform((val) => {
    // Normalize URL - add https:// if missing
    if (!val.startsWith('http://') && !val.startsWith('https://')) {
      return `https://${val}`;
    }
    return val;
  }).pipe(z.string().url('Invalid URL format. Example: https://example.com or example.com')),
});

export const pdf2txtInput = z
  .object({
    pdfUrl: z.string().url().optional(),
    pdfBase64: z.string().optional(),
  })
  .refine((v) => !!(v.pdfUrl || v.pdfBase64), {
    message: 'Provide pdfUrl or pdfBase64',
    path: ['pdfUrl'],
  });

/**
 * SKU catalog - single source of truth for all products
 */
export function getSkuCatalog(): Record<string, SkuDefinition> {
  const env = getEnv();
  
  return {
    'img-gen-basic': {
      id: 'img-gen-basic',
      name: 'Basic Image Generation',
      description: 'Generate 768×768 PNG image from text prompt',
      priceAtomic: env.PRICE_IMGGEN,
      inputSchema: imgGenBasicInput,
      outputSchema: {
        imageBase64: 'string',
        signedUrl: 'string',
      },
    },
    'meme-maker': {
      id: 'meme-maker',
      name: 'Meme Maker',
      description: 'Create a meme from a text prompt (AI-generated)',
      priceAtomic: env.PRICE_MEME,
      inputSchema: memeMakerInput,
      outputSchema: {
        imageBase64: 'string',
        signedUrl: 'string',
      },
    },
    'bg-remove': {
      id: 'bg-remove',
      name: 'Background Removal',
      description: 'Remove background from image (PNG with alpha)',
      priceAtomic: env.PRICE_BGREMOVE,
      inputSchema: bgRemoveInput,
      outputSchema: {
        imageBase64: 'string',
        signedUrl: 'string',
      },
    },
    'upscale-2x': {
      id: 'upscale-2x',
      name: '2× Image Upscale',
      description: 'Upscale image 2× with quality enhancement',
      priceAtomic: env.PRICE_UPSCALE2X,
      inputSchema: upscale2xInput,
      outputSchema: {
        imageBase64: 'string',
        signedUrl: 'string',
        scale: 'number',
      },
    },
    'favicon': {
      id: 'favicon',
      name: 'Favicon Generator',
      description: 'Generate multi-size favicons + ICO (16-512px)',
      priceAtomic: env.PRICE_FAVICON,
      inputSchema: faviconInput,
      outputSchema: {
        zipBase64: 'string',
        signedUrl: 'string',
        sizes: 'array',
      },
    },
    'urlsum': {
      id: 'urlsum',
      name: 'URL Summarizer',
      description: 'Extract and summarize webpage content with AI',
      priceAtomic: env.PRICE_URLSUM,
      inputSchema: urlsumInput,
      outputSchema: {
        summary: 'string',
        bullets: 'array',
        entities: 'array',
      },
    },
    'pdf2txt': {
      id: 'pdf2txt',
      name: 'PDF to Text',
      description: 'Extract text from PDF (≤10MB)',
      priceAtomic: env.PRICE_PDF2TXT,
      inputSchema: pdf2txtInput,
      outputSchema: {
        text: 'string',
        pageCount: 'number',
        signedUrl: 'string',
      },
    },
  };
}

export function getSkuById(skuId: string): SkuDefinition {
  const catalog = getSkuCatalog();
  const sku = catalog[skuId];
  
  if (!sku) {
    throw new Error(`Unknown SKU: ${skuId}`);
  }
  
  return sku;
}

export function getAllSkuIds(): string[] {
  return Object.keys(getSkuCatalog());
}

