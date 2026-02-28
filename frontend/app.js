const runBtn = document.getElementById("runBtn");
const presetRenderBtn = document.getElementById("presetRenderBtn");
const presetClaudeBtn = document.getElementById("presetClaudeBtn");
const brandInput = document.getElementById("brand");
const competitorInput = document.getElementById("competitor");
const locationInput = document.getElementById("location");
const output = document.getElementById("output");
const apiBaseInput = document.getElementById("apiBase");

const API_BASE_STORAGE_KEY = "trendhijack_api_base";
const LOCALHOST_CANDIDATES = [
  "http://localhost:5050",
  "http://localhost:5051",
  "http://localhost:5052",
  "http://localhost:5053",
];

function normalizeBase(url) {
  return String(url || "").trim().replace(/\/$/, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setOutputText(value) {
  output.innerHTML = `<pre>${escapeHtml(typeof value === "string" ? value : JSON.stringify(value, null, 2))}</pre>`;
}

function setOutputHtml(html) {
  output.innerHTML = html;
}

function saveApiBase(base) {
  const normalized = normalizeBase(base);
  apiBaseInput.value = normalized;
  localStorage.setItem(API_BASE_STORAGE_KEY, normalized);
  return normalized;
}

function getApiBase() {
  return saveApiBase(apiBaseInput.value);
}

function getConfiguredApiBase() {
  const configured = normalizeBase(window.__API_BASE__ || "");
  if (!configured || configured === "REPLACE_ME") {
    return "";
  }
  return configured;
}

function applyPreset(brand, competitor, location) {
  brandInput.value = brand;
  competitorInput.value = competitor;
  locationInput.value = location;
}

async function getConfigJsApiBase() {
  try {
    const res = await fetch("config.js", { cache: "no-store" });
    if (!res.ok) {
      return "";
    }
    const text = await res.text();
    const match = text.match(/window\.__API_BASE__\s*=\s*["']([^"']+)["']/);
    const value = normalizeBase(match ? match[1] : "");
    if (!value || value === "REPLACE_ME") {
      return "";
    }
    return value;
  } catch (_error) {
    return "";
  }
}

async function checkHealth(base) {
  try {
    const res = await fetch(`${base}/api/health`, { method: "GET" });
    if (!res.ok) {
      return false;
    }
    const data = await res.json();
    return data && data.status === "ok";
  } catch (_error) {
    return false;
  }
}

async function autoDetectApiBase() {
  const explicitInput = normalizeBase(apiBaseInput.value);
  if (explicitInput) {
    saveApiBase(explicitInput);
    return;
  }

  const configuredWindowBase = getConfiguredApiBase();
  const configuredScriptBase = await getConfigJsApiBase();
  const storedBase = normalizeBase(localStorage.getItem(API_BASE_STORAGE_KEY) || "");

  const candidates = [];
  for (const base of [configuredWindowBase, configuredScriptBase, storedBase, ...LOCALHOST_CANDIDATES]) {
    const normalized = normalizeBase(base);
    if (normalized && !candidates.includes(normalized)) {
      candidates.push(normalized);
    }
  }

  for (const base of candidates) {
    if (await checkHealth(base)) {
      saveApiBase(base);
      return;
    }
  }

  const fallback = configuredWindowBase || configuredScriptBase || storedBase || LOCALHOST_CANDIDATES[0];
  saveApiBase(fallback);
}

function renderShortlist(shortlist) {
  if (!Array.isArray(shortlist) || shortlist.length === 0) {
    return "<p>No shortlist posts available.</p>";
  }

  return `<ul>${shortlist
    .map((item) => {
      const title = escapeHtml(item.title || "Untitled");
      const platform = escapeHtml(item.platform || "unknown");
      const snippet = escapeHtml(item.snippet || "");
      const score = item.score == null ? "n/a" : escapeHtml(item.score);
      const url = String(item.url || "");
      const safeUrl = escapeHtml(url);
      const link = url
        ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${title}</a>`
        : title;
      return `<li>${link} (${platform}) - score: ${score}<br/><small>${snippet}</small></li>`;
    })
    .join("")}</ul>`;
}

function renderTavilyRaw(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return "<p>No Tavily raw results.</p>";
  }

  return `<ul>${results
    .map((item) => {
      const title = escapeHtml(item.title || "Untitled");
      const snippet = escapeHtml(item.snippet || "");
      const platform = escapeHtml(item.platform || "unknown");
      const score = item.score == null ? "n/a" : escapeHtml(item.score);
      const url = String(item.url || "");
      const safeUrl = escapeHtml(url);
      const link = url
        ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`
        : "";
      return `<li><strong>${title}</strong> (${platform}) - score: ${score}<br/>${link}<br/><small>${snippet}</small></li>`;
    })
    .join("")}</ul>`;
}

function renderYutoriRaw(tweets) {
  if (!Array.isArray(tweets) || tweets.length === 0) {
    return "<p>No Yutori tweets captured.</p>";
  }

  return `<ul>${tweets
    .map((tweet) => {
      const text = escapeHtml(tweet.text || "");
      const author = escapeHtml(tweet.author || "unknown");
      const createdAt = escapeHtml(tweet.created_at || "");
      const url = String(tweet.url || "");
      const safeUrl = escapeHtml(url);
      const link = url
        ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`
        : "";
      return `<li><strong>@${author}</strong> (${createdAt})<br/>${text}<br/>${link}</li>`;
    })
    .join("")}</ul>`;
}

function renderExplainSummary(explain) {
  if (!explain || typeof explain !== "object") {
    return "<p>No explain metadata.</p>";
  }

  const discovery = explain.discovery || {};
  const tavily = discovery.tavily || {};
  const yutori = discovery.yutori || {};
  const merged = discovery.merged || {};
  const analysis = explain.analysis || {};
  const generation = explain.generation || {};
  const errors = Array.isArray(explain.errors) ? explain.errors : [];

  return `
    <ul>
      <li>Tavily enabled: ${escapeHtml(tavily.enabled)} | found: ${escapeHtml(tavily.total_found)}</li>
      <li>Yutori enabled: ${escapeHtml(yutori.enabled)} | found: ${escapeHtml(yutori.total_found)}</li>
      <li>Merged posts: ${escapeHtml(merged.total_posts)} | shortlist: ${escapeHtml(merged.top_posts_for_reka)}</li>
      <li>Reka model: ${escapeHtml(analysis.model)}</li>
      <li>Kling model: ${escapeHtml(generation.model)} | task_id: ${escapeHtml(generation.task_id || "")}</li>
      <li>Errors captured: ${escapeHtml(errors.length)}</li>
    </ul>
  `;
}

function renderDone(job) {
  const result = job.result || {};
  const explain = result.explain || {};
  const discovery = explain.discovery || {};
  const tavily = discovery.tavily || {};
  const yutori = discovery.yutori || {};
  const merged = discovery.merged || {};
  const analysis = explain.analysis || {};
  const generation = explain.generation || {};

  const directorBrief = analysis.director_brief || result.director_brief || {};
  const videoUrl = String(generation.video_url || result.video_url || "");
  const safeVideoUrl = escapeHtml(videoUrl);

  const html = `
    <section class="panel">
      <h3>Trend Summary</h3>
      <p>${escapeHtml(result.trend_summary || "No trend summary returned.")}</p>
    </section>

    <section class="panel">
      <h3>What we found</h3>
      <p>Tavily posts: <strong>${escapeHtml(result.tavily_posts_found ?? tavily.total_found ?? 0)}</strong></p>
      <p>Twitter posts: <strong>${escapeHtml(result.twitter_posts_found ?? yutori.total_found ?? 0)}</strong></p>
      <p>Top posts for Reka: <strong>${escapeHtml(result.top_posts_for_reka ?? merged.top_posts_for_reka ?? 0)}</strong></p>
      ${renderShortlist(merged.shortlist || [])}
    </section>

    <details class="panel">
      <summary>Tavily Raw</summary>
      ${renderTavilyRaw(tavily.results || [])}
    </details>

    <details class="panel">
      <summary>Yutori Raw</summary>
      ${renderYutoriRaw(yutori.tweets || [])}
    </details>

    <section class="panel">
      <h3>Reka Brief</h3>
      <pre>${escapeHtml(JSON.stringify(directorBrief, null, 2))}</pre>
    </section>

    <section class="panel">
      <h3>Kling Prompt</h3>
      <p><strong>Prompt:</strong></p>
      <pre>${escapeHtml(generation.prompt || result.kling_prompt || "")}</pre>
      <p><strong>Task ID:</strong> ${escapeHtml(generation.task_id || "")}</p>
      <p><strong>Video URL:</strong> ${videoUrl ? `<a href="${safeVideoUrl}" target="_blank" rel="noopener noreferrer">${safeVideoUrl}</a>` : "None"}</p>
      ${videoUrl ? `<video controls playsinline style="width: 100%; max-height: 520px;" src="${safeVideoUrl}"></video>` : ""}
    </section>

    <details class="panel">
      <summary>Explain</summary>
      ${renderExplainSummary(explain)}
    </details>

    <details class="panel">
      <summary>Raw JSON</summary>
      <pre>${escapeHtml(JSON.stringify(job, null, 2))}</pre>
    </details>
  `;

  setOutputHtml(html);
}

function renderRunning(job) {
  const progress = job.progress || {};
  const html = `
    <section class="panel">
      <h3>Job Running</h3>
      <p>Status: <strong>${escapeHtml(job.status || "running")}</strong></p>
      <p>Step: <strong>${escapeHtml(progress.step || "")}</strong></p>
      <p>Progress: <strong>${escapeHtml(progress.percent ?? 0)}%</strong></p>
      <p>Message: ${escapeHtml(progress.message || "")}</p>
    </section>

    <details class="panel">
      <summary>Raw JSON</summary>
      <pre>${escapeHtml(JSON.stringify(job, null, 2))}</pre>
    </details>
  `;

  setOutputHtml(html);
}

function renderError(job) {
  const html = `
    <section class="panel">
      <h3>Job Failed</h3>
      <p style="color:#b91c1c;"><strong>${escapeHtml(job.error || "Unknown error")}</strong></p>
    </section>

    <details class="panel" open>
      <summary>Raw JSON</summary>
      <pre>${escapeHtml(JSON.stringify(job, null, 2))}</pre>
    </details>
  `;

  setOutputHtml(html);
}

function renderJob(job) {
  if (!job || typeof job !== "object") {
    setOutputText(job);
    return;
  }

  if (job.status === "done" || job.status === "completed") {
    renderDone(job);
    return;
  }

  if (job.status === "error" || job.status === "failed") {
    renderError(job);
    return;
  }

  if (job.status === "queued" || job.status === "running") {
    renderRunning(job);
    return;
  }

  setOutputText(job);
}

async function pollJob(apiBase, jobId) {
  const maxAttempts = 360;
  let attempts = 0;

  while (true) {
    const res = await fetch(`${apiBase}/api/job/${jobId}`);
    const data = await res.json();

    attempts += 1;
    const elapsedSeconds = attempts * 2;

    if (data.status === "running" || data.status === "queued") {
      data.progress = data.progress || {};
      if (elapsedSeconds >= 180) {
        data.progress.message = "Finalizing video render...";
      } else if (elapsedSeconds >= 60) {
        data.progress.message = "Still generating... Kling jobs can take 2-4 minutes.";
      }
    }

    renderJob(data);

    if (
      data.status === "done" ||
      data.status === "error" ||
      data.status === "completed" ||
      data.status === "failed"
    ) {
      return;
    }

    if (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

runBtn.addEventListener("click", async () => {
  const brand = brandInput.value.trim();
  const competitor = competitorInput.value.trim();
  const location = locationInput.value.trim();
  const apiBase = getApiBase();

  if (!brand || !competitor || !location) {
    setOutputText("Enter brand, competitor, and location.");
    return;
  }

  try {
    setOutputText("Starting pipeline...");

    const res = await fetch(`${apiBase}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand, competitor, location }),
    });

    const data = await res.json();

    if (!res.ok) {
      renderJob(data);
      return;
    }

    await pollJob(apiBase, data.job_id);
  } catch (error) {
    setOutputText({ error: error.message });
  }
});

presetRenderBtn.addEventListener("click", () => {
  applyPreset("Render", "Vercel", "San Francisco");
});

presetClaudeBtn.addEventListener("click", () => {
  applyPreset("Claude", "OpenAI", "San Francisco");
});

void autoDetectApiBase();
