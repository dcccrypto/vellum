import { z } from 'zod';

const envSchema = z.object({
  // App
  APP_NAME: z.string().default('Vellum'),
  API_URL: z.string().url().default('http://localhost:3001'),
  ALLOW_ORIGIN: z.string().default('*'),

  // Chain / payments
  SOLANA_CLUSTER: z.enum(['mainnet-beta', 'devnet', 'testnet']).default('mainnet-beta'),
  RPC_URL: z.string().url(),
  USDC_MINT: z.string().length(44), // Base58 Solana address
  VAULT_OWNER: z.string().length(44),
  VAULT_USDC_ATA: z.string().optional(),

  // Facilitator (PayAI)
  FACILITATOR_URL: z.string().url(),
  OFFER_EXPIRES_AT: z.string().regex(/^\d+$/),
  PUBLIC_MINT_URL: z.string().url(),

  // Supabase (Storage for outputs)
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_BUCKET: z.string().default('vellum'),
  SUPABASE_SIGNED_URL_TTL: z.string().regex(/^\d+$/).default('3600'),

  // AI provider
  AI_PROVIDER: z.enum(['gemini']).default('gemini'),
  GEMINI_API_KEY: z.string().min(1),

  // SKU prices (atomic USDC strings)
  PRICE_IMGGEN: z.string().regex(/^\d+$/).default('30000'),
  PRICE_MEME: z.string().regex(/^\d+$/).default('30000'),
  PRICE_BGREMOVE: z.string().regex(/^\d+$/).default('60000'),
  PRICE_UPSCALE2X: z.string().regex(/^\d+$/).default('50000'),
  PRICE_FAVICON: z.string().regex(/^\d+$/).default('30000'),
  PRICE_URLSUM: z.string().regex(/^\d+$/).default('30000'),
  PRICE_PDF2TXT: z.string().regex(/^\d+$/).default('40000'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Environment validation failed:');
    console.error(parsed.error.format());
    throw new Error('Invalid environment configuration. Check .env file.');
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getEnv(): Env {
  if (!cachedEnv) {
    throw new Error('Environment not loaded. Call loadEnv() first.');
  }
  return cachedEnv;
}

