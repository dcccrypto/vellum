import axios from 'axios';
import { getEnv, toAtomicUsdc } from '@vellum/shared';

type ModelKind = 'text' | 'image' | 'image-edit';

interface OpenRouterModelInfo {
  id: string;
  name?: string;
  pricing?: {
    prompt?: number;      // USD per 1M input tokens
    completion?: number;  // USD per 1M output tokens
    image?: number;       // USD per image (if provided by provider)
  };
  context_length?: number;
  tags?: string[];
}

export interface ListedModel {
  id: string;
  label: string;
  pricing: {
    prompt?: number;
    completion?: number;
    image?: number;
  };
  contextLength?: number;
}

function getHeaders() {
  const env = getEnv();
  return {
    'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': env.OPENROUTER_SITE_URL,
    'X-Title': env.OPENROUTER_SITE_NAME,
    'Content-Type': 'application/json',
  };
}

function isImageModelHeuristic(id: string, tags?: string[]) {
  const s = id.toLowerCase();
  if (tags?.some(t => /image|vision|multimodal|diffusion|sd|flux|playground|stability/i.test(t))) return true;
  return /(image|vision|sd|stability|flux|playground)/.test(s);
}

function isTextModelHeuristic(id: string, tags?: string[]) {
  const s = id.toLowerCase();
  if (tags?.some(t => /text|chat|instruct|general/i.test(t))) return true;
  return /(gpt|llama|mistral|mixtral|claude|sonnet|qwen|command|instruct|chat)/.test(s);
}

function isImageEditCapable(id: string, tags?: string[]) {
  const s = id.toLowerCase();
  if (tags?.some(t => /edit|inpaint|image-edit/i.test(t))) return true;
  return /(edit|inpaint|inpainting|erase|background)/.test(s) || isImageModelHeuristic(id, tags);
}

let cachedModels: { items: OpenRouterModelInfo[]; fetchedAt: number } | null = null;
const MODELS_TTL_MS = 15 * 60 * 1000;

async function fetchModelsFresh(): Promise<OpenRouterModelInfo[]> {
  const { data } = await axios.get('https://openrouter.ai/api/v1/models', {
    headers: getHeaders(),
    timeout: 15000,
  });
  return data?.data || data?.models || [];
}

export async function getModelsCached(): Promise<{ items: OpenRouterModelInfo[]; cacheAgeMs: number }> {
  const now = Date.now();
  if (!cachedModels || now - cachedModels.fetchedAt > MODELS_TTL_MS) {
    const items = await fetchModelsFresh();
    cachedModels = { items, fetchedAt: now };
  }
  return { items: cachedModels.items, cacheAgeMs: now - cachedModels.fetchedAt };
}

export async function listModels(kind: ModelKind): Promise<ListedModel[]> {
  const { items } = await getModelsCached();
  const models: OpenRouterModelInfo[] = items;
  const filtered = models.filter((m) => {
    switch (kind) {
      case 'text':
        return isTextModelHeuristic(m.id, m.tags);
      case 'image':
        return isImageModelHeuristic(m.id, m.tags);
      case 'image-edit':
        return isImageEditCapable(m.id, m.tags);
    }
  });
  return filtered.map((m) => ({
    id: m.id,
    label: m.name || m.id,
    pricing: {
      prompt: m.pricing?.prompt,
      completion: m.pricing?.completion,
      image: m.pricing?.image,
    },
    contextLength: m.context_length,
  }));
}

function clampUsdForSku(skuId: string, usd: number): { usd: number; floor: number; cap: number; markupPct: number } {
  const env = getEnv();
  const markupPct = parseFloat(env.PRICE_MARKUP_PCT || '10');
  const withMarkup = usd * (1 + markupPct / 100);
  const floors: Record<string, number> = {
    'urlsum': parseFloat(env.PRICE_FLOOR_USD_URLSUM || '0.01'),
    'img-gen-basic': parseFloat(env.PRICE_FLOOR_USD_IMGGEN || '0.01'),
    'meme-maker': parseFloat(env.PRICE_FLOOR_USD_MEME || '0.01'),
    'bg-remove': parseFloat(env.PRICE_FLOOR_USD_BGREMOVE || '0.01'),
  };
  const caps: Record<string, number> = {
    'urlsum': parseFloat(env.PRICE_CAP_USD_URLSUM || '0.50'),
    'img-gen-basic': parseFloat(env.PRICE_CAP_USD_IMGGEN || '0.50'),
    'meme-maker': parseFloat(env.PRICE_CAP_USD_MEME || '0.50'),
    'bg-remove': parseFloat(env.PRICE_CAP_USD_BGREMOVE || '0.50'),
  };
  const floor = floors[skuId] ?? 0.01;
  const cap = caps[skuId] ?? 0.50;
  const clamped = Math.min(cap, Math.max(floor, withMarkup));
  return { usd: clamped, floor, cap, markupPct };
}

function modelFamily(modelId: string): 'openai' | 'claude' | 'llama' | 'mistral' | 'qwen' | 'other' {
  const s = modelId.toLowerCase();
  if (s.includes('gpt') || s.includes('o3') || s.includes('openai')) return 'openai';
  if (s.includes('claude') || s.includes('anthropic') || s.includes('sonnet') || s.includes('haiku')) return 'claude';
  if (s.includes('llama')) return 'llama';
  if (s.includes('mistral') || s.includes('mixtral')) return 'mistral';
  if (s.includes('qwen')) return 'qwen';
  return 'other';
}

function estimateTokensFromInput(input: any, modelId?: string, params?: { max_tokens?: number }): { inTokens: number; outTokens: number } {
  const stringify = (v: any): string => {
    if (typeof v === 'string') return v;
    if (v == null) return '';
    try { return JSON.stringify(v); } catch { return String(v); }
  };
  const text = stringify(input);
  const family = modelId ? modelFamily(modelId) : 'other';
  const charsPerToken = family === 'openai' ? 4 : family === 'claude' ? 5 : family === 'llama' ? 3.5 : 4;
  const inTokens = Math.ceil(text.length / charsPerToken);
  const estimatedOut = Math.ceil(inTokens * 0.4);
  const cap = Math.max(64, Math.min(4096, params?.max_tokens ?? 800));
  const outTokens = Math.max(128, Math.min(cap, estimatedOut));
  return { inTokens, outTokens };
}

export async function estimatePriceAtomic(opts: {
  skuId: string;
  model: string;
  input: any;
  params?: { max_tokens?: number };
}): Promise<{ atomic: string; usd: number; breakdown: any }> {
  // Fetch model pricing to inform estimate
  const { items } = await getModelsCached();
  const models: OpenRouterModelInfo[] = items || [];
  const m = models.find(mm => mm.id === opts.model);

  let usdBase = 0.03; // fallback

  if (opts.skuId === 'urlsum') {
    // Text summarization
    const { inTokens, outTokens } = estimateTokensFromInput(opts.input, opts.model, opts.params);
    const inRate = (m?.pricing?.prompt ?? 0.50) / 1_000_000;      // $ / token
    const outRate = (m?.pricing?.completion ?? 1.50) / 1_000_000; // $ / token
    usdBase = inTokens * inRate + outTokens * outRate;
    const clamped = clampUsdForSku(opts.skuId, usdBase);
    return { atomic: toAtomicUsdc(clamped.usd), usd: clamped.usd, breakdown: { inTokens, outTokens, inRate: m?.pricing?.prompt, outRate: m?.pricing?.completion, floor: clamped.floor, cap: clamped.cap, markupPct: clamped.markupPct } };
  }

  if (opts.skuId === 'img-gen-basic' || opts.skuId === 'meme-maker') {
    const perImage = m?.pricing?.image ?? 0.03;
    const clamped = clampUsdForSku(opts.skuId, perImage);
    return { atomic: toAtomicUsdc(clamped.usd), usd: clamped.usd, breakdown: { perImage: m?.pricing?.image, floor: clamped.floor, cap: clamped.cap, markupPct: clamped.markupPct } };
  }

  if (opts.skuId === 'bg-remove') {
    const perEdit = m?.pricing?.image ?? 0.04;
    const clamped = clampUsdForSku(opts.skuId, perEdit);
    return { atomic: toAtomicUsdc(clamped.usd), usd: clamped.usd, breakdown: { perImage: m?.pricing?.image, floor: clamped.floor, cap: clamped.cap, markupPct: clamped.markupPct } };
  }

  // Non-AI SKUs keep existing static pricing (will be ignored here)
  const clamped = clampUsdForSku(opts.skuId, usdBase);
  return { atomic: toAtomicUsdc(clamped.usd), usd: clamped.usd, breakdown: { floor: clamped.floor, cap: clamped.cap, markupPct: clamped.markupPct } };
}

export async function chatComplete(model: string, messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>, options?: {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}) {
  const { data } = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.max_tokens ?? 512,
    top_p: options?.top_p,
  }, {
    headers: getHeaders(),
    timeout: 30000,
  });
  const text = data?.choices?.[0]?.message?.content ?? '';
  return { text, raw: data };
}

/**
 * Generate an image (or edit if imageBase64 provided). Returns base64 PNG and mime type.
 */
export async function generateImage(model: string, prompt: string, imageBase64?: string): Promise<{ base64: string; mimeType: string }> {
  // Prefer OpenAI-compatible Images APIs
  if (!imageBase64) {
    // Generation
    const { data } = await axios.post('https://openrouter.ai/api/v1/images', {
      model,
      prompt,
      size: '768x768',
      response_format: 'b64_json',
    }, { headers: getHeaders(), timeout: 60000 });
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenRouter did not return image data');
    return { base64: b64, mimeType: 'image/png' };
  } else {
    // Edit (background removal or similar)
    // Use multipart like OpenAI images/edits
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('size', '768x768');
    const imgBuffer = Buffer.from(imageBase64, 'base64');
    form.append('image', imgBuffer, { filename: 'image.png', contentType: 'image/png' });

    const headers = { ...getHeaders(), ...form.getHeaders() };
    const { data } = await axios.post('https://openrouter.ai/api/v1/images/edits', form, {
      headers,
      timeout: 90000,
      maxBodyLength: 25 * 1024 * 1024,
    });
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenRouter did not return edited image data');
    return { base64: b64, mimeType: 'image/png' };
  }
}


