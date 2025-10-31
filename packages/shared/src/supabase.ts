import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client (singleton)
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;
  
  const env = getEnv();
  
  supabaseClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  
  return supabaseClient;
}

export interface UploadResult {
  path: string;
  signedUrl: string;
}

/**
 * Upload buffer to Supabase Storage and return signed URL
 */
export async function put(
  buffer: Buffer,
  contentType: string,
  ext: string,
  subdir: string
): Promise<UploadResult> {
  const env = getEnv();
  const client = getSupabaseClient();
  const bucket = env.SUPABASE_BUCKET;
  
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const path = `${subdir}/${timestamp}-${random}.${ext}`;
  
  // Upload file
  const { error: uploadError } = await client.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });
  
  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }
  
  // Instead of returning Supabase signed URL, return our own domain URL
  // The API will proxy the file from Supabase storage
  // Prefer a non-localhost base in production by deriving from PUBLIC_MINT_URL if needed
  const apiBase = env.API_URL.startsWith('http://localhost') || env.API_URL.includes('127.0.0.1')
    ? env.PUBLIC_MINT_URL.replace(/\/x402\/pay\/?$/, '')
    : env.API_URL;
  const customUrl = `${apiBase}/files/${encodeURIComponent(path)}`;
  
  return {
    path,
    signedUrl: customUrl,
  };
}

/**
 * Ensure bucket exists (called on startup)
 */
export async function ensureBucket(): Promise<void> {
  const env = getEnv();
  const client = getSupabaseClient();
  const bucket = env.SUPABASE_BUCKET;
  
  try {
    const { data: buckets } = await client.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === bucket);
    
    if (!exists) {
      const { error } = await client.storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
      });
      
      if (error) {
        console.warn(`Could not create bucket ${bucket}: ${error.message}`);
      }
    }
  } catch (error) {
    console.warn('Bucket check skipped (permissions?)');
  }
}

