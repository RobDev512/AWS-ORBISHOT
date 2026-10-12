import { CONFIG } from '../core/config.js';

const LOGICAL_WIDTH = CONFIG.CANVAS_WIDTH;

/**
 * feedback.js — Textos flotantes, anillos de impacto y notificaciones.
 */

const texts = [];
const rings = [];
const banners = [];

let decorativeEnabled = true;

export function setFeedbackFxEnabled(val) {
  decorativeEnabled = Boolean(val);
}

export function emitFloatingText(x, y, text, options = {}) {
  texts.push({
    x, y,
    text,
    color: options.color ?? '#FFFFFF',
    size: options.size ?? 17,
    life: 1,
    maxLife: options.duration ?? 0.75,
    vy: options.vy ?? -28,
  });
}

export function emitRing(x, y, color = '#FF9900', strength = 1) {
  if (!decorativeEnabled) return;
  rings.push({ x, y, color, strength, life: 1, maxLife: 0.32 });
}

/**
 * Las notificaciones se muestran de una en una en una zona dedicada.
 * priority='high' coloca la nueva notificación al frente de la cola.
 */
export function emitBanner(title, subtitle = '', options = {}) {
  const item = {
    title,
    subtitle,
    color: options.color ?? '#FF9900',
    life: 1,
    maxLife: options.duration ?? 1.2,
  };

  for (let i = banners.length - 1; i >= 0; i--) {
    if (
      banners[i].title === title &&
      banners[i].subtitle === subtitle
    ) {
      banners.splice(i, 1);
    }
  }

  if (options.priority === 'high') {
    banners.unshift(item);
  } else {
    banners.push(item);
  }

  while (banners.length > 4) {
    banners.splice(banners.length - 1, 1);
  }
}

function notificationPath(ctx, x, y, w, h, r) {
  ctx.beginPath();

  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

function fitBannerText(ctx, text, maxWidth, startSize, minSize) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `bold ${size}px "Amazon Ember", Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

export function updateAndDrawFeedback(ctx, dt, options = {}) {
  const canvasW = Math.max(1, Number(ctx?.canvas?.dataset?.logicalWidth) || LOGICAL_WIDTH);
  const compact = ctx?.canvas?.dataset?.layout === 'compact';
  const sceneOffsetX = Math.max(0, Number(options.sceneOffsetX) || 0);
  const sceneOffsetY = Math.max(0, Number(options.sceneOffsetY) || 0);
  const sceneScale = Math.max(
    0.9,
    Math.min(1.24, Number(options.sceneScale) || 1),
  );

  for (let i = texts.length - 1; i >= 0; i--) {
    const item = texts[i];
    item.life -= dt / item.maxLife;
    if (item.life <= 0) {
      texts.splice(i, 1);
      continue;
    }

    item.y += item.vy * dt;

    ctx.save();
    ctx.translate(sceneOffsetX, sceneOffsetY);
    if (sceneScale !== 1) {
      ctx.translate(LOGICAL_WIDTH / 2, 350);
      ctx.scale(sceneScale, sceneScale);
      ctx.translate(-LOGICAL_WIDTH / 2, -350);
    }
    ctx.globalAlpha = Math.min(1, item.life * 1.6);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${item.size}px "Amazon Ember", Arial, sans-serif`;
    ctx.fillStyle = item.color;
    ctx.shadowColor = 'rgba(0,0,0,.65)';
    ctx.shadowBlur = decorativeEnabled ? 5 : 0;
    ctx.fillText(item.text, item.x, item.y);
    ctx.restore();
  }

  for (let i = rings.length - 1; i >= 0; i--) {
    const ring = rings[i];
    ring.life -= dt / ring.maxLife;
    if (ring.life <= 0) {
      rings.splice(i, 1);
      continue;
    }

    const progress = 1 - ring.life;
    const radius = 10 + progress * 34 * ring.strength;

    ctx.save();
    ctx.translate(sceneOffsetX, sceneOffsetY);
    if (sceneScale !== 1) {
      ctx.translate(LOGICAL_WIDTH / 2, 350);
      ctx.scale(sceneScale, sceneScale);
      ctx.translate(-LOGICAL_WIDTH / 2, -350);
    }
    ctx.globalAlpha = Math.max(0, ring.life * 0.8);
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = 4 * ring.life + 1;
    ctx.shadowColor = ring.color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
  }

  if (banners.length) {
    const banner = banners[0];
    banner.life -= dt / banner.maxLife;

    if (banner.life <= 0) {
      banners.shift();
    } else {
      const fadeIn = Math.min(1, (1 - banner.life) * 9);
      const fadeOut = Math.min(1, banner.life * 4.5);
      const alpha = Math.min(fadeIn, fadeOut);

      // Zona exclusiva entre el progreso superior y el disco.
      // En compacto se da más ancho al mensaje y se ajusta la tipografía
      // para que títulos largos (como Power Core listo) nunca desborden.
      const w = compact ? 390 : 286;
      const h = compact ? 60 : 56;
      const x = (canvasW - w) / 2;
      const y = compact ? 188 : 178;

      ctx.save();
      ctx.globalAlpha = alpha;

      notificationPath(ctx, x, y, w, h, 14);
      // Más opaco que antes: evita que Power Cores/proyectiles detrás del
      // banner ensucien la lectura del título y subtítulo.
      ctx.fillStyle = compact ? 'rgba(10,14,20,.94)' : 'rgba(13,17,23,.90)';
      ctx.fill();
      ctx.strokeStyle = `${banner.color}CC`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const titleSize = fitBannerText(
        ctx,
        banner.title,
        w - 28,
        compact ? 20 : 19,
        compact ? 15 : 14,
      );
      ctx.font = `bold ${titleSize}px "Amazon Ember", Arial, sans-serif`;
      ctx.fillStyle = banner.color;
      ctx.shadowColor = banner.color;
      ctx.shadowBlur = decorativeEnabled ? 8 : 0;
      ctx.fillText(banner.title, canvasW / 2, y + (compact ? 22 : 20));

      ctx.shadowBlur = 0;
      if (banner.subtitle) {
        const subtitleSize = fitBannerText(
          ctx,
          banner.subtitle,
          w - 26,
          compact ? 9 : 9,
          7,
        );
        ctx.font = `bold ${subtitleSize}px "Amazon Ember", Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,.82)';
        ctx.fillText(
          banner.subtitle,
          canvasW / 2,
          y + (compact ? 43 : 40),
        );
      }

      ctx.restore();
    }
  }
}

export function clearFeedback() {
  texts.length = 0;
  rings.length = 0;
  banners.length = 0;
}
