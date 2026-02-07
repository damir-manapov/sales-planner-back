import type {
  CreateSeasonalCoefficientDto as SharedCreateSeasonalCoefficientDto,
  CreateSeasonalCoefficientRequest as SharedCreateSeasonalCoefficientRequest,
  ImportSeasonalCoefficientItem as SharedImportSeasonalCoefficientItem,
  PaginationQuery as SharedPaginationQuery,
  UpdateSeasonalCoefficientDto as SharedUpdateSeasonalCoefficientDto,
  UpdateSeasonalCoefficientRequest as SharedUpdateSeasonalCoefficientRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, PaginationQuerySchema, zodSchemas } from '../../common/index.js';

const { id, code, month, flexibleMonth, coefficient, flexibleFloat } = zodSchemas;

// Schema for requests (omitting shop_id and tenant_id)
const CreateSeasonalCoefficientRequestSchema = z.object({
  group_id: id(),
  month: month(),
  coefficient: coefficient(),
});

// Query schema with pagination
export const SeasonalCoefficientQuerySchema = PaginationQuerySchema;

export const CreateSeasonalCoefficientSchema = z.object({
  shop_id: id(),
  tenant_id: id(),
  group_id: id(),
  month: month(),
  coefficient: coefficient(),
});

export const UpdateSeasonalCoefficientSchema = z.object({
  coefficient: coefficient().optional(),
});

export const ImportSeasonalCoefficientItemSchema = z.object({
  group: code(),
  month: flexibleMonth(),
  coefficient: flexibleFloat(),
});

// TypeScript types
export type SeasonalCoefficientQuery = AssertCompatible<
  SharedPaginationQuery,
  z.infer<typeof SeasonalCoefficientQuerySchema>
>;
export type CreateSeasonalCoefficientRequest = AssertCompatible<
  SharedCreateSeasonalCoefficientRequest,
  z.infer<typeof CreateSeasonalCoefficientRequestSchema>
>;
export type CreateSeasonalCoefficientDto = AssertCompatible<
  SharedCreateSeasonalCoefficientDto,
  z.infer<typeof CreateSeasonalCoefficientSchema>
>;
export type UpdateSeasonalCoefficientDto = AssertCompatible<
  SharedUpdateSeasonalCoefficientDto,
  z.infer<typeof UpdateSeasonalCoefficientSchema>
>;
export type UpdateSeasonalCoefficientRequest = AssertCompatible<
  SharedUpdateSeasonalCoefficientRequest,
  z.infer<typeof UpdateSeasonalCoefficientSchema>
>;
export type ImportSeasonalCoefficientItem = AssertCompatible<
  SharedImportSeasonalCoefficientItem,
  z.infer<typeof ImportSeasonalCoefficientItemSchema>
>;
