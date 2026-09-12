const BACKEND_URL = "https://ai-startup-launchpad.onrender.com";

const SECTION_DEFS = [
  { id: "business_summary",           index: "01", label: "Business Summary",     tag: "OVERVIEW",  icon: "◈" },
  { id: "problem_statement",          index: "02", label: "Problem Statement",    tag: "INSIGHT",   icon: "⚡" },
  { id: "target_audience",            index: "03", label: "Target Audience",      tag: "MARKET",    icon: "◎" },
  { id: "unique_value_proposition",   index: "04", label: "Unique Value Proposition", tag: "STRATEGY", icon: "◆" },
  { id: "swot_analysis",              index: "05", label: "SWOT Analysis",        tag: "ANALYSIS",  icon: "⊞" },
  { id: "mvp_features",               index: "06", label: "MVP Features",         tag: "PRODUCT",   icon: "◉" },
  { id: "revenue_model",              index: "07", label: "Revenue Model",        tag: "FINANCE",   icon: "◐" },
  { id: "elevator_pitch",             index: "08", label: "Elevator Pitch",       tag: "PITCH",     icon: "✦" },
];
const SECTION_BY_ID = Object.fromEntries(SECTION_DEFS.map((d) => [d.id, d]));

const EXAMPLES = [
  "A subscription app matching independent coffee shops with remote workers — co-working day passes that fill their off-peak hours.",
  "An AI tool reading Shopify data and automatically writing SEO product descriptions in a brand's exact voice.",
  "A platform connecting retired executives with early-stage startups for paid 2-hour advisory sessions.",
];

const body = document.body;
const modeToggle = document.getElementById("modeToggle");
const darkPill = document.getElementById("darkPill");
const lightPill = document.getElementById("lightPill");

const ideaInput = document.getElementById("ideaInput");
const charsLabel = document.getElementById("charsLabel");
const generateBtn = document.getElementById("generateBtn");
const generateBtnText = document.getElementById("generateBtnText");
const errorBanner = document.getElementById("errorBanner");
const errorText = document.getElementById("errorText");
const hintText = document.getElementById("hintText");

const previewGrid = document.getElementById("previewGrid");
const examplesWrap = document.getElementById("examplesWrap");
const examplesList = document.getElementById("examplesList");

const resultsSection = document.getElementById("resultsSection");
const cardsGrid = document.getElementById("cardsGrid");
const progressLabel = document.getElementById("progressLabel");
const progFill = document.getElementById("progFill");
const resultsActions = document.getElementById("resultsActions");
const exportBtn = document.getElementById("exportBtn");
const newAnalysisBtn = document.getElementById("newAnalysisBtn");

let currentIdea = "";
let generating = false;

function setMode(mode) {
  body.className = mode;
  darkPill.classList.toggle("active", mode === "dark");
  lightPill.classList.toggle("active", mode === "light");
}
modeToggle.addEventListener("click", () => {
  setMode(body.classList.contains("dark") ? "light" : "dark");
});
setMode("dark");

(function initAurora() {
  const canvas = document.getElementById("aurora-canvas");
  const ctx = canvas.getContext("2d");
  let t = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const particles = [];
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      hue: Math.random() > 0.5 ? 248 : 330,
    });
  }

  function draw() {
    t += 0.004;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isLight = body.classList.contains("light");

    for (let layer = 0; layer < 4; layer++) {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      const hue1 = 245 + layer * 12 + Math.sin(t + layer) * 20;
      const hue2 = 320 + layer * 8 + Math.cos(t * 0.7 + layer) * 15;

      // Subtle light theme aurora gradient vs dark theme gradient
      if (isLight) {
        grad.addColorStop(0, `hsla(${hue1},70%,60%,0)`);
        grad.addColorStop(0.3, `hsla(${hue1},65%,55%,0.05)`);
        grad.addColorStop(0.6, `hsla(${hue2},75%,60%,0.06)`);
        grad.addColorStop(1, `hsla(${hue2},60%,55%,0)`);
      } else {
        grad.addColorStop(0, `hsla(${hue1},70%,45%,0)`);
        grad.addColorStop(0.3, `hsla(${hue1},65%,40%,0.04)`);
        grad.addColorStop(0.6, `hsla(${hue2},75%,50%,0.06)`);
        grad.addColorStop(1, `hsla(${hue2},60%,45%,0)`);
      }

      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.3);
      const amp = 80 + layer * 30;
      const freq = 0.002 + layer * 0.0005;
      const yBase = canvas.height * (0.25 + layer * 0.08);
      for (let x = 0; x <= canvas.width; x += 4) {
        const y =
          yBase +
          Math.sin(x * freq + t + layer) * amp +
          Math.sin(x * freq * 2.1 - t * 1.3 + layer) * (amp * 0.4) +
          Math.cos(x * freq * 0.7 + t * 0.8) * (amp * 0.6);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      const twinkle = 0.5 + Math.sin(t * 3 + p.x * 0.01) * 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + (isLight ? 0.5 : 0), 0, Math.PI * 2);

      const lightness = isLight ? "40%" : "80%";
      const alphaFactor = isLight ? 0.4 : 1;
      ctx.fillStyle = `hsla(${p.hue},80%,${lightness},${p.alpha * twinkle * alphaFactor})`;
      ctx.fill();
    });

    for (let b = 0; b < 3; b++) {
      const bx = canvas.width * (0.2 + b * 0.3 + Math.sin(t * 0.4 + b) * 0.06);
      const by = canvas.height * (0.4 + Math.cos(t * 0.3 + b * 1.2) * 0.15);
      const r = 150 + b * 60 + Math.sin(t + b) * 20;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
      const h = 250 + b * 25;

      if (isLight) {
        g.addColorStop(0, `hsla(${h},70%,60%,0.05)`);
        g.addColorStop(0.5, `hsla(${h},60%,55%,0.02)`);
        g.addColorStop(1, `hsla(${h},50%,50%,0)`);
      } else {
        g.addColorStop(0, `hsla(${h},70%,50%,0.07)`);
        g.addColorStop(0.5, `hsla(${h},60%,45%,0.03)`);
        g.addColorStop(1, `hsla(${h},50%,40%,0)`);
      }

      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }
  draw();
})();

SECTION_DEFS.forEach((d) => {
  const chip = document.createElement("div");
  chip.className = "preview-chip";
  chip.innerHTML = `<div class="chip-icon">${d.icon}</div><span class="chip-label">${d.label}</span>`;
  previewGrid.appendChild(chip);
});

EXAMPLES.forEach((ex) => {
  const btn = document.createElement("button");
  btn.className = "btn-outline example-btn";
  btn.innerHTML = `<span class="arrow">→</span>${ex}`;
  btn.addEventListener("click", () => {
    ideaInput.value = ex;
    charsLabel.textContent = `${ex.length} chars`;
    charsLabel.classList.toggle("has-chars", ex.length > 0);
    clearError();
    ideaInput.focus();
  });
  examplesList.appendChild(btn);
});

function clearError() {
  errorBanner.style.display = "none";
  hintText.style.display = "inline";
}
function showError(msg) {
  errorText.textContent = msg;
  errorBanner.style.display = "flex";
  hintText.style.display = "none";
}

ideaInput.addEventListener("input", () => {
  const len = ideaInput.value.length;
  charsLabel.textContent = `${len} chars`;
  charsLabel.classList.toggle("has-chars", len > 0);
  if (errorBanner.style.display !== "none") clearError();
});

ideaInput.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    generateBtn.click();
  }
});

function renderSkeleton() {
  cardsGrid.innerHTML = "";
  SECTION_DEFS.forEach((d) => {
    const card = document.createElement("div");
    card.className = "report-card";
    card.id = `card-${d.id}`;
    card.innerHTML = `
      <div class="card-header-row">
        <div class="skel" style="height:10px;width:60px;border-radius:4px;"></div>
        <span class="card-index">${d.index}</span>
      </div>
      <div class="skel" style="height:18px;width:65%;border-radius:6px;"></div>
      <div class="card-divider"></div>
      <div class="skel-lines">
        ${[100, 92, 100, 85, 100, 78]
          .map((w) => `<div class="skel" style="height:11px;width:${w}%;border-radius:4px;"></div>`)
          .join("")}
      </div>
    `;
    cardsGrid.appendChild(card);
  });
  resultsSection.classList.add("visible");
  resultsActions.style.display = "none";
  updateProgress();
}

function renderErrorCard(def) {
  const card = document.getElementById(`card-${def.id}`);
  if (!card) return;
  card.className = "error-card fade-up";
  card.innerHTML = `
    <div class="error-card-top">
      <span class="error-card-label">FAILED</span>
      <span class="card-index">${def.index}</span>
    </div>
    <div class="card-title">${def.label}</div>
    <p class="error-card-msg">Generation timed out or hit a rate limit. Retrying usually resolves this.</p>
    <button class="btn-retry">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M9 5A4 4 0 1 1 5 1M5 1L7 0M5 1L7 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      RETRY
    </button>
  `;
  card.querySelector(".btn-retry").addEventListener("click", () => retrySection(def.id));
}

function renderDoneCard(def, content) {
  const card = document.getElementById(`card-${def.id}`);
  if (!card) return;
  card.className = "report-card fade-up";
  card.innerHTML = `
    <div class="card-header-row">
      <span class="card-tag">${def.tag}</span>
      <span class="card-index">${def.index}</span>
    </div>
    <div class="card-title">${def.label}</div>
    <div class="card-divider"></div>
    <p class="card-body"></p>
  `;
  card.querySelector(".card-body").innerText = content;
}

function updateCard(sectionId, status, content) {
  const def = SECTION_BY_ID[sectionId];
  if (!def) return;
  if (status === "success") {
    renderDoneCard(def, content);
  } else {
    renderErrorCard(def);
  }
  updateProgress();
}

function updateProgress() {
  const total = SECTION_DEFS.length;
  const done = SECTION_DEFS.filter((d) => {
    const card = document.getElementById(`card-${d.id}`);
    return card && !card.classList.contains("loading") && (card.classList.contains("report-card") || card.classList.contains("error-card")) && !card.querySelector(".skel");
  }).length;

  progressLabel.textContent = `${done}/${total} sections resolved`;
  progFill.style.width = `${total ? (done / total) * 100 : 0}%`;

  if (done === total && total > 0) {
    resultsActions.style.display = "flex";
  }
}

async function streamGeneration(idea) {
  const response = await fetch(`${BACKEND_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea }),
  });

  if (!response.ok || !response.body) {
    showError("Could not reach the server. Please try again.");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop();

    for (const part of parts) {
      if (part.startsWith("event: done")) continue;
      const line = part.replace(/^data:\s*/, "");
      if (!line) continue;
      try {
        const payload = JSON.parse(line);
        if (payload.section && SECTION_BY_ID[payload.section]) {
          updateCard(payload.section, payload.status, payload.content);
        }
      } catch (e) {
      }
    }
  }
}

async function retrySection(sectionId) {
  const def = SECTION_BY_ID[sectionId];
  const card = document.getElementById(`card-${sectionId}`);
  if (card && def) {
    card.className = "report-card";
    card.innerHTML = `
      <div class="card-header-row">
        <div class="skel" style="height:10px;width:60px;border-radius:4px;"></div>
        <span class="card-index">${def.index}</span>
      </div>
      <div class="skel" style="height:18px;width:65%;border-radius:6px;"></div>
      <div class="card-divider"></div>
      <div class="skel-lines">
        ${[100, 92, 100, 85, 100, 78]
          .map((w) => `<div class="skel" style="height:11px;width:${w}%;border-radius:4px;"></div>`)
          .join("")}
      </div>
    `;
  }
  await streamGeneration(currentIdea);
}

async function generate() {
  const idea = ideaInput.value.trim();
  clearError();

  if (!idea) {
    showError("Please describe your startup idea.");
    ideaInput.focus();
    return;
  }
  if (idea.length < 15) {
    showError("Add a bit more detail — a sentence or two.");
    ideaInput.focus();
    return;
  }

  currentIdea = idea;
  generating = true;
  generateBtn.disabled = true;
  ideaInput.disabled = true;
  generateBtnText.textContent = "Analyzing…";
  generateBtn.querySelector("svg").outerHTML = `
    <svg class="spin" width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="6" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <path d="M7.5 1.5A6 6 0 0 1 13.5 7.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;

  renderSkeleton();
  setTimeout(() => resultsSection.scrollIntoView({ behavior: "smooth", block: "start" }), 300);

  try {
    await streamGeneration(idea);
  } catch (err) {
    showError("An error occurred. Please try again.");
  } finally {
    generating = false;
    generateBtn.disabled = false;
    ideaInput.disabled = false;
    generateBtnText.textContent = "Generate Analysis";
    generateBtn.querySelector("svg").outerHTML = `
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 1L8.2 5.4H13L9.4 8.1L10.7 12.5L6.5 9.8L2.3 12.5L3.6 8.1L0 5.4H4.8L6.5 1Z" fill="currentColor"/>
      </svg>
    `;
  }
}

generateBtn.addEventListener("click", generate);

newAnalysisBtn.addEventListener("click", () => {
  resultsSection.classList.remove("visible");
  cardsGrid.innerHTML = "";
  ideaInput.value = "";
  currentIdea = "";
  charsLabel.textContent = "0 chars";
  charsLabel.classList.remove("has-chars");
  clearError();
  ideaInput.focus();
});

exportBtn.addEventListener("click", () => {
  window.print();
});