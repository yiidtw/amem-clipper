// amem — ChatGPT extractor (Day 1-2 stub).

export function extractChatgpt(doc = document) {
  return {
    platform: 'chatgpt',
    url: doc.location ? doc.location.href : '',
    title: (doc.title || '').trim(),
    messages: [],
    extractedAt: new Date().toISOString(),
  };
}
