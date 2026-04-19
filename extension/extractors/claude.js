// amem — Claude.ai extractor (Day 1-2 stub).
// Returns the current page URL and title; real DOM walk lands Day 3+.

export function extractClaude(doc = document) {
  return {
    platform: 'claude',
    url: doc.location ? doc.location.href : '',
    title: (doc.title || '').trim(),
    messages: [],
    extractedAt: new Date().toISOString(),
  };
}
