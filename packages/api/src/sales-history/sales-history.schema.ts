import { z } from 'zod';
import type {
  CreateSalesHistoryDto as SharedCreateSalesHistoryDto,
  UpdateSalesHistoryDto as SharedUpdateSalesHistoryDto,
  ImportSalesHistoryItem as SharedImportSalesHistoryItem,
  PeriodQuery as SharedPeriodQuery,
} from '@sales-planner/shared';
import { AssertCompatible, zodSchemas } from '../common/schema.utils.js';

const { id, quantity, period, code } = zodSchemas;

// Zod schemas
export const PeriodQuerySchema = z.object({
  period_from: period().optional(),
  period_to: period().optional(),
});

export const CreateSalesHistorySchema = z.object({
  shop_id: id(),
  tenant_id: id(),
  sku_id: id(),
  period: period(),
  quantity: quantity(),
});

export const UpdateSalesHistorySchema = z.object({
  quantity: quantity().optional(),
  // Note: shop_id, tenant_id, sku_id, period are not updatable
});

export const ImportSalesHistoryItemSchema = z.object({
  sku_code: code(),
  period: period(),
  quantity: quantity(),
  marketplace: z.string().optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type PeriodQuery = AssertCompatible<SharedPeriodQuery, z.infer<typeof PeriodQuerySchema>>;
export type CreateSalesHistoryDto = AssertCompatible<
  SharedCreateSalesHistoryDto,
  z.infer<typeof CreateSalesHistorySchema>
>;
export type UpdateSalesHistoryDto = AssertCompatible<
  SharedUpdateSalesHistoryDto,
  z.infer<typeof UpdateSalesHistorySchema>
>;
export type ImportSalesHistoryItem = AssertCompatible<
  SharedImportSalesHistoryItem,
  z.infer<typeof ImportSalesHistoryItemSchema>
>;
