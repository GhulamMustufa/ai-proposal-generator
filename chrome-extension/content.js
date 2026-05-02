// Runs on all Upwork pages. Responds to GET_JOB messages from the popup.

function extractJob() {
  const titleSelectors = [
    '[data-test="job-title"]',
    'h1[data-test="job-title"]',
    '.up-card-title h4',
    'h1.m-0-bottom',
    'h1',
  ];

  const descSelectors = [
    '[data-test="description"]',
    '[data-test="job-description"]',
    '.up-card-section .description',
    '.description',
    '.up-line-clamp-v2',
    '[data-ev-label="job_description"]',
    '.job-description',
    'section[data-test="description"] > div',
  ];

  let title = '';
  for (const sel of titleSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.textContent.trim();
      if (text.length > 3) { title = text; break; }
    }
  }

  let description = '';
  for (const sel of descSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.innerText?.trim() || el.textContent?.trim() || '';
      if (text.length > 80) { description = text; break; }
    }
  }

  // Fallback: look for any large text block on a job URL
  if (!description) {
    const isJobPage = /\/(jobs|proposals|nx\/jobs)\//.test(location.pathname);
    if (isJobPage) {
      const paras = Array.from(document.querySelectorAll('p, div'));
      const big = paras.find(el => (el.textContent?.trim().length || 0) > 200);
      if (big) description = big.textContent.trim().slice(0, 4000);
    }
  }

  return { title, description };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_JOB') {
    const job = extractJob();
    if (job.description.length > 80) {
      sendResponse({ ok: true, title: job.title, description: job.description });
    } else {
      sendResponse({ ok: false, error: 'no_job' });
    }
  }
  return true; // keep message channel open
});
