import { describe, expect, it } from 'vitest';
import { normalizeCode, normalizeSkuCode } from './normalize-code.js';

describe('normalizeCode', () => {
  it('should transliterate Cyrillic to Latin', () => {
    expect(normalizeCode('Товар')).toBe('tovar');
    expect(normalizeCode('ТОВАР')).toBe('tovar');
    expect(normalizeCode('Яблоко')).toBe('yabloko');
  });

  it('should convert to camelCase', () => {
    expect(normalizeCode('SKU_CODE')).toBe('skuCode');
    expect(normalizeCode('my-sku')).toBe('mySku');
    expect(normalizeCode('my sku')).toBe('mySku');
    expect(normalizeCode('MY-SKU-CODE')).toBe('mySkuCode');
  });

  it('should handle mixed Cyrillic and Latin', () => {
    expect(normalizeCode('Товар-123')).toBe('tovar123');
    expect(normalizeCode('SKU_Яблоко')).toBe('skuYabloko');
    expect(normalizeCode('my-Товар-01')).toBe('myTovar01');
  });

  it('should preserve numbers', () => {
    expect(normalizeCode('SKU-001')).toBe('sku001');
    expect(normalizeCode('item_123_abc')).toBe('item123Abc');
  });

  it('should handle already normalized codes', () => {
    expect(normalizeCode('sku-code')).toBe('skuCode');
    expect(normalizeCode('my_product_01')).toBe('myProduct01');
  });

  it('should handle empty string', () => {
    expect(normalizeCode('')).toBe('');
  });

  it('should handle special characters', () => {
    expect(normalizeCode('sku@code')).toBe('sku@code');
    expect(normalizeCode('sku.code')).toBe('sku.code');
  });

  it('should handle consecutive separators', () => {
    expect(normalizeCode('my--sku')).toBe('mySku');
    expect(normalizeCode('my__sku')).toBe('mySku');
    expect(normalizeCode('my  sku')).toBe('mySku');
  });

  it('should handle multi-character Cyrillic transliterations', () => {
    expect(normalizeCode('Щука')).toBe('shchuka'); // щ → shch
    expect(normalizeCode('Часы')).toBe('chasy'); // ч → ch
    expect(normalizeCode('Юнит')).toBe('yunit'); // ю → yu
    expect(normalizeCode('Ёлка')).toBe('yolka'); // ё → yo
  });

  it('should handle hard and soft signs', () => {
    expect(normalizeCode('объект')).toBe('obekt'); // ъ is removed
    expect(normalizeCode('мышь')).toBe('mysh'); // ь is removed
  });

  it('should handle leading and trailing separators', () => {
    expect(normalizeCode('-my-sku-')).toBe('mySku');
    expect(normalizeCode('_my_sku_')).toBe('mySku');
    expect(normalizeCode(' my sku ')).toBe('mySku');
  });

  it('should remove all whitespace', () => {
    expect(normalizeCode('  my-sku  ')).toBe('mySku');
    expect(normalizeCode('\tmy-sku\t')).toBe('mySku');
    expect(normalizeCode(' SKU_CODE ')).toBe('skuCode');
    expect(normalizeCode('my sku code')).toBe('mySkuCode');
    expect(normalizeCode('SKU 001')).toBe('sku001');
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
