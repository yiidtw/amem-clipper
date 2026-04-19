#!/usr/bin/env bash
# amem — prod build: copy extension/ → dist/ and strip dev-only permissions.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
EXT="$ROOT/extension"
DIST="$ROOT/dist"

rm -rf "$DIST"
mkdir -p "$DIST"
cp -R "$EXT"/. "$DIST"/

python3 - <<'PY'
import json, pathlib
dist = pathlib.Path("dist/manifest.json")
m = json.loads(dist.read_text())
# tabCapture + offscreen are PRODUCTION requirements: self-recording workflow
# produces demo videos for the CWS listing. Only "debugger" is truly dev-only.
dev_only = {"debugger"}
m["permissions"] = [p for p in m.get("permissions", []) if p not in dev_only]
dist.write_text(json.dumps(m, indent=2) + "\n")
print("[build-prod] stripped dev perms:", ", ".join(sorted(dev_only)) or "(none)")
PY

echo "[build-prod] dist/ ready (prod)"
