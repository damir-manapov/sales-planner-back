import type {
  CreateSkuCompetitorMappingDto as SharedCreateSkuCompetitorMappingDto,
  CreateSkuCompetitorMappingRequest as SharedCreateSkuCompetitorMappingRequest,
  ImportSkuCompetitorMappingItem as SharedImportSkuCompetitorMappingItem,
  PaginationQuery as SharedPaginationQuery,
  UpdateSkuCompetitorMappingDto as SharedUpdateSkuCompetitorMappingDto,
  UpdateSkuCompetitorMappingRequest as SharedUpdateSkuCompetitorMappingRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, PaginationQuerySchema, zodSchemas } from '../../common/index.js';

const { id, code } = zodSchemas;

// Schema for requests (omitting shop_id and tenant_id)
const CreateSkuCompetitorMappingRequestSchema = z.object({
  sku_id: id(),
  competitor_product_id: id(),
});

// Query schema with pagination
export const SkuCompetitorMappingQuerySchema = PaginationQuerySchema;

export const CreateSkuCompetitorMappingSchema = z.object({
  shop_id: id(),
  tenant_id: id(),
  sku_id: id(),
  competitor_product_id: id(),
});

export const UpdateSkuCompetitorMappingSchema = z.object({
  competitor_product_id: id().optional(),
});

export const ImportSkuCompetitorMappingItemSchema = z.object({
  sku: code(),
  marketplace: code(),
  marketplaceProductId: z.string().min(1), // BIGINT as string
});

// TypeScript types
export type SkuCompetitorMappingQuery = AssertCompatible<
  SharedPaginationQuery,
  z.infer<typeof SkuCompetitorMappingQuerySchema>
>;
export type CreateSkuCompetitorMappingRequest = AssertCompatible<
  SharedCreateSkuCompetitorMappingRequest,
  z.infer<typeof CreateSkuCompetitorMappingRequestSchema>
>;
export type CreateSkuCompetitorMappingDto = AssertCompatible<
  SharedCreateSkuCompetitorMappingDto,
  z.infer<typeof CreateSkuCompetitorMappingSchema>
>;
export type UpdateSkuCompetitorMappingDto = AssertCompatible<
  SharedUpdateSkuCompetitorMappingDto,
  z.infer<typeof UpdateSkuCompetitorMappingSchema>
>;
export type UpdateSkuCompetitorMappingRequest = AssertCompatible<
  SharedUpdateSkuCompetitorMappingRequest,
  z.infer<typeof UpdateSkuCompetitorMappingSchema>
>;
export type ImportSkuCompetitorMappingItem = AssertCompatible<
  SharedImportSkuCompetitorMappingItem,
  z.infer<typeof ImportSkuCompetitorMappingItemSchema>
>;
