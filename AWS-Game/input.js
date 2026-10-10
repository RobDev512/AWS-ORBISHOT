/**
 * input.js
 * --------
 * Controles:
 * - Space o clic fuera de UI: lanzar.
 * - Clic/tap en el Power-Up Dock: activar Power-Up almacenado.
 * - Teclas 1–4: activar Freeze, Shield, Double o Cleanup.
 */

import {
  POWER_UP_ORDER,
  canActivateStoredPowerUp,
} from './powerups.js?build=v142-economy-r5';
import { getPowerUpSlotAtPoint } from './powerupUi.js?build=v142-economy-r5';
import {
  playSoundBowTensionStart,
  playSoundBowTensionStop,
} from './sound.js?build=v142-economy-r5';

function getLogicalCanvasSize(canvas) {
  return {
    width: Math.max(1, Number(canvas.dataset.logicalWidth) || 600),
    height: Math.max(1, Number(canvas.dataset.logicalHeight) || 700),
  };
}

function toCanvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const logical = getLogicalCanvasSize(canvas);
  return {
    x: (event.clientX - rect.left) * (logical.width / rect.width),
    y: (event.clientY - rect.top)  * (logical.height / rect.height),
  };
}

function getLayout(canvas) {
  return canvas.dataset.layout === 'compact' ? 'compact' : 'desktop';
}

function getHudControlGeometry(canvas, control) {
  const { width } = getLogicalCanvasSize(canvas);
  const compact = getLayout(canvas) === 'compact';

  if (compact) {
    return {
      cx: width - 42,
      cy: control === 'shop' ? 128 : 190,
      r: 31,
    };
  }

  return {
    cx: control === 'shop' ? width - 80 : width - 40,
    cy: 42,
    r: 20,
  };
}

function isHudControlPoint(canvas, control, x, y) {
  const { cx, cy, r } = getHudControlGeometry(canvas, control);
  return Math.hypot(x - cx, y - cy) <= r;
}

function isSettingsPoint(canvas, x, y) {
  return isHudControlPoint(canvas, 'settings', x, y);
}

function isShopPoint(canvas, x, y) {
  return isHudControlPoint(canvas, 'shop', x, y);
}

function shortcutToPowerUp(code, key = '') {
  const keyMap = {
    '1': POWER_UP_ORDER[0],
    '2': POWER_UP_ORDER[1],
    '3': POWER_UP_ORDER[2],
    '4': POWER_UP_ORDER[3],
  };

  const codeMap = {
    Digit1: POWER_UP_ORDER[0],
    Numpad1: POWER_UP_ORDER[0],
    Digit2: POWER_UP_ORDER[1],
    Numpad2: POWER_UP_ORDER[1],
    Digit3: POWER_UP_ORDER[2],
    Numpad3: POWER_UP_ORDER[2],
    Digit4: POWER_UP_ORDER[3],
    Numpad4: POWER_UP_ORDER[3],
  };

  return codeMap[code] ?? keyMap[key] ?? null;
}

function requestPowerUpActivation(state, type) {
  if (
    state.phase === 'playing' &&
    canActivateStoredPowerUp(state, type)
  ) {
    state.pendingPowerUpActivation = type;
    return true;
  }

  return false;
}


const BOW_CHARGE_MS = 600;

function getNowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function getBowChargeProgress(state, now = getNowMs()) {
  if (!state.bowVisualPressed) return 0;
  const startedAt = Number(state.bowVisualPressAt) || now;
  return Math.max(0, Math.min(1, (now - startedAt) / BOW_CHARGE_MS));
}

function beginBowDraw(state) {
  if (
    state.phase !== 'playing' ||
    state.flyingProjectile !== null ||
    state.pendingLaunch
  ) {
    return false;
  }

  if (!state.bowVisualPressed) {
    state.bowVisualPressed = true;
    state.bowVisualPressAt = getNowMs();
    state.bowVisualReleaseCharged = false;
    playSoundBowTensionStart();
  }

  return true;
}

function cancelBowDraw(state) {
  playSoundBowTensionStop();
  state.bowVisualPressed = false;
  state.bowVisualPressAt = 0;
}

function releaseBowAndRequestLaunch(state) {
  if (!state.bowVisualPressed) return false;

  const now = getNowMs();
  const charged = getBowChargeProgress(state, now) >= 1;

  playSoundBowTensionStop(charged ? 0.020 : 0.028);

  state.bowVisualPressed = false;
  state.bowVisualPressAt = 0;
  state.bowVisualReleaseAt = now;
  state.bowVisualReleaseCharged = charged;

  if (
    state.phase !== 'playing' ||
    state.flyingProjectile !== null ||
    state.pendingLaunch
  ) {
    return false;
  }

  state.pendingLaunchCharged = charged;
  state.pendingLaunch = true;
  return true;
}

export function registerInputHandlers(canvas, state, abortController) {
  const controller = abortController ?? new AbortController();
  const { signal } = controller;

  let shotPointerId = null;
  let spaceShotArmed = false;

  canvas.tabIndex = 0;
  canvas.style.outline = 'none';

  window.addEventListener('keydown', (event) => {
    const powerUpType = shortcutToPowerUp(event.code, event.key);

    if (powerUpType) {
      event.preventDefault();
      requestPowerUpActivation(state, powerUpType);
      return;
    }

    if (event.code !== 'Space' && event.key !== ' ') return;
    event.preventDefault();

    if (!event.repeat && !spaceShotArmed) {
      spaceShotArmed = beginBowDraw(state);
    }
  }, { signal });

  window.addEventListener('keyup', (event) => {
    if (event.code !== 'Space' && event.key !== ' ') return;
    event.preventDefault();

    if (spaceShotArmed) {
      releaseBowAndRequestLaunch(state);
      spaceShotArmed = false;
    }
  }, { signal });

  canvas.addEventListener('pointerdown', (event) => {
    canvas.focus();
    const { x, y } = toCanvasPoint(canvas, event);

    const { width: logicalWidth, height: logicalHeight } = getLogicalCanvasSize(canvas);
    const powerUpType = getPowerUpSlotAtPoint(
      logicalWidth,
      x,
      y,
      getLayout(canvas),
      logicalHeight,
    );

    if (state.phase === 'playing' && isSettingsPoint(canvas, x, y)) {
      canvas.dataset.hudPressed = 'settings';
      state.pressedPowerUpSlot = null;
    } else if (state.phase === 'playing' && isShopPoint(canvas, x, y)) {
      canvas.dataset.hudPressed = 'shop';
      state.pressedPowerUpSlot = null;
    } else if (state.phase === 'playing' && powerUpType) {
      delete canvas.dataset.hudPressed;
      state.pressedPowerUpSlot = powerUpType;
      state.hoveredPowerUpSlot = powerUpType;
    } else {
      delete canvas.dataset.hudPressed;
      state.pressedPowerUpSlot = null;

      if (beginBowDraw(state)) {
        shotPointerId = event.pointerId;
        try {
          canvas.setPointerCapture(event.pointerId);
        } catch {
          // Algunos navegadores no implementan pointer capture en canvas.
        }
      }
    }
  }, { signal });

  const clearHudPressed = () => {
    delete canvas.dataset.hudPressed;
    state.pressedPowerUpSlot = null;
  };

  canvas.addEventListener('pointerup', (event) => {
    clearHudPressed();

    if (shotPointerId === event.pointerId) {
      releaseBowAndRequestLaunch(state);
      shotPointerId = null;

      try {
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
      } catch {
        // noop
      }
    }
  }, { signal });

  canvas.addEventListener('pointercancel', (event) => {
    clearHudPressed();

    if (shotPointerId === event.pointerId) {
      shotPointerId = null;
      cancelBowDraw(state);
    }
  }, { signal });

  canvas.addEventListener('click', (event) => {
    const { x, y } = toCanvasPoint(canvas, event);
    canvas.focus();

    if (isSettingsPoint(canvas, x, y) && state.phase === 'playing') {
      canvas.dispatchEvent(new CustomEvent('settings-open'));
      return;
    }

    if (isShopPoint(canvas, x, y) && state.phase === 'playing') {
      canvas.dispatchEvent(new CustomEvent('shop-open'));
      return;
    }

    const { width: logicalWidth, height: logicalHeight } = getLogicalCanvasSize(canvas);
    const powerUpType = getPowerUpSlotAtPoint(
      logicalWidth,
      x,
      y,
      getLayout(canvas),
      logicalHeight,
    );
    state.hoveredPowerUpSlot = powerUpType;

    if (powerUpType) {
      requestPowerUpActivation(state, powerUpType);
    }
  }, { signal });

  canvas.addEventListener('mousemove', (event) => {
    const { x, y } = toCanvasPoint(canvas, event);
    const { width: logicalWidth, height: logicalHeight } = getLogicalCanvasSize(canvas);
    const powerUpType = getPowerUpSlotAtPoint(
      logicalWidth,
      x,
      y,
      getLayout(canvas),
      logicalHeight,
    );

    state.hoveredPowerUpSlot = powerUpType;

    const overSettings =
      state.phase === 'playing' &&
      isSettingsPoint(canvas, x, y);

    const overShop =
      state.phase === 'playing' &&
      isShopPoint(canvas, x, y);

    const overPowerUp =
      state.phase === 'playing' &&
      powerUpType !== null;

    if (overSettings) {
      canvas.dataset.hudHover = 'settings';
    } else if (overShop) {
      canvas.dataset.hudHover = 'shop';
    } else {
      delete canvas.dataset.hudHover;
    }

    canvas.style.cursor =
      overSettings || overShop || overPowerUp ? 'pointer' : 'default';
  }, { signal });

  canvas.addEventListener('mouseleave', () => {
    state.hoveredPowerUpSlot = null;
    state.pressedPowerUpSlot = null;
    delete canvas.dataset.hudHover;
    delete canvas.dataset.hudPressed;
    canvas.style.cursor = 'default';
  }, { signal });

  window.addEventListener('blur', () => {
    shotPointerId = null;
    spaceShotArmed = false;
    cancelBowDraw(state);
  }, { signal });

  return controller;
}
