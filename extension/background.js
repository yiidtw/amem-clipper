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
// Bridge client placeholder (amem-sh on ws://localhost:7600)
// ---------------------------------------------------------------------------

let bridgeWs = null;

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
    bridgeWs.onmessage = (event) => {
      // Day 1-2: log only. Day 2+ will wire real commands.
      console.log('[amem:bridge] message:', event.data);
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
