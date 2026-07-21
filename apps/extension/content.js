// Runs on all pages (as per manifest.json <all_urls>)

// ─── PLATFORM CONFIGURATIONS ────────────────────────────────────────────────
const PLATFORMS = {
  upwork: {
    matches: ['upwork.com'],
    titles: ['[data-test="job-title"]', 'h1[data-test="job-title"]', '.up-card-title h4', 'h1.m-0-bottom', 'h1'],
    descriptions: ['[data-test="description"]', '[data-test="job-description"]', '.up-card-section .description', '.description', '.up-line-clamp-v2', '[data-ev-label="job_description"]', '.job-description', 'section[data-test="description"] > div']
  },
  freelancer: {
    matches: ['freelancer.com'],
    titles: ['.ProjectView-projectTitle', 'h1.PageProjectViewLogout-projectInfo-title'],
    descriptions: ['.ProjectView-description', '.PageProjectViewLogout-detail-description']
  },
  linkedin: {
    matches: ['linkedin.com'],
    titles: ['.job-details-jobs-unified-top-card__job-title', '.top-card-layout__title', 'h1'],
    descriptions: ['#job-details', '.description__text', '.job-description']
  },
  indeed: {
    matches: ['indeed.com'],
    titles: ['.jobsearch-JobInfoHeader-title', 'h1.jobsearch-JobInfoHeader-title'],
    descriptions: ['#jobDescriptionText']
  },
  wellfound: {
    matches: ['wellfound.com'],
    titles: ['h1.styles_component__yT0Qp', 'h1', '.styles_header__wJ0H6 h1'],
    descriptions: ['.styles_description__b0b_q', '.styles_jobDescription__uL1y6', '.styles_description__2s_R5']
  },
  flexjobs: {
    matches: ['flexjobs.com'],
    titles: ['h1.job-title'],
    descriptions: ['#job-description', '.job-description']
  },
  weworkremotely: {
    matches: ['weworkremotely.com'],
    titles: ['.listing-header h1'],
    descriptions: ['.listing-container']
  },
  workingnomads: {
    matches: ['workingnomads.com'],
    titles: ['h1.job-title'],
    descriptions: ['.job-description']
  },
  contra: {
    matches: ['contra.com'],
    titles: ['h1'], // Contra uses obscure Next.js classes, fallback to main H1
    descriptions: ['div[data-testid="job-description"]', 'div[class*="JobDescription"]', 'article']
  },
  guru: {
    matches: ['guru.com'],
    titles: ['h1.jobTitle'],
    descriptions: ['.jobDesc']
  },
  peopleperhour: {
    matches: ['peopleperhour.com'],
    titles: ['h1.project-title'],
    descriptions: ['.project-description']
  },
  braintrust: {
    matches: ['usebraintrust.com'],
    titles: ['h1'],
    descriptions: ['.job-description', '.prose']
  },
  toptal: {
    matches: ['toptal.com'],
    titles: ['h1.job-title', 'h1'],
    descriptions: ['.job-description', '.job-details']
  },
  jobstreet: {
    matches: ['jobstreet.com'],
    titles: ['h1[data-automation="job-detail-title"]', 'h1[data-automation="job-title"]', 'h1'],
    descriptions: ['[data-automation="jobDescription"]', '[data-automation="jobAdDetails"]', 'div[data-automation="job-description"]']
  }
};

// ─── JOB EXTRACTION ENGINE ──────────────────────────────────────────────────
function extractJob() {
  const hostname = window.location.hostname;
  let activePlatform = null;
  
  // 1. Identify Platform
  for (const [key, config] of Object.entries(PLATFORMS)) {
    if (config.matches.some(m => hostname.includes(m))) {
      activePlatform = config;
      break;
    }
  }

  let title = '';
  let description = '';

  // 2. Try Exact Selectors if platform matches
  if (activePlatform) {
    for (const sel of activePlatform.titles) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent.trim();
        if (text.length > 3) { title = text; break; }
      }
    }

    for (const sel of activePlatform.descriptions) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.innerText?.trim() || el.textContent?.trim() || '';
        if (text.length > 50) { description = text; break; }
      }
    }
  }

  // 3. Universal Fallbacks
  if (!title) {
    const h1 = document.querySelector('h1');
    if (h1) title = h1.textContent.trim();
  }

  if (!description) {
    // Look for any large text block on a page that looks like a job URL
    const isJobPage = /\\/(jobs|proposals|nx\\/jobs|project|gig|job)\\//.test(location.pathname);
    if (isJobPage || activePlatform) {
      const paras = Array.from(document.querySelectorAll('p, div, article, section'));
      // Find the element with the most text that isn't the entire body
      let bestEl = null;
      let maxLen = 0;
      for (const el of paras) {
        // Exclude huge wrapper divs
        if (el.tagName.toLowerCase() === 'div' && el.children.length > 10) continue; 
        const text = el.innerText?.trim() || el.textContent?.trim() || '';
        if (text.length > maxLen && text.length > 200 && text.length < 15000) {
          maxLen = text.length;
          bestEl = el;
        }
      }
      if (bestEl) {
        description = (bestEl.innerText?.trim() || bestEl.textContent?.trim()).slice(0, 8000);
      }
    }
  }

  // Final sanity check
  if (!title) title = document.title.split('-')[0].trim() || 'Untitled Job';

  return { title, description };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_JOB') {
    const job = extractJob();
    if (job.description.length > 50) {
      sendResponse({ ok: true, title: job.title, description: job.description });
    } else {
      sendResponse({ ok: false, error: 'no_job' });
    }
  }
  return true; // keep message channel open
});

// ─── AUTO-FILL LOGIC FOR COMPLEX SITES ─────────────────────────────────────
(function initAutoFill() {
  let btnInjected = false;

  function checkInputs() {
    if (btnInjected) return;
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
    // Inject button if there are forms that look like applications
    if (inputs.length > 2) {
      injectAutoFillButton();
    }
  }

  function injectAutoFillButton() {
    btnInjected = true;
    const btn = document.createElement('button');
    btn.textContent = '✨ Auto-Fill Application';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.zIndex = '2147483647'; // Max z-index
    btn.style.padding = '12px 24px';
    btn.style.backgroundColor = '#0052cc';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    btn.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    btn.style.fontWeight = 'bold';
    btn.style.fontSize = '14px';
    btn.style.transition = 'all 0.2s';

    btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';

    btn.addEventListener('click', async () => {
      btn.textContent = 'Generating...';
      btn.disabled = true;
      btn.style.backgroundColor = '#666';
      
      const context = document.body.innerText.slice(0, 8000); // Send page context
      
      chrome.runtime.sendMessage({ type: 'AUTO_FILL', context }, (response) => {
        btn.disabled = false;
        if (!response || response.error) {
          btn.textContent = '❌ Failed';
          btn.style.backgroundColor = '#cc0000';
          console.error('Auto-fill error:', response?.error);
          setTimeout(() => {
            btn.textContent = '✨ Auto-Fill Application';
            btn.style.backgroundColor = '#0052cc';
          }, 3000);
          return;
        }
        
        btn.textContent = '✅ Filled!';
        btn.style.backgroundColor = '#00cc52';
        setTimeout(() => {
          btn.textContent = '✨ Auto-Fill Application';
          btn.style.backgroundColor = '#0052cc';
        }, 3000);
        
        autoFillDOM(response.data);
      });
    });

    document.body.appendChild(btn);
  }

  function autoFillDOM(data) {
    const { generated_proposal, user_profile } = data;
    const contact = user_profile?.contactDetails || {};
    
    const fieldMap = {
      'first': contact.firstName,
      'last': contact.lastName,
      'name': \`\${contact.firstName || ''} \${contact.lastName || ''}\`.trim(),
      'email': contact.email,
      'phone': contact.phone,
      'linkedin': contact.linkedin,
    };

    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
    inputs.forEach(input => {
      const nameAttr = (input.name || input.id || input.placeholder || input.getAttribute('aria-label') || '').toLowerCase();
      
      // Map contact fields
      for (const [key, val] of Object.entries(fieldMap)) {
        // e.g. if key is 'first' and nameAttr includes 'first', it's a match
        if (nameAttr.includes(key) && val) {
          // Special exception: don't overwrite 'last name' with 'name' (full name)
          if (key === 'name' && (nameAttr.includes('first') || nameAttr.includes('last'))) continue;
          
          input.value = val;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
      }

      // Map proposal/cover letter fields
      if (
        nameAttr.includes('cover') || 
        nameAttr.includes('proposal') || 
        nameAttr.includes('message') || 
        nameAttr.includes('additional')
      ) {
        if (input.tagName.toLowerCase() === 'textarea') {
          input.value = generated_proposal || '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
  }

  // Observe dynamically loaded forms (for React/Angular/Vue SPAs)
  const observer = new MutationObserver(() => {
    checkInputs();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial check
  checkInputs();
})();
