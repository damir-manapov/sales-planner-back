#!/bin/bash
set -e

echo "=== Formatting ==="
pnpm format

echo "=== Linting ==="
pnpm lint

echo "=== Type checking ==="
pnpm typecheck

echo "=== Running tests ==="
pnpm test

echo "=== All checks passed ==="
