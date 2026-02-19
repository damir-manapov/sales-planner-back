# @sales-planner/react

## 0.5.5

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.20.5
  - @sales-planner/http-client@0.22.5

## 0.5.4

### Patch Changes

- Add /me shop visibility e2e tests: owner sees all shops, tenantAdmin sees all shops, editor sees only assigned shop, no-role user sees no tenants.
- Updated dependencies
  - @sales-planner/shared@0.20.4
  - @sales-planner/http-client@0.22.4

## 0.5.3

### Patch Changes

- Add comprehensive quick setup e2e tests: custom shopTitle, userName defaults to email, validation errors (400). Add expectBadRequest test helper.
- Updated dependencies
  - @sales-planner/shared@0.20.3
  - @sales-planner/http-client@0.22.3

## 0.5.2

### Patch Changes

- Add comprehensive quick setup e2e tests: custom shopTitle, userName defaults to email, validation errors (400).
- Updated dependencies
  - @sales-planner/shared@0.20.2
  - @sales-planner/http-client@0.22.2

## 0.5.1

### Patch Changes

- Return 409 Conflict instead of 500 when quick setup is called with an existing email.
- Updated dependencies
  - @sales-planner/shared@0.20.1
  - @sales-planner/http-client@0.22.1

## 0.5.0

### Minor Changes

- Make userName optional in quick setup (CreateTenantWithShopDto). Falls back to userEmail when omitted.

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.20.0
  - @sales-planner/http-client@0.22.0

## 0.4.0

### Minor Changes

- Remove user-shops entity (unused for access control, superseded by user-roles)

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.19.0
  - @sales-planner/http-client@0.21.0

## 0.3.0

### Minor Changes

- feat: camelCase API field names

  BREAKING CHANGE: All API field names converted from snake_case to camelCase using Kysely CamelCasePlugin.

  - All entity fields: `shop_id` → `shopId`, `tenant_id` → `tenantId`, `created_at` → `createdAt`, etc.
  - All DTO/request fields: `sku_id` → `skuId`, `marketplace_id` → `marketplaceId`, etc.
  - Query params: `shop_id` → `shopId`, `tenant_id` → `tenantId`, `period_from` → `periodFrom`, etc.
  - ShopContextParams: `{ shop_id, tenant_id }` → `{ shopId, tenantId }`
  - PeriodQuery: `{ period_from, period_to }` → `{ periodFrom, periodTo }`
  - Removed `toShopContextParams()` from react package (ShopContext ≡ ShopContextParams now)
  - DB columns remain snake_case in PostgreSQL; Kysely CamelCasePlugin maps automatically

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.18.0
  - @sales-planner/http-client@0.20.0

## 0.2.3

### Patch Changes

- Unify SkuMetricsClient and ComputedEntitiesClient to accept ShopContextParams instead of positional (shopId, tenantId) args, matching ShopScopedClient convention.
- Updated dependencies
  - @sales-planner/shared@0.17.4
  - @sales-planner/http-client@0.19.4

## 0.2.2

### Patch Changes

- Fix user_shops: add id serial PK, updated_at field, unique constraint on (user_id, shop_id). Clean up roles module.
- Updated dependencies
  - @sales-planner/shared@0.17.3
  - @sales-planner/http-client@0.19.3

## 0.2.1

### Patch Changes

- Add useExampleJson and useExampleCsv hooks to coded and shop-scoped entity factories. Improve README with full API reference.

## 0.2.0

### Minor Changes

- Add @sales-planner/react package with TanStack Query hooks for all API entities
