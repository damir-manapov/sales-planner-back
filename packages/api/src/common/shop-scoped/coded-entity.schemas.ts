import { z } from 'zod';
import { zodSchemas } from '../helpers/schema.utils.js';

const { code, title } = zodSchemas;

/**
 * Common Zod schemas for coded entities (code + title).
 * Used by: brands, categories, groups, statuses, suppliers, warehouses
 */
export const CodedTitledCreateSchema = z.object({
  code: code(),
  title: title(),
});

export const CodedTitledUpdateSchema = z.object({
  code: code().optional(),
  title: title().optional(),
});

export const CodedTitledImportSchema = z.object({
  code: code(),
  title: title(),
});
