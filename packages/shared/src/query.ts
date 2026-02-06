/**
 * Query parameter types
 */

export interface ShopContextParams {
  shop_id: number;
  tenant_id: number;
  [key: string]: string | number | undefined;
}

export interface PaginationQuery {
  limit?: number;
  offset?: number;
}

export interface PeriodQuery {
  period_from?: string; // YYYY-MM format
  period_to?: string; // YYYY-MM format
}

export interface SalesHistoryQuery extends PeriodQuery, PaginationQuery {}

export interface GetUserRolesQuery {
  userId?: number;
  roleId?: number;
  tenantId?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
