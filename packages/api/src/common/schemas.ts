import { z } from 'zod';
import type { PaginationQuery as SharedPaginationQuery } from '@sales-planner/shared';
import type { AssertCompatible } from './helpers/schema.utils.js';

/**
 * Common pagination query schema for all paginated endpoints.
 * Includes optional ids filter for filtering by specific entity IDs.
 */
export const PaginationQuerySchema = z.object({
  ids: z
    .string()
    .transform((val) => val.split(',').map(Number))
    .optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type PaginationQuery = AssertCompatible<
  SharedPaginationQuery,
  z.infer<typeof PaginationQuerySchema>
>;
