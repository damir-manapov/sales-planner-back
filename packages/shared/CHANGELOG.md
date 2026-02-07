# @sales-planner/shared

## 0.17.2

### Patch Changes

- 200b15f: fix: remove unused brand_id from SKU and SKU metrics

## 0.17.1

### Patch Changes

- Add IDs to SkuMetrics entity, update export to use simple field names

  - Add group_id, category_id, brand_id, status_id, supplier_id to SkuMetrics
  - Export uses simple field names (code, title, group, category) matching SKU export pattern
  - Cast numeric fields to integer in SQL view for proper types

## 0.17.0

### Minor Changes

- Add computed entities infrastructure with SKU metrics

  - Add SkuMetrics entity with ABC classification, sales ranking, days of stock
  - Add SkuMetricsClient and ComputedEntitiesClient to http-client
  - Support materialized views with CONCURRENTLY refresh
  - Add export endpoints (CSV/JSON) for computed entities

## 0.16.0

### Minor Changes

- Add ids filter to all shop-scoped entities

  - All getAll endpoints now support `?ids=1,2,3` query parameter to filter by specific IDs
  - Affects: SKUs, brands, categories, groups, statuses, suppliers, warehouses, marketplaces, sales-history, leftovers, competitor-products, competitor-sales, seasonal-coefficients, sku-competitor-mappings
  - Added e2e tests for ids filtering on all entities
  - Updated PaginationQuery interface to include `ids?: number[]`
  - Updated http-client types for seasonalCoefficients and skuCompetitorMappings

### Patch Changes

- f9777a0: fix: improve CSV validation error messages with row numbers

## 0.15.1

### Patch Changes

- fix: improve CSV validation error messages with row numbers

## 0.15.0

### Minor Changes

- Add warehouses entity with full CRUD, import/export, and metadata support

## 0.14.0

### Minor Changes

- feat: add pagination to all system entities (users, tenants, shops, roles, userRoles, apiKeys)

## 0.13.1

### Patch Changes

- Update README with pagination types documentation

## 0.13.0

### Minor Changes

- 25ce063: Add pagination support to all entities and code cleanup

  - All entity endpoints now return paginated responses with `items`, `total`, `limit`, `offset`
  - Added `PaginationQuery` and `SalesHistoryQuery` types
  - Added pagination e2e tests for all entities (431 tests total)
  - Updated http-client to return `PaginatedResponse<T>` from getAll methods
  - Service `update()` now throws `NotFoundException` instead of returning `undefined`
  - Removed unnecessary type casts from controllers
  - Fixed lint errors and improved type safety
  - Excluded dist folders from biome linting

## 0.12.0

### Minor Changes

- Add pagination support to SKUs endpoint with PaginationQuery and PaginatedResponse types

## 0.11.1

### Patch Changes

- Add title2 field to SKU, update READMEs with ctx-first API convention

## 0.11.0

### Minor Changes

- 64b3294: Add suppliers entity with full CRUD operations, CSV import/export, and SKU supplier_code field

## 0.10.0

### Minor Changes

- 98537c8: Change sales history import/export format from `sku_code, period, quantity, marketplace` to `marketplace, period, sku, quantity` to match original data file structure

## 0.9.3

### Patch Changes

- Convert @sales-planner/shared to CommonJS for Vercel compatibility

## 0.9.2

### Patch Changes

- Fix package.json exports to support both CommonJS and ES modules in Vercel serverless environment

## 0.9.1

### Patch Changes

- Fix package.json exports to support both CommonJS and ES modules in Vercel serverless environment

## 0.9.0

### Minor Changes

- Add entity metadata API for UI documentation. Provides metadata about entities (brands, marketplaces, skus, sales history) including field definitions, types, and examples.

## 0.8.3

### Patch Changes

- Reorganize entities and responses into separate files per domain (matching dto/ structure)

## 0.8.2

### Patch Changes

- Remove unused dto.ts file (DTOs already organized in dto/ folder)

## 0.8.1

### Patch Changes

- Update READMEs to document marketplace numeric ID usage pattern

## 0.8.0

### Minor Changes

- Refactor sales_history to use numeric marketplace_id

  - Changed sales_history.marketplace_id from string (marketplace code) to numeric ID (foreign key to marketplaces.id)
  - Consolidated all 23 migrations into a single clean 001_initial_schema.sql
  - Import/export still use marketplace codes for user-friendly data exchange
  - API internally uses numeric marketplace IDs for referential integrity
  - Fixed race condition in bootstrap service for parallel test execution

## 0.7.0

### Minor Changes

- 92cbfd7: Refactor marketplaces to use numeric IDs and align access control with brands

  BREAKING CHANGE: Marketplace API routes now use numeric IDs instead of code-based routes

  - Changed routes from /marketplaces/:code to /marketplaces/:id
  - Marketplaces are now managed by shop editors (write access) like brands, not system admins only
  - Added numeric id field while keeping code as unique identifier
  - Reduced MarketplacesService from 224 to 75 lines (66% reduction) via BaseEntityService
  - Added ParseIntPipe for type safety
  - Improved shop/tenant ownership verification

## 0.6.1

### Patch Changes

- Cleanup and documentation improvements

  **Improvements:**

  - Added `ImportBrandItem` type to shared package
  - Added missing brand example endpoints to http-client (`getBrandsExampleJson`, `getBrandsExampleCsv`)
  - Removed duplicate `dto.ts` file (using split dto/ structure)
  - Removed unnecessary `client.ts` re-export layer
  - Added comprehensive Data Requirements section to http-client README
  - Brands client now imports types from shared package (consistent with SKUs)

  **Documentation:**

  - Field requirements for all entities (SKUs, Brands, Sales History, Users, Tenants, Shops, Marketplaces)
  - Required vs optional fields clearly documented
  - Field constraints (length, format, uniqueness)
  - Special behaviors (auto-creation for imports)

## 0.6.0

### Minor Changes

- Add brands entity with comprehensive CRUD, import/export, and base classes for DRY

  **New Features:**

  - **Brands Entity**: Full CRUD operations with shop-scoped unique codes
  - **Import/Export**: JSON and CSV support with auto-detected delimiters (comma/semicolon)
  - **Example Endpoints**: `/brands/examples/json` and `/brands/examples/csv` (no auth)
  - **BaseEntityService**: Generic service class for shop-scoped entities (brands, SKUs)
  - **BaseExamplesController**: Generic controller for example endpoints
  - **Type Safety**: CSV columns now use `ReadonlyArray<keyof T>` with `as const`

  **Improvements:**

  - Moved `findOrCreateByCode` to BaseEntityService for reuse across entities
  - Updated `toCsv` to accept readonly arrays
  - Code reduction: Brands service 23 lines (vs 165), SKUs service ~40 lines (vs 221)
  - All example controllers reduced by 42%
  - Enhanced READMEs with detailed API documentation

  **CSV Features:**

  - Auto-detects delimiter (comma or semicolon)
  - Handles UTF-8 BOM for Excel compatibility
  - Supports Cyrillic and Unicode characters
  - Proper file download headers (Content-Type, Content-Disposition)

  **Breaking Changes:** None - all changes are additive

## 0.5.1

### Patch Changes

- - Split shared/dto.ts into modular structure by entity
  - Split http-client into domain-specific client classes
  - Add ImportExportBaseClient for import/export functionality
  - Rename normalizeCode to normalizeId
  - Add Zod validation to bulkUpsert methods
  - Update marketplace examples to use camelCase IDs

## 0.5.0

### Minor Changes

- Type system refactoring and API improvements

  **Breaking Changes:**

  - Introduced Request vs DTO type separation for all entities
  - `CreateApiKeyDto` no longer accepts `key` field (auto-generated)
  - Type structure reorganized for better consistency

  **New Features:**

  - Added Update types for all entities (UpdateUserDto, UpdateTenantDto, etc.)
  - Added duplicate resource detection with 409 Conflict responses
  - API keys are now auto-generated using crypto.randomUUID()
  - All controller update methods now use ZodValidationPipe

  **Improvements:**

  - Simplified dto.ts with better organization and comments
  - Consistent type pattern across all entities
  - Request types for HTTP layer, DTO types for service layer
  - AssertCompatible validation for type safety
  - Updated README documentation for all packages

## 0.4.3

### Patch Changes

- Add SKU and marketplace code normalization with Cyrillic transliteration support. SKU codes preserve case and separators, while marketplace IDs are converted to camelCase. Both functions remove spaces and handle Cyrillic-to-Latin transliteration.

## 0.4.2

### Patch Changes

- Make marketplace required in sales_history and allow read access for all users

  - **Breaking**: `marketplace_id` is now required in sales_history (NOT NULL constraint)
  - Auto-creates missing marketplaces during sales history import
  - Marketplace GET endpoints now accessible to all authenticated users (was admin-only)
  - Marketplace POST/PUT/DELETE remain admin-only
  - Added `findOrCreateByCode` method to SkusService for proper encapsulation
  - Added `ensureExist` method to MarketplacesService
  - Regenerated database types to reflect NOT NULL constraint
  - Added marketplace auth e2e tests
  - Updated READMEs with auth requirements

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
