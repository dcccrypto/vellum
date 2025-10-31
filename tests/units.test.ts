import { describe, it, expect } from '@jest/globals';
import {
  toAtomicUsdc,
  fromAtomicUsdc,
  formatUsdc,
  isValidAtomicAmount,
  addAtomicUsdc,
  compareAtomicUsdc,
} from '../packages/shared/src/units';

describe('USDC Unit Conversions', () => {
  it('converts human amount to atomic', () => {
    expect(toAtomicUsdc(0.03)).toBe('30000');
    expect(toAtomicUsdc(0.04)).toBe('40000');
    expect(toAtomicUsdc(0.05)).toBe('50000');
    expect(toAtomicUsdc(0.06)).toBe('60000');
    expect(toAtomicUsdc(1.0)).toBe('1000000');
  });

  it('converts atomic to human amount', () => {
    expect(fromAtomicUsdc('30000')).toBe(0.03);
    expect(fromAtomicUsdc('40000')).toBe(0.04);
    expect(fromAtomicUsdc('50000')).toBe(0.05);
    expect(fromAtomicUsdc('60000')).toBe(0.06);
    expect(fromAtomicUsdc('1000000')).toBe(1.0);
  });

  it('formats atomic amount to display string', () => {
    expect(formatUsdc('30000')).toBe('$0.03');
    expect(formatUsdc('40000')).toBe('$0.04');
    expect(formatUsdc('50000')).toBe('$0.05');
    expect(formatUsdc('60000')).toBe('$0.06');
    expect(formatUsdc('1000000')).toBe('$1.00');
  });

  it('validates atomic amounts', () => {
    expect(isValidAtomicAmount('30000')).toBe(true);
    expect(isValidAtomicAmount('0')).toBe(true);
    expect(isValidAtomicAmount('-1')).toBe(false);
    expect(isValidAtomicAmount('abc')).toBe(false);
    expect(isValidAtomicAmount('1.5')).toBe(false);
  });

  it('adds atomic amounts', () => {
    expect(addAtomicUsdc('30000', '40000')).toBe('70000');
    expect(addAtomicUsdc('0', '50000')).toBe('50000');
  });

  it('compares atomic amounts', () => {
    expect(compareAtomicUsdc('30000', '40000')).toBe(-1);
    expect(compareAtomicUsdc('50000', '50000')).toBe(0);
    expect(compareAtomicUsdc('60000', '30000')).toBe(1);
  });

  it('handles price conversions for all SKUs', () => {
    const prices = {
      PRICE_IMGGEN: '30000',
      PRICE_MEME: '30000',
      PRICE_BGREMOVE: '60000',
      PRICE_UPSCALE2X: '50000',
      PRICE_FAVICON: '30000',
      PRICE_URLSUM: '30000',
      PRICE_PDF2TXT: '40000',
    };

    Object.entries(prices).forEach(([name, atomic]) => {
      const human = fromAtomicUsdc(atomic);
      const formatted = formatUsdc(atomic);
      
      expect(human).toBeGreaterThan(0);
      expect(formatted).toMatch(/^\$\d+\.\d{2}$/);
      console.log(`${name}: ${atomic} = ${formatted} (${human})`);
    });
  });
});

