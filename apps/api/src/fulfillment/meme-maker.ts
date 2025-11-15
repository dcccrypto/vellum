import axios from 'axios';
import { getEnv, put, validatePrompt } from '@vellum/shared';
import { logAi } from '../logger';
import { generateImage } from '../ai/openrouter';

export async function fulfillMemeMaker(
  input: { prompt: string },
  txSig: string,
  model = 'openrouter/auto'
): Promise<{ imageBase64?: string; signedUrl: string }> {
  getEnv(); // ensure env loaded

  // Build an enhanced prompt for Gemini from user's idea
  validatePrompt(input.prompt);
  const prompt = [
    'Create a 768x768 PNG meme image. Requirements:',
    '- Use bold Impact-style captions (white with black stroke).',
    '- Center text, high contrast, readable, no watermark.',
    '- Compose the visual scene to match the idea below.',
    '',
    'IDEA:',
    input.prompt,
  ].join('\n');

  // Request image via OpenRouter
  const aiStart = Date.now();
  const endpoint = 'https://openrouter.ai/api/v1/images';
  logAi('request', { provider: 'openrouter', model, endpoint, promptLen: prompt.length });
  const { base64, mimeType } = await generateImage(model, prompt);
  logAi('response', { provider: 'openrouter', model, endpoint, durationMs: Date.now() - aiStart, status: 200 });

  const buffer = Buffer.from(base64, 'base64');
  const ext = mimeType.split('/')[1]?.split(';')[0] ?? 'png';

  const { signedUrl } = await put(buffer, mimeType, ext, `memes/${txSig}`);

  const result: { imageBase64?: string; signedUrl: string } = { signedUrl };
  if (buffer.length < 1024 * 1024) result.imageBase64 = base64;
  return result;
}

