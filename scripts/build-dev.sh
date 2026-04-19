#!/usr/bin/env bash
# amem — dev build: copy extension/ → dist/ as-is.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
EXT="$ROOT/extension"
DIST="$ROOT/dist"

rm -rf "$DIST"
mkdir -p "$DIST"
cp -R "$EXT"/. "$DIST"/

echo "[build-dev] dist/ ready (all permissions)"
