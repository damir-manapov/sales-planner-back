# @sales-planner/api

## 0.5.0

### Minor Changes

- Add entity metadata API for UI documentation. Provides metadata about entities (brands, marketplaces, skus, sales history) including field definitions, types, and examples.

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.9.0

## 0.4.5

### Patch Changes

- Rename normalizeId to normalizeCode for consistency with service method naming

## 0.4.4

### Patch Changes

- Add code normalization for brands and marketplaces (normalizeId: removes spaces, transliterates Cyrillic, converts to camelCase)

## 0.4.3

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.8.3

## 0.4.2

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.8.2

## 0.4.1

### Patch Changes

- Update READMEs to document marketplace numeric ID usage pattern
- Updated dependencies
  - @sales-planner/shared@0.8.1

## 0.4.0

### Minor Changes

- Refactor sales_history to use numeric marketplace_id

  - Changed sales_history.marketplace_id from string (marketplace code) to numeric ID (foreign key to marketplaces.id)
  - Consolidated all 23 migrations into a single clean 001_initial_schema.sql
  - Import/export still use marketplace codes for user-friendly data exchange
  - API internally uses numeric marketplace IDs for referential integrity
  - Fixed race condition in bootstrap service for parallel test execution

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.8.0

## 0.3.0

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

## 0.2.1

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.6.1

## 0.2.0

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

## 0.1.3

### Patch Changes

- - Split shared/dto.ts into modular structure by entity
  - Split http-client into domain-specific client classes
  - Add ImportExportBaseClient for import/export functionality
  - Rename normalizeCode to normalizeId
  - Add Zod validation to bulkUpsert methods
  - Update marketplace examples to use camelCase IDs
- Updated dependencies
  - @sales-planner/shared@0.5.1

## 0.1.2

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.5.0

## 0.1.1

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.4.3

## 0.1.0

### Minor Changes

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

### Patch Changes

- Updated dependencies
  - @sales-planner/shared@0.4.2

## 0.0.6

### Patch Changes

- Updated dependencies [0e747cf]
  - @sales-planner/shared@0.4.1
