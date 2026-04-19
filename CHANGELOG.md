# amem Changelog

All notable changes to the amem Chrome extension.

## [0.1.0] — 2026-04-18

### Added
- MV3 extension skeleton with side panel UI.
- Context-menu capture entries: "capture this page" and "capture selection".
- Tab-recording workflow (`tabCapture` → offscreen `MediaRecorder` → Downloads folder)
  driven by `chrome.runtime.sendMessage({ cmd: 'start_recording' | 'stop_recording' })`.
- Placeholder content-script hooks for claude.ai, chatgpt.com, and gemini.google.com.
- Placeholder generic/Claude/ChatGPT/Gemini extractor modules.
- Client-only scaffolding for the amem-sh local bridge at `ws://localhost:7600`.
- Amem-branded monogram icon (16/48/128 PNG from a single SVG source).
- `scripts/verify-manifest.mjs`: checks `manifest.json` is valid, referenced files
  exist, and forbidden keys (`oauth2`, `identity`) are absent.
- Dev and prod build scripts (`scripts/build-dev.sh`, `scripts/build-prod.sh`).

### Not included (intentional)
- No Google Drive / OAuth integration.
- No `identity` permission.
- No server-side bridge implementation (client placeholder only).
- No real conversation extraction; content scripts are inert stubs.
