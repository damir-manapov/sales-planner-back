# Sales Planner API

NestJS API for sales planning and management with Kysely + PostgreSQL (Neon).

## Features

- **Users** - User management
- **Tenants** - Multi-tenant support
- **Shops** - Shop management linked to tenants
- **User-Shops** - Link users to shops
- **Roles** - Role-based access control (viewer, editor, tenantAdmin, systemAdmin)
- **User-Roles** - Assign roles to users (per shop or per tenant)
- **API Keys** - API keys with optional expiration, linked to users
- **Marketplaces** - Marketplace management (string IDs)
- **SKUs** - SKU management linked to shops (unique code per shop)
- **Sales History** - Monthly sales data per SKU (shop-level entity)
- **Bootstrap** - Auto-creates systemAdmin user and seeds default roles on startup

## Role-Based Access Control

The API implements a hierarchical role-based access control system:

### Role Types

| Role | Scope | Description |
|------|-------|-------------|
| `viewer` | Shop | Read-only access to a specific shop's resources |
| `editor` | Shop | Read/write access to a specific shop's resources |
| `tenantAdmin` | Tenant | Full access to all shops within a tenant |
| `systemAdmin` | Global | Full access to all tenants and shops |

### Role Assignment

- **Shop-level roles** (`viewer`, `editor`): Assigned with `tenant_id` and `shop_id`
- **Tenant-level roles** (`tenantAdmin`): Assigned with `tenant_id` only (no `shop_id`)
- **System-level roles** (`systemAdmin`): No tenant or shop scope

### Access Control Logic

For protected endpoints (e.g., SKUs):
1. **System admin**: Full access to everything
2. **Tenant admin**: Full access to all shops in their tenant
3. **Shop-level roles**: 
   - `viewer` or `editor`: Read access to the specific shop
   - `editor` only: Write access to the specific shop

### Authentication

All protected endpoints require an API key in the `x-api-key` header. The API key is linked to a user, and the user's roles determine access permissions.

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

### Check scripts

| Script | Description |
|--------|-------------|
| `./check.sh` | Format, lint, typecheck, and run unit tests |
| `./health.sh` | Check gitleaks, outdated deps, and vulnerabilities |
| `./all-checks.sh` | Run both check.sh and health.sh |

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
│   ├── skus/                   # SKUs CRUD│   ├── sales-history/         # Sales history (monthly data per SKU)│   └── bootstrap/              # System admin & seed data initialization
├── data/
│   └── common/                 # Seed data (JSON files)
│       └── marketplaces.json   # Marketplace definitions
├── migrations/                 # SQL migrations
├── api/                        # Vercel serverless handler
│   └── index.ts
├── test/                       # E2E tests
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
| `/users` | GET, POST | List/create users |
| `/users/:id` | GET, PUT, DELETE | User CRUD |
| `/tenants` | GET, POST | List/create tenants |
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
| `/skus/import/json` | POST | Import/upsert SKUs from JSON array |
| `/skus/import/csv` | POST | Import/upsert SKUs from CSV |
| `/skus/:id` | GET, PUT, DELETE | SKU CRUD (requires `shop_id` and `tenant_id` query params) |
| `/sales-history` | GET, POST | List/create sales history (requires `shop_id` and `tenant_id` query params) |
| `/sales-history/examples/json` | GET | Download example JSON file for import (no auth required) |
| `/sales-history/examples/csv` | GET | Download example CSV file for import (no auth required) |
| `/sales-history/import` | POST | Import/upsert sales history from JSON array |
| `/sales-history/:id` | GET, PUT, DELETE | Sales history CRUD (requires `shop_id` and `tenant_id` query params) |

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
```

CSV format for import:
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
  -d '{"sku_id": 1, "period": "2026-01", "quantity": 100, "amount": "1500.50"}'

# Import sales history (upserts by sku_code + period)
curl -X POST -H "x-api-key: $API_KEY" -H "Content-Type: application/json" \
  "http://localhost:3000/sales-history/import?shop_id=1&tenant_id=1" \
  -d '[{"sku_code": "SKU-001", "period": "2026-01", "quantity": 100, "amount": "1500.50"}]'
```

Sales history import JSON format (uses `sku_code` for user convenience):
```json
[
  {"sku_code": "SKU-001", "period": "2026-01", "quantity": 100, "amount": "1500.50"},
  {"sku_code": "SKU-002", "period": "2026-01", "quantity": 50, "amount": "750.00"}
]
```

## Deployment

Deployed on Vercel. Add environment variables in Vercel dashboard:
- `DATABASE_URL`
- `SERVERLESS=true`
- `SYSTEM_ADMIN_KEY`
