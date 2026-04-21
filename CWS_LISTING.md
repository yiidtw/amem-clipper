# Chrome Web Store listing — amem Clipper

Submission reference. Copy these fields into the CWS developer dashboard.

## Title (max 45 chars, bold)
**amem Clipper — Local-First Web Capture** (40 chars)

## Short description (max 132 chars)
Snapshot any page into your personal, local-first wiki. Paired with the amem CLI — everything stays on your machine.
(113 chars)

## Detailed description

amem Clipper is the browser companion to **amem**, a local-first knowledge capture system for people who want to own their notes forever.

Click the amem button, and the current page becomes part of your personal wiki: title, URL, selected text, even a full tab recording if you enable it. No cloud accounts. No trackers. No telemetry. Nothing leaves your machine unless you tell it to.

### What amem Clipper does

- **One-click capture** — snapshot the current tab into your wiki
- **Side panel** — review recent captures, search, open in your editor
- **Recording** — capture a live tab session as `.webm` for demos and walkthroughs
- **Bridge mode** — talks to your local `amem` binary over `ws://127.0.0.1:7600` so captures land in `~/.amem/` as structured markdown
- **Agent-ready** — your captured wiki is served via MCP, so Claude, ChatGPT, and other agents can read your own knowledge base when you ask

### How it works

1. Install the `amem` CLI once (`curl -fsSL https://amem.sh/install | sh`). Required.
2. Install this extension.
3. amem Clipper connects to the local `amem` bridge automatically. When it can't find the bridge, it tells you plainly — no hidden failures.
4. Click. Capture. Search. Recall.

### Why "Clipper"

amem Clipper is a peripheral, like an Apple Watch to your iPhone. The amem CLI is the core — storage, compile, recall, and MCP all live there. Clipper surfaces the two capture moments a browser is best at (a tab, a recording) without trying to be the whole product.

### Privacy

- No analytics, no telemetry, no backend.
- All captures write to **your** `~/.amem/` via a loopback WebSocket.
- No third-party network calls from the extension.
- Full policy: <https://docs.amem.sh/privacy.html>

### Open source

Code: <https://github.com/yiidtw/amem-clipper> (extension) · <https://github.com/yiidtw/amem-sh> (CLI + MCP server)

### Feedback

File an issue at <https://github.com/yiidtw/amem-clipper/issues>.

---

## Category
**Productivity**

## Language
English

## Permission justifications (for CWS "single purpose" section)

amem Clipper has one purpose: **capture the current web page into the user's local knowledge base via the `amem` CLI**. Each permission exists to support that single flow.

| Permission | Justification |
|---|---|
| `storage` | Persist capture history + settings in `chrome.storage.local`. |
| `activeTab` | Access the current tab's DOM/URL at the moment the user presses the capture button. |
| `scripting` | Inject the capture helper into the active tab once per invocation. |
| `sidePanel` | Render the amem Clipper UI in Chrome's side panel. |
| `alarms` | Retry the local bridge connection on a short interval so the user doesn't see transient "disconnected" states. |
| `tabs` | Read the active tab's URL and title for the capture record. |
| `tabCapture` | Record the active tab's video stream — only after the user clicks Record in the side panel. |
| `offscreen` | Host the `MediaRecorder` off-screen because MV3 service workers can't hold a `MediaStream`. |
| `contextMenus` | Offer right-click capture entries on links and pages. |
| `downloads` | Save `.webm` recordings to the Downloads folder. |
| `host_permissions: <all_urls>` | Let capture work on any page the user visits. The extension never reads a page without an explicit user action. |

## Promo video (optional, recommended)
Recordly-produced 90-second demo showing:
1. (0:00–0:15) User sees a page worth saving; clicks amem action → capture lands in wiki
2. (0:15–0:40) `amem recall` in terminal finds the page by content
3. (0:40–0:75) Side panel opens; user records a short tab session
4. (0:75–0:90) Agent (Claude Code) uses `amem_recall` MCP tool to answer a question from the user's own wiki

Host video at `https://amem.sh/demo.mp4` (or YouTube unlisted).

## Screenshots checklist (1280×800, up to 5)
Pending — user captures after UI gray-out states land (RFC-001). Minimum viable set for MVP submission:

1. Side panel open on an arxiv abstract, amem action highlighted
2. Captured entry in the wiki list with title + excerpt
3. Terminal showing `amem recall "transformer"` with a hit
4. (optional) Side panel recording mode
5. (optional) Claude Code using `amem_recall` MCP tool
