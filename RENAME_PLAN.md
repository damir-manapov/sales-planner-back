# Plan: Add CompetitorProduct Entity + Simplify Related Entities

## Data Model

**CompetitorProduct** (new entity from skusOfCompetitors.csv):
- `id` (PK, auto-increment) ← simple technical ID for FK references
- `tenant_id`, `shop_id` (FK)
- `marketplace_id` FK to marketplaces
- `marketplace_product_id` BIGINT (numeric ID on external marketplace)
- `title`, `brand` (nullable - can be auto-created without these)
- UNIQUE(shop_id, marketplace_id, marketplace_product_id)

**SkuCompetitorMapping** (simplified):
- `id`, `tenant_id`, `shop_id`
- `sku_id` FK to skus
- `competitor_product_id` FK to competitor_products(id) ← single technical FK
- UNIQUE(shop_id, sku_id, competitor_product_id)

**CompetitorSale** (simplified):
- `id`, `tenant_id`, `shop_id`
- `competitor_product_id` FK to competitor_products(id) ← single technical FK
- `period`, `quantity`
- UNIQUE(shop_id, competitor_product_id, period)

---

## Import/Export Pattern

**Auto-create pattern** (following existing codebase pattern):
- When importing sku_competitor_mappings or competitor_sales, auto-create CompetitorProduct if not exists (with empty title/brand)
- competitor_products import is optional enrichment - updates existing records with title/brand

**Import formats** (string codes for links):
- CompetitorProduct: `marketplace` (code), `marketplace_product_id` (number), `title`, `brand`
- SkuCompetitorMapping: `sku` (code), `marketplace` (code), `marketplace_product_id` (number)
- CompetitorSale: `marketplace` (code), `marketplace_product_id` (number), `period`, `quantity`

**Import flow:**
1. **sku_competitor_mappings import:**
   - Auto-create SKU if not exists
   - Auto-create Marketplace if not exists
   - Auto-create CompetitorProduct if not exists (empty title/brand)
   - Create/update mapping with resolved competitor_product_id

2. **competitor_sales import:**
   - Auto-create Marketplace if not exists
   - Auto-create CompetitorProduct if not exists (empty title/brand)
   - Create/update sale with resolved competitor_product_id

3. **competitor_products import (optional enrichment):**
   - Auto-create Marketplace if not exists
   - Create or update CompetitorProduct with title/brand

**Export flow:**
- Join competitor_products → marketplaces to return marketplace code + marketplace_product_id

---

## Implementation Order

### Phase 1: Database Migrations

**Migration 016: Create competitor_products table**
```sql
CREATE TABLE competitor_products (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
  marketplace_product_id BIGINT NOT NULL,
  title VARCHAR(1000),
  brand VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shop_id, marketplace_id, marketplace_product_id)
);
```

**Migration 017: Update sku_competitor_mappings to use competitor_product_id**
- Add competitor_product_id column
- Create competitor_products from existing data (with empty title/brand)
- Populate competitor_product_id from lookup
- Drop marketplace_id, competitor_sku_code columns
- Add FK constraint and update unique constraint

**Migration 018: Update competitor_sales to use competitor_product_id**  
- Add competitor_product_id column
- Populate from lookup (competitor_products created in 017)
- Drop marketplace_id, competitor_sku_code columns
- Add FK constraint and update unique constraint

### Phase 2: Shared Package Types

| File | Changes |
|------|---------|
| `entities/competitor-products.ts` | NEW: CompetitorProduct interface |
| `entities/sku-competitor-mappings.ts` | Change: marketplace_id + marketplace_product_id → competitor_product_id |
| `entities/competitor-sales.ts` | Change: marketplace_id + marketplace_product_id → competitor_product_id |
| `dto/competitor-products.ts` | NEW: Create/Update/Import DTOs |
| `dto/sku-competitor-mappings.ts` | Update: import uses marketplace+product_id, internal uses competitor_product_id |
| `dto/competitor-sales.ts` | Update: import uses marketplace+product_id, internal uses competitor_product_id |
| `responses/export.ts` | Add CompetitorProductExportItem |
| `responses/import.ts` | Add competitorProductsDeleted to DeleteDataResult |
| `metadata.ts` | Add competitorProducts, update related |
| `index.ts` | Export new types |

### Phase 3: API Modules

**NEW: competitor-products module**
- Full CRUD + import/export CSV
- `findOrCreate(shopId, marketplaceId, marketplaceProductId)` helper for auto-create pattern

**UPDATE: sku-competitor-mappings module**
- Service: inject CompetitorProductsService
- bulkUpsert: auto-create competitor_products via findOrCreate
- Export: join to get marketplace code + marketplace_product_id

**UPDATE: competitor-sales module**
- Service: inject CompetitorProductsService
- bulkUpsert: auto-create competitor_products via findOrCreate
- Export: join to get marketplace code + marketplace_product_id

**UPDATE: shops module**
- deleteData: add competitorProductsDeleted count (delete BEFORE mappings/sales due to FK)

### Phase 4: Http-client

- Add competitorProducts client (ShopScopedClient)
- Update README with new entity

### Phase 5: Tests

**Unit tests (schema specs):**
- competitor-products.schema.spec.ts (NEW)
- sku-competitor-mappings.schema.spec.ts (UPDATE)
- competitor-sales.schema.spec.ts (UPDATE)

**E2E tests:**
- competitor-products.e2e.spec.ts (NEW)
- sku-competitor-mappings.e2e.spec.ts (UPDATE)
- competitor-sales.e2e.spec.ts (UPDATE)

### Phase 6: Alena Init Script

Import order (any order works due to auto-create, but this is logical):
1. Reference data (brands, categories, groups, statuses, suppliers, warehouses)
2. SKUs
3. Sales history
4. Leftovers
5. Seasonal coefficients
6. **CompetitorProducts** (enrichment - title/brand from skusOfCompetitors.csv)
7. SkuCompetitorMappings (auto-creates competitor_products if missing)
8. CompetitorSales (auto-creates competitor_products if missing)

---

## Checklist

### Migrations
- [x] 016_create_competitor_products.sql
- [x] 017_update_sku_competitor_mappings.sql (drop old columns, add FK)
- [x] 018_update_competitor_sales.sql (drop old columns, add FK)
- [x] 019_fix_competitor_products_timestamps.sql (make created_at/updated_at NOT NULL)

### Shared Package
- [x] entities/competitor-products.ts (NEW)
- [x] entities/sku-competitor-mappings.ts (update: competitor_product_id)
- [x] entities/competitor-sales.ts (update: competitor_product_id)
- [x] dto/competitor-products.ts (NEW)
- [x] dto/sku-competitor-mappings.ts (update)
- [x] dto/competitor-sales.ts (update)
- [x] responses/export.ts (add CompetitorProductExportItem)
- [x] responses/import.ts (add competitorProductsDeleted)
- [x] metadata.ts (add competitorProducts)
- [x] index.ts (exports)

### API
- [x] competitor-products/ module (NEW - all files)
- [x] sku-competitor-mappings/ (update schema, service, controller)
- [x] competitor-sales/ (update schema, service, controller)
- [x] shops/shops.service.ts (deleteData - delete competitor_products)
- [x] shops/shops.module.ts (import CompetitorProductsModule)
- [x] app.module.ts (register CompetitorProductsModule)

### Http-client
- [x] sales-planner-client.ts (add competitorProducts)
- [x] index.ts (exports)
- [x] README.md

### Tests
- [x] competitor-products.schema.spec.ts (NEW)
- [x] competitor-products.e2e.spec.ts (NEW)
- [x] sku-competitor-mappings.schema.spec.ts (update)
- [x] sku-competitor-mappings.e2e.spec.ts (update)
- [x] competitor-sales.schema.spec.ts (update)
- [x] competitor-sales.e2e.spec.ts (update)
- [x] shops.service.spec.ts (update - add competitorProductsService mock)

### Alena Script
- [x] Add skusOfCompetitors.csv import (competitor_products)
- [x] Update convert functions for new field names

### Post-changes
- [ ] Run migrations locally
- [ ] Regenerate database types
- [ ] pnpm all-checks
- [ ] pnpm test:e2e
