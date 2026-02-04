# @sales-planner/http-client

TypeScript HTTP client for the Sales Planner API with full type safety.

## Installation

```bash
pnpm add @sales-planner/http-client
```

## Usage

### Quick Start

```typescript
import { SalesPlannerClient } from '@sales-planner/http-client';

const client = new SalesPlannerClient({
  baseUrl: 'https://sales-planner-back.vercel.app',
  getAuthToken: () => 'your-api-key',
});

// Check if API is healthy
const health = await client.getHealth();
console.log(health); // { status: 'ok', version: '1.0.0' }
```

### API Styles

The client supports two complementary API styles:

#### 1. **Namespaced API** (Recommended)

Access resources through domain-specific sub-clients:

```typescript
// Users
const users = await client.users.getUsers();
const user = await client.users.getUser(1);

// Tenants & Shops
const tenants = await client.tenants.getTenants();
const shops = await client.shops.getShops(tenantId);

// SKUs with import/export
const skus = await client.skus.getSkus({ tenantId, shopId });
await client.skus.importSkusJson(items, { tenantId, shopId });
const csv = await client.skus.exportSkusCsv({ tenantId, shopId });

// Sales History
const history = await client.salesHistory.getSalesHistory(
  { tenantId, shopId },
  { start: '2024-01', end: '2024-12' }
);

// Marketplaces
const marketplaces = await client.marketplaces.getMarketplaces({ tenantId });
```

**Benefits:**
- Clear domain separation
- IDE autocomplete by domain
- Easier to discover related methods

#### 2. **Flat API** (Backward Compatible)

Access all methods directly on the client:

```typescript
// Backward compatible with existing code
const users = await client.getUsers();
const user = await client.getUser(1);
const skus = await client.getSkus({ tenantId, shopId });
```

## Import/Export Pattern

Resources that support bulk operations (SKUs, Sales History, Marketplaces) follow a consistent pattern:

```typescript
// Import from JSON
const result = await client.skus.importSkusJson(
  [
    { code: 'SKU-001', title: 'Product 1' },
    { code: 'SKU-002', title: 'Product 2' },
  ],
  { tenantId, shopId }
);
// Returns: { inserted: 2, updated: 0, errors: [] }

// Import from CSV file
const csvContent = await fs.readFile('skus.csv', 'utf-8');
const result = await client.skus.importSkusCsv(csvContent, { tenantId, shopId });

// Export to CSV
const csv = await client.skus.exportSkusCsv({ tenantId, shopId });

// Get example templates
const exampleCsv = await client.skus.getSkusExampleCsv();
```

## Error Handling

```typescript
import { ApiError } from '@sales-planner/http-client';

try {
  await client.users.getUser(999);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}: ${error.message}`);
  }
}
```

Common HTTP status codes:
- `409 Conflict` - Duplicate resource (email, SKU code, sales period)
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
