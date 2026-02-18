/**
 * Query parameter types
 */

export interface ShopContextParams {
  shopId: number;
  tenantId: number;
  [key: string]: string | number | undefined;
}

export interface PaginationQuery {
  ids?: number[];
  limit?: number;
  offset?: number;
}

export interface PeriodQuery {
  periodFrom?: string; // YYYY-MM format
  periodTo?: string; // YYYY-MM format
}

export interface SalesHistoryQuery extends PeriodQuery, PaginationQuery {}

export interface GetUserRolesQuery {
  userId?: number;
  roleId?: number;
  tenantId?: number;
}

export interface GetUserShopsQuery {
  userId?: number;
  shopId?: number;
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
