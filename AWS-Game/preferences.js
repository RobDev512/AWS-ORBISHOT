/**
 * preferences.js — Preferencias locales del jugador.
 * Se conservan entre sesiones con localStorage.
 */

const PREFS_KEY = 'awsArcadePreferencesV1';

const DEFAULTS = Object.freeze({
  difficulty: 'medium',
  sound: true,
  music: true,
  soundVolume: 1,
  musicVolume: 1,
  combo: true,
  fx: true,
  performanceHud: true,
  developerMode: false,
  targetFps: 'auto',
  performanceMetrics: Object.freeze({
    fps: true,
    frameTime: true,
    renderResolution: false,
    renderScale: false,
    layout: false,
    objects: false,
  }),
});

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    const difficulty = ['easy', 'medium', 'hard'].includes(parsed?.difficulty)
      ? parsed.difficulty
      : DEFAULTS.difficulty;
    return {
      difficulty,
      sound: typeof parsed?.sound === 'boolean' ? parsed.sound : DEFAULTS.sound,
      music: typeof parsed?.music === 'boolean' ? parsed.music : DEFAULTS.music,
      soundVolume: Number.isFinite(Number(parsed?.soundVolume))
        ? Math.max(0, Math.min(1, Number(parsed.soundVolume)))
        : DEFAULTS.soundVolume,
      musicVolume: Number.isFinite(Number(parsed?.musicVolume))
        ? Math.max(0, Math.min(1, Number(parsed.musicVolume)))
        : DEFAULTS.musicVolume,
      combo: typeof parsed?.combo === 'boolean' ? parsed.combo : DEFAULTS.combo,
      fx: typeof parsed?.fx === 'boolean' ? parsed.fx : DEFAULTS.fx,
      performanceHud: typeof parsed?.performanceHud === 'boolean'
        ? parsed.performanceHud
        : DEFAULTS.performanceHud,
      developerMode: typeof parsed?.developerMode === 'boolean'
        ? parsed.developerMode
        : DEFAULTS.developerMode,
      targetFps: ['auto', '30', '60', '90', '120'].includes(String(parsed?.targetFps))
        ? String(parsed.targetFps)
        : DEFAULTS.targetFps,
      performanceMetrics: {
        fps: typeof parsed?.performanceMetrics?.fps === 'boolean'
          ? parsed.performanceMetrics.fps
          : DEFAULTS.performanceMetrics.fps,
        frameTime: typeof parsed?.performanceMetrics?.frameTime === 'boolean'
          ? parsed.performanceMetrics.frameTime
          : DEFAULTS.performanceMetrics.frameTime,
        renderResolution: typeof parsed?.performanceMetrics?.renderResolution === 'boolean'
          ? parsed.performanceMetrics.renderResolution
          : DEFAULTS.performanceMetrics.renderResolution,
        renderScale: typeof parsed?.performanceMetrics?.renderScale === 'boolean'
          ? parsed.performanceMetrics.renderScale
          : DEFAULTS.performanceMetrics.renderScale,
        layout: typeof parsed?.performanceMetrics?.layout === 'boolean'
          ? parsed.performanceMetrics.layout
          : DEFAULTS.performanceMetrics.layout,
        objects: typeof parsed?.performanceMetrics?.objects === 'boolean'
          ? parsed.performanceMetrics.objects
          : DEFAULTS.performanceMetrics.objects,
      },
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePreferences(prefs) {
  const safe = {
    difficulty: ['easy', 'medium', 'hard'].includes(prefs?.difficulty)
      ? prefs.difficulty
      : DEFAULTS.difficulty,
    sound: prefs?.sound !== false,
    music: prefs?.music !== false,
    soundVolume: Number.isFinite(Number(prefs?.soundVolume))
      ? Math.max(0, Math.min(1, Number(prefs.soundVolume)))
      : DEFAULTS.soundVolume,
    musicVolume: Number.isFinite(Number(prefs?.musicVolume))
      ? Math.max(0, Math.min(1, Number(prefs.musicVolume)))
      : DEFAULTS.musicVolume,
    combo: prefs?.combo !== false,
    fx: prefs?.fx !== false,
    performanceHud: prefs?.performanceHud !== false,
    developerMode: prefs?.developerMode === true,
    targetFps: ['auto', '30', '60', '90', '120'].includes(String(prefs?.targetFps))
      ? String(prefs.targetFps)
      : DEFAULTS.targetFps,
    performanceMetrics: {
      fps: prefs?.performanceMetrics?.fps !== false,
      frameTime: prefs?.performanceMetrics?.frameTime !== false,
      renderResolution: prefs?.performanceMetrics?.renderResolution === true,
      renderScale: prefs?.performanceMetrics?.renderScale === true,
      layout: prefs?.performanceMetrics?.layout === true,
      objects: prefs?.performanceMetrics?.objects === true,
    },
  };

  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(safe));
  } catch {
    // El juego puede funcionar aunque el navegador bloquee localStorage.
  }
  return safe;
}
