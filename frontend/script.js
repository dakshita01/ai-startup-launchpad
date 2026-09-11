const BACKEND_URL = "http://localhost:8000";

const SECTION_LABELS = {
  business_summary: "Business Summary",
  problem_statement: "Problem Statement",
  target_audience: "Target Audience",
  unique_value_proposition: "Unique Value Proposition",
  swot_analysis: "SWOT Analysis",
  mvp_features: "MVP Features",
  revenue_model: "Revenue Model",
  elevator_pitch: "Elevator Pitch",
};

const ideaInput = document.getElementById("ideaInput");
const generateBtn = document.getElementById("generateBtn");
const resultsGrid = document.getElementById("resultsGrid");
const errorMsg = document.getElementById("errorMsg");

let currentIdea = "";

function renderSkeleton() {
  resultsGrid.innerHTML = "";
  Object.entries(SECTION_LABELS).forEach(([key, label]) => {
    const card = document.createElement("div");
    card.className = "section-card loading";
    card.id = `card-${key}`;
    card.innerHTML = `
      <h3>${label}</h3>
      <div class="content">
        <span class="spinner"></span> Generating...
      </div>
    `;
    resultsGrid.appendChild(card);
  });
}

function updateCard(section, status, content) {
  const card = document.getElementById(`card-${section}`);
  if (!card) return;
  card.classList.remove("loading", "error");

  if (status === "success") {
    card.querySelector(".content").innerText = content;
  } else {
    card.classList.add("error");
    card.querySelector(".content").innerText = "Something went wrong generating this section.";
    const retryBtn = document.createElement("button");
    retryBtn.className = "retry-btn";
    retryBtn.innerText = "Retry";
    retryBtn.onclick = () => retrySection(section);
    card.appendChild(retryBtn);
  }
}

async function retrySection(section) {
  const card = document.getElementById(`card-${section}`);
  card.className = "section-card loading";
  card.innerHTML = `<h3>${SECTION_LABELS[section]}</h3><div class="content"><span class="spinner"></span> Retrying...</div>`;

  // Simplest retry: re-run the whole generation (keeps code simple for MVP)
  await streamGeneration(currentIdea);
}

async function streamGeneration(idea) {
  const response = await fetch(`${BACKEND_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea }),
  });

  if (!response.ok || !response.body) {
    errorMsg.innerText = "Could not reach the server. Please try again.";
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE messages are separated by double newlines
    const parts = buffer.split("\n\n");
    buffer = parts.pop(); // keep incomplete chunk in buffer

    for (const part of parts) {
      if (part.startsWith("event: done")) continue;
      const line = part.replace(/^data:\s*/, "");
      if (!line) continue;
      try {
        const payload = JSON.parse(line);
        if (payload.section && SECTION_LABELS[payload.section]) {
          updateCard(payload.section, payload.status, payload.content);
        }
      } catch (e) {
        // ignore malformed chunks
      }
    }
  }
}

generateBtn.addEventListener("click", async () => {
  const idea = ideaInput.value.trim();
  errorMsg.innerText = "";

  if (!idea) {
    errorMsg.innerText = "Please describe your idea before generating.";
    return;
  }

  currentIdea = idea;
  generateBtn.disabled = true;
  generateBtn.innerText = "Generating...";
  renderSkeleton();

  try {
    await streamGeneration(idea);
  } catch (err) {
    errorMsg.innerText = "An error occurred. Please try again.";
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerText = "Generate Analysis";
  }
});
