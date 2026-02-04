# @sales-planner/http-client

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
