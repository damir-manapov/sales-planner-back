// Client
export { SalesPlannerClient, ApiError } from './clients/index.js';
export type { ClientConfig } from './clients/index.js';

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
  CreateSkuRequest,
  UpdateSkuDto,
  ImportSkuItem,
  CreateSalesHistoryDto,
  CreateSalesHistoryRequest,
  UpdateSalesHistoryDto,
  ImportSalesHistoryItem,
  CreateApiKeyDto,
  CreateRoleDto,
  CreateUserRoleDto,
  CreateMarketplaceDto,
  CreateMarketplaceRequest,
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
  // Metadata types
  EntityFieldMetadata,
  EntityMetadata,
  EntitiesMetadata,
  FieldType,
} from '@sales-planner/shared';
