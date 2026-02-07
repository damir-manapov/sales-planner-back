import type {
  CompetitorSaleQuery as SharedCompetitorSaleQuery,
  CreateCompetitorSaleDto as SharedCreateCompetitorSaleDto,
  CreateCompetitorSaleRequest as SharedCreateCompetitorSaleRequest,
  ImportCompetitorSaleItem as SharedImportCompetitorSaleItem,
  UpdateCompetitorSaleDto as SharedUpdateCompetitorSaleDto,
  UpdateCompetitorSaleRequest as SharedUpdateCompetitorSaleRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, PaginationQuerySchema, zodSchemas } from '../../common/index.js';

const { id, quantity, period, code, flexiblePeriod } = zodSchemas;

// Schema for requests (omitting shop_id and tenant_id)
const CreateCompetitorSaleRequestSchema = z.object({
  competitor_product_id: id(),
  period: period(),
  quantity: quantity(),
});

// Query schema with period filters and pagination
export const CompetitorSaleQuerySchema = z
  .object({
    period_from: period().optional(),
    period_to: period().optional(),
  })
  .merge(PaginationQuerySchema);

export const CreateCompetitorSaleSchema = z.object({
  shop_id: id(),
  tenant_id: id(),
  competitor_product_id: id(),
  period: period(),
  quantity: quantity(),
});

export const UpdateCompetitorSaleSchema = z.object({
  quantity: quantity().optional(),
});

export const ImportCompetitorSaleItemSchema = z.object({
  marketplace: code(),
  marketplaceProductId: z.string().min(1), // BIGINT as string
  period: flexiblePeriod(),
  quantity: quantity(),
});

// Period query for exports
export const PeriodQuerySchema = z.object({
  period_from: period().optional(),
  period_to: period().optional(),
});

// TypeScript types
export type CompetitorSaleQuery = AssertCompatible<
  SharedCompetitorSaleQuery,
  z.infer<typeof CompetitorSaleQuerySchema>
>;
export type CreateCompetitorSaleRequest = AssertCompatible<
  SharedCreateCompetitorSaleRequest,
  z.infer<typeof CreateCompetitorSaleRequestSchema>
>;
export type CreateCompetitorSaleDto = AssertCompatible<
  SharedCreateCompetitorSaleDto,
  z.infer<typeof CreateCompetitorSaleSchema>
>;
export type UpdateCompetitorSaleDto = AssertCompatible<
  SharedUpdateCompetitorSaleDto,
  z.infer<typeof UpdateCompetitorSaleSchema>
>;
export type UpdateCompetitorSaleRequest = AssertCompatible<
  SharedUpdateCompetitorSaleRequest,
  z.infer<typeof UpdateCompetitorSaleSchema>
>;
export type ImportCompetitorSaleItem = AssertCompatible<
  SharedImportCompetitorSaleItem,
  z.infer<typeof ImportCompetitorSaleItemSchema>
>;
