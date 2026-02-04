# Sales Planner Backend

Monorepo for Sales Planner API and related packages.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [@sales-planner/api](packages/api) | NestJS REST API | Private |
| [@sales-planner/shared](packages/shared) | Shared types and DTOs | [![npm](https://img.shields.io/npm/v/@sales-planner/shared)](https://www.npmjs.com/package/@sales-planner/shared) |
| [@sales-planner/http-client](packages/http-client) | TypeScript HTTP client | [![npm](https://img.shields.io/npm/v/@sales-planner/http-client)](https://www.npmjs.com/package/@sales-planner/http-client) |

## Quick Start

```bash
# Install dependencies
pnpm install

# Start local PostgreSQL
pnpm --filter @sales-planner/api compose:up

# Run migrations
pnpm --filter @sales-planner/api db:migrate:local

# Start development server
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API in development mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run e2e tests |
| `pnpm lint` | Lint all packages (biome) |
| `pnpm format` | Format all packages (biome) |
| `pnpm typecheck` | Type check all packages |
| `pnpm check` | Format, lint, build, test |
| `pnpm all-checks` | Full CI checks (format, lint, typecheck, test, security, audit) |

## Project Structure

```
sales-planner-back/
├── biome.json              # Project-wide linting & formatting
├── package.json            # Root scripts
├── pnpm-workspace.yaml     # Monorepo config
├── scripts/
│   ├── all-checks.sh       # Full CI checks
│   ├── check.sh            # Quick dev checks
│   └── health.sh           # Security & dependency checks
└── packages/
    ├── api/                # NestJS API (private)
    │   ├── src/            # Source code
    │   ├── tests/          # E2E tests
    │   ├── migrations/     # SQL migrations
    │   └── scripts/        # Utility scripts
    ├── shared/             # Shared types (npm)
    └── http-client/        # HTTP client (npm)
```

## Deployment

- **API**: Deployed to [Vercel](https://sales-planner-back.vercel.app)
- **Packages**: Published to npm via changesets

```bash
# Create changeset
pnpm changeset

# Version packages
pnpm changeset version

# Publish to npm
pnpm release

# Deploy API to Vercel
npx vercel --prod
```

## Requirements

- Node.js 20+
- pnpm
- Docker (for local PostgreSQL)
- gitleaks (for security checks)

## Documentation

- [API Documentation](packages/api/README.md) - Full API reference
- [Shared Types](packages/shared/README.md) - DTOs and entities
- [HTTP Client](packages/http-client/README.md) - Client usage guide
