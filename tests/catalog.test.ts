import { describe, it, expect, beforeAll } from '@jest/globals';
import { loadEnv } from '../packages/shared/src/env';
import { getSkuCatalog, getAllSkuIds, getSkuById } from '../packages/shared/src/catalog';

beforeAll(() => {
  // Ensure env is parsed for priceAtomic defaults
  loadEnv();
});

describe('SKU Catalog', () => {
  it('returns consistent ids and fields', () => {
    const catalog = getSkuCatalog();
    const ids = Object.keys(catalog);
    expect(ids.length).toBeGreaterThan(0);

    for (const id of ids) {
      const sku = catalog[id];
      expect(sku.id).toBe(id);
      expect(typeof sku.name).toBe('string');
      expect(typeof sku.description).toBe('string');
      expect(sku.priceAtomic).toMatch(/^\d+$/);
      expect(typeof sku.inputSchema).toBe('object');
      expect(typeof sku.outputSchema).toBe('object');
    }
  });

  it('getAllSkuIds matches catalog keys', () => {
    const ids = getAllSkuIds();
    const keys = Object.keys(getSkuCatalog());
    expect(new Set(ids)).toEqual(new Set(keys));
  });

  it('getSkuById throws on unknown id', () => {
    expect(() => getSkuById('nope')).toThrow();
  });
});


