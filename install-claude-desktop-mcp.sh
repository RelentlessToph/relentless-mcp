#!/bin/bash
# One-command Claude Desktop MCP bootstrap for local clone usage.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR"
npm run build >/dev/null
node dist/index.js setup claude-desktop --use-local-server "$@"
