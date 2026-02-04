---
"@sales-planner/shared": patch
"@sales-planner/http-client": minor
---

Refactored e2e tests to use http-client, removed supertest dependency

- Added getRoot() and getHealth() methods to http-client for unauthenticated endpoints
- Made CreateTenantDto.created_by optional (set automatically by API controller)
- Simplified test-helpers.ts to only export cleanupUser and SYSTEM_ADMIN_KEY
