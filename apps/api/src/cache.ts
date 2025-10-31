/**
 * Simple in-memory idempotency cache
 * In production, use Redis or similar
 */

interface CacheEntry {
  txSig: string;
  result: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

// Cache TTL: 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Get cached result by transaction signature
 */
export function getCached(txSig: string): any | null {
  const entry = cache.get(txSig);
  
  if (!entry) return null;
  
  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(txSig);
    return null;
  }
  
  return entry.result;
}

/**
 * Store result in cache
 */
export function setCached(txSig: string, result: any): void {
  cache.set(txSig, {
    txSig,
    result,
    timestamp: Date.now(),
  });
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanupCache(): void {
  const now = Date.now();
  
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupCache, 60 * 60 * 1000);

