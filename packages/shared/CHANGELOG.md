# @sales-planner/shared

## 0.2.0

### Minor Changes

- Add CSV import/export methods for SKUs and Sales History
- Add example endpoint methods (`getSkusExampleJson`, `getSalesHistoryExampleCsv`, etc.)
- Add `updateRole` method
- Add marketplace CRUD methods (`createMarketplace`, `updateMarketplace`, `deleteMarketplace`)
- Add `CreateMarketplaceDto` type

## 0.1.0

### Minor Changes

- Initial release of @sales-planner/shared package

  ## Features

  - **SalesPlannerClient** - Type-safe HTTP client for the Sales Planner API
  - **Entity types** - User, Tenant, Shop, Sku, SalesHistory, Role, ApiKey, Marketplace
  - **DTO types** - CreateUserDto, CreateTenantDto, CreateShopDto, and more
  - **Response types** - UserWithRolesAndTenants, ImportResult, etc.
  - **Query types** - ShopContextParams, PeriodQuery

  ## Client Methods

  - Authentication: `getMe()`
  - Users: CRUD operations
  - Tenants: CRUD + `createTenantWithShopAndUser()`
  - Shops: CRUD + `deleteShopData()`
  - SKUs: CRUD + JSON/CSV import/export + examples
  - Sales History: CRUD + JSON/CSV import/export + examples
  - Roles & User Roles: CRUD
  - API Keys: CRUD
  - Marketplaces: CRUD
