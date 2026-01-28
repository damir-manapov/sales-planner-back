# Sales Planner API

NestJS API for sales planning and management.

## Prerequisites

- Node.js 20+
- pnpm
- Docker (for database)
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
├── src/                    # Application source code
│   ├── main.ts             # Application entry point
│   ├── app.module.ts       # Root module
│   ├── app.controller.ts   # Root controller
│   ├── app.service.ts      # Root service
│   └── *.spec.ts           # Unit tests
├── test/                   # E2E tests
│   └── *.e2e.spec.ts
├── check.sh                # Format, lint, typecheck, unit tests
├── health.sh               # Security and dependency checks
├── all-checks.sh           # Run all checks
├── docker-compose.yml      # Docker services
├── biome.json              # Biome linter/formatter config
├── tsconfig.json           # TypeScript config
├── vitest.config.ts        # Vitest config (unit tests)
└── vitest.config.e2e.ts    # Vitest config (e2e tests)
```
