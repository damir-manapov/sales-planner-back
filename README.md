# Sales Planner API

NestJS API for sales planning and management with Kysely + PostgreSQL (Neon).

## Features

- **Users** - User management
- **Tenants** - Multi-tenant support
- **Shops** - Shop management linked to tenants
- **User-Shops** - Link users to shops
- **Roles** - Role-based access control
- **User-Roles** - Assign roles to users
- **API Keys** - API keys with optional expiration, linked to users
- **Bootstrap** - Auto-creates systemAdmin user on startup

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
│   └── bootstrap/              # System admin initialization
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

## Deployment

Deployed on Vercel. Add environment variables in Vercel dashboard:
- `DATABASE_URL`
- `SERVERLESS=true`
- `SYSTEM_ADMIN_KEY`
