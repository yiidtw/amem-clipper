#!/usr/bin/env bash
# amem — regenerate PNG icons from icon.svg using rsvg-convert.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
ICONS="$ROOT/extension/icons"

if ! command -v rsvg-convert >/dev/null 2>&1; then
  echo "rsvg-convert not found. brew install librsvg" >&2
  exit 1
fi

for size in 16 48 128; do
  rsvg-convert -w "$size" -h "$size" "$ICONS/icon.svg" -o "$ICONS/icon${size}.png"
  echo "  ✓ icon${size}.png"
done
