# amem-extension

Chrome MV3 extension for amem — local-first knowledge capture. Snapshot and
compile any page into your personal wiki, and record the active tab into
`.webm` files for demos and walkthroughs.

## Quick start (dev)

```bash
npm install
npm run build        # runs verify + dev build into dist/
```

Then in Chrome: `chrome://extensions` → enable Developer mode → "Load
unpacked" → select `dist/`.

## Layout

- `extension/` — source of truth. Everything here is copied to `dist/`.
  - `manifest.json` — MV3, minimal permissions, no OAuth, no Drive.
  - `background.js` — service worker: capture, recording, bridge placeholder.
  - `sidepanel.html` / `sidepanel.js` — UI with capture/record/status widgets.
  - `offscreen.html` / `offscreen.js` — hosts `MediaRecorder` for tabCapture.
  - `content-scripts/` — inert stubs for claude / chatgpt / gemini.
  - `extractors/` — placeholder extractor modules.
  - `lib/` — dedup, fsm, bridge client scaffolding.
  - `icons/` — `icon.svg` + generated 16/48/128 PNG.
- `scripts/` — build and verification scripts.
- `tests/` — vitest unit tests.

## Self-recording API

The side panel exposes Start/Stop buttons. Any other agent can drive the
recorder via `chrome.runtime.sendMessage`:

```js
chrome.runtime.sendMessage({ cmd: 'start_recording' });
chrome.runtime.sendMessage({ cmd: 'stop_recording' });
chrome.runtime.sendMessage({ cmd: 'recording_status' });
```

Recordings land in the browser Downloads folder as
`amem-recording-<timestamp>.webm`.

## Verification

```bash
npm run verify   # manifest JSON valid, referenced paths exist, no oauth2/identity
npm test         # vitest unit tests
```

See `LINEAGE.md` for project history.
