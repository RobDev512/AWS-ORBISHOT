const ROADMAP_URL = "./AWS-Game/docs/ROADMAP.md";

const grid = document.querySelector("#roadmapGrid");
const detail = document.querySelector("#roadmapDetail");
const statusEl = document.querySelector("#roadmapLoadStatus");
const filterButtons = [...document.querySelectorAll("[data-roadmap-filter]")];

let roadmapItems = [];
let currentFilter = "all";
let selectedVersion = null;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inlineMarkdown(value = "") {
  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return text;
}

function normalizeStatus(raw = "") {
  const value = raw.toLowerCase();
  if (value.includes("publicado") || value.includes("congelado")) {
    return { key: "published", label: "Publicado" };
  }
  if (value.includes("próxima") || value.includes("proxima")) {
    return { key: "next", label: "Próxima" };
  }
  if (value.includes("planeado")) {
    return { key: "planned", label: "Planeado" };
  }
  if (value.includes("visión") || value.includes("vision") || value.includes("largo plazo")) {
    return { key: "future", label: "Largo plazo" };
  }
  return { key: "future", label: raw || "Futuro" };
}

function getExcerpt(lines) {
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("**Estado:**") || line.startsWith("###") || line.startsWith("-") || line === "---") {
      continue;
    }
    return line
      .replace(/^\*\*Objetivo:\*\*\s*/i, "")
      .replace(/\*\*/g, "")
      .replace(/`/g, "");
  }
  return "Consulta el detalle de esta versión.";
}

function renderBody(lines) {
  const html = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line || line === "---") {
      closeList();
      continue;
    }

    if (line.startsWith("**Estado:**")) continue;

    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h4>${inlineMarkdown(line.slice(4))}</h4>`);
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();
  return html.join("");
}

function parseRoadmap(markdown) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const items = [];
  let current = null;
  const versionHeading = /^#{1,2}\s+(v\d+(?:\.\d+){1,3})\s+—\s+(.+)$/;

  for (const rawLine of lines) {
    const match = rawLine.match(versionHeading);

    if (match) {
      if (current) items.push(current);
      current = {
        version: match[1],
        title: match[2].trim(),
        statusRaw: "",
        lines: [],
      };
      continue;
    }

    if (!current) continue;

    const statusMatch = rawLine.trim().match(/^\*\*Estado:\*\*\s*(.+)$/);
    if (statusMatch) current.statusRaw = statusMatch[1].trim();

    current.lines.push(rawLine);
  }

  if (current) items.push(current);

  return items.map((item) => ({
    ...item,
    status: normalizeStatus(item.statusRaw),
    excerpt: getExcerpt(item.lines),
  }));
}

function matchesFilter(item) {
  return currentFilter === "all" || item.status.key === currentFilter;
}

function renderGrid() {
  const visible = roadmapItems.filter(matchesFilter);

  grid.innerHTML = visible.map((item) => `
    <button
      class="roadmap-live-card ${selectedVersion === item.version ? "selected" : ""}"
      type="button"
      data-roadmap-version="${escapeHtml(item.version)}"
    >
      <div class="roadmap-live-card-top">
        <span class="roadmap-live-version">${escapeHtml(item.version)}</span>
        <span class="roadmap-status roadmap-status-${item.status.key}">
          ${escapeHtml(item.status.label)}
        </span>
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.excerpt)}</p>
      <span class="roadmap-open">Ver detalle →</span>
    </button>
  `).join("");

  if (!visible.length) {
    grid.innerHTML = `<div class="roadmap-empty">No hay versiones que coincidan con este filtro.</div>`;
  }

  grid.querySelectorAll("[data-roadmap-version]").forEach((button) => {
    button.addEventListener("click", () => selectVersion(button.dataset.roadmapVersion));
  });
}

function selectVersion(version) {
  const item = roadmapItems.find((candidate) => candidate.version === version);
  if (!item) return;

  selectedVersion = version;
  renderGrid();

  detail.hidden = false;
  detail.innerHTML = `
    <div class="roadmap-detail-header">
      <div>
        <span class="roadmap-live-version">${escapeHtml(item.version)}</span>
        <h3>${escapeHtml(item.title)}</h3>
      </div>
      <span class="roadmap-status roadmap-status-${item.status.key}">
        ${escapeHtml(item.status.label)}
      </span>
    </div>
    <div class="roadmap-detail-body">${renderBody(item.lines)}</div>
    <button class="roadmap-detail-close" id="roadmapDetailClose" type="button">Cerrar detalle</button>
  `;

  document.querySelector("#roadmapDetailClose")?.addEventListener("click", () => {
    selectedVersion = null;
    detail.hidden = true;
    detail.innerHTML = "";
    renderGrid();
  });

  detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function loadRoadmap() {
  statusEl.textContent = "Cargando roadmap…";

  try {
    const response = await fetch(ROADMAP_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const markdown = await response.text();
    roadmapItems = parseRoadmap(markdown);

    if (!roadmapItems.length) throw new Error("No se encontraron versiones en ROADMAP.md");

    statusEl.textContent = `${roadmapItems.length} versiones cargadas desde el roadmap del proyecto.`;
    renderGrid();
  } catch (error) {
    console.error("No se pudo cargar el roadmap:", error);
    statusEl.innerHTML = `
      No se pudo cargar el roadmap dinámico.
      <a href="${ROADMAP_URL}" target="_blank" rel="noreferrer">Abrir archivo local</a>
    `;
    grid.innerHTML = "";
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.roadmapFilter;
    selectedVersion = null;
    detail.hidden = true;
    detail.innerHTML = "";

    filterButtons.forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle("active", active);
      candidate.setAttribute("aria-pressed", String(active));
    });

    renderGrid();
  });
});

loadRoadmap();
