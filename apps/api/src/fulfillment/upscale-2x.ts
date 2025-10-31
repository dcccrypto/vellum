import sharp from 'sharp';
import axios from 'axios';
import { put } from '@vellum/shared';

const MAX_DIMENSION = 2048;

export async function fulfillUpscale2x(
  input: { imageUrl?: string; imageBase64?: string },
  txSig: string
): Promise<{ imageBase64?: string; signedUrl: string; scale: number }> {
  // Load image (url or base64)
  let inputBuffer: Buffer;
  if (input.imageBase64) {
    inputBuffer = Buffer.from(input.imageBase64, 'base64');
  } else if (input.imageUrl) {
    const response = await axios.get(input.imageUrl, {
      responseType: 'arraybuffer',
      timeout: 8000,
      maxContentLength: 5 * 1024 * 1024,
      headers: {
        'Accept': 'image/*',
      },
    });
    inputBuffer = Buffer.from(response.data);
  } else {
    throw new Error('Provide imageUrl or imageBase64');
  }
  
  // Get metadata
  const metadata = await sharp(inputBuffer).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;
  
  // Calculate new dimensions (2x, but cap at MAX_DIMENSION)
  let newWidth = originalWidth * 2;
  let newHeight = originalHeight * 2;
  
  const maxDim = Math.max(newWidth, newHeight);
  if (maxDim > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / maxDim;
    newWidth = Math.floor(newWidth * scale);
    newHeight = Math.floor(newHeight * scale);
  }
  
  // Upscale with high-quality interpolation
  const upscaled = await sharp(inputBuffer)
    .resize(newWidth, newHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: 'fill',
    })
    .sharpen()
    .png({ quality: 95 })
    .toBuffer();
  
  // Upload to Supabase
  const { signedUrl } = await put(upscaled, 'image/png', 'png', `upscaled/${txSig}`);
  
  // Return base64 if small enough
  const result: any = {
    signedUrl,
    scale: 2,
  };
  
  if (upscaled.length < 1024 * 1024) {
    result.imageBase64 = upscaled.toString('base64');
  }
  
  return result;
}

