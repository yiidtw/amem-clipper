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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Tab strip --------------------------------------------------------------

function activateTab(tabEl) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
  tabEl.classList.add('active');
  const panel = document.getElementById(tabEl.dataset.panel);
  if (panel) panel.classList.add('active');
  if (tabEl.dataset.panel === 'panel-skills') refreshSkills();
}

document.querySelectorAll('.tab').forEach((t) => {
  t.addEventListener('click', () => activateTab(t));
});

// --- Captures tab -----------------------------------------------------------

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

async function onCapturePage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  await send('capture_page', { tabId: tab.id });
  await refreshCaptures();
}

async function onScreenshot() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  $('capture-status').textContent = 'capturing…';
  const res = await send('capture_screenshot', { tabId: tab.id });
  if (!res || !res.success) {
    $('capture-status').textContent = 'error: ' + (res?.error || 'unknown');
    return;
  }
  $('capture-status').textContent = `saved ${res.data.filename}`;
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

// --- Skills tab -------------------------------------------------------------

const runningSkills = new Set();

function lastRunLabel(lastRun) {
  if (!lastRun) return 'never run';
  const ago = Math.max(0, Math.floor((Date.now() - lastRun.ts) / 1000));
  const when = ago < 60 ? `${ago}s ago` : ago < 3600 ? `${Math.floor(ago / 60)}m ago` : `${Math.floor(ago / 3600)}h ago`;
  return `${lastRun.ok ? '✓' : '✗'} ${escapeHtml(lastRun.summary || '')} · ${when}`;
}

function renderSkillCard(skill) {
  const running = runningSkills.has(skill.id);
  const stateText = running
    ? '<span class="skill-state running">Running…</span>'
    : skill.lastRun
      ? `<span class="skill-state ${skill.lastRun.ok ? 'ok' : 'fail'}">${lastRunLabel(skill.lastRun)}</span>`
      : '<span class="skill-state">never run</span>';

  const indicator = skill.mode === 'auto'
    ? `<span>${skill.enabled ? '● Auto' : '○ Auto (off)'}</span>`
    : '<span>▶ Run</span>';

  let action;
  if (skill.mode === 'auto') {
    action = `<input type="checkbox" class="toggle" data-skill-toggle="${skill.id}" ${skill.enabled ? 'checked' : ''} aria-label="enable ${escapeHtml(skill.name)}" />`;
  } else {
    action = `<button class="primary" data-skill-run="${skill.id}" ${running ? 'disabled' : ''}>${running ? '…' : 'Run'}</button>`;
  }

  return `
    <div class="skill-card">
      <div class="skill-icon">${escapeHtml(skill.icon || '·')}</div>
      <div class="skill-body">
        <div class="skill-name">${escapeHtml(skill.name)}</div>
        <div class="skill-desc">${escapeHtml(skill.description)}</div>
        <div class="skill-meta">${indicator}${stateText}</div>
      </div>
      <div class="skill-action">${action}</div>
    </div>`;
}

async function refreshSkills() {
  const res = await send('skill_list');
  const root = $('skill-list');
  if (!res || !res.success) {
    root.innerHTML = '<div class="status">failed to load skills</div>';
    return;
  }
  const skills = res.data || [];
  root.innerHTML = skills.map(renderSkillCard).join('');

  root.querySelectorAll('[data-skill-toggle]').forEach((el) => {
    el.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-skill-toggle');
      await send('skill_set_enabled', { skillId: id, enabled: e.target.checked });
      await refreshSkills();
    });
  });
  root.querySelectorAll('[data-skill-run]').forEach((el) => {
    el.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-skill-run');
      runningSkills.add(id);
      await refreshSkills();
      try {
        await send('skill_run', { skillId: id, context: {} });
      } finally {
        runningSkills.delete(id);
        await refreshSkills();
        // The captures tab might have new entries (e.g. cws-demo-recording).
        refreshCaptures();
      }
    });
  });
}

// --- Wiring ------------------------------------------------------------------

$('btn-capture-page').addEventListener('click', onCapturePage);
$('btn-screenshot').addEventListener('click', onScreenshot);
$('btn-record-start').addEventListener('click', onRecordStart);
$('btn-record-stop').addEventListener('click', onRecordStop);

refreshCaptures();
refreshBridge();
refreshRecording();
setInterval(refreshRecording, 1000);
setInterval(refreshBridge, 3000);
