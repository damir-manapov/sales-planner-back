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

### Namespaced Sub-Clients

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
await client.skus.importJson(items, { tenantId, shopId });
const csv = await client.skus.exportCsv({ tenantId, shopId });

// Brands with import/export
const brands = await client.brands.getBrands({ tenantId, shopId });
await client.brands.importJson(items, { tenantId, shopId });
const brandsCsv = await client.brands.exportCsv({ tenantId, shopId });

// Categories with import/export
const categories = await client.categories.getCategories({ tenantId, shopId });
await client.categories.importJson(items, { tenantId, shopId });

// Groups with import/export
const groups = await client.groups.getGroups({ tenantId, shopId });
await client.groups.importJson(items, { tenantId, shopId });

// Statuses with import/export
const statuses = await client.statuses.getStatuses({ tenantId, shopId });
await client.statuses.importJson(items, { tenantId, shopId });

// Suppliers with import/export
const suppliers = await client.suppliers.getSuppliers({ tenantId, shopId });
await client.suppliers.importJson(items, { tenantId, shopId });
const suppliersCsv = await client.suppliers.exportCsv({ tenantId, shopId });

// Sales History
const history = await client.salesHistory.getSalesHistory(
  { tenantId, shopId },
  { start: '2024-01', end: '2024-12' }
);

// Marketplaces
const marketplaces = await client.marketplaces.getMarketplaces({ tenantId });

// Entity Metadata (for UI documentation)
const metadata = await client.metadata.getEntitiesMetadata();
// Returns field definitions for brands, categories, groups, statuses, suppliers, marketplaces, skus, sales history
```

## Import/Export Pattern

Resources that support bulk operations (SKUs, Brands, Categories, Groups, Statuses, Suppliers, Sales History, Marketplaces) follow a consistent pattern:

```typescript
// Import from JSON
const result = await client.skus.importJson(
  [
    { code: 'SKU-001', title: 'Product 1' },
    { code: 'SKU-002', title: 'Product 2' },
  ],
  { tenantId, shopId }
);
// Returns: { created: 2, updated: 0, errors: [] }

// Import from CSV file
const csvContent = await fs.readFile('skus.csv', 'utf-8');
const result = await client.skus.importCsv(csvContent, { tenantId, shopId });

// Export to CSV
const csv = await client.skus.exportCsv({ tenantId, shopId });

// Get example templates (no auth required)
const exampleCsv = await client.skus.getExampleCsv();

// Same pattern works for brands, categories, groups, statuses
const brandResult = await client.brands.importJson(
  [{ code: 'apple', title: 'Apple' }],
  { tenantId, shopId }
);

const categoryResult = await client.categories.importJson(
  [{ code: 'electronics', title: 'Electronics' }],
  { tenantId, shopId }
);

const groupResult = await client.groups.importJson(
  [{ code: 'smartphones', title: 'Smartphones' }],
  { tenantId, shopId }
);

const statusResult = await client.statuses.importJson(
  [{ code: 'active', title: 'Active' }],
  { tenantId, shopId }
);
```

## Data Requirements

### SKUs

**Create/Import:**
- `code` (required): String, 1-100 characters, unique per shop
- `title` (required): String, 1-200 characters

**Update:**
- `code` (optional): String, 1-100 characters
- `title` (optional): String, 1-200 characters

### Brands

**Create/Import:**
- `code` (required): String, 1-100 characters, unique per shop
- `title` (required): String, 1-200 characters

**Update:**
- `code` (optional): String, 1-100 characters
- `title` (optional): String, 1-200 characters

### Categories

**Create/Import:**
- `code` (required): String, 1-100 characters, unique per shop
- `title` (required): String, 1-200 characters

**Update:**
- `code` (optional): String, 1-100 characters
- `title` (optional): String, 1-200 characters

### Groups

**Create/Import:**
- `code` (required): String, 1-100 characters, unique per shop
- `title` (required): String, 1-200 characters

**Update:**
- `code` (optional): String, 1-100 characters
- `title` (optional): String, 1-200 characters

### Statuses

**Create/Import:**
- `code` (required): String, 1-100 characters, unique per shop
- `title` (required): String, 1-200 characters

**Update:**
- `code` (optional): String, 1-100 characters
- `title` (optional): String, 1-200 characters

### Suppliers

**Create/Import:**
- `code` (required): String, 1-100 characters, unique per shop
- `title` (required): String, 1-200 characters

**Update:**
- `code` (optional): String, 1-100 characters
- `title` (optional): String, 1-200 characters

### Sales History

**Create:**
- `sku_id` (required): Number, must reference existing SKU
- `period` (required): String, format `YYYY-MM` (e.g., "2026-01")
- `quantity` (required): Number, integer
- `marketplace_id` (required): Number, must reference existing marketplace

**Import (CSV/JSON):**
- `sku_code` (required): String, must match existing SKU or will be auto-created
- `period` (required): String, format `YYYY-MM` (e.g., "2026-01")
- `quantity` (required): Number, integer
- `marketplace` (required): String (marketplace code), must match existing marketplace or will be auto-created

Note: Import endpoints accept marketplace codes for convenience, but the API internally uses numeric marketplace IDs. Export also returns marketplace codes.

**Update:**
- `sku_id` (optional): Number
- `period` (optional): String, format `YYYY-MM`
- `quantity` (optional): Number
- `marketplace_id` (optional): Number

### Users

**Create:**
- `email` (required): String, valid email format, unique
- `name` (required): String, 1-200 characters
- `default_shop_id` (optional): Number

**Update:**
- `email` (optional): String, valid email format
- `name` (optional): String, 1-200 characters
- `default_shop_id` (optional): Number or null

### Tenants

**Create:**
- `title` (required): String, 1-200 characters
- `owner_id` (optional): Number, user ID

**Update:**
- `title` (optional): String, 1-200 characters
- `owner_id` (optional): Number or null

### Shops

**Create:**
- `title` (required): String, 1-200 characters
- `tenant_id` (required): Number

**Update:**
- `title` (optional): String, 1-200 characters

### Marketplaces

**Create:**
- `code` (required): String, 1-100 characters, unique (e.g., "amazon", "ebay")
- `title` (required): String, 1-200 characters

**Update:**
- `code` (optional): String, 1-100 characters
- `title` (optional): String, 1-200 characters

## Available Sub-Clients

Each sub-client is accessed via `client.<subClient>.<method>()`.

### `client.me`
- `getMe()` - Get current user with roles and tenants

### `client.users`
- `getUsers()`, `getUser(id)` - System admin or tenant admin (filtered by their tenants)
- `createUser(dto)`, `deleteUser(id)` - Tenant admin or higher

### `client.tenants`
- `getTenants()`, `getTenant(id)` - All authenticated users
- `createTenant(dto)` - System admin only
- `updateTenant(id, dto)`, `deleteTenant(id)` - Authenticated users (validation happens server-side)
- `createTenantWithShopAndUser(dto)` - System admin only

### `client.shops`
- `getShops(tenantId?)`, `getShop(id)`, `createShop(dto)`, `updateShop(id, dto)`, `deleteShop(id)` - Requires tenant access
- `deleteShopData(id)` - Delete all data (SKUs, sales history) for a shop

### `client.skus`
- `getSkus(ctx)`, `getSku(id, ctx)`, `getSkuByCode(code, ctx)` - Requires read access (viewer or higher)
- `createSku(dto, ctx)`, `updateSku(id, dto, ctx)`, `deleteSku(id, ctx)` - Requires write access (editor or higher)
- `importJson(items, ctx)`, `importCsv(csvContent, ctx)` - Requires write access
- `exportJson(ctx)`, `exportCsv(ctx)` - Requires read access
- `getExampleJson()`, `getExampleCsv()` - Get import format examples (no auth required)

### `client.brands`
- `getBrands(ctx)`, `getBrand(id, ctx)`, `getBrandByCode(code, ctx)` - Requires read access (viewer or higher)
- `createBrand(dto, ctx)`, `updateBrand(id, dto, ctx)`, `deleteBrand(id, ctx)` - Requires write access (editor or higher)
- `importJson(items, ctx)`, `importCsv(csvContent, ctx)` - Requires write access (bulk upsert by code)
- `exportJson(ctx)`, `exportCsv(ctx)` - Requires read access
- `getExampleJson()`, `getExampleCsv()` - Get import format examples (no auth required)

### `client.categories`
- `getCategories(ctx)`, `getCategory(id, ctx)`, `getCategoryByCode(code, ctx)` - Requires read access (viewer or higher)
- `createCategory(dto, ctx)`, `updateCategory(id, dto, ctx)`, `deleteCategory(id, ctx)` - Requires write access (editor or higher)
- `importJson(items, ctx)`, `importCsv(csvContent, ctx)` - Requires write access (bulk upsert by code)
- `exportJson(ctx)`, `exportCsv(ctx)` - Requires read access
- `getExampleJson()`, `getExampleCsv()` - Get import format examples (no auth required)

### `client.groups`
- `getGroups(ctx)`, `getGroup(id, ctx)`, `getGroupByCode(code, ctx)` - Requires read access (viewer or higher)
- `createGroup(dto, ctx)`, `updateGroup(id, dto, ctx)`, `deleteGroup(id, ctx)` - Requires write access (editor or higher)
- `importJson(items, ctx)`, `importCsv(csvContent, ctx)` - Requires write access (bulk upsert by code)
- `exportJson(ctx)`, `exportCsv(ctx)` - Requires read access
- `getExampleJson()`, `getExampleCsv()` - Get import format examples (no auth required)

### `client.statuses`
- `getStatuses(ctx)`, `getStatus(id, ctx)`, `getStatusByCode(code, ctx)` - Requires read access (viewer or higher)
- `createStatus(dto, ctx)`, `updateStatus(id, dto, ctx)`, `deleteStatus(id, ctx)` - Requires write access (editor or higher)
- `importJson(items, ctx)`, `importCsv(csvContent, ctx)` - Requires write access (bulk upsert by code)
- `exportJson(ctx)`, `exportCsv(ctx)` - Requires read access
- `getExampleJson()`, `getExampleCsv()` - Get import format examples (no auth required)

### `client.suppliers`
- `getSuppliers(ctx)`, `getSupplier(id, ctx)`, `getSupplierByCode(code, ctx)` - Requires read access (viewer or higher)
- `createSupplier(dto, ctx)`, `updateSupplier(id, dto, ctx)`, `deleteSupplier(id, ctx)` - Requires write access (editor or higher)
- `importJson(items, ctx)`, `importCsv(csvContent, ctx)` - Requires write access (bulk upsert by code)
- `exportJson(ctx)`, `exportCsv(ctx)` - Requires read access
- `getExampleJson()`, `getExampleCsv()` - Get import format examples (no auth required)

### `client.salesHistory`
- `getSalesHistory(ctx, query?)`, `getSalesHistoryItem(id, ctx)` - Requires read access (viewer or higher)
- `createSalesHistory(dto, ctx)`, `updateSalesHistory(id, dto, ctx)`, `deleteSalesHistory(id, ctx)` - Requires write access (editor or higher)
- `importJson(items, ctx)`, `importCsv(csvContent, ctx)` - Requires write access
- `exportJson(ctx, query?)`, `exportCsv(ctx, query?)` - Requires read access
- `getExampleJson()`, `getExampleCsv()` - Get import format examples (no auth required)

### `client.roles`
- `getRoles()`, `getRole(id)` - System admin only
- `createRole(dto)`, `updateRole(id, dto)`, `deleteRole(id)` - System admin only

### `client.userRoles`
- `getUserRoles(query)`, `getUserRole(id)` - View roles for tenant
- `createUserRole(dto)`, `deleteUserRole(id)` - Tenant admin or higher for their tenant

### `client.apiKeys`
- `getApiKeys()`, `createApiKey(dto)`, `deleteApiKey(id)` - System admin only

### `client.marketplaces`
- `getMarketplaces(ctx)`, `getMarketplace(id, ctx)`, `getMarketplaceByCode(code, ctx)` - Requires read access
- `createMarketplace(dto, ctx)`, `updateMarketplace(id, dto, ctx)`, `deleteMarketplace(id, ctx)` - Requires write access (editor or higher)
- `importJson(items, ctx)`, `importCsv(csvContent, ctx)` - Requires write access
- `exportJson(ctx)`, `exportCsv(ctx)` - Requires read access

### `client.metadata`
- `getEntitiesMetadata()` - Get field definitions for all entities (no auth required)

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

Common HTTP status codes:
- `409 Conflict` - Duplicate resource (email, SKU code, sales period)
- `404 Not Found` - Resource not found
- `403 Forbidden` - Insufficient permissions
- `400 Bad Request` - Validation error

## Types

Common types are re-exported from `@sales-planner/shared` for convenience:

```typescript
import type { 
  // Entities
  User, Tenant, Shop, Sku, SalesHistory, Role, UserRole, ApiKey, Marketplace,
  // DTOs
  CreateUserDto, CreateTenantDto, CreateShopDto,
  CreateSkuDto, CreateSkuRequest, CreateSalesHistoryDto, CreateSalesHistoryRequest,
  CreateMarketplaceDto, CreateMarketplaceRequest,
  // Query types
  ShopContextParams, PeriodQuery,
  // Response types
  UserWithRolesAndTenants, TenantWithShopAndApiKey,
  ImportResult, DeleteDataResult,
  SkuExportItem, SalesHistoryExportItem,
} from '@sales-planner/http-client';

// For additional types (Brand, Category, Group, Status, Supplier, etc.)
// import directly from @sales-planner/shared
import type { Brand, Category, Group, Status, Supplier } from '@sales-planner/shared';
```

## License

MIT
