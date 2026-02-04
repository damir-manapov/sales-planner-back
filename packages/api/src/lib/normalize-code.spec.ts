import { describe, expect, it } from 'vitest';
import { normalizeId, normalizeSkuCode } from './normalize-code.js';

describe('normalizeId', () => {
  it('should transliterate Cyrillic to Latin', () => {
    expect(normalizeId('Товар')).toBe('tovar');
    expect(normalizeId('ТОВАР')).toBe('tovar');
    expect(normalizeId('Яблоко')).toBe('yabloko');
  });

  it('should convert to camelCase', () => {
    expect(normalizeId('SKU_CODE')).toBe('skuCode');
    expect(normalizeId('my-sku')).toBe('mySku');
    expect(normalizeId('my sku')).toBe('mySku');
    expect(normalizeId('MY-SKU-CODE')).toBe('mySkuCode');
  });

  it('should handle mixed Cyrillic and Latin', () => {
    expect(normalizeId('Товар-123')).toBe('tovar123');
    expect(normalizeId('SKU_Яблоко')).toBe('skuYabloko');
    expect(normalizeId('my-Товар-01')).toBe('myTovar01');
  });

  it('should preserve numbers', () => {
    expect(normalizeId('SKU-001')).toBe('sku001');
    expect(normalizeId('item_123_abc')).toBe('item123Abc');
  });

  it('should handle already normalized codes', () => {
    expect(normalizeId('sku-code')).toBe('skuCode');
    expect(normalizeId('my_product_01')).toBe('myProduct01');
  });

  it('should handle empty string', () => {
    expect(normalizeId('')).toBe('');
  });

  it('should handle special characters', () => {
    expect(normalizeId('sku@code')).toBe('sku@code');
    expect(normalizeId('sku.code')).toBe('sku.code');
  });

  it('should handle consecutive separators', () => {
    expect(normalizeId('my--sku')).toBe('mySku');
    expect(normalizeId('my__sku')).toBe('mySku');
    expect(normalizeId('my  sku')).toBe('mySku');
  });

  it('should handle multi-character Cyrillic transliterations', () => {
    expect(normalizeId('Щука')).toBe('shchuka'); // щ → shch
    expect(normalizeId('Часы')).toBe('chasy'); // ч → ch
    expect(normalizeId('Юнит')).toBe('yunit'); // ю → yu
    expect(normalizeId('Ёлка')).toBe('yolka'); // ё → yo
  });

  it('should handle hard and soft signs', () => {
    expect(normalizeId('объект')).toBe('obekt'); // ъ is removed
    expect(normalizeId('мышь')).toBe('mysh'); // ь is removed
  });

  it('should handle leading and trailing separators', () => {
    expect(normalizeId('-my-sku-')).toBe('mySku');
    expect(normalizeId('_my_sku_')).toBe('mySku');
    expect(normalizeId(' my sku ')).toBe('mySku');
  });

  it('should remove all whitespace', () => {
    expect(normalizeId('  my-sku  ')).toBe('mySku');
    expect(normalizeId('\tmy-sku\t')).toBe('mySku');
    expect(normalizeId(' SKU_CODE ')).toBe('skuCode');
    expect(normalizeId('my sku code')).toBe('mySkuCode');
    expect(normalizeId('SKU 001')).toBe('sku001');
  });
});

describe('normalizeSkuCode', () => {
  it('should transliterate Cyrillic to Latin', () => {
    expect(normalizeSkuCode('Товар')).toBe('Tovar');
    expect(normalizeSkuCode('ТОВАР')).toBe('TOVAR');
    expect(normalizeSkuCode('Яблоко')).toBe('Yabloko');
  });

  it('should preserve case and separators', () => {
    expect(normalizeSkuCode('SKU_CODE')).toBe('SKU_CODE');
    expect(normalizeSkuCode('my-sku')).toBe('my-sku');
    expect(normalizeSkuCode('MY-SKU-CODE')).toBe('MY-SKU-CODE');
  });

  it('should handle mixed Cyrillic and Latin', () => {
    expect(normalizeSkuCode('Товар-123')).toBe('Tovar-123');
    expect(normalizeSkuCode('SKU_Яблоко')).toBe('SKU_Yabloko');
    expect(normalizeSkuCode('my-Товар-01')).toBe('my-Tovar-01');
  });

  it('should preserve numbers and separators', () => {
    expect(normalizeSkuCode('SKU-001')).toBe('SKU-001');
    expect(normalizeSkuCode('item_123_abc')).toBe('item_123_abc');
  });

  it('should handle already normalized codes', () => {
    expect(normalizeSkuCode('skucode')).toBe('skucode');
    expect(normalizeSkuCode('myproduct01')).toBe('myproduct01');
  });

  it('should handle empty string', () => {
    expect(normalizeSkuCode('')).toBe('');
  });

  it('should handle special characters', () => {
    expect(normalizeSkuCode('sku@code')).toBe('sku@code');
    expect(normalizeSkuCode('sku.code')).toBe('sku.code');
  });

  it('should preserve consecutive separators', () => {
    expect(normalizeSkuCode('my--sku')).toBe('my--sku');
    expect(normalizeSkuCode('my__sku')).toBe('my__sku');
  });

  it('should handle multi-character Cyrillic transliterations with case', () => {
    expect(normalizeSkuCode('Щука')).toBe('Shchuka'); // Щ → Shch
    expect(normalizeSkuCode('ЩУКА')).toBe('ShchUKA'); // Щ → Shch (only first char uppercase in multi-char mapping)
    expect(normalizeSkuCode('Часы')).toBe('Chasy'); // Ч → Ch
    expect(normalizeSkuCode('Юнит')).toBe('Yunit'); // Ю → Yu
    expect(normalizeSkuCode('Ёлка')).toBe('Yolka'); // Ё → Yo
  });

  it('should handle hard and soft signs', () => {
    expect(normalizeSkuCode('Объект')).toBe('Obekt'); // Ъ is removed
    expect(normalizeSkuCode('Мышь')).toBe('Mysh'); // Ь is removed
  });

  it('should preserve leading and trailing separators within trimmed content', () => {
    expect(normalizeSkuCode('-my-sku-')).toBe('-my-sku-');
    expect(normalizeSkuCode('_MY_SKU_')).toBe('_MY_SKU_');
  });

  it('should remove all whitespace', () => {
    expect(normalizeSkuCode('  SKU-001  ')).toBe('SKU-001');
    expect(normalizeSkuCode('\tSKU_CODE\t')).toBe('SKU_CODE');
    expect(normalizeSkuCode(' my sku ')).toBe('mysku');
    expect(normalizeSkuCode('  Tovar 123  ')).toBe('Tovar123');
    expect(normalizeSkuCode('My SKU 01')).toBe('MySKU01');
  });
});
