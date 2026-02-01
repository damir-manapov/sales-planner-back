import { z } from 'zod';

// Zod schemas
const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const PeriodQuerySchema = z.object({
  period_from: z.string().regex(periodRegex, 'Must be in YYYY-MM format').optional(),
  period_to: z.string().regex(periodRegex, 'Must be in YYYY-MM format').optional(),
});

export const CreateSalesHistorySchema = z.object({
  shop_id: z.number().int().positive(),
  tenant_id: z.number().int().positive(),
  sku_id: z.number().int().positive(),
  period: z.string().regex(periodRegex, 'Period must be in YYYY-MM format'),
  quantity: z.number().int().nonnegative(),
});

export const UpdateSalesHistorySchema = z.object({
  quantity: z.number().int().nonnegative().optional(),
  // Note: shop_id, tenant_id, sku_id, period are not updatable
});

export const ImportSalesHistoryItemSchema = z.object({
  sku_code: z.string().min(1).max(100),
  period: z.string().regex(periodRegex, 'Period must be in YYYY-MM format'),
  quantity: z.number().int().nonnegative(),
});

// Infer TypeScript types from schemas
export type PeriodQuery = z.infer<typeof PeriodQuerySchema>;
export type CreateSalesHistoryDto = z.infer<typeof CreateSalesHistorySchema>;
export type UpdateSalesHistoryDto = z.infer<typeof UpdateSalesHistorySchema>;
export type ImportSalesHistoryItem = z.infer<typeof ImportSalesHistoryItemSchema>;
