# @sales-planner/http-client

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
