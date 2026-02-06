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

Sales history also supports period filtering:
```typescript
const { items, total } = await client.salesHistory.getAll(ctx, {
  period_from: '2024-01',
  period_to: '2024-12',
  limit: 50,
  offset: 0,
});
```

## API

All shop-scoped clients (`skus`, `brands`, `categories`, `groups`, `statuses`, `suppliers`, `marketplaces`, `salesHistory`) share these methods:

- `getAll(ctx, query?)` → `PaginatedResponse<T>`
- `getById(ctx, id)`, `getByCode(ctx, code)`
- `create(ctx, req)`, `update(ctx, id, req)`, `delete(ctx, id)`
- `importJson(ctx, items)`, `importCsv(ctx, csv)`, `exportJson(ctx)`, `exportCsv(ctx)`
- `getExampleJson()`, `getExampleCsv()` (no auth)

System clients: `me`, `users`, `tenants`, `shops`, `roles`, `userRoles`, `apiKeys`, `metadata`

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

All types re-exported from `@sales-planner/shared`:

```typescript
import type {
  ShopContextParams, PaginationQuery, PaginatedResponse, PeriodQuery, SalesHistoryQuery,
  User, Tenant, Shop, Sku, Brand, Category, Group, Status, Supplier, Marketplace, SalesHistory,
  CreateSkuRequest, UpdateSkuRequest, ImportSkuItem, SkuExportItem,
  ImportResult, SkuImportResult,
} from '@sales-planner/http-client';
```

## License

MIT
