import express, { Request, Response } from 'express';
import { getSupabaseClient, getEnv } from '@vellum/shared';

const router: express.Router = express.Router();

/**
 * Proxy files from Supabase storage through our domain
 * GET /files/:path
 */
router.get('/:path(*)', async (req: Request, res: Response) => {
  try {
    const path = decodeURIComponent(req.params.path);
    const env = getEnv();
    const client = getSupabaseClient();
    const bucket = env.SUPABASE_BUCKET;

    // Generate a fresh signed URL from Supabase (short TTL for security)
    const { data: urlData, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, 300); // 5 minutes

    if (error || !urlData?.signedUrl) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Fetch the file from Supabase
    const response = await fetch(urlData.signedUrl);
    
    if (!response.ok) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get content type from Supabase response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Stream the file to the client
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Get the buffer and send it
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('File proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

export default router;

