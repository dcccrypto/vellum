import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'HH:MM:ss',
      singleLine: true,
    },
  },
});

export function logEvent(
  event: '402_issued' | 'verify_ok' | 'verify_fail' | 'settle_ok' | 'settle_fail' | 'fulfilled' | 'error',
  data: {
    sku?: string;
    amountAtomic?: string;
    txSig?: string;
    duration?: number;
    error?: string;
  }
) {
  logger.info({
    event,
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export function logAi(
  phase: 'request' | 'response' | 'error',
  data: {
    provider: 'gemini' | 'openrouter';
    model: string;
    endpoint: string;
    sku?: string;
    durationMs?: number;
    promptLen?: number;
    inputBytes?: number;
    candidates?: number;
    status?: number;
    message?: string;
  }
) {
  logger.info({
    event: `ai_${phase}`,
    timestamp: new Date().toISOString(),
    ...data,
  });
}

