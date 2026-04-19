// amem — bridge client placeholder.
// Day 1-2: client-only scaffold for ws://localhost:7600 (amem-sh).
// No command protocol yet; Day 2+ wires real actions.

export const DEFAULT_BRIDGE_URL = 'ws://localhost:7600';

export function openBridge(url = DEFAULT_BRIDGE_URL, handlers = {}) {
  const ws = new WebSocket(url);
  if (handlers.onOpen) ws.addEventListener('open', handlers.onOpen);
  if (handlers.onClose) ws.addEventListener('close', handlers.onClose);
  if (handlers.onError) ws.addEventListener('error', handlers.onError);
  if (handlers.onMessage) {
    ws.addEventListener('message', (e) => handlers.onMessage(safeParse(e.data)));
  }
  return ws;
}

function safeParse(data) {
  if (typeof data !== 'string') return data;
  try { return JSON.parse(data); } catch { return { raw: data }; }
}
