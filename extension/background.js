// amem — background service worker
// Day 1-2 scope: capture skeleton, self-recording workflow, placeholder bridge client.
// No Google Drive. No OAuth. Local-first only.

const BRIDGE_PORT = 7600;
const BRIDGE_URL = `ws://localhost:${BRIDGE_PORT}`;

// ---------------------------------------------------------------------------
// Side panel wiring
// ---------------------------------------------------------------------------

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error('[amem] setPanelBehavior failed:', err));

// ---------------------------------------------------------------------------
// Context menus
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'amem-capture-page',
    title: 'amem: capture this page',
    contexts: ['page'],
  });
  chrome.contextMenus.create({
    id: 'amem-capture-selection',
    title: 'amem: capture selection',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;
  if (info.menuItemId === 'amem-capture-page') {
    await capturePage(tab.id);
  } else if (info.menuItemId === 'amem-capture-selection') {
    await captureSelection(tab.id, info.selectionText || '');
  }
});

// ---------------------------------------------------------------------------
// Capture logic (placeholder)
// ---------------------------------------------------------------------------

async function capturePage(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const record = {
      type: 'page',
      url: tab.url,
      title: tab.title,
      capturedAt: new Date().toISOString(),
    };
    await appendCaptureLog(record);
    console.log('[amem:capture] page captured:', record.url);
    return { success: true, data: record };
  } catch (err) {
    console.error('[amem:capture] capturePage failed:', err);
    return { success: false, error: err.message };
  }
}

async function captureSelection(tabId, text) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const record = {
      type: 'selection',
      url: tab.url,
      title: tab.title,
      text,
      capturedAt: new Date().toISOString(),
    };
    await appendCaptureLog(record);
    console.log('[amem:capture] selection captured:', record.url);
    return { success: true, data: record };
  } catch (err) {
    console.error('[amem:capture] captureSelection failed:', err);
    return { success: false, error: err.message };
  }
}

async function appendCaptureLog(record) {
  const { amemCaptureLog } = await chrome.storage.local.get('amemCaptureLog');
  const log = Array.isArray(amemCaptureLog) ? amemCaptureLog : [];
  log.unshift(record);
  if (log.length > 200) log.length = 200;
  await chrome.storage.local.set({ amemCaptureLog: log });
}

// ---------------------------------------------------------------------------
// Recording workflow (tabCapture → offscreen → downloads)
// ---------------------------------------------------------------------------

let isRecording = false;
let recordingTabId = null;
let recordingStartedAt = null;

async function ensureOffscreenDocument() {
  const existing = await chrome.offscreen.hasDocument?.();
  if (existing) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Record the active tab for amem demo capture.',
  });
}

async function startRecording(params = {}) {
  if (isRecording) {
    return { success: false, error: 'Already recording.' };
  }
  let tabId = params.tabId;
  if (!tabId) {
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!active) return { success: false, error: 'No active tab.' };
    tabId = active.id;
  }
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  await ensureOffscreenDocument();
  const response = await chrome.runtime.sendMessage({
    type: 'amem-offscreen-start',
    streamId,
  });
  if (!response || !response.started) {
    return { success: false, error: response?.error || 'Offscreen failed to start.' };
  }
  isRecording = true;
  recordingTabId = tabId;
  recordingStartedAt = Date.now();
  console.log('[amem:recording] started on tab', tabId);
  return { success: true, data: { tabId, startedAt: recordingStartedAt } };
}

async function stopRecording() {
  if (!isRecording) {
    return { success: false, error: 'No active recording.' };
  }
  const response = await chrome.runtime.sendMessage({ type: 'amem-offscreen-stop' });
  if (!response || response.error) {
    isRecording = false;
    return { success: false, error: response?.error || 'Offscreen stop failed.' };
  }
  const duration = Date.now() - recordingStartedAt;
  const filename = `amem-recording-${new Date(recordingStartedAt).toISOString().replace(/[:.]/g, '-')}.webm`;
  const dataUrl = `data:${response.mimeType};base64,${response.base64}`;
  let downloadId = null;
  try {
    downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: false,
    });
  } catch (err) {
    console.warn('[amem:recording] download failed:', err);
  }
  try { await chrome.offscreen.closeDocument(); } catch {}
  const result = {
    tabId: recordingTabId,
    startedAt: recordingStartedAt,
    duration,
    size: response.size,
    mimeType: response.mimeType,
    filename,
    downloadId,
  };
  isRecording = false;
  recordingTabId = null;
  recordingStartedAt = null;
  console.log('[amem:recording] stopped:', result);
  return { success: true, data: result };
}

function recordingStatus() {
  return {
    success: true,
    data: {
      recording: isRecording,
      tabId: recordingTabId,
      startedAt: recordingStartedAt,
      duration: isRecording ? Date.now() - recordingStartedAt : 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Bridge client (amem-sh on ws://localhost:7600)
// ---------------------------------------------------------------------------

let bridgeWs = null;
const agentTabs = new Map(); // agentId → tabId
let bridgeActionLog = []; // [{action, selector, boundingRect, timestamp}, ...]

// Clean up if a tracked agent tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  for (const [agent, tid] of agentTabs) {
    if (tid === tabId) agentTabs.delete(agent);
  }
});

// Wait for a tab to finish loading (with 30s timeout)
function waitForTabLoad(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('Tab load timeout'));
    }, 30000);

    function listener(id, changeInfo) {
      if (id === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        clearTimeout(timeout);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);

    // Check if already loaded
    chrome.tabs.get(tabId).then(tab => {
      if (tab.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}

// Execute a bridge command
async function bridgeExecute(cmd) {
  const { action, params = {}, agentId: _agentId } = cmd;
  const agentId = _agentId || '_default';
  let bridgeTabId = agentTabs.get(agentId) || null;

  switch (action) {
    case 'navigate': {
      if (bridgeTabId) {
        try {
          await chrome.tabs.get(bridgeTabId);
          await chrome.tabs.update(bridgeTabId, { url: params.url, active: true });
        } catch {
          const tab = await chrome.tabs.create({ url: params.url });
          agentTabs.set(agentId, tab.id);
          bridgeTabId = tab.id;
        }
      } else {
        const tab = await chrome.tabs.create({ url: params.url });
        agentTabs.set(agentId, tab.id);
        bridgeTabId = tab.id;
      }
      if (!params.noWait) {
        await waitForTabLoad(bridgeTabId);
      } else {
        // Give the tab a moment to start loading, but don't wait for complete
        await new Promise(r => setTimeout(r, 2000));
      }
      if (isRecording) {
        bridgeActionLog.push({
          action: 'navigate',
          url: params.url,
          timestamp: Date.now() - recordingStartedAt,
        });
      }
      return { success: true };
    }

    case 'click': {
      if (!bridgeTabId) return { success: false, error: 'No active tab. Navigate first.' };
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: bridgeTabId },
        func: (selector) => {
          const el = document.querySelector(selector);
          if (!el) return { error: `Element not found: ${selector}` };
          el.scrollIntoView({ block: 'center' });
          const rect = el.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
          el.dispatchEvent(new MouseEvent('mousedown', opts));
          el.dispatchEvent(new MouseEvent('mouseup', opts));
          el.dispatchEvent(new MouseEvent('click', opts));
          return { clicked: true, tag: el.tagName, boundingRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
        },
        args: [params.selector],
      });
      if (result.result?.error) return { success: false, error: result.result.error };
      if (isRecording && result.result?.clicked) {
        bridgeActionLog.push({
          action: 'click',
          selector: params.selector,
          boundingRect: result.result.boundingRect,
          timestamp: Date.now() - recordingStartedAt,
        });
      }
      return { success: true, data: result.result };
    }

    case 'type': {
      if (!bridgeTabId) return { success: false, error: 'No active tab. Navigate first.' };
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: bridgeTabId },
        func: (selector, text, opts) => {
          const el = document.querySelector(selector);
          if (!el) return { error: `Element not found: ${selector}` };
          el.focus();
          el.scrollIntoView({ block: 'center' });

          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            // Standard form elements -- use native setter to trigger React/Vue
            const proto = el.tagName === 'INPUT'
              ? HTMLInputElement.prototype
              : HTMLTextAreaElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
            if (setter) setter.call(el, opts?.append ? el.value + text : text);
            else el.value = opts?.append ? el.value + text : text;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            // Contenteditable (Twitter/X, Notion, etc.)
            if (!opts?.append) {
              const sel = window.getSelection();
              const range = document.createRange();
              range.selectNodeContents(el);
              sel.removeAllRanges();
              sel.addRange(range);
            }
            document.execCommand('insertText', false, text);
          }
          const rect = el.getBoundingClientRect();
          return { typed: true, boundingRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
        },
        args: [params.selector, params.text, { append: params.append }],
      });
      if (result.result?.error) return { success: false, error: result.result.error };
      if (isRecording && result.result?.typed) {
        bridgeActionLog.push({
          action: 'type',
          selector: params.selector,
          text: params.text,
          boundingRect: result.result.boundingRect,
          timestamp: Date.now() - recordingStartedAt,
        });
      }
      return { success: true, data: result.result };
    }

    case 'wait': {
      if (!bridgeTabId) return { success: false, error: 'No active tab. Navigate first.' };
      const timeout = params.timeout || 10000;
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: bridgeTabId },
        func: (selector, timeout) => {
          return new Promise((resolve) => {
            const existing = document.querySelector(selector);
            if (existing) return resolve({ found: true });

            const observer = new MutationObserver(() => {
              if (document.querySelector(selector)) {
                observer.disconnect();
                resolve({ found: true });
              }
            });
            observer.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
              observer.disconnect();
              resolve({ error: `Timeout (${timeout}ms) waiting for: ${selector}` });
            }, timeout);
          });
        },
        args: [params.selector, timeout],
      });
      if (result.result?.error) return { success: false, error: result.result.error };
      return { success: true, data: result.result };
    }

    case 'extract': {
      if (!bridgeTabId) return { success: false, error: 'No active tab. Navigate first.' };
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: bridgeTabId },
        func: (selector, attr) => {
          const els = document.querySelectorAll(selector);
          if (els.length === 0) return [];
          return Array.from(els).map(el => {
            if (attr) return el.getAttribute(attr);
            return el.innerText || el.textContent;
          });
        },
        args: [params.selector, params.attr || null],
      });
      return { success: true, data: result.result };
    }

    case 'evaluate': {
      if (!bridgeTabId) return { success: false, error: 'No active tab. Navigate first.' };
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: bridgeTabId },
        world: 'MAIN',
        func: async (code) => {
          try { return { value: await eval(code) }; }
          catch (e) { return { error: e.message }; }
        },
        args: [params.expression],
      });
      if (result.result?.error) return { success: false, error: result.result.error };
      return { success: true, data: result.result.value };
    }

    case 'screenshot': {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
      return { success: true, data: { dataUrl } };
    }

    case 'sleep': {
      await new Promise(r => setTimeout(r, params.ms || 1000));
      return { success: true };
    }

    case 'tab_info': {
      if (!bridgeTabId) return { success: false, error: 'No active tab.' };
      const tab = await chrome.tabs.get(bridgeTabId);
      return { success: true, data: { url: tab.url, title: tab.title, status: tab.status } };
    }

    case 'ping': {
      return { success: true, data: { pong: true, agentId, tabId: bridgeTabId, agents: Object.fromEntries(agentTabs), extensionId: chrome.runtime.id } };
    }

    case 'action_log': {
      return { success: true, data: bridgeActionLog };
    }

    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}

function bridgeConnect() {
  if (bridgeWs && bridgeWs.readyState === WebSocket.OPEN) return;
  try {
    bridgeWs = new WebSocket(BRIDGE_URL);
    bridgeWs.onopen = () => console.log('[amem:bridge] connected to', BRIDGE_URL);
    bridgeWs.onclose = () => {
      bridgeWs = null;
    };
    bridgeWs.onerror = () => {
      bridgeWs = null;
    };
    bridgeWs.onmessage = async (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        console.warn('[amem:bridge] non-JSON message:', event.data);
        return;
      }

      // Execute command and reply
      try {
        const result = await bridgeExecute(msg);
        if (bridgeWs && bridgeWs.readyState === WebSocket.OPEN) {
          bridgeWs.send(JSON.stringify({ id: msg.id, ...result }));
        }
      } catch (err) {
        if (bridgeWs && bridgeWs.readyState === WebSocket.OPEN) {
          bridgeWs.send(JSON.stringify({ id: msg.id, success: false, error: err.message }));
        }
      }
    };
  } catch (err) {
    console.warn('[amem:bridge] connect failed:', err.message);
    bridgeWs = null;
  }
}

function bridgeStatus() {
  return {
    connected: !!(bridgeWs && bridgeWs.readyState === WebSocket.OPEN),
    url: BRIDGE_URL,
  };
}

chrome.alarms.create('amem-bridge-reconnect', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'amem-bridge-reconnect') bridgeConnect();
});

// ---------------------------------------------------------------------------
// Message router — side panel / external drivers talk to us via cmd.
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return;

  // Offscreen → background relay messages are handled inside offscreen.js.
  if (message.type && message.type.startsWith('amem-offscreen-')) return;

  const reply = (value) => {
    try { sendResponse(value); } catch {}
  };

  switch (message.cmd) {
    case 'capture_page':
      capturePage(message.tabId).then(reply).catch((e) => reply({ success: false, error: e.message }));
      return true;
    case 'capture_selection':
      captureSelection(message.tabId, message.text || '').then(reply).catch((e) => reply({ success: false, error: e.message }));
      return true;
    case 'start_recording':
      startRecording(message.params || {}).then(reply).catch((e) => reply({ success: false, error: e.message }));
      return true;
    case 'stop_recording':
      stopRecording().then(reply).catch((e) => reply({ success: false, error: e.message }));
      return true;
    case 'recording_status':
      reply(recordingStatus());
      return false;
    case 'bridge_status':
      reply({ success: true, data: bridgeStatus() });
      return false;
    case 'bridge_connect':
      bridgeConnect();
      reply({ success: true, data: bridgeStatus() });
      return false;
    case 'get_captures':
      chrome.storage.local.get('amemCaptureLog').then(({ amemCaptureLog }) => {
        reply({ success: true, data: Array.isArray(amemCaptureLog) ? amemCaptureLog : [] });
      });
      return true;
    default:
      return false;
  }
});

// Kick off bridge on startup (best-effort)
bridgeConnect();
console.log('[amem] background service worker started');
