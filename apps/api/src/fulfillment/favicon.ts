import sharp from 'sharp';
import axios from 'axios';
import JSZip from 'jszip';
import { put } from '@vellum/shared';

const SIZES = [16, 32, 48, 64, 128, 150, 180, 192, 512];

/**
 * Manually construct a valid multi-image ICO file.
 * ICO format spec: https://en.wikipedia.org/wiki/ICO_(file_format)
 */
function buildIco(pngBuffers: { size: number; buffer: Buffer }[]): Buffer {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16; // ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes each)
  let offset = headerSize;

  // Allocate buffer for header
  const header = Buffer.alloc(headerSize);
  
  // ICONDIR
  header.writeUInt16LE(0, 0); // Reserved, must be 0
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  // Write ICONDIRENTRY for each image
  pngBuffers.forEach((png, i) => {
    const entryOffset = 6 + i * 16;
    const size = png.size;
    const sizeValue = size >= 256 ? 0 : size; // 0 means 256

    header.writeUInt8(sizeValue, entryOffset + 0); // Width
    header.writeUInt8(sizeValue, entryOffset + 1); // Height
    header.writeUInt8(0, entryOffset + 2); // Color palette (0 = no palette)
    header.writeUInt8(0, entryOffset + 3); // Reserved
    header.writeUInt16LE(1, entryOffset + 4); // Color planes (1)
    header.writeUInt16LE(32, entryOffset + 6); // Bits per pixel (32 = RGBA)
    header.writeUInt32LE(png.buffer.length, entryOffset + 8); // Size of image data
    header.writeUInt32LE(offset, entryOffset + 12); // Offset to image data

    offset += png.buffer.length;
  });

  // Concatenate header + all PNG buffers
  return Buffer.concat([header, ...pngBuffers.map(p => p.buffer)]);
}

export async function fulfillFavicon(
  input: { imageUrl?: string; imageBase64?: string },
  txSig: string
): Promise<{ zipBase64?: string; signedUrl: string; sizes: number[]; files: string[] }> {
  // Load source image (url or base64)
  let sourceBuffer: Buffer;
  if (input.imageBase64) {
    sourceBuffer = Buffer.from(input.imageBase64, 'base64');
  } else if (input.imageUrl) {
    const response = await axios.get(input.imageUrl, {
      responseType: 'arraybuffer',
      timeout: 8000,
      maxContentLength: 5 * 1024 * 1024,
      headers: { 'Accept': 'image/*' },
    });
    sourceBuffer = Buffer.from(response.data);
  } else {
    throw new Error('Provide imageUrl or imageBase64');
  }
  
  // Generate all PNG sizes we need with transparency
  const pngMap: Record<number, Buffer> = {};
  for (const size of SIZES) {
    pngMap[size] = await sharp(sourceBuffer)
      .resize(size, size, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
      .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
      .toBuffer();
  }
  
  // Build a proper ICO with 16, 32, 48 sizes
  const icoSizes = [16, 32, 48];
  const icoBuffer = buildIco(icoSizes.map(size => ({ size, buffer: pngMap[size] })));
  
  // Create ZIP archive with standard filenames used by frameworks/generators
  const zip = new JSZip();

  // Common files
  zip.file('favicon.ico', icoBuffer);
  zip.file('favicon-16x16.png', pngMap[16]);
  zip.file('favicon-32x32.png', pngMap[32]);
  zip.file('apple-touch-icon.png', pngMap[180]);
  zip.file('android-chrome-192x192.png', pngMap[192]);
  zip.file('android-chrome-512x512.png', pngMap[512]);
  zip.file('mstile-150x150.png', pngMap[150]);

  // Optional extras
  zip.file('favicon-48x48.png', pngMap[48]);
  zip.file('favicon-64x64.png', pngMap[64]);
  zip.file('favicon-128x128.png', pngMap[128]);

  // site.webmanifest
  const manifest = {
    name: 'Vellum',
    short_name: 'Vellum',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    theme_color: '#000000',
    background_color: '#000000',
    display: 'standalone',
  };
  zip.file('site.webmanifest', Buffer.from(JSON.stringify(manifest, null, 2)));

  // browserconfig.xml (Windows tile)
  const browserconfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/mstile-150x150.png"/>
      <TileColor>#000000</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
  zip.file('browserconfig.xml', Buffer.from(browserconfig));

  // README
  const readme = `Favicon Pack\n\nFiles included:\n- favicon.ico\n- favicon-16x16.png\n- favicon-32x32.png\n- apple-touch-icon.png\n- android-chrome-192x192.png\n- android-chrome-512x512.png\n- mstile-150x150.png\n- site.webmanifest\n- browserconfig.xml\n\nPlace files in your public/ root and add this to <head>:\n<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/site.webmanifest">\n<meta name="msapplication-config" content="/browserconfig.xml">\n`;
  zip.file('README.txt', Buffer.from(readme));
  
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
  
  // Upload ZIP to Supabase
  const { signedUrl } = await put(zipBuffer, 'application/zip', 'zip', `favicons/${txSig}`);
  
  // Return base64 if small enough
  const files = [
    'favicon.ico',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'apple-touch-icon.png',
    'android-chrome-192x192.png',
    'android-chrome-512x512.png',
    'mstile-150x150.png',
    'site.webmanifest',
    'browserconfig.xml',
    'README.txt',
  ];

  const result: any = {
    signedUrl,
    sizes: SIZES,
    files,
  };
  
  if (zipBuffer.length < 1024 * 1024) {
    result.zipBase64 = zipBuffer.toString('base64');
  }
  
  return result;
}

