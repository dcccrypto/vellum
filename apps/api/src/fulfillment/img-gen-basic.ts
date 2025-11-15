import axios from "axios";
import { getEnv, put } from "@vellum/shared";
import { logAi } from "../logger";
import { generateImage } from "../ai/openrouter";

export async function fulfillImgGenBasic(
  input: { prompt: string },
  txSig: string,
  model = 'openrouter/auto'
): Promise<{ imageBase64?: string; signedUrl: string }> {
  getEnv(); // ensure env loaded

  const endpoint = 'https://openrouter.ai/api/v1/images';
  const aiStart = Date.now();
  logAi('request', {
    provider: 'openrouter',
    model,
    endpoint,
    promptLen: input.prompt.length,
  });
  const { base64, mimeType } = await generateImage(model, input.prompt);
  logAi('response', {
    provider: 'openrouter',
    model,
    endpoint,
    durationMs: Date.now() - aiStart,
    status: 200,
  });

  const buffer = Buffer.from(base64, 'base64');
  const extension = mimeType.split('/')[1]?.split(';')[0] ?? 'png';
  const { signedUrl } = await put(buffer, mimeType, extension, `images/${txSig}`);
  const result: { imageBase64?: string; signedUrl: string } = { signedUrl };
  if (buffer.length < 1024 * 1024) result.imageBase64 = base64;
  return result;
}
