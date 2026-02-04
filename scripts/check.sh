#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "=== Formatting ==="
pnpm format

echo "=== Linting ==="
pnpm lint

echo "=== Building packages ==="
pnpm --filter @sales-planner/shared build
pnpm --filter @sales-planner/http-client build

echo "=== Type checking ==="
pnpm -r typecheck

echo "=== Running unit tests ==="
pnpm test

echo "=== All checks passed ==="
