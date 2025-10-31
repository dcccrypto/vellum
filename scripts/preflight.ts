#!/usr/bin/env tsx

import 'dotenv/config';
import { loadEnv, getEnv, buildPaymentRequirements, getAllSkuIds, getVaultUsdcAta, formatUsdc } from '../packages/shared/src';
import { request } from 'undici';

async function preflight() {
  console.log('\n🔍 Vellum Preflight Check\n');
  console.log('═'.repeat(60));
  
  // Load environment
  try {
    loadEnv();
    console.log('✅ Environment configuration valid\n');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
  
  const env = getEnv();
  
  // Print basic config
  console.log('📋 Configuration:');
  console.log(`   App Name:          ${env.APP_NAME}`);
  console.log(`   Cluster:           ${env.SOLANA_CLUSTER}`);
  console.log(`   RPC URL:           ${env.RPC_URL}`);
  console.log(`   USDC Mint:         ${env.USDC_MINT}`);
  console.log(`   Vault Owner:       ${env.VAULT_OWNER}`);
  
  // Derive USDC ATA
  try {
    const ata = getVaultUsdcAta();
    console.log(`   USDC ATA:          ${ata}`);
    console.log('   ✅ ATA derived successfully\n');
  } catch (error) {
    console.error('   ❌ Failed to derive ATA:', error);
    process.exit(1);
  }
  
  // Print facilitator info
  console.log('💰 Payment Configuration:');
  console.log(`   Facilitator URL:   ${env.FACILITATOR_URL}`);
  console.log(`   Public Mint URL:   ${env.PUBLIC_MINT_URL}`);
  console.log(`   Offer Expires:     ${new Date(Number(env.OFFER_EXPIRES_AT) * 1000).toISOString()}\n`);
  
  // Check facilitator health
  console.log('🔗 Checking facilitator...');
  try {
    const { statusCode, body } = await request(`${env.FACILITATOR_URL}/health`, {
      method: 'GET',
      headersTimeout: 5000,
    });
    
    if (statusCode === 200) {
      console.log('   ✅ Facilitator is reachable\n');
    } else {
      console.log(`   ⚠️  Facilitator returned status ${statusCode}\n`);
    }
  } catch (error) {
    console.log('   ⚠️  Could not reach facilitator (may be expected)\n');
  }
  
  // Print SKU catalog
  console.log('📦 SKU Catalog:');
  console.log('═'.repeat(60));
  
  const skuIds = getAllSkuIds();
  
  for (const skuId of skuIds) {
    try {
      const requirements = buildPaymentRequirements(skuId);
      
      console.log(`\n   SKU: ${skuId}`);
      console.log(`   ├─ Description:    ${requirements.description}`);
      console.log(`   ├─ Price:          ${formatUsdc(requirements.maxAmountRequired)} (${requirements.maxAmountRequired} atomic)`);
      console.log(`   ├─ Network:        ${requirements.network}`);
      console.log(`   ├─ Scheme:         ${requirements.scheme}`);
      console.log(`   └─ Resource:       ${requirements.resource}`);
    } catch (error) {
      console.error(`   ❌ Failed to build requirements for ${skuId}:`, error);
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  
  // Print storage config
  console.log('\n📦 Storage Configuration:');
  console.log(`   Supabase URL:      ${env.SUPABASE_URL}`);
  console.log(`   Bucket:            ${env.SUPABASE_BUCKET}`);
  console.log(`   Signed URL TTL:    ${env.SUPABASE_SIGNED_URL_TTL}s\n`);
  
  // Print AI config
  console.log('🤖 AI Configuration:');
  console.log(`   Provider:          ${env.AI_PROVIDER}`);
  console.log(`   Gemini API Key:    ${env.GEMINI_API_KEY.substring(0, 10)}...\n`);
  
  console.log('═'.repeat(60));
  console.log('\n✅ Preflight check complete!\n');
  console.log('🚀 Ready to start the API server:\n');
  console.log('   cd apps/api');
  console.log('   pnpm dev\n');
}

preflight().catch((error) => {
  console.error('Preflight failed:', error);
  process.exit(1);
});

