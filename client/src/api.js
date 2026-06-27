async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function sendMessage(messages, generateReport = false) {
  return post('/api/chat', { messages, generateReport });
}

export function analyzeGaps(messages, coveredTopics, confidence, language) {
  return post('/api/analyze-gaps', { messages, coveredTopics, confidence, language });
}

export function evaluateReport(report, language) {
  return post('/api/evaluate', { report, language });
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload-document', { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
