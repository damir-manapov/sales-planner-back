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
  apiKey: 'your-api-key',
});

// Check if API is healthy
const health = await client.getHealth();
console.log(health); // { status: 'ok', version: '1.0.0' }
```

### Shop Context

Most operations require a shop context (`ctx`) as the **first argument**:

```typescript
const ctx = { tenant_id: 1, shop_id: 1 };

// All entity methods follow: client.<entity>.<method>(ctx, ...args)
const skus = await client.skus.getSkus(ctx);
const sku = await client.skus.getSku(ctx, 123);
const brand = await client.brands.getBrandByCode(ctx, 'apple');
```

### Namespaced Sub-Clients

Access resources through domain-specific sub-clients:

```typescript
// Users (system-level, no ctx)
const users = await client.users.getUsers();
const user = await client.users.getUser(1);

// Tenants (system-level, no ctx)
const tenants = await client.tenants.getTenants();

// Shops (tenant-level)
const shops = await client.shops.getShops(tenantId);

// Shop-scoped entities (require ctx)
const ctx = { tenant_id: 1, shop_id: 1 };

// SKUs
const skus = await client.skus.getSkus(ctx);
await client.skus.createSku(ctx, { code: 'SKU-001', title: 'Product 1' });
await client.skus.importJson(ctx, items);
const csv = await client.skus.exportCsv(ctx);

// Brands
const brands = await client.brands.getBrands(ctx);
await client.brands.importJson(ctx, [{ code: 'apple', title: 'Apple' }]);

// Categories, Groups, Statuses, Suppliers - same pattern
const categories = await client.categories.getCategories(ctx);
const groups = await client.groups.getGroups(ctx);
const statuses = await client.statuses.getStatuses(ctx);
const suppliers = await client.suppliers.getSuppliers(ctx);

// Marketplaces
const marketplaces = await client.marketplaces.getMarketplaces(ctx);

// Sales History (with optional period filter)
const history = await client.salesHistory.getSalesHistory(ctx, {
  start: '2024-01',
  end: '2024-12',
});

// Entity Metadata (no auth required)
const metadata = await client.metadata.getEntitiesMetadata();
```

## API Conventions

### Argument Order

All methods follow a consistent pattern: **context first, then other arguments**.

```typescript
// Get by ID
await client.skus.getSku(ctx, id);
await client.brands.getBrand(ctx, id);

// Get by code
await client.skus.getSkuByCode(ctx, code);
await client.brands.getBrandByCode(ctx, code);

// Create
await client.skus.createSku(ctx, request);
await client.brands.createBrand(ctx, request);

// Update
await client.skus.updateSku(ctx, id, request);
await client.brands.updateBrand(ctx, id, request);

// Delete
await client.skus.deleteSku(ctx, id);
await client.brands.deleteBrand(ctx, id);

// Import
await client.skus.importJson(ctx, items);
await client.skus.importCsv(ctx, csvContent);

// Export
await client.skus.exportJson(ctx);
await client.skus.exportCsv(ctx);
```

### IDs vs Codes

- **Create/Update operations** use numeric IDs for references (e.g., `marketplace_id`)
- **Import/Export operations** use string codes for human readability (e.g., `marketplace: 'amazon'`)

```typescript
// Create uses IDs
await client.salesHistory.createSalesHistory(ctx, {
  sku_id: 123,
  marketplace_id: 1,
  period: '2026-01',
  quantity: 100,
});

// Import uses codes (auto-resolves to IDs)
await client.salesHistory.importJson(ctx, [
  { sku: 'SKU-001', marketplace: 'amazon', period: '2026-01', quantity: 100 },
]);

// Export returns codes
const exported = await client.salesHistory.exportJson(ctx);
// [{ sku: 'SKU-001', marketplace: 'amazon', period: '2026-01', quantity: 100 }]
```

## Import/Export Pattern

All shop-scoped entities support bulk import/export:

```typescript
const ctx = { tenant_id: 1, shop_id: 1 };

// Import from JSON array
const result = await client.skus.importJson(ctx, [
  { code: 'SKU-001', title: 'Product 1' },
  { code: 'SKU-002', title: 'Product 2' },
]);
console.log(result); // { created: 2, updated: 0, errors: [] }

// Import from CSV string
const csvContent = `code,title
SKU-001,Product 1
SKU-002,Product 2`;
const result = await client.skus.importCsv(ctx, csvContent);

// Export to JSON
const items = await client.skus.exportJson(ctx);

// Export to CSV
const csv = await client.skus.exportCsv(ctx);

// Get example templates (no auth required)
const exampleJson = await client.skus.getExampleJson();
const exampleCsv = await client.skus.getExampleCsv();
```

**Supported entities:** SKUs, Brands, Categories, Groups, Statuses, Suppliers, Marketplaces, Sales History

## Data Requirements

### SKUs

| Field | Create/Import | Update | Export |
|-------|---------------|--------|--------|
| `code` | Required, unique per shop | Optional | ✓ |
| `title` | Required | Optional | ✓ |
| `title2` | Optional | Optional | ✓ |
| `category` | Optional (code) | - | code |
| `group` | Optional (code) | - | code |
| `status` | Optional (code) | - | code |
| `supplier` | Optional (code) | - | code |

### Brands, Categories, Groups, Statuses, Suppliers

| Field | Create/Import | Update | Export |
|-------|---------------|--------|--------|
| `code` | Required, unique per shop | Optional | ✓ |
| `title` | Required | Optional | ✓ |

### Marketplaces

| Field | Create/Import | Update | Export |
|-------|---------------|--------|--------|
| `code` | Required, unique per shop | Optional | ✓ |
| `title` | Required | Optional | ✓ |

### Sales History

| Field | Create | Import | Update | Export |
|-------|--------|--------|--------|--------|
| `sku_id` | Required | - | Optional | - |
| `sku` | - | Required (code) | - | code |
| `marketplace_id` | Required | - | Optional | - |
| `marketplace` | - | Required (code) | - | code |
| `period` | Required (YYYY-MM) | Required | Optional | ✓ |
| `quantity` | Required | Required | Optional | ✓ |

### Users

| Field | Create | Update |
|-------|--------|--------|
| `email` | Required, unique | Optional |
| `name` | Required | Optional |
| `default_shop_id` | Optional | Optional (null to clear) |

### Tenants

| Field | Create | Update |
|-------|--------|--------|
| `title` | Required | Optional |
| `owner_id` | Optional | Optional (null to clear) |

### Shops

| Field | Create | Update |
|-------|--------|--------|
| `title` | Required | Optional |
| `tenant_id` | Required | - |

## Available Sub-Clients

### System-Level (no context required)

#### `client.me`
- `getMe()` - Get current user with roles and tenants

#### `client.users`
- `getUsers()` - List users (system admin sees all, tenant admin sees their tenants)
- `getUser(id)` - Get user by ID
- `createUser(request)` - Create user
- `updateUser(id, request)` - Update user
- `deleteUser(id)` - Delete user

#### `client.tenants`
- `getTenants()` - List tenants
- `getTenant(id)` - Get tenant by ID
- `createTenant(request)` - Create tenant (system admin only)
- `updateTenant(id, request)` - Update tenant
- `deleteTenant(id)` - Delete tenant
- `createTenantWithShopAndUser(request)` - Create tenant with initial shop and user

#### `client.shops`
- `getShops(tenantId?)` - List shops (optionally filtered by tenant)
- `getShop(id)` - Get shop by ID
- `createShop(request)` - Create shop
- `updateShop(id, request)` - Update shop
- `deleteShop(id)` - Delete shop
- `deleteShopData(id)` - Delete all data (SKUs, sales history) for a shop

#### `client.roles`
- `getRoles()` - List roles (system admin only)
- `getRole(id)` - Get role by ID

#### `client.userRoles`
- `getUserRoles(query)` - List user roles
- `getUserRole(id)` - Get user role by ID
- `createUserRole(request)` - Create user role
- `deleteUserRole(id)` - Delete user role

#### `client.apiKeys`
- `getApiKeys()` - List API keys (system admin only)
- `createApiKey(request)` - Create API key
- `deleteApiKey(id)` - Delete API key

#### `client.metadata`
- `getEntitiesMetadata()` - Get field definitions for all entities (no auth)

### Shop-Scoped (context required)

All shop-scoped clients follow the same pattern:

#### `client.skus`
- `getSkus(ctx)` - List SKUs
- `getSku(ctx, id)` - Get SKU by ID
- `getSkuByCode(ctx, code)` - Get SKU by code
- `createSku(ctx, request)` - Create SKU
- `updateSku(ctx, id, request)` - Update SKU
- `deleteSku(ctx, id)` - Delete SKU
- `importJson(ctx, items)` - Import from JSON array
- `importCsv(ctx, csvContent)` - Import from CSV string
- `exportJson(ctx)` - Export to JSON
- `exportCsv(ctx)` - Export to CSV
- `getExampleJson()` - Get JSON import example (no auth)
- `getExampleCsv()` - Get CSV import example (no auth)

#### `client.brands`, `client.categories`, `client.groups`, `client.statuses`, `client.suppliers`

Same methods as `client.skus`:
- `get<Entity>s(ctx)`, `get<Entity>(ctx, id)`, `get<Entity>ByCode(ctx, code)`
- `create<Entity>(ctx, request)`, `update<Entity>(ctx, id, request)`, `delete<Entity>(ctx, id)`
- `importJson(ctx, items)`, `importCsv(ctx, csvContent)`
- `exportJson(ctx)`, `exportCsv(ctx)`
- `getExampleJson()`, `getExampleCsv()`

#### `client.marketplaces`
- `getMarketplaces(ctx)` - List marketplaces
- `getMarketplace(ctx, id)` - Get marketplace by ID
- `getMarketplaceByCode(ctx, code)` - Get marketplace by code
- `createMarketplace(ctx, request)` - Create marketplace
- `updateMarketplace(ctx, id, request)` - Update marketplace
- `deleteMarketplace(ctx, id)` - Delete marketplace
- `importJson(ctx, items)`, `importCsv(ctx, csvContent)` - Import
- `exportJson(ctx)`, `exportCsv(ctx)` - Export

#### `client.salesHistory`
- `getSalesHistory(ctx, query?)` - List sales history (optional period filter)
- `getSalesHistoryItem(ctx, id)` - Get sales history item by ID
- `createSalesHistory(ctx, request)` - Create sales history
- `updateSalesHistory(ctx, id, request)` - Update sales history
- `deleteSalesHistory(ctx, id)` - Delete sales history
- `importJson(ctx, items)`, `importCsv(ctx, csvContent)` - Import
- `exportJson(ctx, query?)`, `exportCsv(ctx, query?)` - Export (optional period filter)
- `getExampleJson()`, `getExampleCsv()` - Examples (no auth)

## Error Handling

```typescript
import { SalesPlannerClient, ApiError } from '@sales-planner/http-client';

try {
  const user = await client.users.getUser(999);
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.status); // 404
    console.log(error.message); // "User not found"
  }
}
```

**Common HTTP status codes:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid API key
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource (email, code, period)

## Types

Types are re-exported from `@sales-planner/shared`:

```typescript
import type {
  // Context
  ShopContextParams,
  PeriodQuery,

  // Entities
  User,
  Tenant,
  Shop,
  Sku,
  Brand,
  Category,
  Group,
  Status,
  Supplier,
  Marketplace,
  SalesHistory,
  Role,
  UserRole,
  ApiKey,

  // Request types (for create/update)
  CreateUserRequest,
  UpdateUserRequest,
  CreateTenantRequest,
  UpdateTenantRequest,
  CreateShopRequest,
  UpdateShopRequest,
  CreateSkuRequest,
  UpdateSkuRequest,
  CreateBrandRequest,
  UpdateBrandRequest,
  CreateSalesHistoryRequest,
  UpdateSalesHistoryRequest,
  // ... etc

  // Import types (for import operations)
  ImportSkuItem,
  ImportBrandItem,
  ImportSalesHistoryItem,
  // ... etc

  // Response types
  UserWithRolesAndTenants,
  TenantWithShopAndApiKey,
  ImportResult,
  SkuImportResult,
  DeleteDataResult,

  // Export types
  SkuExportItem,
  SalesHistoryExportItem,
} from '@sales-planner/http-client';
```

## License

MIT
