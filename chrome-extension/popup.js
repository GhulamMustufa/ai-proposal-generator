// ─── State ────────────────────────────────────────────────────────────────────
let currentJob = null;
let accessToken = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function showError(msg) {
  document.getElementById("error-message").textContent = msg;
  showView("view-error");
}

function setLoginError(msg) {
  const el = document.getElementById("login-error");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearLoginError() {
  const el = document.getElementById("login-error");
  el.textContent = "";
  el.classList.add("hidden");
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
async function login(email, password) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.message || "Invalid credentials");
  }
  const data = await res.json();
  return data.access_token;
}

function logout() {
  accessToken = null;
  chrome.storage.local.clear(() => {
    document.getElementById("btn-logout").classList.add("hidden");
    showView("view-login");
  });
}

// ─── Job detection ────────────────────────────────────────────────────────────
async function getActiveTab() {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => resolve(tabs[0]));
  });
}

async function fetchJob(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type: "GET_JOB" }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error("content_script_unavailable"));
        return;
      }
      resolve(response);
    });
  });
}

// ─── Generation ───────────────────────────────────────────────────────────────
async function generateProposal(jobTitle, jobDescription) {
  const res = await fetch(`${API_BASE}/api/generate-proposal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      jobDescription,
      jobTitle,
      stream: false,
    }),
  });

  if (res.status === 401) {
    // Token expired — force re-login
    logout();
    throw new Error("session_expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }

  const data = await res.json();
  return data.generated_proposal || "";
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  showView("view-loading");

  // Restore token from storage
  chrome.storage.local.get(["accessToken"], async ({ accessToken: stored }) => {
    if (stored) {
      accessToken = stored;
      document.getElementById("btn-logout").classList.remove("hidden");
      await loadJobView();
    } else {
      showView("view-login");
    }
  });
}

async function loadJobView() {
  try {
    const tab = await getActiveTab();
    const isUpwork = tab?.url && /upwork\.com/.test(tab.url);

    if (!isUpwork) {
      showView("view-no-job");
      return;
    }

    let jobResponse;
    try {
      jobResponse = await fetchJob(tab.id);
    } catch {
      showView("view-no-job");
      return;
    }

    if (!jobResponse?.ok) {
      showView("view-no-job");
      return;
    }

    currentJob = { title: jobResponse.title, description: jobResponse.description };

    document.getElementById("job-title").textContent = currentJob.title || "Untitled job";
    const descEl = document.getElementById("job-desc");
    descEl.textContent = currentJob.description.slice(0, 300) +
      (currentJob.description.length > 300 ? "…" : "");

    showView("view-job");
  } catch {
    showView("view-no-job");
  }
}

// ─── Event listeners ──────────────────────────────────────────────────────────

// Login
document.getElementById("btn-login").addEventListener("click", async () => {
  const email = document.getElementById("input-email").value.trim();
  const password = document.getElementById("input-password").value;

  clearLoginError();

  if (!email || !password) {
    setLoginError("Please enter your email and password.");
    return;
  }

  const btn = document.getElementById("btn-login");
  btn.disabled = true;
  btn.textContent = "Signing in…";

  try {
    accessToken = await login(email, password);
    chrome.storage.local.set({ accessToken });
    document.getElementById("btn-logout").classList.remove("hidden");
    await loadJobView();
  } catch (err) {
    setLoginError(err.message || "Sign in failed.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign in";
  }
});

// Allow Enter key to submit login
document.getElementById("input-password").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("btn-login").click();
});
document.getElementById("input-email").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("input-password").focus();
});

// Generate
document.getElementById("btn-generate").addEventListener("click", async () => {
  if (!currentJob) return;

  showView("view-generating");

  try {
    const proposal = await generateProposal(currentJob.title, currentJob.description);

    if (!proposal) {
      showError("The AI returned an empty proposal. Please try again.");
      return;
    }

    document.getElementById("result-text").textContent = proposal;
    const copyBtn = document.getElementById("btn-copy");
    copyBtn.textContent = "Copy";
    copyBtn.classList.remove("copied");
    showView("view-result");
  } catch (err) {
    if (err.message === "session_expired") {
      setLoginError("Your session expired. Please sign in again.");
      showView("view-login");
      return;
    }
    showError(err.message || "Failed to generate proposal.");
  }
});

// Copy
document.getElementById("btn-copy").addEventListener("click", async () => {
  const text = document.getElementById("result-text").textContent;
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById("btn-copy");
    btn.textContent = "Copied!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "Copy";
      btn.classList.remove("copied");
    }, 2000);
  } catch {
    // Clipboard may be blocked in some contexts — silently ignore
  }
});

// Back / Generate another
document.getElementById("btn-back").addEventListener("click", () => {
  showView("view-job");
});

// Retry on error view
document.getElementById("btn-retry").addEventListener("click", () => {
  loadJobView();
});

// Logout
document.getElementById("btn-logout").addEventListener("click", logout);

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
