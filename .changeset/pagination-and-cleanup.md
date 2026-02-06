---
"@sales-planner/api": minor
"@sales-planner/http-client": minor
"@sales-planner/shared": minor
---

Add pagination support to all entities and code cleanup

- All entity endpoints now return paginated responses with `items`, `total`, `limit`, `offset`
- Added `PaginationQuery` and `SalesHistoryQuery` types
- Added pagination e2e tests for all entities (431 tests total)
- Updated http-client to return `PaginatedResponse<T>` from getAll methods
- Service `update()` now throws `NotFoundException` instead of returning `undefined`
- Removed unnecessary type casts from controllers
- Fixed lint errors and improved type safety
- Excluded dist folders from biome linting
