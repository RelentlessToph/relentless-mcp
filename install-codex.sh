#!/bin/bash
# One-command Codex bootstrap for local clone usage.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_REPO="${1:-$PWD}"

cd "$SCRIPT_DIR"
npm run build >/dev/null
node dist/index.js setup codex --repo "$TARGET_REPO" --use-local-server
