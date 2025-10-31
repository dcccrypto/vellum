import sharp from 'sharp';
import axios from 'axios';
import { getEnv, put } from '@vellum/shared';
import { logAi } from '../logger';

/**
 * Simple background removal using edge detection and alpha compositing
 * Note: For production, consider using a dedicated service (remove.bg, etc.)
 */
export async function fulfillBgRemove(
  input: { imageUrl?: string; imageBase64?: string },
  txSig: string
): Promise<{ imageBase64?: string; signedUrl: string }> {
  const env = getEnv();

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

  // Normalize to PNG for Gemini input
  const pngBuffer = await sharp(inputBuffer).png().toBuffer();
  const inlineBase64 = pngBuffer.toString('base64');

  // Call Gemini to remove background
  const GEMINI_IMAGE_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

  let data: any;
  try {
    const aiStart = Date.now();
    logAi('request', { provider: 'gemini', model: 'gemini-2.5-flash-image', endpoint: GEMINI_IMAGE_ENDPOINT, inputBytes: pngBuffer.length });
    ({ data } = await axios.post(
      GEMINI_IMAGE_ENDPOINT,
      {
        contents: [
          {
            role: 'user',
            parts: [
              { text: [
                'Remove the background from this image. Requirements:',
                '- Return a PNG with transparent background (alpha channel).',
                '- Preserve fine details (hair, fur, semi-transparent regions).',
                '- Keep original subject colors and edges; do not blur.',
                '- Do not add outlines, drop shadows, borders, or watermarks.',
                '- Center subject on transparent canvas; no background fill.',
              ].join('\n') },
              { inlineData: { data: inlineBase64, mimeType: 'image/png' } },
            ],
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
    logAi('response', { provider: 'gemini', model: 'gemini-2.5-flash-image', endpoint: GEMINI_IMAGE_ENDPOINT, durationMs: Date.now() - aiStart, status: 200 });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logAi('error', { provider: 'gemini', model: 'gemini-2.5-flash-image', endpoint: GEMINI_IMAGE_ENDPOINT, status: error.response?.status, message: (error.response?.data as any)?.error?.message || error.message });
      const status = error.response?.status;
      const apiError = (error.response?.data as any)?.error;
      const apiMessage = apiError?.message ?? error.message;
      const statusLabel = status ? ` (${status})` : '';
      const statusCode = apiError?.status ? ` [${apiError.status}]` : '';
      throw new Error(`Gemini bg-remove failed${statusLabel}${statusCode}: ${apiMessage}`);
    }
    throw error;
  }

  const topCandidate = data?.candidates?.[0];
  const parts = topCandidate?.content?.parts ?? [];
  const imagePart = parts.find((part: any) => {
    const inlineData = part.inlineData ?? part.inline_data;
    return inlineData?.data;
  });
  const inlineData = imagePart?.inlineData ?? imagePart?.inline_data;
  const outBase64: string | undefined = inlineData?.data;
  const mimeType = inlineData?.mimeType ?? inlineData?.mime_type ?? 'image/png';

  if (!outBase64) throw new Error('Gemini did not return an image');

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
      logAi('request', { provider: 'gemini', model: 'gemini-2.5-flash-image', endpoint: GEMINI_IMAGE_ENDPOINT, inputBytes: pngBuffer.length });
      const { data: retryData } = await axios.post(
        GEMINI_IMAGE_ENDPOINT,
        {
          contents: [
            { role: 'user', parts: [ { text: strictPrompt }, { inlineData: { data: inlineBase64, mimeType: 'image/png' } } ] },
          ],
          generationConfig: { responseModalities: ['Image'], imageConfig: { aspectRatio: '1:1' } },
        },
        { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, timeout: 30000 }
      );
      logAi('response', { provider: 'gemini', model: 'gemini-2.5-flash-image', endpoint: GEMINI_IMAGE_ENDPOINT, durationMs: Date.now() - strictStart, status: 200 });
      const rParts = retryData?.candidates?.[0]?.content?.parts ?? [];
      const rImagePart = rParts.find((p: any) => (p.inlineData ?? p.inline_data)?.data);
      const rInline = rImagePart?.inlineData ?? rImagePart?.inline_data;
      if (rInline?.data) outBuffer = Buffer.from(rInline.data, 'base64');
    }
  } catch {}
  const ext = mimeType.split('/')[1]?.split(';')[0] ?? 'png';
  const { signedUrl } = await put(outBuffer, mimeType, ext, `bg-removed/${txSig}`);

  const result: any = { signedUrl };
  if (outBuffer.length < 1024 * 1024) result.imageBase64 = outBase64;
  return result;
}

