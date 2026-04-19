// amem — Gemini extractor (Day 1-2 stub).

export function extractGemini(doc = document) {
  return {
    platform: 'gemini',
    url: doc.location ? doc.location.href : '',
    title: (doc.title || '').trim(),
    messages: [],
    extractedAt: new Date().toISOString(),
  };
}
