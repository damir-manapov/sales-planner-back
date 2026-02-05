---
"@sales-planner/api": minor
"@sales-planner/shared": minor
"@sales-planner/http-client": minor
---

Refactor marketplaces to use numeric IDs and align access control with brands

BREAKING CHANGE: Marketplace API routes now use numeric IDs instead of code-based routes
- Changed routes from /marketplaces/:code to /marketplaces/:id
- Marketplaces are now managed by shop editors (write access) like brands, not system admins only
- Added numeric id field while keeping code as unique identifier
- Reduced MarketplacesService from 224 to 75 lines (66% reduction) via BaseEntityService
- Added ParseIntPipe for type safety
- Improved shop/tenant ownership verification
