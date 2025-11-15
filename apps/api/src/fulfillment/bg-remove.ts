import sharp from 'sharp';
import axios from 'axios';
import { getEnv, put } from '@vellum/shared';
import { logAi } from '../logger';
import { generateImage } from '../ai/openrouter';

/**
 * Simple background removal using edge detection and alpha compositing
 * Note: For production, consider using a dedicated service (remove.bg, etc.)
 */
export async function fulfillBgRemove(
  input: { imageUrl?: string; imageBase64?: string },
  txSig: string,
  model = 'openrouter/auto'
): Promise<{ imageBase64?: string; signedUrl: string }> {
  getEnv(); // ensure env loaded

  // Load input image (url or base64)
  let inputBuffer: Buffer;
  if (input.imageBase64) {
    inputBuffer = Buffer.from(input.imageBase64, 'base64');
  } else if (input.imageUrl) {
    const response = await axios.get(input.imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxContentLength: 10 * 1024 * 1024,
      headers: { Accept: 'image/*' },
    });
    inputBuffer = Buffer.from(response.data);
  } else {
    throw new Error('Provide imageUrl or imahhbbhgeBase64');
  }

  // Normalize to PNG for edit input
  const pngBuffer = await sharp(inputBuffer).png().toBuffer();
  const inlineBase64 = pngBuffer.toString('base64');

  // Call OpenRouter to remove background via image edit
  const endpoint = 'https://openrouter.ai/api/v1/images/edits';
  const prompt = [
    'Remove the background from this image.',
    'Requirements:',
    '- Output PNG with transparent background (alpha channel).',
    '- Preserve fine details (hair, fur, semi-transparent regions).',
    '- Keep original subject colors and edges; do not blur.',
    '- Do not add outlines, drop shadows, borders, or watermarks.',
    '- Center subject on transparent canvas; no background fill.',
  ].join('\n');
  const aiStart = Date.now();
  logAi('request', { provider: 'openrouter', model, endpoint, inputBytes: pngBuffer.length });
  const { base64: outBase64, mimeType } = await generateImage(model, prompt, inlineBase64);
  logAi('response', { provider: 'openrouter', model, endpoint, durationMs: Date.now() - aiStart, status: 200 });
  if (!outBase64) throw new Error('Background removal did not return an image');

  let outBuffer = Buffer.from(outBase64, 'base64');
  // Validate transparency; if not transparent, retry once with stricter instruction
  try {
    const stats = await sharp(outBuffer).stats();
    const hasAlphaChannel = stats.channels.length === 4;
    const alpha = hasAlphaChannel ? stats.channels[3] : null;
    const fullyOpaque = !alpha || (alpha.min === 255 && alpha.max === 255);
    if (fullyOpaque) {
      const strictPrompt = [
        'Remove the background COMPLETELY. Requirements:',
        '- Output PNG RGBA. Background outside subject MUST have alpha=0.',
        '- Do not alter subject pixels. No borders/shadows/watermarks.',
      ].join('\n');
      const strictStart = Date.now();
      logAi('request', { provider: 'openrouter', model, endpoint, inputBytes: pngBuffer.length });
      const retry = await generateImage(model, strictPrompt, inlineBase64);
      logAi('response', { provider: 'openrouter', model, endpoint, durationMs: Date.now() - strictStart, status: 200 });
      if (retry?.base64) outBuffer = Buffer.from(retry.base64, 'base64');
    }
  } catch {}
  const ext = mimeType.split('/')[1]?.split(';')[0] ?? 'png';
  const { signedUrl } = await put(outBuffer, mimeType, ext, `bg-removed/${txSig}`);

  const result: any = { signedUrl };
  if (outBuffer.length < 1024 * 1024) result.imageBase64 = outBase64;
  return result;
}

