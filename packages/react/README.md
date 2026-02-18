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

### Admin hooks

#### Tenants

| Hook | Kind | Description |
| --- | --- | --- |
| `useTenants(query?)` | query | Paginated list (filterable by `ownerId`) |
| `useTenantById(id)` | query | Single tenant |
| `useCreateTenant()` | mutation | Create tenant (SysAdmin) |
| `useCreateTenantWithShopAndUser()` | mutation | Create tenant + shop + user + API key (SysAdmin) |
| `useUpdateTenant()` | mutation | Update tenant (`{ id, data }`) |
| `useDeleteTenant()` | mutation | Delete tenant (SysAdmin) |

#### Users

| Hook | Kind | Description |
| --- | --- | --- |
| `useUsers(query?)` | query | Paginated list (filterable by `tenantId`) |
| `useUserById(id)` | query | Single user |
| `useCreateUser()` | mutation | Create user |
| `useDeleteUser()` | mutation | Delete user |

#### Shops

| Hook | Kind | Description |
| --- | --- | --- |
| `useShops(query?)` | query | Paginated list (filterable by `tenantId`) |
| `useShopById(id)` | query | Single shop |
| `useCreateShop()` | mutation | Create shop |
| `useUpdateShop()` | mutation | Update shop (`{ id, data }`) |

#### Roles (predefined, read-only)

| Hook | Kind | Description |
| --- | --- | --- |
| `useRoles(query?)` | query | Paginated list |
| `useRoleById(id)` | query | Single role |

#### User Roles

| Hook | Kind | Description |
| --- | --- | --- |
| `useUserRoles(query?)` | query | Paginated list (filterable by `userId`, `roleId`, `tenantId`) |
| `useUserRoleById(id)` | query | Single user-role assignment |
| `useCreateUserRole()` | mutation | Assign role to user |
| `useDeleteUserRole()` | mutation | Remove role from user |

#### User Shops

| Hook | Kind | Description |
| --- | --- | --- |
| `useUserShops(query?)` | query | List (filterable by `userId`, `shopId`, `tenantId`) |
| `useUserShopById(id)` | query | Single user-shop assignment |
| `useCreateUserShop()` | mutation | Assign user to shop |
| `useDeleteUserShop()` | mutation | Remove user from shop |

#### API Keys

| Hook | Kind | Description |
| --- | --- | --- |
| `useApiKeys(query?)` | query | Paginated list (filterable by `userId`) |
| `useCreateApiKey()` | mutation | Create API key |
| `useRevokeApiKey()` | mutation | Revoke (delete) API key |

### Utilities

| Export | Description |
| --- | --- |
| `queryKeys` | Query key factory for custom cache management |
| `ShopContext` | Type — `{ shopId: number; tenantId: number }` |
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
| `queryKeys.tenants(query?)` | pagination + ownerId | Tenants list |
| `queryKeys.tenantDetail(id)` | id | Single tenant |
| `queryKeys.users(query?)` | pagination + tenantId | Users list |
| `queryKeys.userDetail(id)` | id | Single user |
| `queryKeys.shops(query?)` | pagination + tenantId | Shops list |
| `queryKeys.shopDetail(id)` | id | Single shop |
| `queryKeys.roles(query?)` | pagination | Roles list |
| `queryKeys.roleDetail(id)` | id | Single role |
| `queryKeys.userRoles(query?)` | userId, roleId, tenantId | User-role assignments |
| `queryKeys.userRoleDetail(id)` | id | Single user-role |
| `queryKeys.userShops(query?)` | userId, shopId, tenantId | User-shop assignments |
| `queryKeys.userShopDetail(id)` | id | Single user-shop |
| `queryKeys.apiKeys(query?)` | pagination + userId | API keys list |
| `queryKeys.apiKeyDetail(id)` | id | Single API key |
| `queryKeys.entity(name, ctx)` | entity name, shop context | Root key for a data entity |
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

## Related Packages

- `@sales-planner/shared` — TypeScript types
- `@sales-planner/http-client` — HTTP client (included as dependency)

## License

MIT
