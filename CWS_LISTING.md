# Chrome Web Store listing — amem Clipper

Submission reference. Copy these fields into the CWS developer dashboard.

## Title (max 45 chars, bold)
**amem Clipper — Chrome Skills for AI Agents** (42 chars)

## Short description (max 132 chars)
The first user-installable browser skills catalog for AI agents. Bundled v0.1, BYO v0.2. Each skill is one action your agent calls.
(131 chars)

## Detailed description

amem Clipper is **the first user-installable browser skills catalog for AI agents.**

A "skill" is one small browser action your agent can call — capture this page, glance at LinkedIn unread, run a scripted demo. v0.1 ships three bundled skills you can toggle from a side panel that looks (and behaves) like an installable catalog. **v0.2 ships installable skills**: pull-request your own, install from a registry, BYO.

Underneath the catalog, your agent talks to amem Clipper through MCP. Anything the side panel can do, your Claude Code / Cursor / ChatGPT instance can do too — it's the same surface.

### Bundled v0.1 skills

| Skill | Trigger | What it does |
|---|---|---|
| **Auto-capture arxiv** | auto, on `arxiv.org/abs/*` | snapshots the abstract into your local amem wiki |
| **LinkedIn inbox glance** | manual (Run) | reads your DM unread count and summarizes new threads |
| **CWS demo recording** | manual (Run) | records a scripted Chrome demo as `.webm` |

Auto skills run silently when you visit a matching URL. Manual skills have a Run button. All skill state (enabled / last-run / result) lives in `chrome.storage.local`.

### How it fits the amem stack

amem Clipper is one half of [amem](https://amem.sh) — agent memory for the era of frontier models.

| Layer | What it is |
|---|---|
| **Sensor** (this extension) | Skills catalog + page captures from the web |
| **Brain** (`amem-sh` CLI) | Stores, compiles, fact-checks |
| **Access** (MCP) | Your agent reads & invokes skills via MCP |

The Apple Watch metaphor: this extension is dark without the brain running, by design. A sensor with no brain is a window with no eye behind it.

### How it works

1. Install the `amem` CLI once — `cargo install amem` (Rust required) or download from <https://github.com/yiidtw/amem-sh/releases>. **Required.**
2. Install this extension.
3. Open the side panel. The "Skills" tab shows the bundled catalog. Toggle on "Auto-capture arxiv" and visit any abstract — it lands in your wiki.
4. Click. Capture. Search. Recall. Or just let your agent call the skills directly.

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

amem Clipper has one purpose: **expose a skills catalog of small, agent-invokable browser actions, each backed by the user's local `amem` CLI.** The bundled v0.1 skills (auto-capture, LinkedIn inbox glance, demo recording) and the v0.2 installable-skills system both run through the same permission set — each permission supports the catalog's single flow.

| Permission | Justification |
|---|---|
| `storage` | Persist capture history, skill enabled/disabled state, and skill last-run results in `chrome.storage.local`. |
| `activeTab` | Access the current tab's DOM/URL when the user runs a skill or presses capture. |
| `scripting` | Inject skill code (capture helper, LinkedIn DOM reader, scripted demo driver) into the active tab once per invocation. |
| `sidePanel` | Render the skills catalog UI in Chrome's side panel. |
| `alarms` | Retry the local bridge connection on a short interval so the user doesn't see transient "disconnected" states. |
| `tabs` | Read the active tab's URL and title for capture records and to detect URL matches for auto skills. |
| `tabCapture` | Record the active tab's video stream — only when the user runs the CWS demo recording skill. |
| `offscreen` | Host the `MediaRecorder` off-screen because MV3 service workers can't hold a `MediaStream`. |
| `contextMenus` | Offer right-click capture entries on links and pages. |
| `downloads` | Save `.webm` recordings to the Downloads folder. |
| `host_permissions: <all_urls>` | Skills can target any site (LinkedIn, arxiv, future user-installed skills). The extension never reads a page without an explicit user action or a matching enabled auto-skill. |

## Promo video (optional)
Skip for v0.2.0 launch — submit screenshots only. A 90-second skills-catalog demo can be added in a follow-up update.

## Screenshots checklist (1280×800, 3 minimum for submission)

For v0.2.0, the minimum viable set leads with the skills catalog framing:

1. **Skills tab open** — side panel "Skills" tab active, three skill cards visible (Auto-capture arxiv toggled on, LinkedIn inbox glance with Run button, CWS demo recording with Run button), v0.2 footer line at the bottom
2. **Auto skill firing** — arxiv abstract page in foreground with the subtle "captured to amem" toast in the corner, side panel "Captures" tab showing the new entry on top
3. **Manual skill result** — "LinkedIn inbox glance" card showing "✓ captured 5 LinkedIn unread · 8s ago" inline
4. **Bridge status** — side panel "Captures" tab showing the bridge row in connected vs offline state (one screenshot of each, or a side-by-side composite)

Optional 5th if time permits:
5. Claude Code (or another MCP client) calling a skill via the amem MCP server — proof that the catalog is agent-callable, not just a UI

### Capture procedure

1. `cd ~/claude_projects/amem-clipper && npm run build:prod` (already done — `dist/` is fresh)
2. Chrome → `chrome://extensions` → toggle Developer mode → Load unpacked → select `~/claude_projects/amem-clipper/dist/`
3. Open `chrome://settings/appearance` and ensure window is sized for 1280×800 (or use the macOS Screenshot tool with size hints)
4. Open the side panel (toolbar icon → side panel option) and click the "Skills" tab — first screenshot here
5. Toggle "Auto-capture arxiv" on, visit `https://arxiv.org/abs/1706.03762`, wait for toast — second screenshot
6. Click "Run" on "LinkedIn inbox glance" (must be logged into LinkedIn) — third screenshot when result lands
7. Use macOS Cmd+Shift+4 to capture the side panel + page area; resize/crop to 1280×800
8. Save as `screenshots/01-skills-tab.png`, `02-arxiv-autocapture.png`, `03-linkedin-result.png`, `04-bridge-status.png`
