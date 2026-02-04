# @sales-planner/shared

## 0.4.1

### Patch Changes

- 0e747cf: Refactored e2e tests to use http-client, removed supertest dependency

  - Added getRoot() and getHealth() methods to http-client for unauthenticated endpoints
  - Made CreateTenantDto.created_by optional (set automatically by API controller)
  - Simplified test-helpers.ts to only export cleanupUser and SYSTEM_ADMIN_KEY

## 0.4.0

### Minor Changes

- - Add `created_by` field to `CreateTenantDto`
  - Change `SalesHistory.period` type from `Date` to `string` (YYYY-MM format) to match API response
  - Types now serve as compile-time contracts validated against API's Zod schemas

## 0.3.0

### Minor Changes

- **BREAKING**: Removed `SalesPlannerClient` and `ApiError` - use `@sales-planner/http-client` instead
- Package now contains only types and DTOs (no runtime code)

## 0.2.0

### Minor Changes

- Added CSV import/export methods
- Added example endpoints
- Added full CRUD for marketplaces
- Added `updateRole` method

## 0.1.0

### Minor Changes

- Initial release with entities, DTOs, and HTTP client
