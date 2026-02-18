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

## Available Hooks

### Coded entities

`brands`, `categories`, `groups`, `statuses`, `suppliers`, `warehouses`, `marketplaces`, `skus` — each provides:

- `.useList(ctx, query?)` — paginated list
- `.useById(ctx, id)` — single entity
- `.useByCode(ctx, code)` — lookup by code
- `.useCreate(ctx)` — create mutation
- `.useUpdate(ctx)` — update mutation (`{ id, data }`)
- `.useDelete(ctx)` — delete mutation
- `.useImportJson(ctx)` — JSON import mutation
- `.useImportCsv(ctx)` — CSV import mutation
- `.useExportJson(ctx)` — JSON export (manual trigger)
- `.useExportCsv(ctx)` — CSV export (manual trigger)

### Shop-scoped entities

`salesHistory`, `leftovers`, `seasonalCoefficients`, `skuCompetitorMappings`, `competitorProducts`, `competitorSales` — same as above minus `useByCode`.

### Specialized

- `useMe()` — current user
- `useEntitiesMetadata()` — entity field metadata
- `useSkuMetrics(ctx, query?)` — paginated SKU metrics
- `useSkuMetricsById(ctx, id)` — single SKU metric
- `useSkuMetricsByAbcClass(ctx, 'A' | 'B' | 'C')` — filter by ABC class
- `useSkuMetricsExportCsv(ctx)` — CSV export
- `useComputedViews(ctx)` — list materialized views
- `useRefreshAllViews(ctx)` — refresh all views mutation

## Cache Invalidation

All mutations automatically invalidate related query caches. The `queryKeys` object is exported for custom cache management:

```tsx
import { queryKeys } from '@sales-planner/react';
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: queryKeys.entity('skus', ctx) });
```
