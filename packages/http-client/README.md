# @sales-planner/http-client

Type-safe HTTP client for the Sales Planner API.

> This package re-exports the client from `@sales-planner/shared`. You can use either package.

## Installation

```bash
npm install @sales-planner/http-client
# or
pnpm add @sales-planner/http-client
```

## Usage

```typescript
import { SalesPlannerClient } from '@sales-planner/http-client';

const client = new SalesPlannerClient({
  baseUrl: 'https://sales-planner-back.vercel.app',
  apiKey: 'your-api-key'
});

// Get current user
const me = await client.getMe();

// Get shops
const shops = await client.getShops();

// Get SKUs for a shop
const skus = await client.getSkus({ shop_id: 1, tenant_id: 1 });

// Import sales history
const result = await client.importSalesHistoryJson([
  { sku_code: 'SKU-001', period: '2026-01', quantity: 100 }
], { shop_id: 1, tenant_id: 1 });
```

## Available Methods

### Authentication
- `getMe()` - Get current user with roles and tenants

### Users
- `getUsers()`, `getUser(id)`, `createUser(dto)`, `deleteUser(id)`

### Tenants
- `getTenants()`, `getTenant(id)`, `createTenant(dto)`, `updateTenant(id, dto)`, `deleteTenant(id)`
- `createTenantWithShopAndUser(dto)` - Create tenant with shop and user in one call

### Shops
- `getShops(tenantId?)`, `getShop(id)`, `createShop(dto)`, `updateShop(id, dto)`, `deleteShop(id)`
- `deleteShopData(id)` - Delete all data (SKUs, sales history) for a shop

### SKUs
- `getSkus(ctx)`, `getSku(id, ctx)`, `createSku(dto, ctx)`, `updateSku(id, dto, ctx)`, `deleteSku(id, ctx)`
- `importSkusJson(items, ctx)`, `importSkusCsv(csvContent, ctx)`
- `exportSkusJson(ctx)`, `exportSkusCsv(ctx)`
- `getSkusExampleJson()`, `getSkusExampleCsv()` - Get import format examples

### Sales History
- `getSalesHistory(ctx, query?)`, `getSalesHistoryItem(id, ctx)`
- `createSalesHistory(dto, ctx)`, `updateSalesHistory(id, dto, ctx)`, `deleteSalesHistory(id, ctx)`
- `importSalesHistoryJson(items, ctx)`, `importSalesHistoryCsv(csvContent, ctx)`
- `exportSalesHistoryJson(ctx, query?)`, `exportSalesHistoryCsv(ctx, query?)`
- `getSalesHistoryExampleJson()`, `getSalesHistoryExampleCsv()` - Get import format examples

### Roles & User Roles
- `getRoles()`, `getRole(id)`, `createRole(dto)`, `updateRole(id, dto)`, `deleteRole(id)`
- `createUserRole(dto)`, `deleteUserRole(id)`

### API Keys
- `getApiKeys()`, `createApiKey(dto)`, `deleteApiKey(id)`

### Marketplaces
- `getMarketplaces()`, `getMarketplace(id)`, `createMarketplace(dto)`, `updateMarketplace(id, dto)`, `deleteMarketplace(id)`

## Error Handling

```typescript
import { SalesPlannerClient, ApiError } from '@sales-planner/http-client';

try {
  const user = await client.getUser(999);
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.status); // 404
    console.log(error.message); // "User not found"
  }
}
```

## Types

All entity types, DTOs, and response types are exported:

```typescript
import type { 
  User, Tenant, Shop, Sku, SalesHistory,
  CreateUserDto, CreateTenantDto, CreateShopDto,
  ShopContextParams, PeriodQuery,
  UserWithRolesAndTenants, ImportResult
} from '@sales-planner/http-client';
```

## License

MIT
