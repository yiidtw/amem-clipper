// amem — side panel controller.

const $ = (id) => document.getElementById(id);

function send(cmd, extra = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ cmd, ...extra }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

async function refreshCaptures() {
  const res = await send('get_captures');
  const ul = $('captures');
  if (!res || !res.success) {
    ul.innerHTML = '<li>failed to load</li>';
    return;
  }
  const items = res.data || [];
  if (items.length === 0) {
    ul.innerHTML = '<li>none yet</li>';
    return;
  }
  ul.innerHTML = items
    .slice(0, 10)
    .map((r) => {
      const title = escapeHtml(r.title || r.url || '(untitled)');
      const url = escapeHtml(r.url || '');
      const ts = new Date(r.capturedAt).toLocaleString();
      return `<li><div class="title">${title}</div><div class="url">${url}</div><div class="url">${r.type} · ${ts}</div></li>`;
    })
    .join('');
}

async function refreshBridge() {
  const res = await send('bridge_status');
  if (res && res.success) {
    const s = res.data;
    $('bridge-status').textContent = `${s.connected ? 'connected' : 'offline'} · ${s.url}`;
  }
}

async function refreshRecording() {
  const res = await send('recording_status');
  if (res && res.success) {
    const s = res.data;
    if (s.recording) {
      const seconds = Math.floor(s.duration / 1000);
      $('record-status').textContent = `recording · tab ${s.tabId} · ${seconds}s`;
    } else {
      $('record-status').textContent = 'idle';
    }
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function onCapturePage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  await send('capture_page', { tabId: tab.id });
  await refreshCaptures();
}

async function onRecordStart() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const res = await send('start_recording', { params: { tabId: tab?.id } });
  if (!res || !res.success) {
    $('record-status').textContent = 'error: ' + (res?.error || 'unknown');
  }
  await refreshRecording();
}

async function onRecordStop() {
  const res = await send('stop_recording');
  if (!res || !res.success) {
    $('record-status').textContent = 'error: ' + (res?.error || 'unknown');
    return;
  }
  const d = res.data;
  $('record-status').textContent = `saved ${d.filename} (${Math.round(d.size / 1024)} KB, ${Math.round(d.duration / 1000)}s)`;
}

$('btn-capture-page').addEventListener('click', onCapturePage);
$('btn-record-start').addEventListener('click', onRecordStart);
$('btn-record-stop').addEventListener('click', onRecordStop);

refreshCaptures();
refreshBridge();
refreshRecording();
setInterval(refreshRecording, 1000);
setInterval(refreshBridge, 3000);
