# @sales-planner/shared

Shared types and DTOs for the Sales Planner API.

> **For the HTTP client**: Use `@sales-planner/http-client` - it includes this package as a dependency.

## Installation

```bash
npm install @sales-planner/shared
# or
pnpm add @sales-planner/shared
```

## Usage

This package provides TypeScript types only (no runtime code). Types are the single source of truth and are validated at compile-time against the API's Zod schemas.

## Type System

The package provides two type variants for each operation:

**Request Types** - Used at HTTP boundary (may omit context fields):
```typescript
export interface CreateSkuRequest {
  code: string;
  title: string;
  // shop_id, tenant_id omitted - injected by API
}
```

**DTO Types** - Used in service layer (full data model):
```typescript
export interface CreateSkuDto {
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
}
```

For entities where Request and DTO are identical, Request is a type alias:
```typescript
export interface CreateUserDto {
  email: string;
  name: string;
}
export type CreateUserRequest = CreateUserDto;
```

## Usage

```typescript
import type { 
  // Entities
  User, Tenant, Shop, Sku, Brand, SalesHistory,
  Role, UserRole, ApiKey, Marketplace,

  // Request types (HTTP layer)
  CreateUserRequest, UpdateUserRequest,
  CreateSkuRequest, UpdateSkuRequest,
  CreateBrandRequest, UpdateBrandRequest,
  CreateSalesHistoryRequest, UpdateSalesHistoryRequest,

  // DTO types (Service layer)
  CreateUserDto, UpdateUserDto,
  CreateSkuDto, UpdateSkuDto,
  CreateBrandDto, UpdateBrandDto,
  CreateSalesHistoryDto, UpdateSalesHistoryDto,

  // Import types
  ImportSkuItem, ImportBrandItem, ImportSalesHistoryItem, ImportMarketplaceItem,

  // Query types
  ShopContextParams, PeriodQuery,

  // Response types
  UserWithRolesAndTenants, TenantWithShopAndApiKey,
  ImportResult, DeleteDataResult,
  SkuExportItem, BrandExportItem, SalesHistoryExportItem
} from '@sales-planner/shared';
```

## Marketplace IDs vs Codes

The API uses **numeric IDs** internally for referential integrity:
- `CreateSalesHistoryRequest.marketplace_id: number` - API uses numeric foreign keys
- Import/Export use **marketplace codes** (strings) for user convenience
- This pattern matches SKUs: IDs internally, codes for import/export

## Types Reference

### Entities

| Type | Description |
|------|-------------|
| `User` | User account |
| `Tenant` | Organization/company |
| `Shop` | Store within a tenant |
| `Sku` | Stock keeping unit (product variant) |
| `Brand` | Product brand (shop-scoped) |
| `SalesHistory` | Sales record for a period (uses numeric marketplace_id) |
| `Role` | Access role |
| `UserRole` | User-role assignment |
| `ApiKey` | API authentication key |
| `Marketplace` | E-commerce platform (numeric ID, shop-scoped) |

### Query Types

| Type | Description |
|------|-------------|
| `ShopContextParams` | `{ shop_id: number; tenant_id: number }` |
| `PeriodQuery` | `{ period_from?: string; period_to?: string }` |

### Response Types

| Type | Description |
|------|-------------|
| `UserWithRolesAndTenants` | User with their roles and tenants |
| `TenantWithShopAndApiKey` | Created tenant with shop and API key |
| `ImportResult` | `{ created: number; updated: number; errors: string[] }` |
| `DeleteDataResult` | `{ deletedSkus: number; deletedSalesHistory: number }` |

## Related Packages

- `@sales-planner/http-client` - HTTP client for the API (includes this package)

## License

MIT
