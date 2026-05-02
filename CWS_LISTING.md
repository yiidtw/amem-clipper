# Chrome Web Store listing — amem Clipper

Submission reference. Copy these fields into the CWS developer dashboard.

## Title (max 45 chars, bold)
**amem Clipper — Memory for AI agents** (38 chars)

## Short description (max 132 chars)
Your AI agent's eyes on the web. Capture pages into a local-first wiki the agent recalls — and fact-checks against — via MCP.
(132 chars)

## Detailed description

amem Clipper is the **web sensor** for [amem](https://amem.sh) — agent memory for the era of frontier models.

When you read something worth remembering, click amem. The page goes into your local wiki. Later, when Claude / ChatGPT / any MCP-aware agent answers a question, it can cite directly from what *you* read — and warn you when the agent's draft contradicts something already in your wiki.

No cloud. No accounts. No telemetry. Your captures live in `~/.amem/` on your own Mac, and are read by agents through a loopback bridge — never uploaded.

### What amem Clipper does

- **One-click capture** — snapshot the current tab into your local wiki
- **Side panel** — review recent captures, search, open in your editor
- **Tab recording** — capture a live tab session as `.webm` for demos and walkthroughs
- **Bridge mode** — talks to your local `amem` binary over `ws://127.0.0.1:7600` so captures land in `~/.amem/` as structured markdown
- **Agent-ready** — your captured wiki is served via MCP, so Claude, ChatGPT, and other agents can read your own knowledge base when answering you (and, soon, fact-check their own claims against it)

### How it works

1. Install the `amem` CLI once — `cargo install amem` (Rust required) or download from <https://github.com/yiidtw/amem-sh/releases>. **Required.**
2. Install this extension.
3. amem Clipper connects to the local `amem` bridge automatically. When it can't find the bridge, it tells you plainly — no hidden failures.
4. Click. Capture. Search. Recall.

### Why it's different

amem Clipper isn't a PKM tool that an agent can query. It's a sensor in a stack designed for the agent first:

| Layer | What it is |
|---|---|
| **Sensor** (this extension) | Captures from the web |
| **Brain** (`amem-sh` CLI) | Stores, compiles, fact-checks |
| **Access** (MCP) | Frontier models read via MCP — same protocol Claude, Cursor, etc. already speak |

The Apple Watch metaphor: this extension is dark without the brain running, by design. A sensor with no brain is a window with no eye behind it.

### Privacy

- No analytics, no telemetry, no backend.
- All captures write to **your** `~/.amem/` via a loopback WebSocket.
- No third-party network calls from the extension.
- Full policy: <https://docs.amem.sh/privacy>

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

amem Clipper has one purpose: **capture the current web page into the user's local agent memory via the `amem` CLI.** Each permission supports that single flow.

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

## Promo video (optional)
Skip for v0.1.0 launch — submit screenshots only. A 90-second demo can be added in a follow-up update.

## Screenshots checklist (1280×800, 3 minimum for submission)

For v0.1.0, the minimum viable set:

1. **Side panel open on an arxiv abstract** — amem button in the toolbar, side panel showing the captured entry with title + URL
2. **Capture history list** — side panel showing 3-5 captured items, each with title + favicon + relative timestamp
3. **Bridge status** — side panel showing "Bridge connected · Wiki at ~/.amem/" status row + a "Disconnected — install amem" state for contrast (one screenshot of each, or a side-by-side composite)

Optional 4th and 5th if time permits:
4. Recording mode active in side panel
5. Claude Code (or other MCP client) using `amem_recall` tool to answer a question from the user's wiki

### Capture procedure

1. `cd ~/claude_projects/amem-clipper && npm run build:prod` (already done — `dist/` is fresh)
2. Chrome → `chrome://extensions` → toggle Developer mode → Load unpacked → select `~/claude_projects/amem-clipper/dist/`
3. Open `chrome://settings/appearance` and ensure window is sized for 1280×800 (or use the macOS Screenshot tool with size hints)
4. Visit `https://arxiv.org/abs/1706.03762` (the Transformer paper — visually distinctive)
5. Open the side panel (toolbar icon → side panel option) and click capture
6. Use macOS Cmd+Shift+4 to capture the side panel + page area; resize/crop to 1280×800
7. Save as `screenshots/01-sidepanel-arxiv.png`, `02-history-list.png`, `03-bridge-status.png`

Or just hand them to me with `aide-skill chrome` driving capture — I can automate steps 4–7 once the extension is loaded.
