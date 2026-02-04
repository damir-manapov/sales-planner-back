# @sales-planner/shared

Shared types and DTOs for the Sales Planner API.

> **Note**: For the HTTP client, use `@sales-planner/http-client` instead.

## Installation

```bash
npm install @sales-planner/shared
# or
pnpm add @sales-planner/shared
```

## Usage

This package provides TypeScript types only (no runtime code).

```typescript
import type { 
  // Entities
  User, Tenant, Shop, Sku, SalesHistory,
  Role, UserRole, ApiKey, Marketplace,
  
  // DTOs
  CreateUserDto, CreateTenantDto, CreateShopDto,
  CreateSkuDto, UpdateSkuDto, ImportSkuItem,
  CreateSalesHistoryDto, UpdateSalesHistoryDto, ImportSalesHistoryItem,
  CreateApiKeyDto, CreateRoleDto, CreateUserRoleDto, CreateMarketplaceDto,
  
  // Query types
  ShopContextParams, PeriodQuery,
  
  // Response types
  UserWithRolesAndTenants, TenantWithShopAndApiKey,
  ImportResult, DeleteDataResult,
  SkuExportItem, SalesHistoryExportItem
} from '@sales-planner/shared';
```

## Types Reference

### Entities

| Type | Description |
|------|-------------|
| `User` | User account |
| `Tenant` | Organization/company |
| `Shop` | Store within a tenant |
| `Sku` | Stock keeping unit |
| `SalesHistory` | Sales record for a period |
| `Role` | Access role |
| `UserRole` | User-role assignment |
| `ApiKey` | API authentication key |
| `Marketplace` | E-commerce platform |

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
