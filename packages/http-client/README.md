# @sales-planner/http-client

TypeScript HTTP client for the Sales Planner API with full type safety.

## Installation

```bash
pnpm add @sales-planner/http-client
```

## Quick Start

```typescript
import { SalesPlannerClient } from '@sales-planner/http-client';

const client = new SalesPlannerClient({
  baseUrl: 'https://sales-planner-back.vercel.app',
  apiKey: 'your-api-key',
});

// Shop context required for most operations
const ctx = { tenant_id: 1, shop_id: 1 };

// All shop-scoped entities use generic method names
const skus = await client.skus.getAll(ctx);
const sku = await client.skus.getById(ctx, 123);
const brand = await client.brands.getByCode(ctx, 'apple');

// CRUD operations
await client.brands.create(ctx, { code: 'apple', title: 'Apple' });
await client.brands.update(ctx, 1, { title: 'Apple Inc.' });
await client.brands.delete(ctx, 1);

// Import/Export
const result = await client.skus.importJson(ctx, [{ code: 'SKU-001', title: 'Product' }]);
const items = await client.skus.exportJson(ctx);
```

## API Reference

### Shop-Scoped Entities

**Clients:** `skus`, `brands`, `categories`, `groups`, `statuses`, `suppliers`, `marketplaces`, `salesHistory`

All use generic method names with context first:

| Method | Description |
|--------|-------------|
| `getAll(ctx, query?)` | List entities |
| `getById(ctx, id)` | Get by ID |
| `getByCode(ctx, code)` | Get by code |
| `create(ctx, request)` | Create entity |
| `update(ctx, id, request)` | Update entity |
| `delete(ctx, id)` | Delete entity |
| `importJson(ctx, items)` | Import from JSON array |
| `importCsv(ctx, csvContent)` | Import from CSV string |
| `exportJson(ctx, query?)` | Export to JSON |
| `exportCsv(ctx, query?)` | Export to CSV |
| `getExampleJson()` | Example JSON (no auth) |
| `getExampleCsv()` | Example CSV (no auth) |

### System-Level Clients

| Client | Methods |
|--------|---------|
| `me` | `getMe()` |
| `users` | `getUsers()`, `getUser(id)`, `createUser(req)`, `deleteUser(id)` |
| `tenants` | `getTenants()`, `getTenant(id)`, `createTenant(req)`, `updateTenant(id, req)`, `deleteTenant(id)`, `createTenantWithShopAndUser(req)` |
| `shops` | `getShops(tenantId?)`, `getShop(id)`, `createShop(req)`, `updateShop(id, req)`, `deleteShop(id)`, `deleteShopData(id)` |
| `roles` | `getAll()`, `getById(id)`, `create(req)`, `update(id, req)`, `delete(id)` |
| `userRoles` | `getUserRoles(query)`, `getUserRole(id)`, `createUserRole(req)`, `deleteUserRole(id)` |
| `apiKeys` | `getApiKeys()`, `createApiKey(req)`, `deleteApiKey(id)` |
| `metadata` | `getEntitiesMetadata()` (no auth) |

## Import/Export

- **Import** uses string codes for references (auto-resolved to IDs)
- **Export** returns string codes for human readability
- **Create/Update** use numeric IDs for references

```typescript
// Import uses codes
await client.salesHistory.importJson(ctx, [
  { sku: 'SKU-001', marketplace: 'amazon', period: '2026-01', quantity: 100 },
]);

// Create uses IDs
await client.salesHistory.create(ctx, {
  sku_id: 123, marketplace_id: 1, period: '2026-01', quantity: 100,
});
```

## Error Handling

```typescript
import { SalesPlannerClient, ApiError } from '@sales-planner/http-client';

try {
  await client.users.getUser(999);
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.status, error.message); // 404, "User not found"
  }
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error |
| 401 | Missing/invalid API key |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Duplicate resource |

## Types

All types re-exported from `@sales-planner/shared`:

```typescript
import type {
  ShopContextParams, PeriodQuery,
  User, Tenant, Shop, Sku, Brand, Category, Group, Status, Supplier, Marketplace, SalesHistory,
  CreateSkuRequest, UpdateSkuRequest, ImportSkuItem, SkuExportItem,
  ImportResult, SkuImportResult,
} from '@sales-planner/http-client';
```

## License

MIT
