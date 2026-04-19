// amem — dedup helpers (Day 1-2).
// Content-hash utilities for short-circuiting duplicate captures.

export async function sha256Hex(input) {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function normalizeText(s) {
  return String(s).replace(/\s+/g, ' ').trim();
}
