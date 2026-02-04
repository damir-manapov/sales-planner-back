# @sales-planner/http-client

Type-safe HTTP client for the Sales Planner API.

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

// Create API key (key is auto-generated)
const apiKey = await client.createApiKey({
  user_id: 1,
  name: 'Production Key',
  expires_at: '2026-12-31T23:59:59Z'
});

// Import sales history (marketplace field required)
const result = await client.importSalesHistoryJson([
  { sku_code: 'SKU-001', period: '2026-01', quantity: 100, marketplace: 'WB' }
], { shop_id: 1, tenant_id: 1 });
```

## Error Handling

The API returns standard HTTP status codes:
- `409 Conflict` - Duplicate resource (e.g., duplicate email, SKU code, sales period)
- `404 Not Found` - Resource not found
- `403 Forbidden` - Insufficient permissions
- `400 Bad Request` - Validation error

```typescript
try {
  await client.createUser({ email: 'user@example.com', name: 'John' });
} catch (error) {
  if (error.response?.status === 409) {
    console.error('User with this email already exists');
  }
}
```

## Available Methods

### Authentication
- `getMe()` - Get current user with roles and tenants

### Users
- `getUsers()`, `getUser(id)` - System admin or tenant admin (filtered by their tenants)
- `createUser(dto)`, `deleteUser(id)` - Tenant admin or higher

### Tenants
- `getTenants()`, `getTenant(id)` - All authenticated users
- `createTenant(dto)` - System admin only
- `updateTenant(id, dto)`, `deleteTenant(id)` - Authenticated users (validation happens server-side)
- `createTenantWithShopAndUser(dto)` - System admin only

### Shops
- `getShops(tenantId?)`, `getShop(id)`, `createShop(dto)`, `updateShop(id, dto)`, `deleteShop(id)` - Requires tenant access
- `deleteShopData(id)` - Delete all data (SKUs, sales history) for a shop

### SKUs
- `getSkus(ctx)`, `getSku(id, ctx)` - Requires read access (viewer or higher)
- `createSku(dto, ctx)`, `updateSku(id, dto, ctx)`, `deleteSku(id, ctx)` - Requires write access (editor or higher)
- `importSkusJson(items, ctx)`, `importSkusCsv(csvContent, ctx)` - Requires write access
- `exportSkusJson(ctx)`, `exportSkusCsv(ctx)` - Requires read access
- `getSkusExampleJson()`, `getSkusExampleCsv()` - Get import format examples (no auth required)

### Sales History
- `getSalesHistory(ctx, query?)`, `getSalesHistoryItem(id, ctx)` - Requires read access (viewer or higher)
- `createSalesHistory(dto, ctx)`, `updateSalesHistory(id, dto, ctx)`, `deleteSalesHistory(id, ctx)` - Requires write access (editor or higher)
- `importSalesHistoryJson(items, ctx)`, `importSalesHistoryCsv(csvContent, ctx)` - Requires write access
- `exportSalesHistoryJson(ctx, query?)`, `exportSalesHistoryCsv(ctx, query?)` - Requires read access
- `getSalesHistoryExampleJson()`, `getSalesHistoryExampleCsv()` - Get import format examples (no auth required)

### Roles & User Roles
- `getRoles()`, `getRole(id)` - System admin only
- `createRole(dto)`, `updateRole(id, dto)`, `deleteRole(id)` - System admin only
- `createUserRole(dto)`, `deleteUserRole(id)` - Tenant admin or higher for their tenant

### API Keys
- `getApiKeys()`, `createApiKey(dto)`, `deleteApiKey(id)` - System admin only

### Marketplaces
- `getMarketplaces()`, `getMarketplace(id)` - All authenticated users
- `createMarketplace(dto)`, `updateMarketplace(id, dto)`, `deleteMarketplace(id)` - System admin only

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
