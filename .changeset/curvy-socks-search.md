---
"@sales-planner/http-client": minor
"@sales-planner/api": patch
---

refactor(http-client): remove flat API, use namespaced sub-clients only

BREAKING CHANGE: Flat API methods removed from SalesPlannerClient.
Use namespaced sub-clients instead (e.g., client.skus.getSkus() instead of client.getSkus()).
