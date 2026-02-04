import { z } from 'zod';
import type {
  CreateSalesHistoryDto as SharedCreateSalesHistoryDto,
  UpdateSalesHistoryDto as SharedUpdateSalesHistoryDto,
  ImportSalesHistoryItem as SharedImportSalesHistoryItem,
  PeriodQuery as SharedPeriodQuery,
} from '@sales-planner/shared';

// Type compatibility helper - fails at compile time if types don't match
type AssertCompatible<T, U extends T> = U;

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

// Infer TypeScript types from schemas with compatibility checks
export type PeriodQuery = AssertCompatible<SharedPeriodQuery, z.infer<typeof PeriodQuerySchema>>;
export type CreateSalesHistoryDto = AssertCompatible<SharedCreateSalesHistoryDto, z.infer<typeof CreateSalesHistorySchema>>;
export type UpdateSalesHistoryDto = AssertCompatible<SharedUpdateSalesHistoryDto, z.infer<typeof UpdateSalesHistorySchema>>;
export type ImportSalesHistoryItem = AssertCompatible<SharedImportSalesHistoryItem, z.infer<typeof ImportSalesHistoryItemSchema>>;
