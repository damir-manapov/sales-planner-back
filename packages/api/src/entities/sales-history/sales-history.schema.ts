import type {
  CreateSalesHistoryDto as SharedCreateSalesHistoryDto,
  CreateSalesHistoryRequest as SharedCreateSalesHistoryRequest,
  ImportSalesHistoryItem as SharedImportSalesHistoryItem,
  PeriodQuery as SharedPeriodQuery,
  SalesHistoryQuery as SharedSalesHistoryQuery,
  UpdateSalesHistoryDto as SharedUpdateSalesHistoryDto,
  UpdateSalesHistoryRequest as SharedUpdateSalesHistoryRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, PaginationQuerySchema, zodSchemas } from '../../common/index.js';

const { id, quantity, period, code, flexiblePeriod } = zodSchemas;

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

// Combined query schema for sales history with period filters and pagination
export const SalesHistoryQuerySchema = PeriodQuerySchema.merge(PaginationQuerySchema);

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
  period: flexiblePeriod(),
  sku: code(),
  quantity: quantity(),
});

// Infer TypeScript types from schemas with compatibility checks
export type PeriodQuery = AssertCompatible<SharedPeriodQuery, z.infer<typeof PeriodQuerySchema>>;
export type SalesHistoryQuery = AssertCompatible<
  SharedSalesHistoryQuery,
  z.infer<typeof SalesHistoryQuerySchema>
>;
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
