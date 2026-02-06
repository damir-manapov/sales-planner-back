import { z } from 'zod';
import type { PaginationQuery as SharedPaginationQuery } from '@sales-planner/shared';
import type { AssertCompatible } from './helpers/schema.utils.js';

/**
 * Common pagination query schema for all paginated endpoints
 */
export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type PaginationQuery = AssertCompatible<
  SharedPaginationQuery,
  z.infer<typeof PaginationQuerySchema>
>;
