# amem Privacy Policy

**Last updated: 2026-04-18**

## What amem does

amem is a Chrome extension that captures web pages and recordings into your personal, local-first knowledge base. Everything stays on your machine unless you explicitly opt into a sync destination.

## Data collection

amem does **not** collect, transmit, or store any user data on external servers. There is no backend, no database, no analytics, no telemetry.

### What amem accesses

- **Active tab** when you click the amem action, open the side panel, or pick a context-menu entry — to read the page title, URL, and (when asked) visible text.
- **Local storage** (`chrome.storage.local`) — for capture history and preferences.
- **Local WebSocket** at `ws://localhost:7600` (the optional amem-sh bridge) — only when running on your own machine, to write captures to your filesystem. No external network calls.
- **Tab recording** (`tabCapture`) — only while you are actively recording from the side panel. Recordings are saved directly to your browser Downloads folder as `.webm` files.

### What amem does NOT do

- Does not read your browsing history.
- Does not track your activity or behavior.
- Does not send data to any third-party server.
- Does not use Google Drive, OAuth, or any cloud provider in this release.
- Does not record audio.

## Permissions explained

| Permission | Why |
|------------|-----|
| `storage` | Save capture history and settings locally in the browser. |
| `activeTab` | Access the current tab when you initiate a capture. |
| `scripting` | Inject capture helpers into the active tab when you press capture. |
| `sidePanel` | Render the amem side panel UI. |
| `alarms` | Periodically retry the local bridge connection. |
| `tabs` | Read the current tab's URL and title for the capture record. |
| `tabCapture` | Record the active tab's video stream (explicit user action only). |
| `offscreen` | Host `MediaRecorder` in an offscreen document (service workers can't). |
| `contextMenus` | Offer right-click capture entries. |
| `downloads` | Save recordings to your Downloads folder as `.webm` files. |
| `host_permissions: <all_urls>` | Lets capture work on whatever page you are viewing. Nothing is read without an explicit capture action. |

## Open source

amem is open source. Review the code at: https://github.com/yiidtw/amem-clipper

## Contact

For questions about this policy, open an issue at: https://github.com/yiidtw/amem-clipper/issues
