/**
 * Query parameter types
 */

export interface ShopContextParams {
  shop_id: number;
  tenant_id: number;
  [key: string]: string | number | undefined;
}

export interface PeriodQuery {
  period_from?: string; // YYYY-MM format
  period_to?: string; // YYYY-MM format
}

export interface GetUserRolesQuery {
  userId?: number;
  roleId?: number;
  tenantId?: number;
}
