import { describe, it, expect } from '@jest/globals';
import {
  imgGenBasicInput,
  memeMakerInput,
  bgRemoveInput,
  upscale2xInput,
  faviconInput,
  urlsumInput,
  pdf2txtInput,
} from '../packages/shared/src/catalog';

describe('Input schema validation', () => {
  it('img-gen-basic: requires prompt', () => {
    expect(imgGenBasicInput.safeParse({ prompt: 'hello' }).success).toBe(true);
    expect(imgGenBasicInput.safeParse({ prompt: '' }).success).toBe(false);
  });

  it('meme-maker: requires prompt', () => {
    expect(memeMakerInput.safeParse({ prompt: 'frog' }).success).toBe(true);
    expect(memeMakerInput.safeParse({}).success).toBe(false);
  });

  it('bg-remove: needs imageUrl or imageBase64', () => {
    expect(bgRemoveInput.safeParse({ imageUrl: 'https://example.com/a.png' }).success).toBe(true);
    expect(bgRemoveInput.safeParse({ imageBase64: 'data:image/png;base64,abc' }).success).toBe(true);
    expect(bgRemoveInput.safeParse({}).success).toBe(false);
  });

  it('upscale-2x: needs imageUrl or imageBase64', () => {
    expect(upscale2xInput.safeParse({ imageUrl: 'https://example.com/a.png' }).success).toBe(true);
    expect(upscale2xInput.safeParse({}).success).toBe(false);
  });

  it('favicon: needs imageUrl or imageBase64', () => {
    expect(faviconInput.safeParse({ imageBase64: 'data:image/png;base64,abc' }).success).toBe(true);
    expect(faviconInput.safeParse({}).success).toBe(false);
  });

  it('urlsum: normalizes missing scheme and validates URL', () => {
    const parsed = urlsumInput.parse({ url: 'example.com' });
    expect(parsed.url).toBe('https://example.com');
    expect(urlsumInput.safeParse({ url: 'notaurl' }).success).toBe(false);
  });

  it('pdf2txt: needs pdfUrl or pdfBase64', () => {
    expect(pdf2txtInput.safeParse({ pdfUrl: 'https://example.com/a.pdf' }).success).toBe(true);
    expect(pdf2txtInput.safeParse({}).success).toBe(false);
  });
});


