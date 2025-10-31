import axios from 'axios';
import { getEnv, put, validatePrompt } from '@vellum/shared';
import { logAi } from '../logger';

const GEMINI_IMAGE_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

export async function fulfillMemeMaker(
  input: { prompt: string },
  txSig: string
): Promise<{ imageBase64?: string; signedUrl: string }> {
  const env = getEnv();

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

  // Request image from Gemini
  let data: any;
  const aiStart = Date.now();
  logAi('request', { provider: 'gemini', model: 'gemini-2.5-flash-image', endpoint: GEMINI_IMAGE_ENDPOINT, promptLen: prompt.length });
  try {
    ({ data } = await axios.post(
      GEMINI_IMAGE_ENDPOINT,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ['Image'],
          imageConfig: { aspectRatio: '1:1' },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        timeout: 30000,
      }
    ));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logAi('error', {
        provider: 'gemini',
        model: 'gemini-2.5-flash-image',
        endpoint: GEMINI_IMAGE_ENDPOINT,
        durationMs: Date.now() - aiStart,
        status: error.response?.status,
        message: (error.response?.data as any)?.error?.message || error.message,
      });
      const status = error.response?.status;
      const apiError = (error.response?.data as any)?.error;
      const apiMessage = apiError?.message ?? error.message;
      const statusLabel = status ? ` (${status})` : '';
      const statusCode = apiError?.status ? ` [${apiError.status}]` : '';
      throw new Error(`Gemini meme request failed${statusLabel}${statusCode}: ${apiMessage}`);
    }
    throw error;
  }
  logAi('response', { provider: 'gemini', model: 'gemini-2.5-flash-image', endpoint: GEMINI_IMAGE_ENDPOINT, durationMs: Date.now() - aiStart, candidates: Array.isArray(data?.candidates) ? data.candidates.length : undefined, status: 200 });

  const topCandidate = data?.candidates?.[0];
  const parts = topCandidate?.content?.parts ?? [];
  const imagePart = parts.find((part: any) => {
    const inlineData = part.inlineData ?? part.inline_data;
    return inlineData?.data;
  });
  const inlineData = imagePart?.inlineData ?? imagePart?.inline_data;
  const imageBase64: string | undefined = inlineData?.data;
  const mimeType = inlineData?.mimeType ?? inlineData?.mime_type ?? 'image/png';

  if (!imageBase64) {
    throw new Error('Gemini did not return a meme image');
  }

  const buffer = Buffer.from(imageBase64, 'base64');
  const ext = mimeType.split('/')[1]?.split(';')[0] ?? 'png';

  const { signedUrl } = await put(buffer, mimeType, ext, `memes/${txSig}`);

  const result: { imageBase64?: string; signedUrl: string } = { signedUrl };
  if (buffer.length < 1024 * 1024) result.imageBase64 = imageBase64;
  return result;
}

