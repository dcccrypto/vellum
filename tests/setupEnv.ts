// Provide a minimal environment for tests that use shared env parsing
process.env.APP_NAME = process.env.APP_NAME || 'Vellum (Test)';
process.env.API_URL = process.env.API_URL || 'http://localhost:3001';
process.env.ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*';
process.env.SOLANA_CLUSTER = process.env.SOLANA_CLUSTER || 'devnet';
process.env.RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
process.env.USDC_MINT = process.env.USDC_MINT || '11111111111111111111111111111111111111111111';
process.env.VAULT_OWNER = process.env.VAULT_OWNER || '11111111111111111111111111111111111111111111';
process.env.VAULT_USDC_ATA = process.env.VAULT_USDC_ATA || '';
process.env.FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://facilitator.example.com';
process.env.OFFER_EXPIRES_AT = process.env.OFFER_EXPIRES_AT || '900';
process.env.PUBLIC_MINT_URL = process.env.PUBLIC_MINT_URL || 'https://api.vellum.app';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://xyz.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
process.env.SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'vellum';
process.env.SUPABASE_SIGNED_URL_TTL = process.env.SUPABASE_SIGNED_URL_TTL || '3600';
process.env.AI_PROVIDER = process.env.AI_PROVIDER || 'openrouter';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-gemini-key';
process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'test-openrouter-key';
process.env.OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || 'https://vellumlabs.app';
process.env.OPENROUTER_SITE_NAME = process.env.OPENROUTER_SITE_NAME || 'Vellum';
// Prices have defaults in schema; no need to set here unless desired

