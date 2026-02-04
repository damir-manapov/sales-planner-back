// Re-export client and types from @sales-planner/shared
export { SalesPlannerClient, ApiError } from '@sales-planner/shared';
export type { ClientConfig } from '@sales-planner/shared';

// Re-export all types for convenience
export type {
  // Entities
  User,
  Tenant,
  Shop,
  Sku,
  SalesHistory,
  Role,
  UserRole,
  ApiKey,
  Marketplace,
  // DTOs
  CreateUserDto,
  CreateTenantDto,
  CreateTenantWithShopDto,
  CreateShopDto,
  CreateSkuDto,
  UpdateSkuDto,
  ImportSkuItem,
  CreateSalesHistoryDto,
  UpdateSalesHistoryDto,
  ImportSalesHistoryItem,
  CreateApiKeyDto,
  CreateRoleDto,
  CreateUserRoleDto,
  CreateMarketplaceDto,
  // Query types
  ShopContextParams,
  PeriodQuery,
  // Response types
  UserWithRolesAndTenants,
  TenantWithShopAndApiKey,
  ImportResult,
  DeleteDataResult,
  SkuExportItem,
  SalesHistoryExportItem,
} from '@sales-planner/shared';
