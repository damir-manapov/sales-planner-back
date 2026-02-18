# @sales-planner/http-client

TypeScript HTTP client for the Sales Planner API with full type safety.

## Installation

```bash
pnpm add @sales-planner/http-client
```

## Quick Start

```typescript
import { SalesPlannerClient, ApiError } from '@sales-planner/http-client';

const client = new SalesPlannerClient({
  baseUrl: 'https://sales-planner-back.vercel.app',
  apiKey: 'your-api-key',
});

const ctx = { tenantId: 1, shopId: 1 };

// CRUD (all list endpoints return paginated responses)
const { items: brands, total } = await client.brands.getAll(ctx);
const { items: paginatedBrands } = await client.brands.getAll(ctx, { limit: 10, offset: 20 });
const brand = await client.brands.getByCode(ctx, 'apple');
await client.brands.create(ctx, { code: 'apple', title: 'Apple' });
await client.brands.update(ctx, 1, { title: 'Apple Inc.' });
await client.brands.delete(ctx, 1);

// Import/Export (uses string codes, auto-resolved)
await client.skus.importJson(ctx, [{ code: 'SKU-001', title: 'Product' }]);
const items = await client.skus.exportJson(ctx);
```

## Pagination

All `getAll` methods return paginated responses:

```typescript
interface PaginatedResponse<T> {
  items: T[];      // The page of items
  total: number;   // Total count of all items
  limit: number;   // Items per page
  offset: number;  // Current offset
}
```

Query parameters:
- `limit` - Number of items per page (1-1000, default: 100)
- `offset` - Number of items to skip (default: 0)
- `ids` - Filter by specific IDs (array of numbers)

**ID Filtering** - All entities support filtering by IDs:
```typescript
// Filter any entity by specific IDs
const { items: brands } = await client.brands.getAll(ctx, { ids: [1, 2, 3] });
const { items: skus } = await client.skus.getAll(ctx, { ids: [10, 20, 30] });
const { items: salesHistory } = await client.salesHistory.getAll(ctx, { ids: [100, 101] });
```

**Period Filtering** - Sales history, leftovers, and competitor sales also support period filtering:
```typescript
const { items, total } = await client.salesHistory.getAll(ctx, {
  periodFrom: '2024-01',
  periodTo: '2024-12',
  limit: 50,
  offset: 0,
});

// Same for leftovers and competitor sales
const { items: leftovers } = await client.leftovers.getAll(ctx, {
  periodFrom: '2024-01',
  periodTo: '2024-12',
});
```

**Combined Filtering** - Combine IDs with pagination and period filters:
```typescript
// Get specific sales history records with period filter
const { items } = await client.salesHistory.getAll(ctx, {
  ids: [1, 2, 3],
  periodFrom: '2024-01',
  periodTo: '2024-06',
  limit: 50,
});
```

## API

All shop-scoped clients (`skus`, `brands`, `categories`, `groups`, `statuses`, `suppliers`, `warehouses`, `marketplaces`, `salesHistory`, `leftovers`, `seasonalCoefficients`, `skuCompetitorMappings`, `competitorProducts`, `competitorSales`) share these methods:

- `getAll(ctx, query?)` → `PaginatedResponse<T>`
- `getById(ctx, id)`, `getByCode(ctx, code)` (where applicable)
- `create(ctx, req)`, `update(ctx, id, req)`, `delete(ctx, id)`
- `importJson(ctx, items)`, `importCsv(ctx, csv)`, `exportJson(ctx)`, `exportCsv(ctx)`
- `getExampleJson()`, `getExampleCsv()` (no auth)

System clients (`users`, `tenants`, `shops`, `roles`, `userRoles`, `userShops`, `apiKeys`) also return paginated responses:

```typescript
// All system getAll() methods return PaginatedResponse<T>
const { items: users, total } = await client.users.getAll();
const { items: tenants } = await client.tenants.getAll({ limit: 10 });
const { items: shops } = await client.shops.getAll();
const { items: userRoles } = await client.userRoles.getAll();
const { items: apiKeys } = await client.apiKeys.getAll();

// Roles are predefined and read-only (available to all authenticated users)
const { items: roles } = await client.roles.getAll();
const role = await client.roles.getById(1);

// User-shop assignments
const userShops = await client.userShops.getAll({ shopId: 1 });
await client.userShops.create({ userId: 1, shopId: 1 });
await client.userShops.delete(assignmentId);

// Delete all shop data (SKUs, sales history, brands, categories, etc.)
const result = await client.shops.deleteData(shopId);
console.log(result); 
// { skusDeleted, salesHistoryDeleted, brandsDeleted, categoriesDeleted,
//   groupsDeleted, statusesDeleted, suppliersDeleted, warehousesDeleted,
//   leftoversDeleted, seasonalCoefficientsDeleted, skuCompetitorMappingsDeleted,
//   competitorProductsDeleted, competitorSalesDeleted }
```

Other system clients:

```typescript
// Get current user with roles and tenants
const me = await client.me.getMe();
console.log(me.email, me.roles, me.tenants);

// Get entities metadata (for UI documentation)
const metadata = await client.metadata.getEntitiesMetadata();
console.log(metadata); // { entities: [...], version: "..." }
```

## Computed Entities (Read-Only)

SKU metrics and materialized view management:

```typescript
const ctx = { shopId: 1, tenantId: 1 };

// SKU Metrics - aggregated metrics from materialized views
const { items, total } = await client.skuMetrics.list(ctx);
const metric = await client.skuMetrics.get(ctx, id);
const topProducts = await client.skuMetrics.getByAbcClass(ctx, 'A');

// Export
const csv = await client.skuMetrics.exportCsv(ctx);
const json = await client.skuMetrics.exportJson(ctx);

// View Management
const views = await client.computed.getViews(ctx);
// [{ name: 'mv_sku_metrics', description: 'SKU metrics with ABC classification' }]

const result = await client.computed.refreshAll(ctx);
// { results: [...], totalDuration: 1234, success: true }

const viewResult = await client.computed.refreshView(ctx, 'mv_sku_metrics');
// { view: 'mv_sku_metrics', duration: 500, success: true }
```

## Error Handling

```typescript
try {
  await client.users.getById(999);
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.status, error.message); // 404, "User not found"
  }
}
```

## Types

### Query & Context Types

```typescript
// Required for all shop-scoped operations
interface ShopContextParams {
  shopId: number;
  tenantId: number;
}

// Pagination (all getAll methods support this)
interface PaginationQuery {
  ids?: number[];   // Filter by specific IDs
  limit?: number;   // 1-1000, default: 100
  offset?: number;  // default: 0
}

// Period filtering (sales history, leftovers, competitor sales)
interface PeriodQuery {
  periodFrom?: string;  // YYYY-MM format
  periodTo?: string;    // YYYY-MM format
}

// Paginated response (returned by all getAll methods)
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
```

### Entity Types

All entities extend base interfaces:

```typescript
// Base for shop-scoped entities without code (e.g., SalesHistory)
interface ShopScopedBaseEntity {
  id: number;
  shopId: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Base for coded entities (e.g., SKUs, Brands, Categories)
interface CodedShopScopedEntity extends ShopScopedBaseEntity {
  code: string;
  title: string;
}
```

#### System Entities

```typescript
interface User {
  id: number;
  email: string;
  name: string;
  defaultShopId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Tenant {
  id: number;
  title: string;
  ownerId: number | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Shop {
  id: number;
  title: string;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ApiKey {
  id: number;
  userId: number;
  key: string;
  name: string | null;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Shop Data Entities

Coded entities (`Sku`, `Brand`, `Category`, `Group`, `Status`, `Supplier`, `Warehouse`, `Marketplace`) extend `CodedShopScopedEntity`:

```typescript
interface Sku extends CodedShopScopedEntity {
  title2?: string | null;
  categoryId?: number | null;
  groupId?: number | null;
  statusId?: number | null;
  supplierId?: number | null;
}
// Brand, Category, Group, Status, Supplier, Warehouse, Marketplace
// all have just: id, code, title, shopId, tenantId, createdAt, updatedAt
```

#### Time-Series Entities

```typescript
interface SalesHistory {
  id: number;
  skuId: number;
  marketplaceId: number;
  period: string;      // YYYY-MM format
  quantity: number;
  shopId: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Leftover {
  id: number;
  skuId: number;
  warehouseId: number;
  period: string;      // YYYY-MM format
  quantity: number;
  shopId: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SeasonalCoefficient {
  id: number;
  groupId: number;
  month: number;       // 1-12
  coefficient: number;
  shopId: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Competitor Entities

```typescript
interface CompetitorProduct {
  id: number;
  marketplaceId: number;
  marketplaceProductId: string;  // BIGINT as string
  title: string | null;
  brand: string | null;
  shopId: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CompetitorSale {
  id: number;
  competitorProductId: number;
  period: string;      // YYYY-MM format
  quantity: number;
  shopId: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SkuCompetitorMapping {
  id: number;
  skuId: number;
  competitorProductId: number;
  shopId: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}
```

Available entity types summary:
- `User`, `Tenant`, `Shop`, `Role`, `UserShop`, `ApiKey` - system entities
- `Sku`, `Brand`, `Category`, `Group`, `Status`, `Supplier`, `Warehouse`, `Marketplace` - shop data
- `SalesHistory`, `Leftover`, `SeasonalCoefficient` - time-series data
- `CompetitorProduct`, `CompetitorSale`, `SkuCompetitorMapping` - competitor data
- `SkuMetrics` - computed entity (read-only, from materialized view)

#### Computed Entities

```typescript
interface SkuMetrics {
  id: number;
  skuId: number;
  shopId: number;
  tenantId: number;
  skuCode: string;
  skuTitle: string;
  // IDs for API responses (like other entities)
  groupId: number | null;
  categoryId: number | null;
  statusId: number | null;
  supplierId: number | null;
  lastPeriod: string;        // YYYY-MM format
  lastPeriodSales: number;  // Total sales for last period
  currentStock: number;      // Current inventory
  daysOfStock: number | null;
  abcClass: 'A' | 'B' | 'C'; // A=top 20%, B=next 30%, C=bottom 50%
  salesRank: number;         // 1 = highest sales
  computedAt: Date;
}

// Export uses simple names (like SKUs export), not camelCase
interface SkuMetricsExportItem {
  code: string;
  title: string;
  group: string | null;
  category: string | null;
  status: string | null;
  supplier: string | null;
  lastPeriod: string;
  lastPeriodSales: number;
  currentStock: number;
  daysOfStock: number | null;
  abcClass: 'A' | 'B' | 'C';
  salesRank: number;
}

// View management types
interface ViewInfo {
  name: string;
  description: string;
}

interface RefreshResult {
  view: string;
  duration: number;
  success: boolean;
  error?: string;
}

interface RefreshAllResult {
  results: RefreshResult[];
  totalDuration: number;
  success: boolean;
}
```

### Import/Export Types

Import items use string codes for references (auto-resolved to IDs):

```typescript
interface ImportSkuItem {
  code: string;
  title: string;
  title2?: string;
  category?: string;  // category code, auto-resolved
  group?: string;     // group code, auto-resolved
  status?: string;    // status code, auto-resolved
  supplier?: string;  // supplier code, auto-resolved
}

// Import results include auto-creation counts
interface SkuImportResult extends ImportResult {
  created: number;
  updated: number;
  errors: string[];
  categoriesCreated: number;
  groupsCreated: number;
  statusesCreated: number;
  suppliersCreated: number;
}
```

### All Exported Types

```typescript
import type {
  // Query & Response
  ShopContextParams, PaginationQuery, PaginatedResponse, PeriodQuery,
  SalesHistoryQuery, LeftoverQuery, CompetitorSaleQuery,
  GetUserRolesQuery, GetUserShopsQuery,

  // System Entities
  User, Tenant, Shop, Role, UserShop, ApiKey, UserRoleResponse,

  // Shop Data Entities
  Sku, Brand, Category, Group, Status, Supplier, Warehouse, Marketplace,

  // Time-Series Entities
  SalesHistory, Leftover, SeasonalCoefficient,

  // Competitor Entities
  CompetitorProduct, CompetitorSale, SkuCompetitorMapping,

  // Computed Entities (read-only)
  SkuMetrics,

  // User/Me Response Types
  UserWithRolesAndTenants, UserRole, TenantInfo, ShopInfo,

  // Create/Update Requests
  CreateSkuRequest, UpdateSkuRequest,
  CreateUserRequest, UpdateUserRequest,
  CreateTenantRequest, UpdateTenantRequest,
  CreateShopRequest, UpdateShopRequest,
  CreateApiKeyRequest,
  CreateUserShopDto,

  // Import Items (use string codes, auto-resolved)
  ImportSkuItem, ImportSalesHistoryItem, ImportLeftoverItem,
  ImportSeasonalCoefficientItem, ImportSkuCompetitorMappingItem,
  ImportCompetitorProductItem, ImportCompetitorSaleItem,
  ImportBrandItem, ImportCategoryItem, ImportGroupItem,
  ImportStatusItem, ImportSupplierItem, ImportWarehouseItem, ImportMarketplaceItem,

  // Export Items
  SkuExportItem, SkuMetricsExportItem, SalesHistoryExportItem, LeftoverExportItem,
  SeasonalCoefficientExportItem, SkuCompetitorMappingExportItem,
  CompetitorProductExportItem, CompetitorSaleExportItem,
  BrandExportItem, CategoryExportItem, GroupExportItem,
  StatusExportItem, SupplierExportItem, WarehouseExportItem, MarketplaceExportItem,

  // Results
  ImportResult, SkuImportResult, SalesHistoryImportResult, DeleteDataResult,

  // Metadata (for UI documentation)
  EntitiesMetadata, EntityMetadata, EntityFieldMetadata, FieldType,
} from '@sales-planner/http-client';
```

## Related Packages

- `@sales-planner/shared` — TypeScript types (included as dependency)
- `@sales-planner/react` — React hooks powered by TanStack Query

## License

MIT
