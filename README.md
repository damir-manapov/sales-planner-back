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

## Scripts

- `pnpm build` - Build the application
- `pnpm start` - Start the application
- `pnpm start:dev` - Start in development mode with watch
- `pnpm start:prod` - Start production build
- `pnpm test` - Run tests
- `pnpm test:cov` - Run tests with coverage
- `pnpm lint` - Run linter
- `pnpm format` - Format code
- `pnpm typecheck` - Check types

### Check scripts

- `./check.sh` - Format, lint, typecheck, and run tests
- `./health.sh` - Check gitleaks, outdated deps, and vulnerabilities
- `./all-checks.sh` - Run both check.sh and health.sh

## Docker Compose

```bash
pnpm compose:up      # Start services
pnpm compose:down    # Stop services
pnpm compose:restart # Restart services
pnpm compose:reset   # Reset (remove volumes and orphans)
```
