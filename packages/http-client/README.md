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

const ctx = { tenant_id: 1, shop_id: 1 };

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
  period_from: '2024-01',
  period_to: '2024-12',
  limit: 50,
  offset: 0,
});

// Same for leftovers and competitor sales
const { items: leftovers } = await client.leftovers.getAll(ctx, {
  period_from: '2024-01',
  period_to: '2024-12',
});
```

**Combined Filtering** - Combine IDs with pagination and period filters:
```typescript
// Get specific sales history records with period filter
const { items } = await client.salesHistory.getAll(ctx, {
  ids: [1, 2, 3],
  period_from: '2024-01',
  period_to: '2024-06',
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

System clients (`users`, `tenants`, `shops`, `roles`, `userRoles`, `apiKeys`) also return paginated responses:

```typescript
// All system getAll() methods return PaginatedResponse<T>
const { items: users, total } = await client.users.getAll();
const { items: tenants } = await client.tenants.getAll({ limit: 10 });
const { items: shops } = await client.shops.getAll();
const { items: roles } = await client.roles.getAll();
const { items: userRoles } = await client.userRoles.getAll();
const { items: apiKeys } = await client.apiKeys.getAll();

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
  shop_id: number;
  tenant_id: number;
}

// Pagination (all getAll methods support this)
interface PaginationQuery {
  ids?: number[];   // Filter by specific IDs
  limit?: number;   // 1-1000, default: 100
  offset?: number;  // default: 0
}

// Period filtering (sales history, leftovers, competitor sales)
interface PeriodQuery {
  period_from?: string;  // YYYY-MM format
  period_to?: string;    // YYYY-MM format
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
  shop_id: number;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
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
  default_shop_id: number | null;
  created_at: Date;
  updated_at: Date;
}

interface Tenant {
  id: number;
  title: string;
  owner_id: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

interface Shop {
  id: number;
  title: string;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

interface ApiKey {
  id: number;
  user_id: number;
  key: string;
  name: string | null;
  expires_at: Date | null;
  last_used_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
```

#### Shop Data Entities

Coded entities (`Sku`, `Brand`, `Category`, `Group`, `Status`, `Supplier`, `Warehouse`, `Marketplace`) extend `CodedShopScopedEntity`:

```typescript
interface Sku extends CodedShopScopedEntity {
  title2?: string | null;
  category_id?: number | null;
  group_id?: number | null;
  status_id?: number | null;
  supplier_id?: number | null;
}
// Brand, Category, Group, Status, Supplier, Warehouse, Marketplace
// all have just: id, code, title, shop_id, tenant_id, created_at, updated_at
```

#### Time-Series Entities

```typescript
interface SalesHistory {
  id: number;
  sku_id: number;
  marketplace_id: number;
  period: string;      // YYYY-MM format
  quantity: number;
  shop_id: number;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

interface Leftover {
  id: number;
  sku_id: number;
  warehouse_id: number;
  period: string;      // YYYY-MM format
  quantity: number;
  shop_id: number;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

interface SeasonalCoefficient {
  id: number;
  group_id: number;
  month: number;       // 1-12
  coefficient: number;
  shop_id: number;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}
```

#### Competitor Entities

```typescript
interface CompetitorProduct {
  id: number;
  marketplace_id: number;
  marketplace_product_id: string;  // BIGINT as string
  title: string | null;
  brand: string | null;
  shop_id: number;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

interface CompetitorSale {
  id: number;
  competitor_product_id: number;
  period: string;      // YYYY-MM format
  quantity: number;
  shop_id: number;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

interface SkuCompetitorMapping {
  id: number;
  sku_id: number;
  competitor_product_id: number;
  shop_id: number;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}
```

Available entity types summary:
- `User`, `Tenant`, `Shop`, `Role`, `ApiKey` - system entities
- `Sku`, `Brand`, `Category`, `Group`, `Status`, `Supplier`, `Warehouse`, `Marketplace` - shop data
- `SalesHistory`, `Leftover`, `SeasonalCoefficient` - time-series data
- `CompetitorProduct`, `CompetitorSale`, `SkuCompetitorMapping` - competitor data

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
  categories_created: number;
  groups_created: number;
  statuses_created: number;
  suppliers_created: number;
}
```

### All Exported Types

```typescript
import type {
  // Query & Response
  ShopContextParams, PaginationQuery, PaginatedResponse, PeriodQuery,
  SalesHistoryQuery, LeftoverQuery, CompetitorSaleQuery, GetUserRolesQuery,
  
  // System Entities
  User, Tenant, Shop, Role, ApiKey, UserRoleResponse,
  
  // Shop Data Entities
  Sku, Brand, Category, Group, Status, Supplier, Warehouse, Marketplace,
  
  // Time-Series Entities
  SalesHistory, Leftover, SeasonalCoefficient,
  
  // Competitor Entities
  CompetitorProduct, CompetitorSale, SkuCompetitorMapping,
  
  // User/Me Response Types
  UserWithRolesAndTenants, UserRole, TenantInfo, ShopInfo,
  
  // Create/Update Requests
  CreateSkuRequest, UpdateSkuRequest,
  CreateUserRequest, UpdateUserRequest,
  CreateTenantRequest, UpdateTenantRequest,
  CreateShopRequest, UpdateShopRequest,
  CreateApiKeyRequest,
  
  // Import Items (use string codes, auto-resolved)
  ImportSkuItem, ImportSalesHistoryItem, ImportLeftoverItem,
  ImportSeasonalCoefficientItem, ImportSkuCompetitorMappingItem,
  ImportCompetitorProductItem, ImportCompetitorSaleItem,
  ImportBrandItem, ImportCategoryItem, ImportGroupItem,
  ImportStatusItem, ImportSupplierItem, ImportWarehouseItem, ImportMarketplaceItem,
  
  // Export Items
  SkuExportItem, SalesHistoryExportItem, LeftoverExportItem,
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

## License

MIT
