# @sales-planner/http-client

## 0.12.0

### Minor Changes

- 26b2809: refactor(http-client): remove flat API, use namespaced sub-clients only

  BREAKING CHANGE: Flat API methods removed from SalesPlannerClient.
  Use namespaced sub-clients instead (e.g., client.skus.getSkus() instead of client.getSkus()).

## 0.11.0

### Minor Changes

- 64b3294: Add suppliers entity with full CRUD operations, CSV import/export, and SKU supplier_code field

### Patch Changes

- Updated dependencies [64b3294]
  - @sales-planner/shared@0.11.0

## 0.10.0

### Minor Changes

- 98537c8: Change sales history import/export format from `sku_code, period, quantity, marketplace` to `marketplace, period, sku, quantity` to match original data file structure

### Patch Changes

- Updated dependencies [98537c8]
  - @sales-planner/shared@0.10.0

## 0.9.3

### Patch Changes

- Convert @sales-planner/shared to CommonJS for Vercel compatibility
- Updated dependencies
  - @sales-planner/shared@0.9.3

## 0.9.2

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.9.2

## 0.9.1

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.9.1

## 0.9.0

### Minor Changes

- Add entity metadata API for UI documentation. Provides metadata about entities (brands, marketplaces, skus, sales history) including field definitions, types, and examples.

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.9.0

## 0.8.4

### Patch Changes

- Reorganize entities and responses into separate files per domain (matching dto/ structure)
- Updated dependencies
  - @sales-planner/shared@0.8.3

## 0.8.3

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.8.2

## 0.8.2

### Patch Changes

- Update READMEs to document marketplace numeric ID usage pattern
- Updated dependencies
  - @sales-planner/shared@0.8.1

## 0.8.1

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.8.0

## 0.8.0

### Minor Changes

- 92cbfd7: Refactor marketplaces to use numeric IDs and align access control with brands

  BREAKING CHANGE: Marketplace API routes now use numeric IDs instead of code-based routes

  - Changed routes from /marketplaces/:code to /marketplaces/:id
  - Marketplaces are now managed by shop editors (write access) like brands, not system admins only
  - Added numeric id field while keeping code as unique identifier
  - Reduced MarketplacesService from 224 to 75 lines (66% reduction) via BaseEntityService
  - Added ParseIntPipe for type safety
  - Improved shop/tenant ownership verification

### Patch Changes

- Updated dependencies [92cbfd7]
  - @sales-planner/shared@0.7.0

## 0.7.1

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

- Updated dependencies
  - @sales-planner/shared@0.6.1

## 0.7.0

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

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.6.0

## 0.6.0

### Minor Changes

- **Breaking Change:** Simplified SalesPlannerClient architecture

  - Exposed sub-clients as public properties (`client.users`, `client.shops`, etc.)
  - Backward compatible: All flat API methods still work (`client.getUsers()`)
  - Recommended: Use namespaced API for better organization (`client.users.getUsers()`)
  - Updated README with comprehensive documentation of both API styles
  - Removed 60+ manual method bindings from constructor in favor of simple delegation
  - No breaking changes for existing code - all previous methods still available

## 0.5.1

### Patch Changes

- - Split shared/dto.ts into modular structure by entity
  - Split http-client into domain-specific client classes
  - Add ImportExportBaseClient for import/export functionality
  - Rename normalizeCode to normalizeId
  - Add Zod validation to bulkUpsert methods
  - Update marketplace examples to use camelCase IDs
- Updated dependencies
  - @sales-planner/shared@0.5.1

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

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.5.0

## 0.4.2

### Patch Changes

- Add SKU and marketplace code normalization with Cyrillic transliteration support. SKU codes preserve case and separators, while marketplace IDs are converted to camelCase. Both functions remove spaces and handle Cyrillic-to-Latin transliteration.
- Updated dependencies
  - @sales-planner/shared@0.4.3

## 0.4.1

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

- Updated dependencies
  - @sales-planner/shared@0.4.2

## 0.4.0

### Minor Changes

- 0e747cf: Refactored e2e tests to use http-client, removed supertest dependency

  - Added getRoot() and getHealth() methods to http-client for unauthenticated endpoints
  - Made CreateTenantDto.created_by optional (set automatically by API controller)
  - Simplified test-helpers.ts to only export cleanupUser and SYSTEM_ADMIN_KEY

### Patch Changes

- Updated dependencies [0e747cf]
  - @sales-planner/shared@0.4.1

## 0.3.0

### Minor Changes

- - Move `SalesPlannerClient` implementation to this package (previously in shared)
  - Add `ApiError` class for typed error handling
  - Fix JSON parsing error on empty responses (204 No Content)
  - All methods now properly typed with shared DTOs

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.4.0

## 0.2.0

### Minor Changes

- **BREAKING**: Client implementation moved from `@sales-planner/shared` to this package
- `SalesPlannerClient` and `ApiError` are now defined here
- Fixed error handling for empty response bodies

## 0.1.0

### Minor Changes

- Initial release (re-exported from `@sales-planner/shared`)
