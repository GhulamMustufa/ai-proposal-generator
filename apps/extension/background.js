// Background script (Service Worker)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTO_FILL') {
    handleAutoFill(message.context).then(sendResponse).catch(err => {
      sendResponse({ error: err.message });
    });
    return true; // Keep message channel open for async response
  }
});

async function handleAutoFill(context) {
  const storage = await chrome.storage.local.get(['accessToken']);
  const token = storage.accessToken;
  if (!token) throw new Error('Not authenticated - Please set Clerk Token in extension popup');

  // Hardcode API_BASE to localhost:4000 for development, or could read from config if we importScripts
  const API_BASE = 'http://localhost:4000';

  const res = await fetch(\`\${API_BASE}/api/generate-proposal\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    },
    body: JSON.stringify({
      job_title: 'Auto-Fill Job',
      job_description: context,
      stream: false
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(\`Server returned \${res.status}: \${text}\`);
  }

  const data = await res.json();
  return { data };
}
