# Implementation Plan: Categories, Groups, Statuses

## Completed ✅

### Database Layer
- ✅ Migration 002: Create categories table
- ✅ Migration 003: Create groups table
- ✅ Migration 004: Create statuses table
- ✅ Migration 005: Add SKU classification fields (category_code, group_code, status_code)

### Shared Package
- ✅ Entity interfaces: Category, Group, Status (extend ShopScopedEntity)
- ✅ DTOs: Create/Update/Import types for all 3 entities
- ✅ Export types: CategoryExportItem, GroupExportItem, StatusExportItem
- ✅ Updated SKU entity and DTOs with classification fields

### API Layer (Partial)
- ✅ Schemas: categories.schema.ts, groups.schema.ts, statuses.schema.ts
- ✅ Services: categories.service.ts, groups.service.ts, statuses.service.ts

## Remaining Work 🚧

### API Layer - Controllers (High Priority)
For each entity (categories, groups, statuses), create:

**Main Controllers** (~200 lines each):
```typescript
// Pattern: src/{entity}/{entity}.controller.ts
@Controller('{entity}')
export class {Entity}Controller {
  // CRUD endpoints:
  @Post() create()
  @Get() findAll()
  @Get(':id') findOne()
  @Put(':id') update()
  @Delete(':id') delete()

  // Import/Export:
  @Post('import/json') importJson()
  @Post('import/csv') importCsv()
  @Get('export/json') exportJson()
  @Get('export/csv') exportCsv()
}
```

**Example Controllers** (~50 lines each):
```typescript
// Pattern: src/{entity}/{entity}-examples.controller.ts
@Controller('{entity}/examples')
export class {Entity}ExamplesController {
  @Get('json') getJsonExample()
  @Get('csv') getCsvExample()
}
```

**Reference**: Copy from `brands.controller.ts` and `brands-examples.controller.ts`

### API Layer - Modules
For each entity, create module file:
```typescript
// Pattern: src/{entity}/{entity}.module.ts
@Module({
  imports: [DatabaseModule],
  controllers: [{Entity}Controller, {Entity}ExamplesController],
  providers: [{Entity}Service],
  exports: [{Entity}Service],
})
export class {Entity}Module {}
```

Then add to `app.module.ts`:
```typescript
imports: [
  // ... existing modules
  CategoriesModule,
  GroupsModule,
  StatusesModule,
]
```

### API Layer - Index Files
Create index.ts for each entity module:
```typescript
export * from './{entity}.controller';
export * from './{entity}.service';
export * from './{entity}.schema';
export * from './{entity}.module';
```

### HTTP Client Package
Create 3 client classes in `packages/http-client/src/clients/`:

```typescript
// categories-client.ts
export class CategoriesClient extends ImportExportBaseClient<Category, CategoryExportItem, ImportCategoryItem> {
  constructor(config: ClientConfig) {
    super(config, 'categories');
  }
}

// groups-client.ts
export class GroupsClient extends ImportExportBaseClient<Group, GroupExportItem, ImportGroupItem> {
  constructor(config: ClientConfig) {
    super(config, 'groups');
  }
}

// statuses-client.ts
export class StatusesClient extends ImportExportBaseClient<Status, StatusExportItem, ImportStatusItem> {
  constructor(config: ClientConfig) {
    super(config, 'statuses');
  }
}
```

Update `sales-planner-client.ts`:
```typescript
export class SalesPlannerClient {
  // Add new properties:
  public readonly categories: CategoriesClient;
  public readonly groups: GroupsClient;
  public readonly statuses: StatusesClient;

  constructor(config: ClientConfig) {
    // ... existing clients
    this.categories = new CategoriesClient(config);
    this.groups = new GroupsClient(config);
    this.statuses = new StatusesClient(config);
  }
}
```

### Unit Tests
For each entity, create 2 test files:

**Schema Tests** (~30 tests per file):
```typescript
// Pattern: src/{entity}/{entity}.schema.spec.ts
describe('{Entity} Schemas', () => {
  describe('Create{Entity}Schema', () => {
    // Valid cases, missing fields, invalid types
  });
  describe('Update{Entity}Schema', () => {
    // Optional fields, partial updates
  });
  describe('Import{Entity}ItemSchema', () => {
    // CSV import validation
  });
});
```

**Service Tests** (~5 tests per file):
```typescript
// Pattern: src/{entity}/{entity}.service.spec.ts
describe('{Entity}Service', () => {
  it('should be defined');
  it('should normalize codes');
  it('should validate import items');
  // etc.
});
```

**Reference**: Copy from `brands.schema.spec.ts` and `brands.service.spec.ts`

### E2E Tests
For each entity, create comprehensive e2e test:

```typescript
// Pattern: tests/{entity}.e2e.spec.ts (~25 tests per file)
describe('{Entity} (e2e)', () => {
  describe('Authentication', () => {
    // 401 tests
  });
  describe('CRUD operations', () => {
    // create, read, update, delete, 409 duplicates
  });
  describe('Tenant isolation', () => {
    // 403 tests for cross-tenant access
  });
  describe('Import/Export', () => {
    // JSON/CSV import with upserts
    // JSON/CSV export
  });
  describe('Examples', () => {
    // Public example endpoints
  });
  describe('Role-based access', () => {
    // Viewer role tests
  });
});
```

**Reference**: Copy from `brands.e2e.spec.ts`, update entity names

### SKUs Updates
Update SKUs to handle classification fields:

**SKUs Schema** (`src/skus/skus.schema.ts`):
```typescript
export const CreateSkuSchema = z.object({
  code: code(),
  title: title(),
  category_code: code().optional(),
  group_code: code().optional(),
  status_code: code().optional(),
});

export const ImportSkuItemSchema = z.object({
  code: code(),
  title: title(),
  category_code: z.string().optional(),
  group_code: z.string().optional(),
  status_code: z.string().optional(),
});
```

**SKUs Service** (`src/skus/skus.service.ts`):
- No changes needed - BaseEntityService handles optional fields automatically

**SKUs Tests**:
- Update existing tests to include optional classification fields

### Metadata
Update `packages/shared/src/metadata.ts`:

```typescript
export interface EntitiesMetadata {
  brands: EntityMetadata;
  categories: EntityMetadata;  // ADD
  groups: EntityMetadata;       // ADD
  statuses: EntityMetadata;     // ADD
  marketplaces: EntityMetadata;
  skus: EntityMetadata;
  salesHistory: EntityMetadata;
}

export const ENTITIES_METADATA: EntitiesMetadata = {
  // ... existing
  categories: {
    name: 'Categories',
    description: 'Product categories for classification',
    fields: [
      { name: 'code', type: 'string', description: 'Unique category identifier', required: true, example: 'electronics' },
      { name: 'title', type: 'string', description: 'Category display name', required: true, example: 'Electronics' },
    ],
  },
  groups: {
    name: 'Groups',
    description: 'Product groups for sub-classification',
    fields: [
      { name: 'code', type: 'string', description: 'Unique group identifier', required: true, example: 'laptops' },
      { name: 'title', type: 'string', description: 'Group display name', required: true, example: 'Laptops' },
    ],
  },
  statuses: {
    name: 'Statuses',
    description: 'Product statuses (new, discontinued, etc.)',
    fields: [
      { name: 'code', type: 'string', description: 'Unique status identifier', required: true, example: 'new' },
      { name: 'title', type: 'string', description: 'Status display name', required: true, example: 'New Product' },
    ],
  },
  // Update skus to show classification fields:
  skus: {
    fields: [
      // ... existing code, title
      { name: 'category_code', type: 'string', description: 'Category code', required: false, example: 'electronics' },
      { name: 'group_code', type: 'string', description: 'Group code', required: false, example: 'laptops' },
      { name: 'status_code', type: 'string', description: 'Status code', required: false, example: 'new' },
    ],
  },
};
```

## Testing & Deployment

### Run Migrations
```bash
cd packages/api
DATABASE_URL="..." bun scripts/migrate.ts
```

### Run Tests
```bash
pnpm test                 # Unit tests
pnpm test:e2e:local      # E2E tests
```

### Build & Deploy
```bash
pnpm build
pnpm changeset version
git add -A && git commit -m "feat: add categories, groups, statuses entities"
git push
pnpm changeset publish && git push --tags
vercel --prod
```

### Update Alena Tenant Script
Update `scripts/alena/create-alena-tenant.ts` to import categories, groups, and statuses from CSV files.

## Estimated Effort

- Controllers (3 × ~200 lines): 2-3 hours
- Modules & setup: 30 mins
- HTTP Client: 1 hour
- Unit tests (6 files × ~50 lines): 2 hours
- E2E tests (3 files × ~300 lines): 3-4 hours
- Metadata & docs: 30 mins
- Testing & debugging: 1-2 hours

**Total: 10-12 hours of development work**

## Quick Start Commands

```bash
# Copy controller structure
cp -r packages/api/src/brands packages/api/src/categories
# Then find/replace "Brand" → "Category", "brands" → "categories"

# Copy tests
cp packages/api/tests/brands.e2e.spec.ts packages/api/tests/categories.e2e.spec.ts
# Then find/replace entity names

# Repeat for groups and statuses
```
