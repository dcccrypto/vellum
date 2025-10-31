import axios from 'axios';
import pdfParse from 'pdf-parse';
import { put } from '@vellum/shared';

const MAX_INLINE_SIZE = 500 * 1024; // 500KB

export async function fulfillPdf2txt(
  input: { pdfUrl?: string; pdfBase64?: string },
  txSig: string
): Promise<{ text?: string; pageCount: number; signedUrl?: string }> {
  // Load PDF (url or base64)
  let pdfBuffer: Buffer;
  if (input.pdfBase64) {
    pdfBuffer = Buffer.from(input.pdfBase64, 'base64');
  } else if (input.pdfUrl) {
    const response = await axios.get(input.pdfUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxContentLength: 10 * 1024 * 1024,
      headers: {
        'Accept': 'application/pdf',
      },
    });
    pdfBuffer = Buffer.from(response.data);
  } else {
    throw new Error('Provide pdfUrl or pdfBase64');
  }
  
  // Parse PDF
  const data = await pdfParse(pdfBuffer);
  
  const text = data.text;
  const pageCount = data.numpages;
  
  // If text is large, store in Supabase
  if (text.length > MAX_INLINE_SIZE) {
    const textBuffer = Buffer.from(text, 'utf-8');
    const { signedUrl } = await put(textBuffer, 'text/plain', 'txt', `pdfs/${txSig}`);
    
    return {
      pageCount,
      signedUrl,
    };
  }
  
  // Return inline text if small enough
  return {
    text,
    pageCount,
  };
}

