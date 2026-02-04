// Client
export { SalesPlannerClient, ApiError } from './client.js';
export type { ClientConfig } from './client.js';

// Re-export all types from @sales-planner/shared for convenience
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
