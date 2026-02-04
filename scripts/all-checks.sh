#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "Running all checks"
echo "========================================="

"$SCRIPT_DIR/check.sh"

"$SCRIPT_DIR/health.sh"

echo "========================================="
echo "All checks completed successfully"
echo "========================================="
