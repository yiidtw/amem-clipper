// amem Clipper — auto-capture arxiv abstracts (skill: arxiv-autocapture)
// Runs on https://arxiv.org/abs/*. Reads chrome.storage.local for the skill's
// enabled flag; if on, asks background.js to capture the page and shows a
// subtle toast. Default: off (user must opt in via the Skills tab).

(async () => {
  try {
    const key = 'amemSkill:arxiv-autocapture';
    const stored = await chrome.storage.local.get(key);
    const enabled = stored?.[key]?.enabled === true;
    if (!enabled) return;

    // Capture the abstract URL via background's existing capture flow.
    chrome.runtime.sendMessage(
      { cmd: 'skill_run', skillId: 'arxiv-autocapture', context: { url: location.href } },
      (resp) => {
        const ok = !chrome.runtime.lastError && resp && resp.success;
        showToast(ok ? 'captured to amem' : 'amem capture failed');
      },
    );
  } catch {
    // Best-effort: never throw on a third-party page.
  }
})();

function showToast(message) {
  if (document.getElementById('amem-toast')) return;
  const el = document.createElement('div');
  el.id = 'amem-toast';
  el.textContent = message;
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '2147483647',
    padding: '8px 12px',
    background: 'rgba(17, 24, 39, 0.92)',
    color: '#fff',
    fontSize: '12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
    opacity: '0',
    transition: 'opacity 220ms ease',
    pointerEvents: 'none',
  });
  document.documentElement.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; });
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 1800);
}
