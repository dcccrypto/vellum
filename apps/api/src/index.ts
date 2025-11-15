import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { loadEnv, getEnv, ensureBucket } from '@vellum/shared';
import { logger } from './logger';
import { handleX402Pay } from './routes/x402';
import filesRouter from './routes/files';
import modelsRouter from './routes/models';
import pricingRouter from './routes/pricing';
import quoteRouter from './routes/quote';
import shareRouter from './routes/share';

// Load and validate environment
  try {
    loadEnv();
    logger.info('✅ Environment configuration dcdc djcdjcdjdc loaded');
  } catch (error) {
    logger.error({ error }, '❌ Failed to load environment bruh');
    process.exit(1);
  }

const env = getEnv();

// Create Express app
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS with exposed headers
app.use(
  cors({
    origin: env.ALLOW_ORIGIN,
    exposedHeaders: ['X-PAYMENT-RESPONSE'],
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: env.APP_NAME,
    timestamp: new Date().toISOString(),
  });
});

// Single x402 payment endpoint
app.post('/x402/pay', handleX402Pay);

// Models and pricing endpoints
app.use('/models', modelsRouter);
app.use('/pricing', pricingRouter);
app.use('/quote', quoteRouter);
app.use('/share', shareRouter);

// File proxy endpoint (serves files through our domain instead of Supabase)
app.use('/files', filesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;

async function start() {
  try {
    // Ensure Supabase bucket exists
    await ensureBucket();
    logger.info('✅ Supabase bucket ready');
  } catch (error) {
    logger.warn({ error }, '⚠️  Could not verify Supabase bucket');
  }
  
  app.listen(PORT, () => {
    logger.info(`🚀 ${env.APP_NAME} API server running on port ${PORT}`);
    logger.info(`   Cluster: ${env.SOLANA_CLUSTER}`);
    logger.info(`   Facilitator: ${env.FACILITATOR_URL}`);
    logger.info(`   Endpoint: POST /x402/pay?sku=<id>`);
  });
}

start().catch((error) => {
  logger.error({ error }, 'Failed to start server');
  process.exit(1);
});

