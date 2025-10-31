import axios from "axios";
import { getEnv, put } from "@vellum/shared";
import { logAi } from "../logger";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

export async function fulfillImgGenBasic(
  input: { prompt: string },
  txSig: string
): Promise<{ imageBase64?: string; signedUrl: string }> {
  const env = getEnv();


  // Call Gemini (generateContent)
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: input.prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ["Image"],
      imageConfig: { aspectRatio: "1:1" },
    },
  };

  let data: any;
  const aiStart = Date.now();
  logAi('request', {
    provider: 'gemini',
    model: 'gemini-2.5-flash-image',
    endpoint: GEMINI_ENDPOINT,
    promptLen: input.prompt.length,
  });
  try {
    ({ data } = await axios.post(GEMINI_ENDPOINT, requestBody, {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      timeout: 30000,
    }));
    logAi('response', {
      provider: 'gemini',
      model: 'gemini-2.5-flash-image',
      endpoint: GEMINI_ENDPOINT,
      durationMs: Date.now() - aiStart,
      candidates: Array.isArray(data?.candidates) ? data.candidates.length : undefined,
      status: 200,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logAi('error', {
        provider: 'gemini',
        model: 'gemini-2.5-flash-image',
        endpoint: GEMINI_ENDPOINT,
        durationMs: Date.now() - aiStart,
        status: error.response?.status,
        message: (error.response?.data as any)?.error?.message || error.message,
      });
      const status = error.response?.status;
      const apiError = (error.response?.data as any)?.error;
      const apiMessage = apiError?.message ?? error.message;
      const statusLabel = status ? ` (${status})` : "";
      const statusCode = apiError?.status ? ` [${apiError.status}]` : "";
      throw new Error(`Gemini request failed${statusLabel}${statusCode}: ${apiMessage}`);
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
  const imageBase64: string | undefined = inlineData?.data;
  const mimeType = inlineData?.mimeType ?? inlineData?.mime_type ?? "image/png";

  if (!imageBase64) {
    const promptFeedback = data?.promptFeedback ?? data?.prompt_feedback;
    const blockReason = promptFeedback?.blockReason ?? promptFeedback?.block_reason;
    const finishReason = topCandidate?.finishReason ?? topCandidate?.finish_reason;
    const detail =
      blockReason ??
      finishReason ??
      (promptFeedback ? JSON.stringify(promptFeedback) : "unknown_reason");
    throw new Error(`Gemini did not return an image (reason: ${detail})`);
  }

  const buffer = Buffer.from(imageBase64, "base64");
  const extension = mimeType.split("/")[1]?.split(";")[0] ?? "png";

  // Upload to your storage (Supabase helper)
  const { signedUrl } = await put(buffer, mimeType, extension, `images/${txSig}`);

  const result: { imageBase64?: string; signedUrl: string } = { signedUrl };
  if (buffer.length < 1024 * 1024) result.imageBase64 = imageBase64; // keep your small-inlining optimization
  return result;
}
