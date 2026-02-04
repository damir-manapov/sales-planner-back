# @sales-planner/api

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
