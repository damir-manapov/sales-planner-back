# @sales-planner/shared

Shared types, DTOs, and entities for the Sales Planner API. This package provides the single source of truth for all TypeScript types used across the API and HTTP client.

> **For the HTTP client**: Use `@sales-planner/http-client` - it includes this package as a dependency.

## Installation

```bash
pnpm add @sales-planner/shared
```

## Overview

This package provides TypeScript types only (no runtime code). Types are the single source of truth and are validated at compile-time against the API's Zod schemas.

### Request vs DTO pattern

The package provides two type variants for each operation:

**Request Types** — used at the HTTP boundary (may omit context fields injected by the API):

```typescript
export interface CreateSkuRequest {
  code: string;
  title: string;
  title2?: string;
  // shopId, tenantId omitted — injected by the API
}
```

**DTO Types** — used in the service layer (full data model):

```typescript
export interface CreateSkuDto extends CreateSkuRequest {
  shopId: number;
  tenantId: number;
}
```

For entities where Request and DTO are identical, Request is a type alias:

```typescript
export interface CreateUserDto { email: string; name: string; }
export type CreateUserRequest = CreateUserDto;
```

## Types Reference

### Entities

| Type | Description |
| --- | --- |
| `ShopScopedBaseEntity` | Base — `id`, `shopId`, `tenantId`, `createdAt`, `updatedAt` |
| `CodedShopScopedEntity` | Extends base + `code`, `title` |
| `User` | `id`, `email`, `name`, `defaultShopId`, `createdAt`, `updatedAt` |
| `Tenant` | `id`, `title`, `ownerId`, `createdBy`, `createdAt`, `updatedAt` |
| `Shop` | `id`, `title`, `tenantId`, `createdAt`, `updatedAt` |
| `Sku` | Extends `CodedShopScopedEntity` + `title2`, `categoryId`, `groupId`, `statusId`, `supplierId` |
| `Brand` | `CodedShopScopedEntity` |
| `Category` | `CodedShopScopedEntity` |
| `Group` | `CodedShopScopedEntity` |
| `Status` | `CodedShopScopedEntity` |
| `Supplier` | `CodedShopScopedEntity` |
| `Warehouse` | `CodedShopScopedEntity` |
| `Marketplace` | `CodedShopScopedEntity` |
| `SalesHistory` | `id`, `skuId`, `marketplaceId`, `period`, `quantity`, `shopId`, `tenantId` |
| `Leftover` | `id`, `skuId`, `warehouseId`, `period`, `quantity`, `shopId`, `tenantId` |
| `SeasonalCoefficient` | `id`, `groupId`, `month`, `coefficient`, `shopId`, `tenantId` |
| `CompetitorProduct` | `id`, `marketplaceId`, `marketplaceProductId`, `title`, `brand`, `shopId`, `tenantId` |
| `SkuCompetitorMapping` | `id`, `skuId`, `competitorProductId`, `shopId`, `tenantId` |
| `CompetitorSale` | `id`, `competitorProductId`, `period`, `quantity`, `shopId`, `tenantId` |
| `Role` | Predefined, read-only — `id`, `name`, `description` |
| `ApiKey` | `id`, `userId`, `key`, `name`, `expiresAt`, `lastUsedAt` |

### Computed Entities (Read-Only)

| Type | Description |
| --- | --- |
| `SkuMetrics` | Materialized view — `skuId`, `skuCode`, `skuTitle`, `abcClass` (`A`/`B`/`C`), `salesRank`, `daysOfStock`, `lastPeriodSales`, `currentStock`, `computedAt`, etc. |
| `SkuMetricsExportItem` | Export-friendly — `code`, `title`, `group`, `category`, `abcClass`, `salesRank`, `daysOfStock`, etc. |

### DTOs — System

| Type | Description |
| --- | --- |
| `CreateUserDto` / `CreateUserRequest` | `email`, `name`, `defaultShopId?` |
| `UpdateUserDto` / `UpdateUserRequest` | `email?`, `name?`, `defaultShopId?` |
| `CreateTenantDto` | `title`, `ownerId?`, `createdBy` |
| `CreateTenantRequest` | `title`, `ownerId?` |
| `UpdateTenantDto` / `UpdateTenantRequest` | `title?` |
| `CreateTenantWithShopDto` / `CreateTenantWithShopRequest` | `tenantTitle`, `shopTitle?`, `userEmail`, `userName?` (defaults to `userEmail`) |
| `CreateShopDto` / `CreateShopRequest` | `title`, `tenantId` |
| `UpdateShopDto` / `UpdateShopRequest` | `title?` |
| `CreateApiKeyDto` / `CreateApiKeyRequest` | `userId`, `name?`, `expiresAt?` |
| `UpdateApiKeyDto` / `UpdateApiKeyRequest` | `name?`, `expiresAt?` |
| `CreateUserRoleDto` / `CreateUserRoleRequest` | `userId`, `roleId`, `tenantId`, `shopId?` |

### DTOs — Shop-Scoped

Base DTO types for coded entities:

| Type | Description |
| --- | --- |
| `CodedTitledCreateDto` | `code`, `title` |
| `CodedTitledUpdateDto` | `code?`, `title?` |
| `CodedTitledImportItem` | `code`, `title` + index signature |

Each of `Brand`, `Category`, `Group`, `Status`, `Supplier`, `Warehouse`, `Marketplace` exports `Create*Dto`, `Create*Request`, `Update*Dto`, `Update*Request`, `Import*Item` as aliases of the base types.

| Type | Description |
| --- | --- |
| `CreateSkuDto` / `CreateSkuRequest` | `code`, `title`, `title2?`, `categoryId?`, `groupId?`, `statusId?`, `supplierId?` |
| `UpdateSkuDto` / `UpdateSkuRequest` | Same fields, all optional |
| `ImportSkuItem` | Uses string codes — `category?`, `group?`, `status?`, `supplier?` |
| `CreateSalesHistoryDto` / `CreateSalesHistoryRequest` | `skuId`, `marketplaceId`, `period`, `quantity` |
| `UpdateSalesHistoryDto` | `quantity?` |
| `ImportSalesHistoryItem` | `sku` (code), `marketplace` (code), `period`, `quantity` |
| `CreateLeftoverDto` / `CreateLeftoverRequest` | `skuId`, `warehouseId`, `period`, `quantity` |
| `UpdateLeftoverDto` | `quantity?` |
| `ImportLeftoverItem` | `sku` (code), `warehouse` (code), `period`, `quantity` |
| `CreateSeasonalCoefficientDto` / `CreateSeasonalCoefficientRequest` | `groupId`, `month`, `coefficient` |
| `UpdateSeasonalCoefficientDto` | `coefficient?` |
| `ImportSeasonalCoefficientItem` | `group` (code), `month`, `coefficient` |
| `CreateCompetitorProductDto` / `CreateCompetitorProductRequest` | `marketplaceId`, `marketplaceProductId`, `title?`, `brand?` |
| `UpdateCompetitorProductDto` | `title?`, `brand?` |
| `ImportCompetitorProductItem` | `marketplace` (code), `marketplaceProductId`, `title?`, `brand?` |
| `CreateSkuCompetitorMappingDto` / `CreateSkuCompetitorMappingRequest` | `skuId`, `competitorProductId` |
| `UpdateSkuCompetitorMappingDto` | `competitorProductId?` |
| `ImportSkuCompetitorMappingItem` | `sku` (code), `marketplace` (code), `marketplaceProductId` |
| `CreateCompetitorSaleDto` / `CreateCompetitorSaleRequest` | `competitorProductId`, `period`, `quantity` |
| `UpdateCompetitorSaleDto` | `quantity?` |
| `ImportCompetitorSaleItem` | `marketplace` (code), `marketplaceProductId`, `period`, `quantity` |

### Query Types

| Type | Description |
| --- | --- |
| `ShopContextParams` | `{ shopId: number; tenantId: number }` |
| `PaginationQuery` | `{ limit?: number; offset?: number; ids?: number[] }` |
| `PeriodQuery` | `{ periodFrom?: string; periodTo?: string }` — YYYY-MM |
| `SalesHistoryQuery` | `PaginationQuery & PeriodQuery` |
| `LeftoverQuery` | `PaginationQuery & PeriodQuery` |
| `CompetitorSaleQuery` | `PaginationQuery & PeriodQuery` |
| `PaginatedResponse<T>` | `{ items: T[]; total: number; limit: number; offset: number }` |
| `GetUserRolesQuery` | `{ userId?: number; roleId?: number; tenantId?: number }` |

### Response Types

| Type | Description |
| --- | --- |
| `UserWithRolesAndTenants` | User + `roles: UserRole[]`, `tenants: TenantInfo[]` |
| `UserRole` | `id`, `roleName`, `tenantId`, `tenant_title`, `shopId`, `shop_title` |
| `TenantInfo` | `id`, `title`, `isOwner`, `shops: ShopInfo[]` |
| `ShopInfo` | `id`, `title` |
| `TenantWithShopAndApiKey` | `tenant: Tenant`, `shop: { id, title, tenantId }`, `user: { id, email, name }`, `apiKey: string` |
| `UserRoleResponse` | `id`, `userId`, `roleId`, `tenantId`, `shopId` |
| `ImportResult` | `{ created: number; updated: number; errors: string[] }` |
| `SkuImportResult` | Extends `ImportResult` + `categoriesCreated`, `groupsCreated`, `statusesCreated`, `suppliersCreated` |
| `SalesHistoryImportResult` | Extends `ImportResult` + `marketplacesCreated`, `skusCreated` |
| `DeleteDataResult` | Counts for all entity types deleted (14 number fields) |

### Export Types

| Type | Description |
| --- | --- |
| `SkuExportItem` | `code`, `title`, `title2?`, `category?`, `group?`, `status?`, `supplier?` |
| `BrandExportItem` | `= CodedTitledItem` |
| `CategoryExportItem` | `= CodedTitledItem` |
| `GroupExportItem` | `= CodedTitledItem` |
| `StatusExportItem` | `= CodedTitledItem` |
| `SupplierExportItem` | `= CodedTitledItem` |
| `WarehouseExportItem` | `= CodedTitledItem` |
| `MarketplaceExportItem` | `= CodedTitledItem` |
| `SalesHistoryExportItem` | `sku`, `marketplace`, `period`, `quantity` |
| `LeftoverExportItem` | `sku`, `warehouse`, `period`, `quantity` |
| `SeasonalCoefficientExportItem` | `group`, `month`, `coefficient` |
| `CompetitorProductExportItem` | `marketplace`, `marketplaceProductId`, `title?`, `brand?` |
| `SkuCompetitorMappingExportItem` | `sku`, `marketplace`, `marketplaceProductId`, `title?` |
| `CompetitorSaleExportItem` | `marketplace`, `marketplaceProductId`, `period`, `quantity` |

### Metadata Types

| Type | Description |
| --- | --- |
| `FieldType` | `'string' \| 'number' \| 'date' \| 'period'` |
| `EntityFieldMetadata` | `name`, `type`, `description`, `required`, `example?` |
| `EntityMetadata` | `name`, `description`, `fields: EntityFieldMetadata[]` |
| `EntitiesMetadata` | Record with keys for all 14 shop-scoped entities → `EntityMetadata` |
| `ENTITIES_METADATA` | **const** — the populated metadata object (only runtime export) |

## Marketplace IDs vs Codes

The API uses **numeric IDs** internally for referential integrity:
- `CreateSalesHistoryRequest.marketplaceId: number` — API uses numeric foreign keys
- Import/Export use **marketplace codes** (strings) for user convenience
- This pattern matches SKUs: IDs internally, codes for import/export

## Related Packages

- `@sales-planner/http-client` — HTTP client for the API (includes this package)
- `@sales-planner/react` — React hooks powered by TanStack Query

## License

MIT
