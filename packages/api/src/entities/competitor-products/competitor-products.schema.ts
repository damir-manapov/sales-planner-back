import type {
  CompetitorProductQuery as SharedCompetitorProductQuery,
  CreateCompetitorProductDto as SharedCreateCompetitorProductDto,
  CreateCompetitorProductRequest as SharedCreateCompetitorProductRequest,
  ImportCompetitorProductItem as SharedImportCompetitorProductItem,
  UpdateCompetitorProductDto as SharedUpdateCompetitorProductDto,
  UpdateCompetitorProductRequest as SharedUpdateCompetitorProductRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, PaginationQuerySchema, zodSchemas } from '../../common/index.js';

const { id, code } = zodSchemas;

// Schema for requests (omitting shop_id and tenant_id)
const CreateCompetitorProductRequestSchema = z.object({
  marketplace_id: id(),
  marketplace_product_id: z.string().min(1), // BIGINT as string
  title: z.string().max(1000).optional(),
  brand: z.string().max(255).optional(),
});

// Query schema with pagination and IDs filter
export const CompetitorProductQuerySchema = PaginationQuerySchema.extend({
  ids: z
    .string()
    .transform((val) => val.split(',').map(Number))
    .optional(),
});

export const CreateCompetitorProductSchema = z.object({
  shop_id: id(),
  tenant_id: id(),
  marketplace_id: id(),
  marketplace_product_id: z.string().min(1), // BIGINT as string
  title: z.string().max(1000).optional(),
  brand: z.string().max(255).optional(),
});

export const UpdateCompetitorProductSchema = z.object({
  title: z.string().max(1000).optional(),
  brand: z.string().max(255).optional(),
});

export const ImportCompetitorProductItemSchema = z.object({
  marketplace: code(),
  marketplaceProductId: z.string().min(1), // BIGINT as string
  title: z.string().max(1000).optional(),
  brand: z.string().max(255).optional(),
});

// TypeScript types
export type CompetitorProductQuery = AssertCompatible<
  SharedCompetitorProductQuery,
  z.infer<typeof CompetitorProductQuerySchema>
>;
export type CreateCompetitorProductRequest = AssertCompatible<
  SharedCreateCompetitorProductRequest,
  z.infer<typeof CreateCompetitorProductRequestSchema>
>;
export type CreateCompetitorProductDto = AssertCompatible<
  SharedCreateCompetitorProductDto,
  z.infer<typeof CreateCompetitorProductSchema>
>;
export type UpdateCompetitorProductDto = AssertCompatible<
  SharedUpdateCompetitorProductDto,
  z.infer<typeof UpdateCompetitorProductSchema>
>;
export type UpdateCompetitorProductRequest = AssertCompatible<
  SharedUpdateCompetitorProductRequest,
  z.infer<typeof UpdateCompetitorProductSchema>
>;
export type ImportCompetitorProductItem = AssertCompatible<
  SharedImportCompetitorProductItem,
  z.infer<typeof ImportCompetitorProductItemSchema>
>;
