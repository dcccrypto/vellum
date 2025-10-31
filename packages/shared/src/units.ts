/**
 * USDC atomic unit helpers (6 decimals)
 * All price operations use bigint for safety
 */

const USDC_DECIMALS = 6;
const USDC_MULTIPLIER = BigInt(10 ** USDC_DECIMALS);

/**
 * Convert human-readable USDC amount to atomic units
 * @param usdcAmount - Dollar amount as number (e.g., 0.03)
 * @returns Atomic units as string (e.g., "30000")
 */
export function toAtomicUsdc(usdcAmount: number): string {
  const atomicBigInt = BigInt(Math.floor(usdcAmount * 10 ** USDC_DECIMALS));
  return atomicBigInt.toString();
}

/**
 * Convert atomic USDC units to human-readable amount
 * @param atomicAmount - Atomic units as string (e.g., "30000")
 * @returns Dollar amount as number (e.g., 0.03)
 */
export function fromAtomicUsdc(atomicAmount: string): number {
  const atomicBigInt = BigInt(atomicAmount);
  return Number(atomicBigInt) / 10 ** USDC_DECIMALS;
}

/**
 * Format atomic USDC to display string
 * @param atomicAmount - Atomic units as string
 * @returns Formatted string (e.g., "$0.03")
 */
export function formatUsdc(atomicAmount: string): string {
  const amount = fromAtomicUsdc(atomicAmount);
  return `$${amount.toFixed(2)}`;
}

/**
 * Validate atomic amount string
 * @param atomicAmount - String to validate
 * @returns true if valid atomic amount
 */
export function isValidAtomicAmount(atomicAmount: string): boolean {
  try {
    const num = BigInt(atomicAmount);
    return num >= 0n;
  } catch {
    return false;
  }
}

/**
 * Add two atomic amounts
 * @param a - First atomic amount as string
 * @param b - Second atomic amount as string
 * @returns Sum as string
 */
export function addAtomicUsdc(a: string, b: string): string {
  return (BigInt(a) + BigInt(b)).toString();
}

/**
 * Compare two atomic amounts
 * @param a - First atomic amount
 * @param b - Second atomic amount
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareAtomicUsdc(a: string, b: string): number {
  const aBig = BigInt(a);
  const bBig = BigInt(b);
  if (aBig < bBig) return -1;
  if (aBig > bBig) return 1;
  return 0;
}

