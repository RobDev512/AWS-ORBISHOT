/**
 * performanceMonitor.js — Monitor técnico opcional de AWS ORBISHOT.
 *
 * Mide cada frame, pero actualiza el DOM a baja frecuencia para que el propio
 * monitor no se convierta en una fuente apreciable de trabajo.
 */

const DEFAULT_METRICS = Object.freeze({
  fps: true,
  frameTime: true,
  renderResolution: false,
  renderScale: false,
  layout: false,
  objects: false,
});

const METRIC_DEFS = Object.freeze([
  ['fps', 'FPS'],
  ['frameTime', 'FRAME'],
  ['renderResolution', 'RENDER'],
  ['renderScale', 'ESCALA'],
  ['layout', 'LAYOUT'],
  ['objects', 'OBJETOS'],
]);

let enabled = true;
let developerMode = false;
let metrics = { ...DEFAULT_METRICS };
let hud = null;
let rowRefs = new Map();

let sampleStart = null;
let sampleFrames = 0;
let lastFrameTimestamp = null;
let fpsValue = 0;
let frameMsValue = 0;

function ensureHud() {
  if (hud) return hud;
  hud = document.getElementById('performanceHud');
  if (!hud) return null;

  rowRefs = new Map();
  for (const [key] of METRIC_DEFS) {
    const row = hud.querySelector(`[data-perf-row="${key}"]`);
    const value = row?.querySelector('[data-perf-value]');
    if (row && value) rowRefs.set(key, { row, value });
  }
  return hud;
}

function setRow(key, text) {
  const ref = rowRefs.get(key);
  if (!ref) return;
  ref.row.hidden = metrics[key] !== true;
  if (!ref.row.hidden) ref.value.textContent = text;
}

function countActiveObjects(state) {
  const count = value => Array.isArray(value) ? value.length : 0;
  return (
    count(state?.anchoredProjectiles) +
    (state?.flyingProjectile ? 1 : 0) +
    count(state?.detachedBossArrows) +
    count(state?.detachedBossDebris) +
    count(state?.splitArrowFragments) +
    (state?.powerCore?.active ? 1 : 0)
  );
}

function renderHud(canvas, state) {
  const el = ensureHud();
  if (!el) return;

  el.hidden = !enabled;
  el.dataset.developerMode = developerMode ? 'on' : 'off';
  if (!enabled) return;

  for (const [key] of METRIC_DEFS) {
    const ref = rowRefs.get(key);
    if (ref) ref.row.hidden = metrics[key] !== true;
  }

  setRow('fps', `${fpsValue.toFixed(0)}`);
  setRow('frameTime', `${frameMsValue.toFixed(1)} ms`);

  const logicalW = Math.max(
    1,
    Number(canvas?.dataset?.logicalWidth) || 600,
  );
  const logicalH = Math.max(
    1,
    Number(canvas?.dataset?.logicalHeight) || 700,
  );
  const renderScale = Math.min(
    (Number(canvas?.width) || logicalW) / logicalW,
    (Number(canvas?.height) || logicalH) / logicalH,
  );
  const dpr = Math.max(1, Number(window.devicePixelRatio) || 1);

  setRow(
    'renderResolution',
    `${Number(canvas?.width) || 0}×${Number(canvas?.height) || 0}`,
  );
  setRow('renderScale', `×${renderScale.toFixed(2)} · DPR ${dpr.toFixed(2)}`);

  const viewportMode = canvas?.dataset?.viewportMode || canvas?.dataset?.layout || '—';
  const inputMode = canvas?.dataset?.inputMode || '—';
  setRow('layout', `${viewportMode} · ${inputMode}`);

  setRow('objects', String(countActiveObjects(state)));

  el.dataset.fpsState =
    fpsValue >= 55 ? 'good' :
    fpsValue >= 45 ? 'warn' :
    'low';
}

export function configurePerformanceMonitor(config = {}) {
  enabled = config?.enabled !== false;
  developerMode = config?.developerMode === true;

  const requestedMetrics = {
    ...DEFAULT_METRICS,
    ...(config?.metrics && typeof config.metrics === 'object'
      ? config.metrics
      : {}),
  };

  metrics = developerMode
    ? requestedMetrics
    : {
        fps: true,
        frameTime: false,
        renderResolution: false,
        renderScale: false,
        layout: false,
        objects: false,
      };

  const el = ensureHud();
  if (el) {
    el.hidden = !enabled;
    el.dataset.developerMode = developerMode ? 'on' : 'off';

    for (const [key] of METRIC_DEFS) {
      const ref = rowRefs.get(key);
      if (ref) ref.row.hidden = metrics[key] !== true;
    }
  }
}

export function resetPerformanceMonitor() {
  sampleStart = null;
  sampleFrames = 0;
  lastFrameTimestamp = null;
  fpsValue = 0;
  frameMsValue = 0;
}

export function recordPerformanceFrame(timestamp, canvas, state) {
  if (!enabled || !Number.isFinite(timestamp)) return;

  if (
    lastFrameTimestamp !== null &&
    timestamp - lastFrameTimestamp > 250
  ) {
    sampleStart = null;
    sampleFrames = 0;
  }

  lastFrameTimestamp = timestamp;

  if (sampleStart === null) {
    sampleStart = timestamp;
    sampleFrames = 0;
    return;
  }

  sampleFrames += 1;
  const elapsed = timestamp - sampleStart;

  // ~2 actualizaciones/segundo: suficiente para leerlo sin añadir ruido al DOM.
  if (elapsed < 500) return;

  fpsValue = sampleFrames * 1000 / elapsed;
  frameMsValue = sampleFrames > 0 ? elapsed / sampleFrames : 0;

  sampleStart = timestamp;
  sampleFrames = 0;

  renderHud(canvas, state);
}
