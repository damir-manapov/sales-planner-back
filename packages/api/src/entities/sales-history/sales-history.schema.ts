import type {
  CreateSalesHistoryDto as SharedCreateSalesHistoryDto,
  CreateSalesHistoryRequest as SharedCreateSalesHistoryRequest,
  ImportSalesHistoryItem as SharedImportSalesHistoryItem,
  PeriodQuery as SharedPeriodQuery,
  UpdateSalesHistoryDto as SharedUpdateSalesHistoryDto,
  UpdateSalesHistoryRequest as SharedUpdateSalesHistoryRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, zodSchemas } from '../../common/schema.utils.js';

const { id, quantity, period, code } = zodSchemas;

// Schema for requests (omitting shop_id and tenant_id)
const CreateSalesHistoryRequestSchema = z.object({
  sku_id: id(),
  period: period(),
  quantity: quantity(),
  marketplace_id: id(),
});

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
  marketplace_id: id(),
});

export const UpdateSalesHistorySchema = z.object({
  quantity: quantity().optional(),
  // Note: shop_id, tenant_id, sku_id, period are not updatable
});

export const ImportSalesHistoryItemSchema = z.object({
  marketplace: z.string().min(1),
  period: period(),
  sku: code(),
  quantity: quantity(),
});

// Infer TypeScript types from schemas with compatibility checks
export type PeriodQuery = AssertCompatible<SharedPeriodQuery, z.infer<typeof PeriodQuerySchema>>;
export type CreateSalesHistoryRequest = AssertCompatible<
  SharedCreateSalesHistoryRequest,
  z.infer<typeof CreateSalesHistoryRequestSchema>
>;
export type CreateSalesHistoryDto = AssertCompatible<
  SharedCreateSalesHistoryDto,
  z.infer<typeof CreateSalesHistorySchema>
>;
export type UpdateSalesHistoryDto = AssertCompatible<
  SharedUpdateSalesHistoryDto,
  z.infer<typeof UpdateSalesHistorySchema>
>;
export type UpdateSalesHistoryRequest = AssertCompatible<
  SharedUpdateSalesHistoryRequest,
  z.infer<typeof UpdateSalesHistorySchema>
>;
export type ImportSalesHistoryItem = AssertCompatible<
  SharedImportSalesHistoryItem,
  z.infer<typeof ImportSalesHistoryItemSchema>
>;
