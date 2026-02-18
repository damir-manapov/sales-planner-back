# @sales-planner/react

React hooks for the Sales Planner API, powered by [TanStack Query](https://tanstack.com/query).

## Installation

```bash
pnpm add @sales-planner/react @tanstack/react-query
```

## Setup

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SalesPlannerProvider } from '@sales-planner/react';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SalesPlannerProvider config={{ baseUrl: '/api', apiKey: 'your-key' }}>
        <MyApp />
      </SalesPlannerProvider>
    </QueryClientProvider>
  );
}
```

## Usage

### Queries

```tsx
import { skus, brands, useMe } from '@sales-planner/react';

function SkuList() {
  const ctx = { shopId: 1, tenantId: 1 };
  const { data, isLoading } = skus.useList(ctx, { limit: 20 });

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {data?.items.map((sku) => (
        <li key={sku.id}>{sku.title}</li>
      ))}
    </ul>
  );
}
```

### Mutations

```tsx
import { brands } from '@sales-planner/react';

function CreateBrand() {
  const ctx = { shopId: 1, tenantId: 1 };
  const create = brands.useCreate(ctx);

  return (
    <button onClick={() => create.mutate({ code: 'NIKE', title: 'Nike' })}>
      Create Brand
    </button>
  );
}
```

### CSV Import

```tsx
import { suppliers } from '@sales-planner/react';

function ImportSuppliers() {
  const ctx = { shopId: 1, tenantId: 1 };
  const importCsv = suppliers.useImportCsv(ctx);

  const handleFileUpload = (file: File) => {
    file.text().then((csv) => importCsv.mutate(csv));
  };

  return <input type="file" onChange={(e) => handleFileUpload(e.target.files![0]!)} />;
}
```

## API Reference

### Provider

| Export | Description |
| --- | --- |
| `SalesPlannerProvider` | React context provider — accepts `config` and `children` |
| `useSalesPlannerClient()` | Returns the underlying `SalesPlannerClient` for direct API access |
| `ClientConfig` | Type — `{ baseUrl: string; apiKey?: string }` |

### Coded entity hooks

`brands`, `categories`, `groups`, `statuses`, `suppliers`, `warehouses`, `marketplaces`, `skus` — each provides:

| Hook | Kind | Description |
| --- | --- | --- |
| `.useList(ctx, query?)` | query | Paginated list |
| `.useById(ctx, id)` | query | Single entity by ID |
| `.useByCode(ctx, code)` | query | Lookup by code |
| `.useExportJson(ctx)` | query | JSON export (`enabled: false`, manual trigger) |
| `.useExportCsv(ctx)` | query | CSV export (`enabled: false`, manual trigger) |
| `.useExampleJson()` | query | Example JSON (public, `staleTime: Infinity`) |
| `.useExampleCsv()` | query | Example CSV (public, `staleTime: Infinity`) |
| `.useCreate(ctx)` | mutation | Create entity |
| `.useUpdate(ctx)` | mutation | Update entity (`{ id, data }`) |
| `.useDelete(ctx)` | mutation | Delete entity by ID |
| `.useImportJson(ctx)` | mutation | Bulk import from JSON |
| `.useImportCsv(ctx)` | mutation | Bulk import from CSV |

`ctx` is `ShopContext` — `{ shopId: number; tenantId: number }`.

### Shop-scoped entity hooks

`salesHistory`, `leftovers`, `seasonalCoefficients`, `skuCompetitorMappings`, `competitorProducts`, `competitorSales` — same as coded entities **without** `.useByCode`.

### Specialized hooks

| Hook | Kind | Description |
| --- | --- | --- |
| `useMe(options?)` | query | Current user with roles and tenants |
| `useEntitiesMetadata(options?)` | query | Entity field metadata (`staleTime: Infinity`) |
| `useSkuMetrics(ctx, query?, options?)` | query | Paginated SKU metrics |
| `useSkuMetricsById(ctx, id, options?)` | query | Single SKU metric |
| `useSkuMetricsByAbcClass(ctx, 'A'\|'B'\|'C', options?)` | query | SKU metrics filtered by ABC class |
| `useSkuMetricsExportCsv(ctx, options?)` | query | CSV export (`enabled: false`, manual trigger) |
| `useComputedViews(ctx, options?)` | query | List materialized views |
| `useRefreshAllViews(ctx, options?)` | mutation | Refresh all views (auto-invalidates `skuMetrics`) |

### Utilities

| Export | Description |
| --- | --- |
| `queryKeys` | Query key factory for custom cache management |
| `ShopContext` | Type — `{ shopId: number; tenantId: number }` |
| `toShopContextParams(ctx)` | Converts `ShopContext` to `ShopContextParams` |
| `createCodedEntityHooks(name, accessor)` | Factory — build your own coded entity hook set |
| `createShopScopedHooks(name, accessor)` | Factory — build your own shop-scoped hook set |

### Query keys

All keys start with `'sales-planner'`. Use `queryKeys` for custom invalidation:

```tsx
import { queryKeys } from '@sales-planner/react';
import { useQueryClient } from '@tanstack/react-query';

const qc = useQueryClient();

// Invalidate all SKU queries
qc.invalidateQueries({ queryKey: queryKeys.entity('skus', ctx) });
```

Available keys:

| Key | Arguments | Purpose |
| --- | --- | --- |
| `queryKeys.me()` | — | Current user |
| `queryKeys.metadata()` | — | Entity metadata |
| `queryKeys.entity(name, ctx)` | entity name, shop context | Root key for an entity |
| `queryKeys.entityList(name, ctx, query?)` | entity, ctx, pagination | Paginated list |
| `queryKeys.entityDetail(name, ctx, id)` | entity, ctx, id | Single entity |
| `queryKeys.entityByCode(name, ctx, code)` | entity, ctx, code | Code lookup |
| `queryKeys.entityExport(name, ctx, format)` | entity, ctx, `'json'\|'csv'` | Export |
| `queryKeys.entityExample(name, format)` | entity, `'json'\|'csv'` | Example (no ctx — public) |
| `queryKeys.skuMetrics(ctx)` | ctx | SKU metrics root |
| `queryKeys.skuMetricsList(ctx, query?)` | ctx, pagination | SKU metrics list |
| `queryKeys.skuMetricsDetail(ctx, id)` | ctx, id | Single SKU metric |
| `queryKeys.skuMetricsAbc(ctx, class)` | ctx, `'A'\|'B'\|'C'` | ABC class filter |
| `queryKeys.computed(ctx)` | ctx | Computed views root |

## Cache Invalidation

All mutations automatically invalidate their related query caches. `useRefreshAllViews` additionally invalidates `skuMetrics`.
