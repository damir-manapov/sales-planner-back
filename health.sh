#!/bin/bash
set -e

echo "=== Checking gitleaks ==="
if ! command -v gitleaks &> /dev/null; then
  echo "ERROR: gitleaks is not installed"
  echo "Install from: https://github.com/gitleaks/gitleaks/releases"
  exit 1
fi
gitleaks git --verbose
echo "gitleaks: OK"

echo "=== Checking outdated dependencies ==="
OUTDATED=$(pnpm outdated --format json 2>&1 | grep -v "WARN" || true)
if [ -n "$OUTDATED" ] && [ "$OUTDATED" != "{}" ] && [ "$OUTDATED" != "[]" ]; then
  echo "ERROR: Outdated dependencies found:"
  pnpm outdated
  exit 1
fi
echo "outdated: OK"

echo "=== Checking vulnerabilities ==="
AUDIT_OUTPUT=$(pnpm audit 2>&1 || true)
echo "$AUDIT_OUTPUT"
if echo "$AUDIT_OUTPUT" | grep -q "[0-9] vulnerabilities found"; then
  echo "ERROR: Vulnerabilities detected"
  exit 1
fi
echo "audit: OK"

echo "=== Health check passed ==="
