#!/bin/bash
set -e

echo "=== Checking gitleaks ==="
if ! command -v gitleaks &> /dev/null; then
  echo "ERROR: gitleaks is not installed"
  echo "Install from: https://github.com/gitleaks/gitleaks/releases"
  exit 1
fi
gitleaks git --source=. --verbose
echo "gitleaks: OK"

echo "=== Checking outdated dependencies ==="
OUTDATED=$(pnpm outdated --format json 2>/dev/null || true)
if [ -n "$OUTDATED" ] && [ "$OUTDATED" != "{}" ] && [ "$OUTDATED" != "[]" ]; then
  echo "ERROR: Outdated dependencies found:"
  pnpm outdated
  exit 1
fi
echo "outdated: OK"

echo "=== Checking vulnerabilities ==="
pnpm audit --audit-level=moderate
echo "audit: OK"

echo "=== Health check passed ==="
