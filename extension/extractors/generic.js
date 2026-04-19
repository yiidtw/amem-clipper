// amem — generic page extractor (Day 1-2 skeleton).
// Returns a minimal capture payload. Deterministic content scoring arrives later.

export function extractGeneric(doc = document) {
  const url = doc.location ? doc.location.href : '';
  const title = (doc.title || '').trim();
  const description =
    doc.querySelector('meta[name="description"]')?.content ||
    doc.querySelector('meta[property="og:description"]')?.content ||
    '';
  const text = (doc.body?.innerText || '').trim().slice(0, 4000);
  return {
    platform: 'generic',
    url,
    title,
    description,
    text,
    extractedAt: new Date().toISOString(),
  };
}
