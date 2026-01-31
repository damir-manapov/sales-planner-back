# Sales Planner API

NestJS API for sales planning and management with Kysely + PostgreSQL (Neon).

## Features

- **Users** - User management
- **Tenants** - Multi-tenant support with audit trail (tracks who created each tenant)
- **Shops** - Shop management linked to tenants
- **User-Shops** - Link users to shops
- **Roles** - Role-based access control (viewer, editor, tenantAdmin, systemAdmin)
- **User-Roles** - Assign roles to users (per shop or per tenant)
- **API Keys** - API keys with optional expiration, linked to users
- **Marketplaces** - Marketplace management (string IDs)
- **SKUs** - SKU management linked to shops (unique code per shop)
- **Sales History** - Monthly sales data per SKU (shop-level entity)
- **Me** - Get current user data with roles and tenants
- **Bootstrap** - Auto-creates systemAdmin user and seeds default roles on startup

## Role-Based Access Control

The API implements a hierarchical role-based access control system:

### Role Types

| Role | Scope | Assignment | Description |
|------|-------|------------|-------------|
| `viewer` | Shop | Explicit | Read-only access to a specific shop's resources |
| `editor` | Shop | Explicit | Read/write access to a specific shop's resources |
| `tenantAdmin` | Tenant | Explicit | Full access to all shops within a tenant |
| `tenantOwner` | Tenant | **Derived** | Full access to owned tenant (from `tenants.owner_id`) |
| `systemAdmin` | Global | Explicit | Full access to all tenants and shops |

### Role Assignment

- **Shop-level roles** (`viewer`, `editor`): Assigned with `tenant_id` and `shop_id`
- **Tenant-level roles** (`tenantAdmin`): Assigned with `tenant_id` only (no `shop_id`)
- **Tenant owner** (`tenantOwner`): **Automatically derived** from `tenants.owner_id` - no explicit assignment needed
- **System-level roles** (`systemAdmin`): No tenant or shop scope

### Access Control Logic

For protected endpoints (e.g., SKUs):
1. **System admin**: Full access to everything
2. **Tenant owner**: Full access to all shops in tenants they own (derived from `tenants.owner_id`)
3. **Tenant admin**: Full access to all shops in their tenant
4. **Shop-level roles**: 
   - `viewer` or `editor`: Read access to the specific shop
   - `editor` only: Write access to the specific shop

### Authentication

All protected endpoints require an API key in the `x-api-key` header. The API key is linked to a user, and the user's roles determine access permissions.

**Getting Current User Information:**

To retrieve the current authenticated user's data including their roles and tenants, use:

```bash
GET /me
Headers: x-api-key: <your-api-key>
```

Response includes:
- User basic info (id, name, email)
- Roles with scope (including tenant/shop titles where applicable)
  - Explicit roles from `user_roles` table
  - Derived `tenantOwner` role for tenants where `owner_id` matches the user
- Tenants the user has access to (with ownership flag and shops array)
  - Each tenant includes: `{ id, title, is_owner, shops: [{id, title}] }`
  - Each tenant includes an array of shops: `{ id, title, is_owner, shops: [{id, title}] }`

### Decorator-Based Access Control

The API uses NestJS decorators for clean, declarative access control in controllers:

**Access Level Decorators:**
- `@RequireReadAccess()` - Validates user has read access (viewer, editor, tenantAdmin, tenantOwner, or systemAdmin)
- `@RequireWriteAccess()` - Validates user has write access (editor, tenantAdmin, tenantOwner, or systemAdmin)

**Context Decorator:**
- `@ShopContext()` - Automatically extracts and validates `shop_id` and `tenant_id` from query parameters

**Example:**
```typescript
@Get()
@RequireReadAccess()
async findAll(@ShopContext() ctx: ShopContextType): Promise<Sku[]> {
  return this.skusService.findByShopId(ctx.shopId);
}

@Post()
@RequireWriteAccess()
async create(
  @ShopContext() ctx: ShopContextType,
  @Body() dto: CreateSkuDto,
): Promise<Sku> {
  return this.skusService.create({ ...dto, shop_id: ctx.shopId, tenant_id: ctx.tenantId });
}
```

The decorators work with `AuthGuard` which:
1. Validates the API key
2. Checks access level metadata from decorators
3. Extracts and validates `shop_id`/`tenant_id` from query params
4. Verifies user has appropriate role-based access
5. Throws `BadRequestException` for missing parameters or `ForbiddenException` for insufficient permissions

## Prerequisites

- Node.js 20+
- pnpm
- Docker (for local database) or Neon.com account
- gitleaks (for security checks)

### Installing gitleaks

Download the latest release from https://github.com/gitleaks/gitleaks/releases for your platform.

**Windows:**
```bash
# Download from releases page, extract and add to PATH
```

**macOS:**
```bash
brew install gitleaks
```

**Linux:**
```bash
# Download from releases, extract, move to /usr/local/bin
```

## Installation

```bash
pnpm install
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Server
PORT=3000

# Database (Neon.com or local PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Serverless mode (true for Vercel/Lambda - uses pool size 1)
SERVERLESS=false

# System admin API key (auto-creates admin user on startup)
SYSTEM_ADMIN_KEY=your-secure-api-key-here
```

## Database

```bash
pnpm db:migrate   # Run migrations
pnpm db:generate  # Generate Kysely types from database
```

## Running the application

```bash
# Development
pnpm start:dev

# Production
pnpm build
pnpm start:prod
```

## Testing

```bash
pnpm test           # Run unit tests
pnpm test:watch     # Run unit tests in watch mode
pnpm test:cov       # Run unit tests with coverage
pnpm test:e2e       # Run e2e tests
pnpm test:e2e:watch # Run e2e tests in watch mode
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build the application |
| `pnpm start` | Start the application |
| `pnpm start:dev` | Start in development mode with watch |
| `pnpm start:prod` | Start production build |
| `pnpm lint` | Run linter |
| `pnpm lint:fix` | Run linter and fix issues |
| `pnpm format` | Format code |
| `pnpm format:check` | Check code formatting |
| `pnpm typecheck` | Check types |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:generate` | Generate Kysely types |
| `pnpm script:create-tenant` | Create new tenant with shop and user (interactive script) |

### Check scripts

| Script | Description |
|--------|-------------|
| `./check.sh` | Format, lint, typecheck, and run unit tests |
| `./health.sh` | Check gitleaks, outdated deps, and vulnerabilities |
| `./all-checks.sh` | Run both check.sh and health.sh |

### Automation Scripts

**Create Tenant Script** (`scripts/create-tenant.ts`):

Automated script for creating a new tenant with shop and user. Requires Bun runtime.

```bash
# Prerequisites: Set environment variables in ~/.profile
export SALES_PLANNER_SYSTEM_ADMIN_KEY="your-system-admin-key"
export SALES_PLANNER_API_URL="https://sales-planner-back.vercel.app"  # Optional, defaults to localhost:3000

# Usage
bun scripts/create-tenant.ts --tenant-title "Company Name" \
  [--user-email "admin@company.com"] \
  [--user-name "Admin Name"] \
  [--api-url "https://api.example.com"]

# Or via pnpm
pnpm script:create-tenant
```

**Arguments:**
- `--tenant-title` (required): Name of the tenant (also used for shop name)
- `--user-email` (optional): User email (defaults to `admin@{slug}.com`)
- `--user-name` (optional): User name (defaults to `{Title} Admin`)
- `--api-url` (optional): API URL (overrides `SALES_PLANNER_API_URL` env var)

**Output:**
Returns the created tenant, shop, user details, and the generated API key for the new user.

---

**Create Demo Tenant Script** (`scripts/create-demo-tenant.ts`):

Creates a fully populated demo tenant with sample products and sales history data. Perfect for testing, demonstrations, and onboarding. Requires Bun runtime.

```bash
# Prerequisites: Set environment variables
export SALES_PLANNER_SYSTEM_ADMIN_KEY="your-system-admin-key"
export SALES_PLANNER_API_URL="https://sales-planner-back.vercel.app"  # Optional, defaults to localhost:3000

# Usage - creates tenant "Demo" with shop "Electronics"
bun scripts/create-demo-tenant.ts

# Or with custom tenant name
bun scripts/create-demo-tenant.ts --tenant-title "ACME Demo Corp"

# Or with custom API URL
bun scripts/create-demo-tenant.ts --api-url "http://localhost:3000"
```

**Arguments:**
- `--tenant-title` (optional): Custom tenant name (default: "Demo")
- `--api-url` (optional): API URL (overrides `SALES_PLANNER_API_URL` env var)
- `-h, --help`: Show help message

**Demo Data Created:**
- **Tenant**: Named "Demo" (or custom name)
- **Shop**: Named "Electronics"
- **Admin User**: Full tenant admin access with generated API key
- **15 Products**: Laptops, phones, tablets, monitors, and accessories
  - Dell XPS, MacBook Pro, Lenovo ThinkPad
  - iPhone, Samsung Galaxy, Google Pixel
  - iPad Pro, Samsung Tab, monitors, keyboards, mice, headsets, webcams
- **21 Sales Records**: 3 months of sales history (Nov 2025 - Jan 2026)
  - Realistic quantities showing sales trends
  - Ready for forecasting and analytics testing

**Output:**
Displays progress with emojis and provides tenant, shop, user details, generated API key, and summary of imported data.

## Docker Compose

```bash
pnpm compose:up      # Start services
pnpm compose:down    # Stop services
pnpm compose:restart # Restart services
pnpm compose:reset   # Reset (remove volumes and orphans)
```

## Project Structure

```
sales-planner-back/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── database/               # Kysely database module
│   │   ├── database.module.ts
│   │   ├── database.service.ts
│   │   └── database.types.ts   # Generated types
│   ├── users/                  # Users CRUD
│   ├── tenants/                # Tenants CRUD
│   ├── shops/                  # Shops CRUD
│   ├── user-shops/             # User-Shop associations
│   ├── roles/                  # Roles CRUD
│   ├── user-roles/             # User-Role associations
│   ├── api-keys/               # API keys management
│   ├── marketplaces/           # Marketplaces CRUD
│   ├── skus/                   # SKUs CRUD with import/export
│   ├── sales-history/          # Sales history with import/export (monthly data per SKU)
│   ├── lib/                    # Shared utilities (period functions)
│   └── bootstrap/              # System admin & seed data initialization
├── data/
│   └── common/                 # Seed data (JSON files)
│       └── marketplaces.json   # Marketplace definitions
├── migrations/                 # SQL migrations
├── api/                        # Vercel serverless handler
│   └── index.ts
├── tests/                      # E2E tests
├── scripts/                    # Utility scripts
├── check.sh                    # Format, lint, typecheck, unit tests
├── health.sh                   # Security and dependency checks
├── all-checks.sh               # Run all checks
├── docker-compose.yml          # Docker services
├── biome.json                  # Biome linter/formatter config
├── tsconfig.json               # TypeScript config
├── vitest.config.ts            # Vitest config (unit tests)
└── vitest.config.e2e.ts        # Vitest config (e2e tests)
```

## API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Health check with version |
| `/version` | GET | Get API version |
| `/me` | GET | Get current user with roles and tenants (includes shops) |
| `/users` | GET, POST | List/create users |
| `/users/:id` | GET, PUT, DELETE | User CRUD |
| `/tenants` | GET, POST | List/create tenants |
| `/tenants/with-shop-and-user` | POST | Create user, tenant, and shop (systemAdmin only, returns generated API key) |
| `/tenants/:id` | GET, PUT, DELETE | Tenant CRUD |
| `/shops` | GET, POST | List/create shops |
| `/shops/:id` | GET, PUT, DELETE | Shop CRUD |
| `/user-shops` | GET, POST | List/create user-shop links |
| `/user-shops/:id` | DELETE | Delete user-shop link |
| `/roles` | GET, POST | List/create roles |
| `/roles/:id` | GET, PUT, DELETE | Role CRUD |
| `/user-roles` | GET, POST | List/create user-role links |
| `/user-roles/:id` | DELETE | Delete user-role link |
| `/api-keys` | GET, POST | List/create API keys |
| `/api-keys/:id` | GET, PUT, DELETE | API key CRUD |
| `/marketplaces` | GET, POST | List/create marketplaces |
| `/marketplaces/:id` | GET, PUT, DELETE | Marketplace CRUD |
| `/skus` | GET, POST | List/create SKUs (requires `shop_id` and `tenant_id` query params) |
| `/skus/examples/json` | GET | Download example JSON file for import (no auth required) |
| `/skus/examples/csv` | GET | Download example CSV file for import (no auth required) |
| `/skus/export/json` | GET | Export all SKUs in JSON format |
| `/skus/export/csv` | GET | Export all SKUs in CSV format |
| `/skus/import/json` | POST | Import/upsert SKUs from JSON array |
| `/skus/import/csv` | POST | Import/upsert SKUs from CSV |
| `/skus/:id` | GET, PUT, DELETE | SKU CRUD (requires `shop_id` and `tenant_id` query params) |
| `/sales-history` | GET, POST | List/create sales history (requires `shop_id` and `tenant_id` query params) |
| `/sales-history/examples/json` | GET | Download example JSON file for import (no auth required) |
| `/sales-history/examples/csv` | GET | Download example CSV file for import (no auth required) |
| `/sales-history/export/json` | GET | Export sales history in JSON format (supports period filters) |
| `/sales-history/export/csv` | GET | Export sales history in CSV format (supports period filters) |
| `/sales-history/import` | POST | Import/upsert sales history from JSON array (auto-creates missing SKUs) |
| `/sales-history/import/csv` | POST | Import/upsert sales history from CSV (auto-creates missing SKUs) |
| `/sales-history/:id` | GET, PUT, DELETE | Sales history CRUD (requires `shop_id` and `tenant_id` query params) |

### Tenant Management

Tenant endpoints require authentication. When creating a tenant, the `created_by` field is automatically set to the authenticated user's ID:

```bash
# Create a tenant (created_by is set automatically to authenticated user)
curl -X POST -H "x-api-key: $API_KEY" -H "Content-Type: application/json" \
  "http://localhost:3000/tenants" \
  -d '{"title": "My Tenant"}'

# List all tenants
curl -H "x-api-key: $API_KEY" "http://localhost:3000/tenants"

# Get tenant by ID
curl -H "x-api-key: $API_KEY" "http://localhost:3000/tenants/1"

# Create tenant with shop and user (systemAdmin only) - returns API key of owner
# Shop automatically takes the same name as the tenant
curl -X POST -H "x-api-key: $SYSTEM_ADMIN_API_KEY" -H "Content-Type: application/json" \
  "http://localhost:3000/tenants/with-shop-and-user" \
  -d '{
    "tenantTitle": "New Company",
    "userEmail": "owner@company.com",
    "userName": "Company Owner"
  }'

# Response includes tenant, shop, user, and generated API key:
# {
#   "tenant": { "id": 1, "title": "New Company", "owner_id": 123, ... },
#   "shop": { "id": 1, "title": "New Company", "tenant_id": 1 },
#   "user": { "id": 123, "email": "owner@company.com", "name": "Company Owner" },
#   "apiKey": "sk_abc123..."
# }
```

The `created_by` field tracks which user created each tenant and cannot be manually set - it's always derived from the authenticated user.

**Create Tenant with Shop and User** (`POST /tenants/with-shop-and-user`):
- Only `systemAdmin` can use this endpoint
- Creates user, tenant, and shop in one transaction
- Shop automatically uses the same name as the tenant
- Generates API key for the new user
- Sets the new user as tenant owner and creator
- Returns tenant, shop, user, and API key for immediate use

### SKU Endpoints

All SKU endpoints (except examples) require `shop_id` and `tenant_id` query parameters for access control:

```bash
# Download example JSON format
curl -O http://localhost:3000/skus/examples/json

# Download example CSV format
curl -O http://localhost:3000/skus/examples/csv

# List SKUs for a shop
curl -H "x-api-key: $API_KEY" \
  "http://localhost:3000/skus?shop_id=1&tenant_id=1"

# Create a SKU
curl -X POST -H "x-api-key: $API_KEY" -H "Content-Type: application/json" \
  "http://localhost:3000/skus?shop_id=1&tenant_id=1" \
  -d '{"code": "SKU-001", "title": "Product 1"}'

# Import SKUs from JSON (upserts by code)
curl -X POST -H "x-api-key: $API_KEY" -H "Content-Type: application/json" \
  "http://localhost:3000/skus/import/json?shop_id=1&tenant_id=1" \
  -d '[{"code": "SKU-001", "title": "Product 1"}, {"code": "SKU-002", "title": "Product 2"}]'

# Import SKUs from CSV (upserts by code)
curl -X POST -H "x-api-key: $API_KEY" -H "Content-Type: application/json" \
  "http://localhost:3000/skus/import/csv?shop_id=1&tenant_id=1" \
  -d '{"content": "code,title\nSKU-001,Product 1\nSKU-002,Product 2"}'

# Export SKUs as JSON (same format as import)
curl -H "x-api-key: $API_KEY" \
  "http://localhost:3000/skus/export/json?shop_id=1&tenant_id=1"

# Export SKUs as CSV
curl -H "x-api-key: $API_KEY" \
  "http://localhost:3000/skus/export/csv?shop_id=1&tenant_id=1"
```

SKU JSON format:
```json
[
  {"code": "SKU-001", "title": "Product 1"},
  {"code": "SKU-002", "title": "Product 2"}
]
```

SKU CSV format:
```csv
code,title
SKU-001,Product 1
SKU-002,Product 2
```

### Sales History Endpoints

All sales history endpoints (except examples) require `shop_id` and `tenant_id` query parameters for access control.
Period is specified in `YYYY-MM` format (stored as DATE, first of month).

```bash
# Download example JSON format
curl -O http://localhost:3000/sales-history/examples/json

# Download example CSV format
curl -O http://localhost:3000/sales-history/examples/csv

# List sales history for a shop
curl -H "x-api-key: $API_KEY" \
  "http://localhost:3000/sales-history?shop_id=1&tenant_id=1"

# Filter by period range
curl -H "x-api-key: $API_KEY" \
  "http://localhost:3000/sales-history?shop_id=1&tenant_id=1&period_from=2026-01&period_to=2026-12"

# Create a sales history record
curl -X POST -H "x-api-key: $API_KEY" -H "Content-Type: application/json" \
  "http://localhost:3000/sales-history?shop_id=1&tenant_id=1" \
  -d '{"sku_id": 1, "period": "2026-01", "quantity": 100}'

# Import sales history (upserts by sku_code + period, auto-creates missing SKUs)
curl -X POST -H "x-api-key: $API_KEY" -H "Content-Type: application/json" \
  "http://localhost:3000/sales-history/import?shop_id=1&tenant_id=1" \
  -d '[{"sku_code": "SKU-001", "period": "2026-01", "quantity": 100}]'

# Export sales history as JSON (same format as import)
curl -H "x-api-key: $API_KEY" \
  "http://localhost:3000/sales-history/export/json?shop_id=1&tenant_id=1"

# Export sales history as CSV
curl -H "x-api-key: $API_KEY" \
  "http://localhost:3000/sales-history/export/csv?shop_id=1&tenant_id=1"

# Export with period filter (works for both JSON and CSV)
curl -H "x-api-key: $API_KEY" \
  "http://localhost:3000/sales-history/export/json?shop_id=1&tenant_id=1&period_from=2026-01&period_to=2026-12"

# Import sales history from CSV (upserts by sku_code + period, auto-creates missing SKUs)
curl -X POST -H "x-api-key: $API_KEY" -H "Content-Type: application/json" \
  "http://localhost:3000/sales-history/import/csv?shop_id=1&tenant_id=1" \
  -d '{"content": "sku_code,period,quantity\nSKU-001,2026-01,100\nSKU-002,2026-01,50"}'
```

Sales history JSON format (uses `sku_code` for user convenience):
```json
[
  {"sku_code": "SKU-001", "period": "2026-01", "quantity": 100},
  {"sku_code": "SKU-002", "period": "2026-01", "quantity": 50}
]
```

Sales history CSV format:
```csv
sku_code,period,quantity
SKU-001,2026-01,100
SKU-002,2026-01,50
```

## Deployment

Deployed on Vercel. Add environment variables in Vercel dashboard:
- `DATABASE_URL`
- `SERVERLESS=true`
- `SYSTEM_ADMIN_KEY`
