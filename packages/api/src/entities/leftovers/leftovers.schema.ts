import type {
  CreateLeftoverDto as SharedCreateLeftoverDto,
  CreateLeftoverRequest as SharedCreateLeftoverRequest,
  ImportLeftoverItem as SharedImportLeftoverItem,
  LeftoverQuery as SharedLeftoverQuery,
  UpdateLeftoverDto as SharedUpdateLeftoverDto,
  UpdateLeftoverRequest as SharedUpdateLeftoverRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, PaginationQuerySchema, zodSchemas } from '../../common/index.js';

const { id, quantity, period, code, flexiblePeriod } = zodSchemas;

// Schema for requests (omitting shop_id and tenant_id)
const CreateLeftoverRequestSchema = z.object({
  warehouse_id: id(),
  sku_id: id(),
  period: period(),
  quantity: quantity(),
});

// Query schema with period filters and pagination
export const LeftoverQuerySchema = z
  .object({
    period_from: period().optional(),
    period_to: period().optional(),
  })
  .merge(PaginationQuerySchema);

export const CreateLeftoverSchema = z.object({
  shop_id: id(),
  tenant_id: id(),
  warehouse_id: id(),
  sku_id: id(),
  period: period(),
  quantity: quantity(),
});

export const UpdateLeftoverSchema = z.object({
  quantity: quantity().optional(),
});

export const ImportLeftoverItemSchema = z.object({
  warehouse: z.string().min(1),
  sku: code(),
  period: flexiblePeriod(),
  quantity: quantity(),
});

// TypeScript types
export type LeftoverQuery = AssertCompatible<
  SharedLeftoverQuery,
  z.infer<typeof LeftoverQuerySchema>
>;
export type CreateLeftoverRequest = AssertCompatible<
  SharedCreateLeftoverRequest,
  z.infer<typeof CreateLeftoverRequestSchema>
>;
export type CreateLeftoverDto = AssertCompatible<
  SharedCreateLeftoverDto,
  z.infer<typeof CreateLeftoverSchema>
>;
export type UpdateLeftoverDto = AssertCompatible<
  SharedUpdateLeftoverDto,
  z.infer<typeof UpdateLeftoverSchema>
>;
export type UpdateLeftoverRequest = AssertCompatible<
  SharedUpdateLeftoverRequest,
  z.infer<typeof UpdateLeftoverSchema>
>;
export type ImportLeftoverItem = AssertCompatible<
  SharedImportLeftoverItem,
  z.infer<typeof ImportLeftoverItemSchema>
>;
