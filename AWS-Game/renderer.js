import { CONFIG, APP_VERSION, APP_CODENAME, APP_NAME } from './config.js?build=v1431-perf-r1';
import { getLevelTarget, getLevelTheme, LEVEL_COMPLETE_DELAY } from './levels.js?build=v143-pages-hotfix2';
import {
  POWER_UP_CONFIG,
  POWER_UP_ORDER,
  canActivateStoredPowerUp,
  getPowerUpInventoryCap,
} from './powerups.js?build=v143-pages-hotfix2';
import {
  getPowerUpChargeRect,
  getPowerUpSlotRects,
} from './powerupUi.js?build=v143-pages-hotfix2';
import { getPowerCorePosition } from './powercore.js?build=v143-pages-hotfix2';
import {
  BOSS_CONFIG,
  getBossPhase,
  getBossLayerTargets,
  getBossPhaseProgress,
  getBossPhaseBreak,
  getBossOverload,
  isBossPhaseTransitionActive,
} from './boss.js?build=v143-pages-hotfix2';
import { getStability } from './stability.js';

/**
 * renderer.js — AWS ORBISHOT
 *
 * Proyectiles: flechas de arco delgadas (punta metálica, astil fino, plumas)
 * con el icono AWS en el centro del astil.
 *
 * CONVENIO DE ÁNGULOS en drawArrow:
 *   En coordenadas locales (antes de rotate), la flecha apunta hacia -Y
 *   (punta en la parte superior). La rotación `angle` gira esa dirección
 *   al destino deseado en el canvas.
 *
 *   - Vuelo: punta en dirección de (vx,vy).
 *     flyAngle = atan2(vy, vx) - PI/2   (resta PI/2 porque local -Y = arriba)
 *
 *   - Anclado: punta apunta HACIA el centro del disco, o sea en la dirección
 *     opuesta a ap.angle (que va del centro al proyectil).
 *     anchorAngle = ap.angle + PI/2    (ap.angle + PI da la dirección hacia
 *     el centro; restar PI/2 convierte a convenio local)
 *     → simplificando: ap.angle - PI/2
 */

const COLOR_BG        = '#232F3E';
const COLOR_DISC_RING = '#FF9900';
const COLOR_DISC_INNER= '#1a2332';

const LOGICAL_WIDTH = CONFIG.CANVAS_WIDTH;
const LOGICAL_HEIGHT = CONFIG.CANVAS_HEIGHT;

function getLogicalCanvasWidth(ctx) {
  return Math.max(
    LOGICAL_WIDTH,
    Number(ctx?.canvas?.dataset?.logicalWidth) || LOGICAL_WIDTH,
  );
}

function getLogicalCanvasHeight(ctx) {
  return Math.max(
    LOGICAL_HEIGHT,
    Number(ctx?.canvas?.dataset?.logicalHeight) || LOGICAL_HEIGHT,
  );
}

function getSceneOffsetX(ctx) {
  return Math.max(0, Number(ctx?.canvas?.dataset?.sceneOffsetX) || 0);
}

function getSceneOffsetY(ctx) {
  return Math.max(0, Number(ctx?.canvas?.dataset?.sceneOffsetY) || 0);
}

function getSceneScale(ctx) {
  return Math.max(
    0.9,
    Math.min(1.24, Number(ctx?.canvas?.dataset?.sceneScale) || 1),
  );
}

const SERVICE_COLORS = {
  lambda:     '#E8702E',
  s3:         '#569A31',
  ec2:        '#ED7100',
  dynamodb:   '#4053D6',
  sqs:        '#FF4F8B',
  sns:        '#E7157B',
  rds:        '#527FFF',
  cloudwatch: '#E7157B',
};

const SERVICE_LABELS = {
  lambda:     'λ',
  s3:         'S3',
  ec2:        'EC2',
  dynamodb:   'DB',
  sqs:        'SQS',
  sns:        'SNS',
  rds:        'RDS',
  cloudwatch: 'CW',
};

function isImageReady(img) {
  return !!(img && img.complete && img.naturalWidth > 0);
}

// ---------------------------------------------------------------------------
// drawArrow — flecha de arco delgada
//
//  Anatomía (coordenadas locales, Y crece hacia abajo):
//
//       ◆           ← punta metálica    y = -totalLen/2
//       |
//    ───┼───        ← aletas de la punta (arrowhead)
//       |
//       │           ← astil (shaft) delgado
//     [icon]        ← icono AWS en el centro del astil
//       │
//       │
//      ═╪═          ← plumas (nock)     y = +totalLen/2
//
//  El punto de referencia (cx,cy) es el CENTRO GEOMÉTRICO de la flecha.
// ---------------------------------------------------------------------------
function drawArrow(ctx, cx, cy, radius, angle, awsIconId, assets) {
  // Proporciones de la flecha (todas relativas al radius del proyectil)
  const totalLen   = radius * 4.2;   // longitud total de la flecha
  const half       = totalLen / 2;   // desde el centro hasta cada extremo

  const tipLen     = radius * 0.9;   // longitud de la punta metálica desde el apex
  const headW      = radius * 0.38;  // semi-ancho de las aletas
  const headBase   = radius * 0.55;  // distancia desde apex hasta la base de aletas

  const shaftW     = radius * 0.13;  // semi-ancho del astil (muy delgado)

  const nockW      = radius * 0.55;  // semi-ancho de las plumas
  const nockH      = radius * 0.7;   // altura del bloque de plumas

  const iconR      = radius * 0.7;   // radio del círculo de icono

  const color      = SERVICE_COLORS[awsIconId] ?? '#888888';

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Sombra global
  ctx.shadowColor    = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur     = 5;
  ctx.shadowOffsetX  = 1.5;
  ctx.shadowOffsetY  = 1.5;

  // ── Astil (shaft) ──────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.rect(-shaftW, -half, shaftW * 2, totalLen);
  ctx.fillStyle = '#C8A96E';   // madera clara
  ctx.fill();

  // veta de madera
  ctx.beginPath();
  ctx.moveTo(0, -half);
  ctx.lineTo(0, half);
  ctx.strokeStyle = 'rgba(120,80,30,0.4)';
  ctx.lineWidth = 0.7;
  ctx.stroke();

  ctx.shadowBlur = 0;

  // ── Punta metálica (arrowhead) ─────────────────────────────────────────────
  // apex en -half, base en (-half + tipLen)
  const apexY    = -half;
  const baseY    = apexY + tipLen;
  const headBaseY= apexY + headBase;

  ctx.beginPath();
  ctx.moveTo(0, apexY);                   // apex (punta)
  ctx.lineTo(-headW, headBaseY);          // aleta izquierda
  ctx.lineTo(-shaftW, baseY);             // unión izquierda con astil
  ctx.lineTo(shaftW, baseY);              // unión derecha
  ctx.lineTo(headW, headBaseY);           // aleta derecha
  ctx.closePath();
  ctx.fillStyle = '#C0C8D0';             // metal grisáceo
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Brillo punta
  ctx.beginPath();
  ctx.moveTo(0, apexY);
  ctx.lineTo(-shaftW * 0.4, headBaseY * 0.6 + apexY * 0.4);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // ── Plumas / nock ──────────────────────────────────────────────────────────
  const nockTop = half - nockH;

  // Pluma izquierda
  ctx.beginPath();
  ctx.moveTo(-shaftW, nockTop);
  ctx.lineTo(-nockW, half - nockH * 0.2);
  ctx.lineTo(-shaftW, half);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
  ctx.fill();

  // Pluma derecha
  ctx.beginPath();
  ctx.moveTo(shaftW, nockTop);
  ctx.lineTo(nockW, half - nockH * 0.2);
  ctx.lineTo(shaftW, half);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 1;

  // ── Icono AWS centrado en el astil ────────────────────────────────────────
  // El icono está en el centro geométrico (y=0 en coords locales)
  const iconY = 0;

  // Fondo circular del icono
  ctx.beginPath();
  ctx.arc(0, iconY, iconR, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const img = assets?.[awsIconId];
  if (isImageReady(img)) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, iconY, iconR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, -iconR, iconY - iconR, iconR * 2, iconR * 2);
    ctx.restore();
  } else {
    const label    = SERVICE_LABELS[awsIconId] ?? awsIconId.slice(0,3).toUpperCase();
    const fontSize = Math.max(8, Math.floor(iconR * 0.9));
    ctx.fillStyle    = '#FFFFFF';
    ctx.font         = `bold ${fontSize}px "Amazon Ember", Arial, sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, iconY);
  }

  ctx.restore();
}


// ---------------------------------------------------------------------------
// drawDifficultyIndicator — estrellas de dificultad con significado estable
//
// v1.4.3:
//   Fácil   = ★☆☆
//   Medio   = ★★☆
//   Difícil = ★★★
//
// El RANGO/Tier de progresión sigue mostrándose por separado en el badge
// superior, evitando mezclar dificultad elegida con progresión dinámica.
// ---------------------------------------------------------------------------

function isR61WideHud(ctx) {
  return (
    getCanvasLayout(ctx) === 'desktop' &&
    getLogicalCanvasWidth(ctx) >= 1000
  );
}

function drawR61WideHud(ctx, state, progression) {
  if (!isR61WideHud(ctx)) return;

  const sideSpace = Math.max(230, getSceneOffsetX(ctx));
  const w = Math.min(300, Math.max(230, sideSpace - 46));
  const x = 24;
  const y = 118;
  const h = 352;
  const cx = x + w / 2;
  const ix = x + 24;
  const iw = w - 48;

  const diff = ({
    easy:   { label: 'FÁCIL', n: 1, color: '#4FC3F7' },
    medium: { label: 'MEDIO', n: 2, color: '#FF9900' },
    hard:   { label: 'DIFÍCIL', n: 3, color: '#FF5A5F' },
  }[state.difficulty] ?? { label: 'MEDIO', n: 2, color: '#FF9900' });

  const level = Math.max(1, Number(state.level) || 1);
  const tier = Math.max(1, Number(progression?.tier) || 1);

  ctx.save();

  roundedRectPath(ctx, x, y, w, h, 18);
  ctx.fillStyle = 'rgba(13,17,23,.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,153,0,.34)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 11px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.48)';
  ctx.fillText('ESTADO DE PARTIDA', cx, y + 24);

  ctx.font = 'bold 15px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFB24D';
  ctx.fillText(
    `${diff.label}  •  NIVEL ${level}  •  RANGO ${tier}`,
    cx,
    y + 50,
  );

  ctx.font = 'bold 12px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.60)';
  ctx.fillText('DIFICULTAD', cx, y + 90);

  const starR = 17;
  const gap = 13;
  const total = 3 * starR * 2 + 2 * gap;
  const sx = cx - total / 2 + starR;

  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(sx + i * (starR * 2 + gap), y + 124);
    drawStar(
      ctx, 0, 0,
      starR,
      starR * .45,
      5,
      i < diff.n,
      diff.color,
    );
    ctx.restore();
  }

  if (state.boss?.active) {
    const phase = getBossPhase(state);
    const p = Math.max(0, Math.min(1, getBossPhaseProgress(state)));
    const accent = state.boss?.accent ?? '#FFD166';

    ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = accent;
    ctx.fillText(
      `JEFE • ${String(phase?.label ?? 'FASE').toUpperCase()}`,
      cx,
      y + 180,
    );

    roundedRectPath(ctx, ix, y + 202, iw, 12, 6);
    ctx.fillStyle = 'rgba(255,255,255,.09)';
    ctx.fill();
    if (p > 0) {
      roundedRectPath(ctx, ix, y + 202, Math.max(12, iw * p), 12, 6);
      ctx.fillStyle = accent;
      ctx.fill();
    }

    const bossOverload = getBossOverload(state);
    const ov = bossOverload.value;
    const ovR = bossOverload.ratio;
    const ovC = ovR >= .75 ? '#FF4D4D' : ovR >= .40 ? '#FFD166' : '#72C66B';

    ctx.textAlign = 'left';
    ctx.font = 'bold 12px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.62)';
    ctx.fillText('SOBRECARGA', ix, y + 257);

    ctx.textAlign = 'right';
    ctx.fillStyle = ovC;
    ctx.fillText(`${Math.round(ov)}%`, ix + iw, y + 257);

    roundedRectPath(ctx, ix, y + 278, iw, 11, 5.5);
    ctx.fillStyle = 'rgba(255,255,255,.09)';
    ctx.fill();
    if (ovR > 0) {
      roundedRectPath(ctx, ix, y + 278, Math.max(11, iw * ovR), 11, 5.5);
      ctx.fillStyle = ovC;
      ctx.fill();
    }
  } else {
    const target = getLevelTarget(level);
    const hits = Math.min(target, Math.max(0, Number(state.levelHits) || 0));
    const p = target > 0 ? hits / target : 0;
    const theme = getLevelTheme(level);

    ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.72)';
    ctx.fillText(`PROGRESO • ${hits}/${target} FLECHAS`, cx, y + 180);

    roundedRectPath(ctx, ix, y + 202, iw, 12, 6);
    ctx.fillStyle = 'rgba(255,255,255,.09)';
    ctx.fill();
    if (p > 0) {
      roundedRectPath(ctx, ix, y + 202, Math.max(12, iw * p), 12, 6);
      ctx.fillStyle = theme.ring;
      ctx.fill();
    }

    const st = getStability(state);
    const ov = Math.max(0, st.max - st.value);
    const ovR = st.max > 0 ? ov / st.max : 0;
    const ovC = ovR >= .75 ? '#FF4D4D' : ovR >= .40 ? '#FFD166' : '#72C66B';

    ctx.textAlign = 'left';
    ctx.font = 'bold 12px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.62)';
    ctx.fillText('SOBRECARGA', ix, y + 257);

    ctx.textAlign = 'right';
    ctx.fillStyle = ovC;
    ctx.fillText(`${Math.round(ov)}%`, ix + iw, y + 257);

    roundedRectPath(ctx, ix, y + 278, iw, 11, 5.5);
    ctx.fillStyle = 'rgba(255,255,255,.09)';
    ctx.fill();
    if (ovR > 0) {
      roundedRectPath(ctx, ix, y + 278, Math.max(11, iw * ovR), 11, 5.5);
      ctx.fillStyle = ovC;
      ctx.fill();
    }
  }

  ctx.textAlign = 'center';
  ctx.font = '10px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.34)';
  ctx.fillText('HUD ADAPTATIVO', cx, y + 327);

  ctx.restore();
}

function drawDifficultyIndicator(
  ctx,
  canvasW,
  difficultyKey,
) {
  const compact =
    getCanvasLayout(ctx) === 'compact';

  const compactDesktop =
    compact && isCompactDesktop(ctx);

  const u =
    compact && !compactDesktop
      ? getUiScale(ctx)
      : 1;

  const maxStars = 3;

  const starSize =
    compactDesktop ? 14 :
    compact ? 14.4 * u :
    11;

  const gap =
    compactDesktop ? 10 :
    compact ? 9.5 * u :
    8;

  const visual = ({
    easy: {
      filled: 1,
      color: '#4FC3F7',
    },
    medium: {
      filled: 2,
      color: '#FF9900',
    },
    hard: {
      filled: 3,
      color: '#FF5A5F',
    },
  }[difficultyKey] ?? {
    filled: 2,
    color: '#FF9900',
  });

  const totalW =
    maxStars * starSize * 2 +
    (maxStars - 1) * gap;

  const startX =
    (canvasW - totalW) / 2 + starSize;

  const y =
    compactDesktop ? 132 :
    compact ? 160 :
    108;

  for (let i = 0; i < maxStars; i++) {
    const cx =
      startX + i * (starSize * 2 + gap);

    ctx.save();
    ctx.translate(cx, y);

    drawStar(
      ctx,
      0,
      0,
      starSize,
      starSize * .45,
      5,
      i < visual.filled,
      visual.color,
    );

    ctx.restore();
  }
}

function drawStar(
  ctx,
  cx,
  cy,
  outerR,
  innerR,
  points,
  filled,
  color = '#FF9900',
) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y_ = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y_) : ctx.lineTo(x, y_);
  }
  ctx.closePath();

  if (filled) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// HUD — score, récord, dificultad y acceso a configuración
// Todo se dibuja dentro del canvas para que escale junto con el juego.
// ---------------------------------------------------------------------------
function roundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawHudValue(ctx, label, value, x, align = 'left') {
  const compact = getCanvasLayout(ctx) === 'compact';
  const compactDesktop = compact && isCompactDesktop(ctx);
  const u = compact && !compactDesktop ? getUiScale(ctx) : 1;

  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  ctx.font = `bold ${
    compactDesktop ? 11.2 :
    compact ? 12.2 * u :
    10
  }px "Amazon Ember", Arial, sans-serif`;

  ctx.fillStyle = 'rgba(255,153,0,.94)';
  ctx.fillText(
    label,
    x,
    compactDesktop ? 30 : compact ? 31 : 29,
  );

  ctx.font = `bold ${
    compactDesktop ? 28 :
    compact ? 28.5 * Math.min(u, 1.22) :
    25
  }px "Amazon Ember", Arial, sans-serif`;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(
    String(value),
    x,
    compactDesktop ? 52 : compact ? 56 : 49,
  );
}

function drawHeartPath(ctx, cx, cy, size) {
  const s = size;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.42);
  ctx.bezierCurveTo(
    cx - s * 0.58, cy + s * 0.04,
    cx - s * 0.55, cy - s * 0.40,
    cx - s * 0.20, cy - s * 0.40,
  );
  ctx.bezierCurveTo(
    cx - s * 0.02, cy - s * 0.40,
    cx, cy - s * 0.20,
    cx, cy - s * 0.12,
  );
  ctx.bezierCurveTo(
    cx, cy - s * 0.20,
    cx + s * 0.02, cy - s * 0.40,
    cx + s * 0.20, cy - s * 0.40,
  );
  ctx.bezierCurveTo(
    cx + s * 0.55, cy - s * 0.40,
    cx + s * 0.58, cy + s * 0.04,
    cx, cy + s * 0.42,
  );
  ctx.closePath();
}

function drawEconomyStatus(ctx, state, canvasW) {
  const compact = getCanvasLayout(ctx) === 'compact';
  const compactDesktop = compact && isCompactDesktop(ctx);
  const u = compact && !compactDesktop ? getUiScale(ctx) : 1;

  const coins = Math.max(
    0,
    Math.floor(Number(state.economy?.coins) || 0),
  );

  const maxLives = Math.max(
    3,
    Math.floor(Number(state.economy?.maxLives) || 3),
  );

  const currentLives = Math.max(
    0,
    Math.min(
      maxLives,
      Math.floor(Number(state.currentLives) || 0),
    ),
  );

  const y =
    compactDesktop ? 77 :
    compact ? 93 :
    73;

  const coinX =
    compactDesktop ? 42 :
    compact ? 42 :
    34;

  const coinR =
    compactDesktop ? 8.8 :
    compact ? 8.6 * u :
    5.2;

  ctx.save();
  ctx.textBaseline = 'middle';

  ctx.beginPath();
  ctx.arc(coinX, y, coinR, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD166';
  ctx.shadowColor = '#FF9900';
  ctx.shadowBlur = compact ? 7 : 5;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(
    coinX,
    y,
    compactDesktop ? 3.2 : compact ? 3.6 * u : 2.3,
    0,
    Math.PI * 2,
  );
  ctx.strokeStyle = 'rgba(121,77,0,.72)';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  ctx.font = `bold ${
    compactDesktop ? 14 :
    compact ? 14.0 * u :
    9
  }px "Amazon Ember", Arial, sans-serif`;

  ctx.fillStyle = '#FFD166';
  ctx.textAlign = 'left';
  ctx.fillText(
    String(coins),
    coinX + (
      compactDesktop ? 15 :
      compact ? 15.5 * u :
      10
    ),
    y + .5,
  );

  if (maxLives <= 5) {
    const size =
      compactDesktop ? 15.5 :
      compact ? 14.4 * u :
      9;

    const gap =
      compactDesktop ? 5.2 :
      compact ? 4.8 * u :
      3;

    const slotW = size + gap;
    const totalW = maxLives * slotW - gap;

    let x =
      (compact ? canvasW - 42 : canvasW - 120) -
      totalW;

    if (compactDesktop) x += 13;

    for (let i = 0; i < maxLives; i++) {
      const cx = x + size / 2;
      drawHeartPath(ctx, cx, y, size);

      if (i < currentLives) {
        ctx.fillStyle = '#FF6688';
        ctx.shadowColor = '#FF4D73';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = 'rgba(255,102,136,.36)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      x += slotW;
    }
  } else {
    const cx =
      compact ? canvasW - 72 : canvasW - 154;

    const size =
      compactDesktop ? 13 :
      compact ? 11 * u :
      10;

    drawHeartPath(ctx, cx, y, size);

    ctx.fillStyle =
      currentLives > 0
        ? '#FF6688'
        : 'rgba(255,102,136,.28)';

    ctx.fill();

    ctx.font = `bold ${
      compactDesktop ? 12.2 :
      compact ? 10.5 * u :
      10
    }px "Amazon Ember", Arial, sans-serif`;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#FF9AB0';
    ctx.fillText(`×${currentLives}`, cx + 11, y + .5);
  }

  ctx.restore();
}

function getHudControlState(ctx, control) {
  return {
    hovered: ctx.canvas?.dataset?.hudHover === control,
    pressed: ctx.canvas?.dataset?.hudPressed === control,
  };
}

function getHudControlGeometry(ctx, control, canvasW) {
  const compact = getCanvasLayout(ctx) === 'compact';

  if (compact) {
    if (isCompactDesktop(ctx)) {
      const radius = 34;

      return {
        x: canvasW - 18 - radius,
        y: control === 'shop' ? 146 : 234,
        radius,
        compact: true,
      };
    }

    const c = getControlScale(ctx);
    const radius = 38 * c;

    return {
      x: canvasW - 18 - radius,
      y: control === 'shop' ? 192 : 300,
      radius,
      compact: true,
    };
  }

  return {
    x: control === 'shop' ? canvasW - 80 : canvasW - 40,
    y: 42,
    radius: 17,
    compact: false,
  };
}

function drawSettingsIcon(ctx, canvasW, assets) {
  const geometry =
    getHudControlGeometry(ctx, 'settings', canvasW);

  const { x, y, compact } = geometry;
  const compactDesktop =
    compact && isCompactDesktop(ctx);

  const u =
    compact && !compactDesktop
      ? getUiScale(ctx)
      : 1;

  const c =
    compact && !compactDesktop
      ? getControlScale(ctx)
      : 1;

  const { hovered, pressed } =
    getHudControlState(ctx, 'settings');

  const baseR = geometry.radius;
  const r =
    pressed
      ? baseR - 1
      : hovered
        ? baseR + 1.5
        : baseR;

  ctx.save();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);

  ctx.fillStyle =
    compactDesktop && pressed
      ? 'rgba(255,153,0,.28)'
      : compactDesktop && hovered
        ? 'rgba(255,153,0,.18)'
        : compact
          ? 'rgba(13,17,23,.92)'
          : 'rgba(255,255,255,.06)';

  if (compactDesktop && (hovered || pressed)) {
    ctx.shadowColor = '#FF9900';
    ctx.shadowBlur = pressed ? 22 : 14;
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle =
    pressed || hovered
      ? '#FFB24D'
      : compact
        ? 'rgba(255,153,0,.78)'
        : 'rgba(255,153,0,.45)';

  ctx.lineWidth =
    compactDesktop ? 2.0 :
    compact ? 1.7 :
    1.2;

  if (compactDesktop && (hovered || pressed)) {
    ctx.shadowColor = '#FFB24D';
    ctx.shadowBlur = pressed ? 18 : 11;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  const icon = assets?.hudIcons?.settings;
  const iconY = y;

  const iconSize =
    compactDesktop ? 31 :
    compact ? 31 * c :
    20;

  if (isImageReady(icon)) {
    ctx.drawImage(
      icon,
      x - iconSize / 2,
      iconY - iconSize / 2,
      iconSize,
      iconSize,
    );
  }


  ctx.restore();
}

function drawShopIcon(ctx, canvasW, assets) {
  const geometry =
    getHudControlGeometry(ctx, 'shop', canvasW);

  const { x, y, compact } = geometry;
  const compactDesktop =
    compact && isCompactDesktop(ctx);

  const u =
    compact && !compactDesktop
      ? getUiScale(ctx)
      : 1;

  const c =
    compact && !compactDesktop
      ? getControlScale(ctx)
      : 1;

  const { hovered, pressed } =
    getHudControlState(ctx, 'shop');

  const baseR = geometry.radius;
  const r =
    pressed
      ? baseR - 1
      : hovered
        ? baseR + 1.5
        : baseR;

  ctx.save();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);

  ctx.fillStyle =
    compactDesktop && pressed
      ? 'rgba(255,209,102,.28)'
      : compactDesktop && hovered
        ? 'rgba(255,209,102,.18)'
        : compact
          ? 'rgba(13,17,23,.92)'
          : 'rgba(255,209,102,.075)';

  if (compactDesktop && (hovered || pressed)) {
    ctx.shadowColor = '#FFD166';
    ctx.shadowBlur = pressed ? 22 : 14;
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle =
    pressed || hovered
      ? '#FFF0B3'
      : compact
        ? 'rgba(255,209,102,.82)'
        : 'rgba(255,209,102,.52)';

  ctx.lineWidth =
    compactDesktop ? 2.0 :
    compact ? 1.7 :
    1.2;

  if (compactDesktop && (hovered || pressed)) {
    ctx.shadowColor = '#FFD166';
    ctx.shadowBlur = pressed ? 18 : 11;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  const icon = assets?.hudIcons?.shop;
  const iconY = compact ? y : y - 1;

  const iconSize =
    compactDesktop ? 32 :
    compact ? 32 * c :
    19;

  if (isImageReady(icon)) {
    ctx.drawImage(
      icon,
      x - iconSize / 2,
      iconY - iconSize / 2,
      iconSize,
      iconSize,
    );
  }

  if (!compact) {
    ctx.fillStyle = 'rgba(255,255,255,.86)';

    ctx.font = `bold ${
      compactDesktop ? 10.0 :
      compact ? 8.8 * u :
      5.5
    }px "Amazon Ember", Arial, sans-serif`;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(
      'TIENDA',
      x,
      compact
        ? y + (
            compactDesktop ? 25 :
            17 * c
          )
        : y + 10.5,
    );
  }

  ctx.restore();
}

function drawHUD(ctx, state, progression, canvasW, assets) {
  ctx.save();

  const compact =
    getCanvasLayout(ctx) === 'compact';

  const compactDesktop =
    compact && isCompactDesktop(ctx);

  const u =
    compact && !compactDesktop
      ? getUiScale(ctx)
      : 1;

  const panelH =
    compactDesktop ? 82 :
    compact ? 104 :
    78;

  roundedRectPath(
    ctx,
    18,
    10,
    canvasW - 36,
    panelH,
    12,
  );

  ctx.fillStyle = 'rgba(13,17,23,.48)';
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,153,0,.22)';
  ctx.lineWidth = 1;
  ctx.stroke();

  drawHudValue(
    ctx,
    'PUNTAJE',
    state.score,
    compactDesktop ? 38 :
    compact ? 40 :
    34,
    'left',
  );

  drawHudValue(
    ctx,
    'RÉCORD',
    state.highScore,
    compact
      ? canvasW - 40
      : canvasW - 120,
    'right',
  );

  const logo = assets?.brandLogo;

  if (isImageReady(logo)) {
    const maxW =
      compactDesktop ? 98 :
      compact ? 108 :
      92;

    const maxH =
      compactDesktop ? 49 :
      compact ? 54 :
      48;

    const ratio =
      logo.naturalWidth / logo.naturalHeight;

    let w = maxW;
    let h = w / ratio;

    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }

    ctx.drawImage(
      logo,
      canvasW / 2 - w / 2,
      compact ? 12 : 13,
      w,
      h,
    );
  }

  const difficulty = ({
    easy: 'FÁCIL',
    medium: 'MEDIO',
    hard: 'DIFÍCIL',
  }[state.difficulty] ?? 'MEDIO');

  const tier = progression?.tier ?? 1;
  const level = Math.max(1, state.level ?? 1);

  const badgeText =
    `${difficulty}  •  NV ${level}  •  RANGO ${tier}`;

  const wide =
    typeof isR61WideHud === 'function' &&
    isR61WideHud(ctx);

  if (!wide) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = `bold ${
      compactDesktop ? 12.8 :
      compact ? 12.5 * u :
      8
    }px "Amazon Ember", Arial, sans-serif`;

    const tw = ctx.measureText(badgeText).width;

    const badgeH =
      compactDesktop ? 24 :
      compact ? 20 * Math.min(u, 1.18) :
      16;

    const badgeY =
      compactDesktop ? 56 :
      compact ? 76 :
      66;

    roundedRectPath(
      ctx,
      canvasW / 2 - tw / 2 - 10,
      badgeY,
      tw + 20,
      badgeH,
      badgeH / 2,
    );

    ctx.fillStyle = 'rgba(255,153,0,.16)';
    ctx.fill();

    ctx.fillStyle = '#FFB24D';

    ctx.fillText(
      badgeText,
      canvasW / 2,
      badgeY + badgeH / 2 + .5,
    );
  }

  drawSettingsIcon(ctx, canvasW, assets);
  drawShopIcon(ctx, canvasW, assets);

  ctx.restore();
}

function drawLevelProgress(ctx, state, canvasW) {
  if (state.boss?.active) return;

  const level =
    Math.max(1, state.level ?? 1);

  const target =
    getLevelTarget(level);

  const hits =
    Math.min(
      target,
      Math.max(0, state.levelHits ?? 0),
    );

  const ratio =
    target > 0
      ? hits / target
      : 0;

  const theme =
    getLevelTheme(level);

  const compact =
    getCanvasLayout(ctx) === 'compact';

  const compactDesktop =
    compact && isCompactDesktop(ctx);

  const u =
    compact && !compactDesktop
      ? getUiScale(ctx)
      : 1;

  const barW =
    compactDesktop ? 238 :
    compact ? 272 :
    190;

  const barH =
    compactDesktop ? 10 :
    compact ? 9.5 * Math.min(u, 1.20) :
    8;

  const x =
    (canvasW - barW) / 2;

  const y =
    compactDesktop ? 176 :
    compact ? 205 :
    145;

  ctx.save();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `bold ${
    compactDesktop ? 10.8 :
    compact ? 11.7 * u :
    9
  }px "Amazon Ember", Arial, sans-serif`;

  ctx.fillStyle = 'rgba(255,255,255,.78)';

  ctx.fillText(
    `NIVEL ${level}  •  ${hits}/${target} FLECHAS`,
    canvasW / 2,
    y - (
      compactDesktop ? 15 :
      compact ? 16 :
      13
    ),
  );

  roundedRectPath(
    ctx,
    x,
    y,
    barW,
    barH,
    barH / 2,
  );

  ctx.fillStyle = 'rgba(255,255,255,.10)';
  ctx.fill();

  if (ratio > 0) {
    roundedRectPath(
      ctx,
      x,
      y,
      Math.max(barH, barW * ratio),
      barH,
      barH / 2,
    );

    ctx.fillStyle = theme.ring;
    ctx.shadowColor = theme.ring;
    ctx.shadowBlur = 7;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function drawStability(ctx, state, canvasW) {
  if (state.phase === 'bossintro') return;

  const compact =
    getCanvasLayout(ctx) === 'compact';

  const compactDesktop =
    compact && isCompactDesktop(ctx);

  const narrowDesktop =
    isNarrowDesktopHud(ctx);

  const bossActive = Boolean(
    state.boss?.active && !state.boss?.defeated,
  );

  let overloadValue = 0;
  let ratio = 0;

  if (bossActive) {
    // En boss, la sobrecarga viene del sistema propio del jefe.
    // En móvil y escritorio angosto la dibujamos como barra vertical
    // separada del centro para no competir con la rueda.
    if (!(compact || narrowDesktop)) return;

    const bossOverload = getBossOverload(state);
    overloadValue = bossOverload.value;
    ratio = bossOverload.ratio;
  } else {
    const stability =
      getStability(state);

    overloadValue =
      Math.max(
        0,
        stability.max - stability.value,
      );

    ratio =
      stability.max > 0
        ? overloadValue / stability.max
        : 0;
  }

  const u =
    compact && !compactDesktop
      ? getUiScale(ctx)
      : 1;

  const color =
    ratio >= .75
      ? '#FF4D4D'
      : ratio >= .4
        ? '#FFD166'
        : '#72C66B';

  // Escritorio angosto/media pantalla y móvil: Sobrecarga vertical a la
  // izquierda para liberar el carril central del HUD y evitar choques.
  if (compact || narrowDesktop) {
    const desktopVertical = compactDesktop || narrowDesktop;
    const barX = desktopVertical ? 30 : 28;
    const barY = desktopVertical ? 180 : 208;
    const barW = desktopVertical ? 10 : 11;
    const barH = desktopVertical ? 132 : 126;

    ctx.save();

    roundedRectPath(
      ctx,
      barX,
      barY,
      barW,
      barH,
      barW / 2,
    );

    ctx.fillStyle = 'rgba(255,255,255,.10)';
    ctx.fill();

    if (ratio > 0) {
      const fillH = Math.max(barW, barH * ratio);

      roundedRectPath(
        ctx,
        barX,
        barY + barH - fillH,
        barW,
        fillH,
        barW / 2,
      );

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = ratio >= .75 ? 8 : 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.save();
    ctx.translate(barX - ((compactDesktop || narrowDesktop) ? 11 : 13), barY + barH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = (compactDesktop || narrowDesktop)
      ? 'bold 9.8px "Amazon Ember", Arial, sans-serif'
      : `bold ${11.2 * u}px "Amazon Ember", Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,.72)';
    ctx.fillText('SOBRECARGA', 0, 0);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = (compactDesktop || narrowDesktop)
      ? 'bold 10.2px "Amazon Ember", Arial, sans-serif'
      : `bold ${11.8 * u}px "Amazon Ember", Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(
      `${Math.round(overloadValue)}%`,
      barX + barW / 2,
      barY + barH + ((compactDesktop || narrowDesktop) ? 15 : 18),
    );

    ctx.restore();
    return;
  }

  const barW = 128;
  const barH = 5;
  const x = (canvasW - barW) / 2;
  const y = 166;

  ctx.save();
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 7px "Amazon Ember", Arial, sans-serif';

  ctx.fillStyle = 'rgba(255,255,255,.68)';
  ctx.textAlign = 'left';

  ctx.fillText(
    'SOBRECARGA',
    x,
    y - 7,
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = color;

  ctx.fillText(
    `${Math.round(overloadValue)}%`,
    x + barW,
    y - 7,
  );

  roundedRectPath(
    ctx,
    x,
    y,
    barW,
    barH,
    barH / 2,
  );

  ctx.fillStyle = 'rgba(255,255,255,.10)';
  ctx.fill();

  if (ratio > 0) {
    roundedRectPath(
      ctx,
      x,
      y,
      Math.max(barH, barW * ratio),
      barH,
      barH / 2,
    );

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = ratio >= .75 ? 8 : 4;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}
function getActiveStatus(state, type) {
  const active = state.activePowerUps ?? {};

  switch (type) {
    case 'freeze': {
      const timer = Number(active.freezeTimer);
      return timer > 0 ? `${timer.toFixed(1)}s` : '';
    }

    case 'shield':
      return Number(active.shieldCharges) > 0
        ? 'ARMADO'
        : '';

    case 'double': {
      const hits = Math.max(
        0,
        Math.floor(Number(active.doubleScoreHits) || 0),
      );
      return hits > 0 ? `${hits} GOLPES` : '';
    }

    default:
      return '';
  }
}

function getCanvasLayout(ctx) {
  return ctx.canvas.dataset.layout === 'compact' ? 'compact' : 'desktop';
}

function getUiScale(ctx) {
  return Math.max(
    1,
    Math.min(1.40, Number(ctx?.canvas?.dataset?.uiScale) || 1),
  );
}

function getControlScale(ctx) {
  return Math.max(
    1,
    Math.min(1.18, Number(ctx?.canvas?.dataset?.controlScale) || 1),
  );
}

function isCompactDesktop(ctx) {
  return (
    getCanvasLayout(ctx) === 'compact' &&
    ctx?.canvas?.dataset?.compactDesktop === '1'
  );
}

function isNarrowDesktopHud(ctx) {
  return (
    getCanvasLayout(ctx) === 'desktop' &&
    ctx?.canvas?.dataset?.inputMode === 'pointer' &&
    ctx?.canvas?.dataset?.viewportMode === 'standard' &&
    !isR61WideHud(ctx)
  );
}

function getCompactActionHint(state) {
  if (state.boss?.active && !state.boss.defeated) {
    const phase = getBossPhase(state);
    return state.powerCore?.active
      ? `${phase?.label ?? 'CAPA'} • NÚCLEO = RECOGER`
      : `${phase?.label ?? 'CAPA'} • FALLOS = SOBRECARGA`;
  }

  if (state.powerCore?.active) {
    return 'CRUZA EL NÚCLEO • Y ANCLA';
  }

  if (Number(state.activePowerUps?.freezeTimer) > 0) {
    return 'CONGELAR • DISPAROS APILADOS';
  }

  return 'TOCA / ESPACIO PARA DISPARAR';
}

function drawPowerUpIconImage(ctx, assets, type, cx, cy, size) {
  const img = assets?.powerUpIcons?.[type];
  if (isImageReady(img)) {
    ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
    return true;
  }

  // Fallback geométrico breve mientras el SVG termina de cargar.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = POWER_UP_CONFIG.colors[type] ?? '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'freeze') {
    ctx.beginPath();
    ctx.moveTo(0, -size * .36); ctx.lineTo(0, size * .36);
    ctx.moveTo(-size * .31, -size * .18); ctx.lineTo(size * .31, size * .18);
    ctx.moveTo(-size * .31, size * .18); ctx.lineTo(size * .31, -size * .18);
    ctx.stroke();
  } else if (type === 'shield') {
    ctx.beginPath();
    ctx.moveTo(0, -size * .36);
    ctx.lineTo(size * .28, -size * .23);
    ctx.lineTo(size * .24, size * .14);
    ctx.quadraticCurveTo(0, size * .38, 0, size * .38);
    ctx.quadraticCurveTo(-size * .24, size * .14, -size * .24, size * .14);
    ctx.lineTo(-size * .28, -size * .23);
    ctx.closePath();
    ctx.stroke();
  } else if (type === 'double') {
    ctx.beginPath();
    ctx.moveTo(-size * .30, -size * .14); ctx.lineTo(size * .18, -size * .14);
    ctx.lineTo(size * .02, -size * .30);
    ctx.moveTo(size * .30, size * .14); ctx.lineTo(-size * .18, size * .14);
    ctx.lineTo(-size * .02, size * .30);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, size * .27, -.2, Math.PI * 1.55);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * .24, -size * .10);
    ctx.lineTo(size * .31, size * .05);
    ctx.lineTo(size * .14, size * .04);
    ctx.stroke();
  }
  ctx.restore();
  return false;
}

function drawPowerUpDock(ctx, state, canvasW, canvasH, assets) {
  if (state.phase !== 'playing') return;

  const layout = getCanvasLayout(ctx);
  const compact = layout === 'compact';
  const compactDesktop = compact && isCompactDesktop(ctx);
  const uiScale = compact && !compactDesktop ? getUiScale(ctx) : 1;
  const slots = getPowerUpSlotRects(canvasW, layout, canvasH);
  const inventory = state.powerUpInventory ?? {};
  const baseChargeRect = getPowerUpChargeRect(canvasW, layout, canvasH);
  const chargeRect = compactDesktop
    ? { ...baseChargeRect, height: 52 }
    : baseChargeRect;
  const hovered = state.hoveredPowerUpSlot ?? null;

  ctx.save();
  ctx.textBaseline = 'middle';

  if (!compact) {
    ctx.textAlign = 'center';
    ctx.font = `bold ${compactDesktop ? 10.4 : 10.2 * uiScale}px "Amazon Ember", Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,.52)';
    ctx.fillText(
      'POTENCIADORES • CLIC / 1–4',
      slots[0].x + slots[0].width / 2,
      slots[0].y - 13,
    );
  }

  for (const slot of slots) {
    const type = slot.type;
    const color = POWER_UP_CONFIG.colors[type] ?? '#FFFFFF';
    const name = POWER_UP_CONFIG.names[type] ?? type.toUpperCase();
    const shortcut = POWER_UP_CONFIG.shortcuts[type] ?? '?';
    const count = Math.max(0, Math.floor(Number(inventory[type]) || 0));
    const status = getActiveStatus(state, type);
    const activatable = canActivateStoredPowerUp(state, type);
    const occupied = count > 0 || Boolean(status);
    const isHovered = hovered === type;
    const isPressed = state.pressedPowerUpSlot === type;
    const capacity = getPowerUpInventoryCap(state, type);

    ctx.save();
    ctx.globalAlpha = occupied ? 1 : 0.58;

    if (compact) {
      const cx = slot.cx;
      const cy = slot.cy;
      const radius = slot.radius;
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 260);

      // Ornamento exterior: conserva el look futurista, pero en arcos
      // separados para que se lea como decoración y no como un segundo botón.
      if (activatable || isHovered || isPressed || status) {
        const ornamentR = radius + 6;
        const arcOffset = Date.now() / 1800;
        ctx.strokeStyle = `${color}${activatable ? '7A' : '48'}`;
        ctx.lineWidth = isPressed ? 3.1 : (activatable ? 2.6 : 1.8);
        ctx.lineCap = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = isPressed ? 18 : (activatable ? 11 + pulse * 5 : 7);

        for (let i = 0; i < 3; i++) {
          const start = arcOffset + i * (Math.PI * 2 / 3);
          ctx.beginPath();
          ctx.arc(cx, cy, ornamentR, start, start + 0.72);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Tres pequeños nodos orbitantes rematan el adorno sin duplicar la
        // silueta circular principal.
        ctx.fillStyle = `${color}${activatable ? 'B8' : '70'}`;
        for (let i = 0; i < 3; i++) {
          const a = arcOffset + i * (Math.PI * 2 / 3) + 0.84;
          ctx.beginPath();
          ctx.arc(
            cx + Math.cos(a) * ornamentR,
            cy + Math.sin(a) * ornamentR,
            1.7,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }

      const gradient = ctx.createRadialGradient(
        cx - radius * 0.30,
        cy - radius * 0.35,
        radius * 0.12,
        cx,
        cy,
        radius,
      );
      gradient.addColorStop(0, activatable ? `${color}24` : 'rgba(31,42,56,.98)');
      gradient.addColorStop(0.58, 'rgba(17,24,34,.985)');
      gradient.addColorStop(1, 'rgba(9,14,21,.995)');

      ctx.beginPath();
      ctx.arc(cx, cy, isPressed ? radius - 1 : radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.shadowColor = color;
      ctx.shadowBlur = isPressed ? 18 : (isHovered ? 12 : 0);
      ctx.fill();
      ctx.strokeStyle = occupied ? color : 'rgba(255,255,255,.18)';
      ctx.lineWidth = isPressed ? 3.1 : (activatable || isHovered ? 2.6 : 1.5);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Aro interno para mejorar lectura del botón sobre fondos complejos.
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 5, 0, Math.PI * 2);
      ctx.strokeStyle = occupied ? `${color}35` : 'rgba(255,255,255,.055)';
      ctx.lineWidth = compactDesktop ? 1.25 : 1;
      ctx.stroke();

      // Número de atajo: pequeña burbuja arriba a la izquierda.
      const badgeR = compactDesktop ? 14.5 : 14;
      const shortcutX = cx - radius * 0.66;
      const badgeY = cy - radius * 0.66;
      ctx.beginPath();
      ctx.arc(shortcutX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = occupied ? color : 'rgba(255,255,255,.13)';
      ctx.fill();
      ctx.font = 'bold 10px "Amazon Ember", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = occupied ? '#0D1117' : 'rgba(255,255,255,.50)';
      ctx.fillText(shortcut, shortcutX, badgeY + 0.5);

      // Cantidad disponible: burbuja opuesta, siempre contenida en el círculo.
      const countX = cx + radius * 0.66;
      ctx.beginPath();
      ctx.arc(countX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = count > 0
        ? 'rgba(7,11,18,.96)'
        : 'rgba(14,18,26,.94)';
      ctx.fill();
      ctx.strokeStyle = count > 0
        ? '#FFFFFF'
        : 'rgba(255,255,255,.16)';
      ctx.lineWidth = compactDesktop ? 1.35 : 1.25;
      ctx.stroke();
      ctx.font = compactDesktop
        ? 'bold 8.0px "Amazon Ember", Arial, sans-serif'
        : 'bold 8.4px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = count > 0 ? '#FFFFFF' : 'rgba(255,255,255,.32)';
      ctx.fillText(`${count}/${capacity}`, countX, badgeY + 0.5);

      // Centro: icono SVG propio del potenciador.
      ctx.save();
      ctx.globalAlpha *= occupied ? 1 : .62;
      drawPowerUpIconImage(ctx, assets, type, cx, cy - 7.5, 40);
      ctx.restore();

      let mobileStatus = status;
      if (!mobileStatus) {
        mobileStatus = count > 0 ? 'LISTO' : 'VACÍO';
      }
      ctx.font = 'bold 10.8px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = status
        ? color
        : count > 0
          ? 'rgba(255,255,255,.72)'
          : 'rgba(255,255,255,.30)';
      ctx.fillText(mobileStatus, cx, cy + 18);
    } else {
      roundedRectPath(ctx, slot.x, slot.y, slot.width, slot.height, 12);
      ctx.fillStyle = isPressed
        ? `${color}1F`
        : activatable
          ? 'rgba(13,17,23,.985)'
          : isHovered
            ? `${color}12`
            : 'rgba(13,17,23,.92)';
      ctx.shadowColor = color;
      ctx.shadowBlur = isPressed ? 18 : (isHovered ? 12 : 0);
      ctx.fill();

      ctx.strokeStyle = occupied ? color : 'rgba(255,255,255,.14)';
      ctx.lineWidth = isPressed ? 2.8 : (activatable || isHovered ? 2.1 : 1.1);
      ctx.shadowBlur = isPressed ? 18 : (activatable || isHovered ? 10 : 0);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(slot.x + 18, slot.y + 19, 11, 0, Math.PI * 2);
      ctx.fillStyle = occupied ? `${color}D0` : 'rgba(255,255,255,.08)';
      ctx.fill();

      ctx.font = 'bold 10px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = '#0E1824';
      ctx.textAlign = 'center';
      ctx.fillText(shortcut, slot.x + 18, slot.y + 19.5);

      // Icono SVG propio del potenciador; no depende de abreviaturas textuales.
      ctx.save();
      ctx.globalAlpha *= occupied ? 1 : .62;
      drawPowerUpIconImage(ctx, assets, type, slot.x + 47, slot.y + 15, 19);
      ctx.restore();

      ctx.textAlign = 'left';
      ctx.font = 'bold 8.2px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = occupied ? '#FFFFFF' : 'rgba(255,255,255,.46)';
      ctx.fillText(name, slot.x + 35, slot.y + 30);

      let subtitle = status;
      if (!subtitle && count > 0) {
        subtitle =
          type === 'cleanup' && !(state.anchoredProjectiles?.length > 0)
            ? 'ESPERA OBJETIVO'
             : 'LISTO';
      }
      if (!subtitle) subtitle = 'VACÍO';

      ctx.font = `bold ${compactDesktop ? 10.2 : 9.6 * uiScale}px "Amazon Ember", Arial, sans-serif`;
      ctx.fillStyle = status ? color : 'rgba(255,255,255,.54)';
      ctx.fillText(subtitle, slot.x + 35, slot.y + 43);

      const badgeW = 32;
      const badgeH = 18;
      const badgeX = slot.x + slot.width - badgeW - 7;
      const badgeY = slot.y + 8;

      roundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 9);
      ctx.fillStyle = count > 0 ? `${color}26` : 'rgba(255,255,255,.06)';
      ctx.fill();
      ctx.strokeStyle = count > 0 ? `${color}AA` : 'rgba(255,255,255,.10)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = count > 0 ? '#FFFFFF' : 'rgba(255,255,255,.35)';
      ctx.fillText(`${count}/${capacity}`, badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5);
    }

    ctx.restore();
  }

  const charge = Math.min(
    POWER_UP_CONFIG.chargeMax,
    Math.max(0, Number(state.powerUpCharge) || 0),
  );
  const ratio = charge / POWER_UP_CONFIG.chargeMax;
  const coreActive = Boolean(state.powerCore?.active);
  const coreType = state.powerCore?.currentType;
  const coreColor = coreType
    ? POWER_UP_CONFIG.colors[coreType] ?? '#FF9900'
    : '#FF9900';

  roundedRectPath(
    ctx,
    chargeRect.x,
    chargeRect.y,
    chargeRect.width,
    chargeRect.height,
    compact ? 15 : 12,
  );
  ctx.fillStyle = compact ? 'rgba(9,14,21,.985)' : 'rgba(13,17,23,.94)';
  ctx.fill();
  ctx.strokeStyle = coreActive ? `${coreColor}AA` : 'rgba(255,153,0,.34)';
  ctx.lineWidth = compact ? 1.5 : 1.2;
  ctx.stroke();

  if (compact) {
    // HUD móvil: texto arriba y barra abajo. Nunca dibujamos texto encima de
    // la pista vacía para evitar recortes en el estado activo.
    const pad = 12;
    const topY = compactDesktop ? chargeRect.y + 11 : chargeRect.y + 10;
    const hintY = compactDesktop ? chargeRect.y + 27 : chargeRect.y + 33;
    const barX = chargeRect.x + pad;
    const barW = chargeRect.width - pad * 2;
    const barY = compactDesktop ? chargeRect.y + 40 : chargeRect.y + chargeRect.height - 12;
    const barH = 7;
    const coreName = coreType ? (POWER_UP_CONFIG.names[coreType] ?? 'PODER') : '';

    ctx.save();
    roundedRectPath(ctx, chargeRect.x + 2, chargeRect.y + 2, chargeRect.width - 4, chargeRect.height - 4, 12);
    ctx.clip();

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = `bold ${compactDesktop ? 13.2 : 12.6 * uiScale}px "Amazon Ember", Arial, sans-serif`;
    ctx.fillStyle = coreActive ? coreColor : '#FFB24D';
    ctx.fillText(
      state.level < POWER_UP_CONFIG.minLevel
        ? 'PODER BLOQUEADO'
        : coreActive
          ? `NÚCLEO • ${coreName}`
          : 'PODER',
      chargeRect.x + pad,
      topY,
    );

    if (coreActive && coreType) {
      ctx.save();
      ctx.globalAlpha = .96;
      drawPowerUpIconImage(
        ctx,
        assets,
        coreType,
        chargeRect.x + chargeRect.width - pad - 2,
        topY,
        18,
      );
      ctx.restore();
    } else {
      ctx.textAlign = 'right';
      ctx.font = 'bold 10px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.78)';
      ctx.fillText(
        state.level < POWER_UP_CONFIG.minLevel
          ? `LV ${POWER_UP_CONFIG.minLevel}`
          : `${Math.round(charge)}%`,
        chargeRect.x + chargeRect.width - pad,
        topY,
      );
    }

    // La instrucción contextual vive DENTRO del panel, entre etiqueta y barra.
    // Así nunca compite con el borde inferior del canvas ni queda bajo la pista.
    ctx.textAlign = 'center';
    if (compactDesktop) {
      ctx.font = 'bold 12.4px "Amazon Ember", Arial, sans-serif';
    } else {
      ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
    }
    ctx.fillStyle = coreActive ? `${coreColor}C8` : 'rgba(255,255,255,.52)';
    ctx.fillText(
      getCompactActionHint(state),
      chargeRect.x + chargeRect.width / 2,
      hintY,
    );

    roundedRectPath(ctx, barX, barY, barW, barH, 3.5);
    ctx.fillStyle = 'rgba(255,255,255,.09)';
    ctx.fill();
    if (ratio > 0) {
      roundedRectPath(ctx, barX, barY, Math.max(barH, barW * ratio), barH, 3.5);
      ctx.fillStyle = coreActive ? coreColor : '#FF9900';
      ctx.shadowColor = coreActive ? coreColor : '#FF9900';
      ctx.shadowBlur = ratio >= 1 || coreActive ? 8 : 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  } else {
    ctx.textAlign = 'left';
    ctx.font = 'bold 10px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = '#FFB24D';
    ctx.fillText('CARGA DE PODER', chargeRect.x + 9, chargeRect.y + 15);

    ctx.textAlign = 'right';
    ctx.font = `bold ${compactDesktop ? 9.2 : 9.2 * uiScale}px "Amazon Ember", Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,.66)';
    ctx.fillText(
      state.level < POWER_UP_CONFIG.minLevel
        ? `LV ${POWER_UP_CONFIG.minLevel}`
        : `${Math.round(charge)}%`,
      chargeRect.x + chargeRect.width - 9,
      chargeRect.y + 15,
    );

    const barX = chargeRect.x + 9;
    const barY = chargeRect.y + 26;
    const barW = chargeRect.width - 18;
    const barH = 10;

    roundedRectPath(ctx, barX, barY, barW, barH, 5);
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fill();
    if (ratio > 0) {
      roundedRectPath(ctx, barX, barY, Math.max(barH, barW * ratio), barH, 5);
      ctx.fillStyle = '#FF9900';
      ctx.shadowColor = '#FF9900';
      ctx.shadowBlur = ratio >= 1 ? 10 : 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.textAlign = 'left';
    ctx.font = `bold ${compactDesktop ? 8.0 : 9.2 * uiScale}px "Amazon Ember", Arial, sans-serif`;
    ctx.fillStyle = coreActive ? coreColor : 'rgba(255,255,255,.54)';
    ctx.save();
    roundedRectPath(ctx, chargeRect.x + 7, chargeRect.y + 38, chargeRect.width - 14, 13, 5);
    ctx.clip();
    ctx.fillText(
      state.level < POWER_UP_CONFIG.minLevel
        ? 'BLOQUEADO'
        : coreActive
          ? `${POWER_UP_CONFIG.names[coreType] ?? 'PODER'} ACTIVO`
          : charge >= POWER_UP_CONFIG.chargeMax
            ? 'ESPERANDO ESPACIO'
            : 'JUEGA BIEN PARA CARGAR',
      chargeRect.x + 9,
      chargeRect.y + 46,
    );
    ctx.restore();
  }

  ctx.restore();
}


function drawR61PowerChargeFix(ctx, state, canvasW, canvasH) {
  if (state.phase !== 'playing') return;
  if (getCanvasLayout(ctx) === 'compact') return;

  const r = getPowerUpChargeRect(canvasW, 'desktop', canvasH);
  const charge = Math.min(
    POWER_UP_CONFIG.chargeMax,
    Math.max(0, Number(state.powerUpCharge) || 0),
  );
  const ratio = charge / POWER_UP_CONFIG.chargeMax;

  ctx.save();

  roundedRectPath(ctx, r.x, r.y, r.width, r.height, 12);
  ctx.fillStyle = 'rgba(13,17,23,.995)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,153,0,.44)';
  ctx.lineWidth = 1.3;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 9.5px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFB24D';
  ctx.fillText('CARGA DE PODER', r.x + r.width / 2, r.y + 14);

  ctx.font = 'bold 10px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.84)';
  ctx.fillText(
    state.level < POWER_UP_CONFIG.minLevel
      ? `LV ${POWER_UP_CONFIG.minLevel}`
      : `${Math.round(charge)}%`,
    r.x + r.width / 2,
    r.y + 31,
  );

  const pad = 10;
  const bx = r.x + pad;
  const by = r.y + 43;
  const bw = r.width - pad * 2;
  const bh = 9;

  roundedRectPath(ctx, bx, by, bw, bh, 4.5);
  ctx.fillStyle = 'rgba(255,255,255,.09)';
  ctx.fill();

  if (ratio > 0) {
    roundedRectPath(ctx, bx, by, Math.max(bh, bw * ratio), bh, 4.5);
    ctx.fillStyle = '#FF9900';
    ctx.shadowColor = '#FF9900';
    ctx.shadowBlur = ratio >= 1 ? 9 : 5;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.font = 'bold 7.5px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.fillText(
    charge >= POWER_UP_CONFIG.chargeMax
      ? 'ESPERANDO ESPACIO'
      : 'JUEGA BIEN PARA CARGAR',
    r.x + r.width / 2,
    r.y + r.height - 9,
  );

  ctx.restore();
}

function drawComboBadge(ctx, state, canvasW) {
  if (!state?.combo || state.combo < 2) return;

  const compact = getCanvasLayout(ctx) === 'compact';
  const compactDesktop = compact && isCompactDesktop(ctx);
  const u = compact && !compactDesktop ? getUiScale(ctx) : 1;

  const label = `COMBO ×${state.combo}`;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `bold ${
    compactDesktop ? 10.2 :
    compact ? 10.4 * u :
    9
  }px "Amazon Ember", Arial, sans-serif`;

  const textW = ctx.measureText(label).width;

  const badgeH =
    compactDesktop ? 20 :
    compact ? 19 * u :
    16;

  const badgeW = textW + (
    compactDesktop ? 18 :
    compact ? 18 * u :
    16
  );

  const x =
    compactDesktop ? 92 :
    compact ? 90 * u :
    74;

  const y =
    compactDesktop ? 142 :
    compact ? 118 :
    93;

  roundedRectPath(
    ctx,
    x - badgeW / 2,
    y - badgeH / 2,
    badgeW,
    badgeH,
    badgeH / 2,
  );

  ctx.fillStyle = 'rgba(36,30,18,.92)';
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,153,0,.58)';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  ctx.fillStyle = '#FFB24D';
  ctx.fillText(label, x, y + .5);

  ctx.restore();
}


function getFooterLayout(ctx, canvasH) {
  const compact = getCanvasLayout(ctx) === 'compact';
  if (compact) {
    return {
      compact,
      hintY: canvasH - 32,
      versionY: canvasH - 12,
      versionX: null,
    };
  }

  return {
    compact,
    hintY: canvasH - 24,
    versionY: canvasH - 10,
    versionX: 12,
  };
}

function drawBottomHint(ctx, state, canvasW, canvasH) {
  if (state.phase !== 'playing' || state.flyingProjectile) return;

  const footer = getFooterLayout(ctx, canvasH);
  const compact = footer.compact;
  if (compact) return; // En móvil la ayuda ya vive dentro del panel Power/Core.
  let text = compact
    ? 'TOCA / ESPACIO PARA DISPARAR'
    : 'CLIC/ESPACIO: DISPARAR  •  MANTÉN: CARGAR SPLIT  •  POTENCIADORES 1–4';
  let fill = 'rgba(255,255,255,.43)';

  if (state.boss?.active && !state.boss.defeated) {
    const phase = getBossPhase(state);
    const bossCoreReady = Boolean(state.powerCore?.active);
    text = compact
      ? bossCoreReady
        ? `ROMPE ${phase?.label ?? 'CAPA'} • NÚCLEO = DISPARO DE RECOGIDA`
        : `ROMPE ${phase?.label ?? 'CAPA'} • FALLOS = SOBRECARGA`
      : bossCoreReady
        ? `JEFE: ROMPE ${phase?.label ?? 'CAPA'} • NÚCLEO DE PODER = RECOGIDA INSTANTÁNEA • POTENCIADORES 1–4`
        : `JEFE: ROMPE ${phase?.label ?? 'CAPA'} • LOS FALLOS CARGAN SOBRECARGA • POTENCIADORES 1–4`;
    fill = state.boss.accent ?? '#FFD166';
  } else if (state.powerCore?.active) {
    text = compact
      ? 'CRUZA EL NÚCLEO DE PODER • Y ANCLA'
      : 'NÚCLEO DE PODER: ATRAVIÉSALO Y ANCLA  •  POTENCIADORES: CLIC O 1–4';
    fill = 'rgba(255,184,77,.72)';
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${compact ? 11 : 11}px "Amazon Ember", Arial, sans-serif`;
  ctx.fillStyle = fill;
  ctx.fillText(text, canvasW / 2, footer.hintY);
  ctx.restore();
}

function drawVersion(ctx, canvasW, canvasH) {
  const footer =
    getFooterLayout(ctx, canvasH);

  const compact =
    footer.compact;

  const compactDesktop =
    compact && isCompactDesktop(ctx);

  const u =
    compact && !compactDesktop
      ? getUiScale(ctx)
      : 1;

  ctx.save();
  ctx.textBaseline = 'middle';

  ctx.font = `${
    compactDesktop ? 8.8 :
    compact ? 10.2 * u :
    8.7
  }px "Amazon Ember", Arial, sans-serif`;

  ctx.fillStyle =
    compact && !compactDesktop
      ? 'rgba(255,255,255,.48)'
      : 'rgba(255,255,255,.34)';

  if (compact) {
    ctx.textAlign = 'center';

    ctx.fillText(
      `v${APP_VERSION} - ${APP_CODENAME}`,
      canvasW / 2,
      footer.versionY,
    );
  } else {
    ctx.textAlign = 'left';

    ctx.fillText(
      `v${APP_VERSION} - ${APP_CODENAME}`,
      footer.versionX,
      footer.versionY,
    );
  }

  ctx.restore();
}

export function drawGameOverFlash(ctx, flashTimer) {
  if (!(flashTimer > 0)) return;
  const alpha = Math.min(0.22, flashTimer * 0.88);
  ctx.save();
  ctx.fillStyle = `rgba(255,70,70,${alpha})`;
  ctx.fillRect(0, 0, getLogicalCanvasWidth(ctx), getLogicalCanvasHeight(ctx));
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Power Core — recompensa orbitante que debe atravesarse con un tiro válido.
// ---------------------------------------------------------------------------
function drawCompactCoreReadableLabel(ctx, state) {
  if (
    getCanvasLayout(ctx) !== 'compact' ||
    isCompactDesktop(ctx) ||
    !state?.powerCore?.active
  ) {
    return;
  }

  // En móvil ya mostramos esta información en el panel inferior;
  // evitamos duplicarla arriba del núcleo para que no parpadee.
  return;

  const position =
    getPowerCorePosition(state);

  const ce =
    state.centralElement;

  if (!position || !ce) return;

  const u =
    getUiScale(ctx);

  const type =
    position.type;

  const color =
    POWER_UP_CONFIG.colors[type] ??
    '#FF9900';

  const name =
    POWER_UP_CONFIG.names[type] ??
    'PODER';

  const title =
    `NÚCLEO • ${name}`;

  const hint =
    'CRUZA EL NÚCLEO • Y ANCLA';

  const cx = ce.x;

  const y =
    ce.y - ce.radius - 64;

  ctx.save();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const titleSize =
    10.5 * u;

  const hintSize =
    8.6 * u;

  ctx.font =
    `bold ${titleSize}px "Amazon Ember", Arial, sans-serif`;

  const titleW =
    ctx.measureText(title).width;

  ctx.font =
    `bold ${hintSize}px "Amazon Ember", Arial, sans-serif`;

  const hintW =
    ctx.measureText(hint).width;

  const w =
    Math.min(
      350,
      Math.max(titleW, hintW) + 22 * u,
    );

  const h =
    36 * u;

  const x =
    cx - w / 2;

  roundedRectPath(
    ctx,
    x,
    y,
    w,
    h,
    12,
  );

  ctx.fillStyle =
    'rgba(8,13,20,.93)';

  ctx.fill();

  ctx.strokeStyle =
    `${color}B8`;

  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.font =
    `bold ${titleSize}px "Amazon Ember", Arial, sans-serif`;

  ctx.fillStyle = color;

  ctx.fillText(
    title,
    cx,
    y + 11.5 * u,
  );

  ctx.font =
    `bold ${hintSize}px "Amazon Ember", Arial, sans-serif`;

  ctx.fillStyle =
    'rgba(255,255,255,.78)';

  ctx.fillText(
    hint,
    cx,
    y + 27 * u,
  );

  ctx.restore();
}

function drawPowerCore(ctx, state, assets) {
  const position = getPowerCorePosition(state);
  if (!position) return;

  const type = position.type;
  const color = POWER_UP_CONFIG.colors[type] ?? '#FFFFFF';
  const name = POWER_UP_CONFIG.names[type] ?? 'POWER';
  const pulse = state.powerCore?.pulse ?? 0;
  const pulseScale = 1 + Math.sin(pulse * 7) * 0.08;

  ctx.save();

  // Órbita guía tenue.
  ctx.beginPath();
  ctx.arc(
    state.centralElement.x,
    state.centralElement.y,
    position.orbitRadius,
    0,
    Math.PI * 2,
  );
  ctx.setLineDash([5, 8]);
  ctx.strokeStyle = `${color}${position.bossPickupMode ? '48' : '28'}`;
  ctx.lineWidth = position.bossPickupMode ? 1.5 : 1;
  ctx.stroke();
  ctx.setLineDash([]);

  // Halo exterior.
  ctx.beginPath();
  ctx.arc(
    position.x,
    position.y,
    (position.radius + 8) * pulseScale,
    0,
    Math.PI * 2,
  );
  ctx.strokeStyle = `${color}70`;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Núcleo.
  ctx.beginPath();
  ctx.arc(
    position.x,
    position.y,
    position.radius * pulseScale,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = 'rgba(13,17,23,.94)';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Firma visual central: el mismo SVG que usa el Dock y la tienda.
  ctx.beginPath();
  ctx.arc(
    position.x,
    position.y,
    Math.max(4, position.radius * 0.30),
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = `${color}28`;
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = .98;
  drawPowerUpIconImage(
    ctx,
    assets,
    type,
    position.x,
    position.y,
    Math.max(20, position.radius * 1.15),
  );
  ctx.restore();



  ctx.restore();
}

// ---------------------------------------------------------------------------
// Bosses — siluetas distintas con hitbox física circular sin modificar.
// ---------------------------------------------------------------------------
function drawRegularPolygonPath(ctx, sides, radius, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rotation + (Math.PI * 2 * i) / sides - Math.PI / 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawBossStarPath(ctx, radius, innerRadius, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : innerRadius;
    const a = rotation + (Math.PI * i) / 5 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawBossProgress(ctx, state, canvasW) {
  const boss = state.boss;
  if (!boss?.active) return;

  const phase = getBossPhase(state);
  const progress = getBossPhaseProgress(state);
  const max = Math.max(1, boss.maxHealth || 1);
  const healthRatio = Math.max(0, Math.min(1, (boss.health ?? max) / max));
  const compact = getCanvasLayout(ctx) === 'compact';
  const compactDesktop = compact && isCompactDesktop(ctx);
  const mobileCompact = compact && !compactDesktop;
  const narrowDesktop = isNarrowDesktopHud(ctx);
  const barW = compactDesktop ? 244 : mobileCompact ? 252 : 220;
  const barH = compactDesktop ? 10 : mobileCompact ? 10 : 9;
  const x = (canvasW - barW) / 2;
  const y = compactDesktop ? 176 : mobileCompact ? 176 : 145;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = compactDesktop
    ? 'bold 11px "Amazon Ember", Arial, sans-serif'
    : mobileCompact
      ? 'bold 10.5px "Amazon Ember", Arial, sans-serif'
      : 'bold 9px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = boss.accent ?? '#FFD166';
  ctx.fillText(
    `${boss.name} • CAPA ${boss.phaseIndex + 1}/3 • ${phase?.label ?? 'FASE'} ${progress.hits}/${progress.target}`,
    canvasW / 2,
    compactDesktop ? (y - 18) : mobileCompact ? (y - 17) : (y - 13),
  );

  roundedRectPath(ctx, x, y, barW, barH, barH / 2);
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.fill();

  if (healthRatio > 0) {
    roundedRectPath(ctx, x, y, Math.max(barH, barW * healthRatio), barH, barH / 2);
    ctx.fillStyle = boss.color ?? '#FF6B35';
    ctx.shadowColor = boss.color ?? '#FF6B35';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // La Sobrecarga ya tiene un lugar dedicado según el layout:
  // - móvil/compacto escritorio: barra vertical izquierda
  // - escritorio standard/media pantalla: barra vertical izquierda
  // - HUD ancho/fullscreen: panel lateral
  // Evitamos una segunda barra horizontal duplicada.
  if (compact || narrowDesktop || isR61WideHud(ctx)) {
    ctx.restore();
    return;
  }

  const overload = getBossOverload(state);
  const overloadY = y + 24;
  const overloadH = 5;
  const overloadColor = overload.ratio >= 0.75
    ? '#FF4D4D'
    : overload.ratio >= 0.5
      ? '#FF6B35'
      : '#FFB24D';

  ctx.font = 'bold 7px "Amazon Ember", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,.50)';
  ctx.fillText('SOBRECARGA', x, overloadY - 6);
  ctx.textAlign = 'right';
  ctx.fillStyle = overloadColor;
  ctx.fillText(`${Math.round(overload.value)}%`, x + barW, overloadY - 6);

  roundedRectPath(ctx, x, overloadY, barW, overloadH, overloadH / 2);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  ctx.fill();

  if (overload.ratio > 0) {
    roundedRectPath(
      ctx,
      x,
      overloadY,
      Math.max(overloadH, barW * overload.ratio),
      overloadH,
      overloadH / 2,
    );
    ctx.fillStyle = overloadColor;
    ctx.shadowColor = overloadColor;
    ctx.shadowBlur = overload.ratio >= 0.75 ? 8 : 4;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function traceBossShape(ctx, shape, radius, rotation = 0) {
  if (shape === 'triangle') {
    drawRegularPolygonPath(ctx, 3, radius, rotation);
  } else if (shape === 'square') {
    drawRegularPolygonPath(ctx, 4, radius, rotation + Math.PI / 4);
  } else if (shape === 'pentagon') {
    drawRegularPolygonPath(ctx, 5, radius, rotation);
  } else if (shape === 'hexagon') {
    drawRegularPolygonPath(ctx, 6, radius, rotation + Math.PI / 6);
  } else if (shape === 'star') {
    drawBossStarPath(ctx, radius, radius * 0.48, rotation);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
  }
}

function drawBossLayerTarget(ctx, target, boss, phase, index) {
  const pulse = 1 + Math.sin(performance.now() / 150 + index * 0.8) * 0.07;
  const size = target.radius * pulse;

  ctx.save();
  ctx.translate(target.x, target.y);
  ctx.rotate(
    (boss.bodyAngle ?? 0) * (index % 2 === 0 ? 1 : -1) +
    performance.now() / 1800,
  );

  ctx.shadowColor = boss.accent;
  ctx.shadowBlur = phase.id === 'core' ? 20 : 12;

  if (phase.id === 'core') {
    ctx.beginPath();
    ctx.arc(0, 0, size + 8, 0, Math.PI * 2);
    ctx.fillStyle = `${boss.accent}20`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fillStyle = `${boss.accent}66`;
    ctx.fill();
    ctx.strokeStyle = boss.accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, Math.max(5, size * 0.36), 0, Math.PI * 2);
    ctx.fillStyle = boss.accent;
    ctx.fill();
  } else {
    traceBossShape(ctx, boss.shape, size, 0);
    ctx.fillStyle = 'rgba(13,17,23,.90)';
    ctx.fill();
    ctx.strokeStyle = boss.accent;
    ctx.lineWidth = phase.id === 'armor' ? 2.8 : 2.3;
    ctx.stroke();

    traceBossShape(ctx, boss.shape, size * 0.44, Math.PI / 9);
    ctx.fillStyle = `${boss.color}8A`;
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

function getBossSurfaceScale(phase) {
  if (phase?.id === 'armor') return 1;
  if (phase?.id === 'exposed') return 0.78;
  return 0.60;
}

function drawBoss(ctx, state, progression) {
  const boss = state.boss;
  const ce = state.centralElement;
  if (!boss?.active) return;

  const phase = getBossPhase(state);
  const targets = getBossLayerTargets(state);
  const tier = progression?.tier ?? 1;
  const r = ce.radius;

  ctx.save();

  if (isBossPhaseTransitionActive(state)) {
    const fx = getBossPhaseBreak(state);
    const duration = Math.max(0.001, Number(fx?.duration) || BOSS_CONFIG.phaseTransitionDuration);
    const reveal = 1 - Math.max(0, Math.min(1, Number(fx?.timer) / duration));
    ctx.globalAlpha = 0.18 + 0.82 * Math.min(1, reveal * 1.55);
  }

  // Órbita guía de la capa activa. ARMOR y EXPOSED giran alrededor del boss.
  if (phase?.id !== 'core' && targets.length) {
    const orbitRadius = targets[0].orbitRadius ?? r * 1.4;
    ctx.beginPath();
    ctx.arc(ce.x, ce.y, orbitRadius, 0, Math.PI * 2);
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = `${boss.accent}28`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    for (const target of targets) {
      ctx.beginPath();
      ctx.moveTo(ce.x, ce.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = `${boss.color}12`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Cuerpo central: se "desviste" conforme desaparecen las capas.
  ctx.translate(ce.x, ce.y);
  ctx.rotate(boss.bodyAngle ?? ce.angle * 0.5);

  // La superficie oscura visible también se rompe por capas. La hitbox física
  // NO cambia: collision.js conserva exactamente el radio histórico.
  const surfaceR = r * getBossSurfaceScale(phase);
  ctx.beginPath();
  ctx.arc(0, 0, surfaceR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10,15,24,.94)';
  ctx.fill();
  ctx.strokeStyle = `${boss.color}38`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const bodyScale = phase?.id === 'armor'
    ? 0.86
    : phase?.id === 'exposed'
      ? 0.69
      : 0.52;
  const bodyR = r * bodyScale;

  traceBossShape(ctx, boss.shape, bodyR, 0);
  ctx.fillStyle = phase?.id === 'core'
    ? 'rgba(10,15,24,.52)'
    : `${boss.color}${phase?.id === 'armor' ? '26' : '18'}`;
  ctx.fill();
  ctx.strokeStyle = boss.color;
  ctx.lineWidth = phase?.id === 'armor' ? 4 : phase?.id === 'exposed' ? 3 : 2;
  ctx.shadowColor = boss.color;
  ctx.shadowBlur = 7 + tier * 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (phase?.id === 'armor') {
    // Armadura exterior: dos bordes que desaparecen por completo en fase 2.
    traceBossShape(ctx, boss.shape, r * 0.95, Math.PI / 18);
    ctx.strokeStyle = `${boss.accent}80`;
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (phase?.id === 'exposed') {
    // Segunda capa: reactor intermedio, visualmente más desnudo.
    traceBossShape(ctx, boss.shape, r * 0.58, -Math.PI / 12);
    ctx.strokeStyle = `${boss.accent}8A`;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Core: las capas externas ya no existen; solo quedan anillos internos.
    const aliveCoreLayers = Math.max(0, targets.length);
    for (let i = 0; i < aliveCoreLayers; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.34 - i * 0.08), 0, Math.PI * 2);
      ctx.strokeStyle = boss.accent;
      ctx.lineWidth = 3 - i * 0.5;
      ctx.shadowColor = boss.accent;
      ctx.shadowBlur = 12;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  ctx.restore();

  // Mini-piezas orbitantes / núcleo. Cada una ES el objetivo, no un marcador.
  targets.forEach((target, index) => {
    drawBossLayerTarget(ctx, target, boss, phase, index);
  });

  if (boss.warning) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = '#FFD166';
    ctx.shadowColor = '#FFD166';
    ctx.shadowBlur = 8;
    ctx.fillText('⚠ INVERSIÓN DEL CUERPO', ce.x, ce.y - r - 36);
    ctx.restore();
  }

  if ((boss.phaseTransitionTimer ?? 0) > 0) {
    const alpha = Math.min(1, boss.phaseTransitionTimer * 2.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = boss.accent;
    ctx.fillText(
      phase?.id === 'core' ? 'NÚCLEO EXPUESTO' : 'SIGUIENTE CAPA REVELADA',
      ce.x,
      ce.y + r + 30,
    );
    ctx.restore();
  }
}



function drawEmbeddedArrowMasks(ctx, state, progression) {
  const boss = state?.boss;
  const ce = state?.centralElement;
  if (!boss?.active || !Array.isArray(state?.anchoredProjectiles) || state.anchoredProjectiles.length === 0 || !ce) return;

  const phase = getBossPhase(state);
  const tier = progression?.tier ?? 1;
  const r = ce.radius;

  ctx.save();
  ctx.translate(ce.x, ce.y);
  ctx.rotate(boss.bodyAngle ?? ce.angle * 0.5);

  const surfaceR = r * getBossSurfaceScale(phase);
  ctx.beginPath();
  ctx.arc(0, 0, surfaceR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10,15,24,.94)';
  ctx.fill();

  const bodyScale = phase?.id === 'armor'
    ? 0.86
    : phase?.id === 'exposed'
      ? 0.69
      : 0.52;
  const bodyR = r * bodyScale;

  traceBossShape(ctx, boss.shape, bodyR, 0);
  ctx.fillStyle = phase?.id === 'core'
    ? 'rgba(10,15,24,.52)'
    : `${boss.color}${phase?.id === 'armor' ? '26' : '18'}`;
  ctx.fill();
  ctx.strokeStyle = boss.color;
  ctx.lineWidth = phase?.id === 'armor' ? 4 : phase?.id === 'exposed' ? 3 : 2;
  ctx.shadowColor = boss.color;
  ctx.shadowBlur = 7 + tier * 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (phase?.id === 'armor') {
    traceBossShape(ctx, boss.shape, r * 0.95, Math.PI / 18);
    ctx.strokeStyle = `${boss.accent}80`;
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (phase?.id === 'exposed') {
    traceBossShape(ctx, boss.shape, r * 0.58, -Math.PI / 12);
    ctx.strokeStyle = `${boss.accent}8A`;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    const targets = getBossLayerTargets(state);
    const aliveCoreLayers = Math.max(0, targets.length);
    for (let i = 0; i < aliveCoreLayers; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.34 - i * 0.08), 0, Math.PI * 2);
      ctx.strokeStyle = boss.accent;
      ctx.lineWidth = 3 - i * 0.5;
      ctx.shadowColor = boss.accent;
      ctx.shadowBlur = 12;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function getBossShakeOffset(state) {
  if (!isBossPhaseTransitionActive(state)) return { x: 0, y: 0 };

  const fx = getBossPhaseBreak(state);
  const duration = Math.max(0.001, Number(fx?.duration) || BOSS_CONFIG.phaseTransitionDuration);
  const remaining = Math.max(0, Math.min(1, Number(fx?.timer) / duration));
  const intensity = 8.5 * Math.pow(remaining, 1.35);
  const now = performance.now();

  return {
    x: Math.sin(now * 0.095) * intensity + Math.sin(now * 0.173) * intensity * 0.42,
    y: Math.cos(now * 0.121) * intensity * 0.66,
  };
}


function drawBossDetachedDebris(ctx, state) {
  const debris = state?.detachedBossDebris;
  if (!Array.isArray(debris) || debris.length === 0) return;

  for (const piece of debris) {
    const radius = Math.max(3, Number(piece.radius) || 7);
    const accent = piece.accent ?? '#FFD166';
    const color = piece.color ?? '#FF6B35';

    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(Number(piece.rotation) || 0);
    ctx.shadowColor = accent;
    ctx.shadowBlur = 6;

    if (piece.shape === 'shard') {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.95, -radius * 0.30);
      ctx.lineTo(radius * 0.25, -radius * 0.90);
      ctx.lineTo(radius, radius * 0.20);
      ctx.lineTo(-radius * 0.20, radius * 0.78);
      ctx.closePath();
      ctx.fillStyle = `${color}CC`;
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else if (piece.shape === 'ringArc') {
      const thickness = Math.max(3, Number(piece.thickness) || radius * 0.28);
      const arc = Math.max(0.35, Number(piece.arc) || 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, radius, -arc, arc);
      ctx.lineWidth = thickness;
      ctx.strokeStyle = `${accent}E8`;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, radius - thickness * 0.45), -arc * 0.92, arc * 0.92);
      ctx.lineWidth = Math.max(1.5, thickness * 0.34);
      ctx.strokeStyle = `${color}D5`;
      ctx.stroke();
    } else {
      traceBossShape(ctx, piece.shape ?? 'circle', radius, 0);
      ctx.fillStyle = 'rgba(13,17,23,.88)';
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.7;
      ctx.stroke();

      traceBossShape(ctx, piece.shape ?? 'circle', radius * 0.42, Math.PI / 8);
      ctx.fillStyle = `${color}B0`;
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawBossDetachedArrows(ctx, state, assets) {
  const arrows = state?.detachedBossArrows;
  if (!Array.isArray(arrows) || arrows.length === 0) return;

  for (const arrow of arrows) {
    ctx.save();
    ctx.globalAlpha = 1;
    drawArrow(
      ctx,
      arrow.x,
      arrow.y,
      arrow.radius,
      arrow.rotation,
      arrow.awsIconId,
      assets,
    );
    ctx.restore();
  }
}

function drawBossPhaseBreakOverlay(ctx, state) {
  const fx = getBossPhaseBreak(state);
  if (!fx?.active) return;

  const duration = Math.max(0.001, Number(fx.duration) || BOSS_CONFIG.phaseTransitionDuration);
  const progress = 1 - Math.max(0, Math.min(1, Number(fx.timer) / duration));
  const boss = state.boss;
  const accent = boss?.accent ?? '#FFD166';

  // Flash inicial de ruptura.
  const flashAlpha = Math.max(0, 0.30 - progress) / 0.30;
  if (flashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = flashAlpha * 0.24;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-getSceneOffsetX(ctx), 0, getLogicalCanvasWidth(ctx), getLogicalCanvasHeight(ctx));
    ctx.restore();
  }

  // Título central: entra rápido y se desvanece antes de terminar la pausa.
  const inAlpha = Math.min(1, progress / 0.12);
  const outAlpha = Math.min(1, Math.max(0, (1 - progress) / 0.24));
  const alpha = Math.min(inAlpha, outAlpha);
  if (alpha <= 0) return;

  const from = String(fx.fromPhase ?? '').toLowerCase();
  const to = String(fx.toPhase ?? '').toLowerCase();
  const title = from === 'armor'
    ? '¡ARMADURA DESTROZADA!'
    : from === 'exposed'
      ? '¡CAPA EXTERNA ROTA!'
      : '¡FASE ROTA!';
  const subtitle = to === 'core'
    ? 'NÚCLEO EXPUESTO'
    : `SE REVELA ${String(fx.toLabel ?? 'SIGUIENTE FASE').toUpperCase()}`;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 24px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  const screenH = getLogicalCanvasHeight(ctx);
  ctx.fillText(title, LOGICAL_WIDTH / 2, screenH / 2 - 18);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 11px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  ctx.fillText(subtitle, LOGICAL_WIDTH / 2, screenH / 2 + 14);
  ctx.restore();
}

function drawBossIntroOverlay(ctx, state) {
  if (state.phase !== 'bossintro' || !state.boss?.active) return;

  const boss = state.boss;
  const elapsed = 1 - Math.min(1, (boss.introTimer ?? 0) / 1.65);
  const alpha = Math.min(1, elapsed * 5 + 0.18);

  ctx.save();
  ctx.fillStyle = 'rgba(5,8,13,.72)';
  const screenH = getLogicalCanvasHeight(ctx);
  ctx.fillRect(-getSceneOffsetX(ctx), 0, getLogicalCanvasWidth(ctx), screenH);

  const w = 410;
  const h = 190;
  const x = (LOGICAL_WIDTH - w) / 2;
  const y = (screenH - h) / 2;
  roundedRectPath(ctx, x, y, w, h, 18);
  ctx.fillStyle = 'rgba(13,17,23,.95)';
  ctx.fill();
  ctx.strokeStyle = boss.color;
  ctx.lineWidth = 2;
  ctx.shadowColor = boss.color;
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 12px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFD166';
  ctx.fillText(`⚠ JEFE ${boss.bossNumber} ENTRANTE ⚠`, LOGICAL_WIDTH / 2, y + 34);

  ctx.font = 'bold 34px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(boss.name, LOGICAL_WIDTH / 2, y + 76);

  ctx.font = 'bold 11px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = boss.accent;
  ctx.fillText(boss.subtitle, LOGICAL_WIDTH / 2, y + 104);

  ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = boss.color;
  ctx.fillText('CAPA 1 • ROMPE EL ANILLO DE ARMADURA', LOGICAL_WIDTH / 2, y + 139);

  ctx.font = '10px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.58)';
  ctx.fillText('Rompe las capas • tiros fallidos cargan OVERLOAD • al 100% pierdes', LOGICAL_WIDTH / 2, y + 165);
  ctx.restore();
}

function drawBossCompleteOverlay(ctx, state) {
  if (state.phase !== 'levelcomplete' || !state.boss?.defeated || !state.boss?.result) return false;

  const result = state.boss.result;
  const remaining = Math.max(0, state.levelTransitionTimer ?? 0);
  const progress = 1 - Math.min(1, remaining / LEVEL_COMPLETE_DELAY);
  const fadeIn = Math.min(1, progress * 5);
  const fadeOut = Math.min(1, remaining * 3.2);
  const alpha = Math.min(fadeIn, fadeOut);

  ctx.save();
  ctx.globalAlpha = Math.max(0.15, alpha);
  ctx.fillStyle = 'rgba(5,8,13,.68)';
  const screenH = getLogicalCanvasHeight(ctx);
  ctx.fillRect(-getSceneOffsetX(ctx), 0, getLogicalCanvasWidth(ctx), screenH);

  const w = 420;
  const h = 252;
  const x = (LOGICAL_WIDTH - w) / 2;
  const y = (screenH - h) / 2;
  roundedRectPath(ctx, x, y, w, h, 18);
  ctx.fillStyle = 'rgba(13,17,23,.96)';
  ctx.fill();
  ctx.strokeStyle = state.boss.color;
  ctx.lineWidth = 2;
  ctx.shadowColor = state.boss.color;
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 12px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = state.boss.accent;
  ctx.fillText(result.bossName, LOGICAL_WIDTH / 2, y + 28);

  ctx.font = 'bold 28px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('JEFE DERROTADO', LOGICAL_WIDTH / 2, y + 60);

  ctx.font = 'bold 50px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = result.rank === 'S' ? '#FFD166' : state.boss.accent;
  ctx.fillText(result.rank, LOGICAL_WIDTH / 2, y + 108);

  ctx.font = 'bold 10px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.74)';
  ctx.fillText(
    `ACCURACY ${result.accuracy}%  •  PERFECTS ${result.perfectHits}  •  TIME ${result.time}s`,
    LOGICAL_WIDTH / 2,
    y + 145,
  );

  ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFD166';
  ctx.fillText(`BONO DE JEFE +${result.bonus}  •  MONEDAS +${state.lastCoinReward ?? 0}`, LOGICAL_WIDTH / 2, y + 176);

  ctx.font = '10px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.56)';
  ctx.fillText(`SIGUE: NIVEL ${(state.completedLevel || state.level) + 1}`, LOGICAL_WIDTH / 2, y + 224);
  ctx.restore();
  return true;
}

// ---------------------------------------------------------------------------
// Disco central
// ---------------------------------------------------------------------------
function drawDisc(ctx, ce, progression, level = 1) {
  const { x, y, radius, angle } = ce;
  const theme = getLevelTheme(level);
  ctx.save();
  ctx.translate(x, y);

  // Fondo interior oscuro
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = theme.inner ?? COLOR_DISC_INNER;
  ctx.fill();

  // Radios giratorios
  const spokeCount = 8;
  for (let i = 0; i < spokeCount; i++) {
    const a = angle + (Math.PI * 2 * i) / spokeCount;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * radius * 0.88, Math.sin(a) * radius * 0.88);
    ctx.strokeStyle = `${theme.ring}55`;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }

  // Anillo exterior — color y brillo varían con el tier
  const tier = progression ? progression.tier : 1;
  const ringColor = tier >= 5 ? '#FF4D4D' : (tier >= 4 ? theme.accent : theme.ring);
  const ringGlow = tier >= 4;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  if (ringGlow) {
    ctx.shadowColor = ringColor;
    ctx.shadowBlur  = 14 + (tier - 4) * 6;
  }
  ctx.strokeStyle = ringColor;
  ctx.lineWidth   = 6 + tier * 0.5;
  ctx.stroke();
  ctx.shadowBlur  = 0;

  // Anillo interior
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = `${theme.ring}73`;
  ctx.lineWidth   = 2.5;
  ctx.stroke();

  // Hub
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = theme.ring ?? COLOR_DISC_RING;
  ctx.fill();

  // Marcador de rotación
  const mx = Math.cos(angle) * radius;
  const my = Math.sin(angle) * radius;
  ctx.beginPath();
  ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.restore();
}



// ---------------------------------------------------------------------------
// Arco del lanzador + carga de Split Shot.
//
// Orientación: el cuerpo rígido del arco queda ARRIBA y la cuerda ABAJO.
// La flecha se engancha físicamente en la cuerda y retrocede con ella al
// cargar. Todo el movimiento de esta sección es visual; la física real del
// proyectil continúa viviendo en projectile.js.
// ---------------------------------------------------------------------------
const BOW_CHARGE_MS = 600;

function getBowVisualState(state) {
  const now = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

  let charge = 0;
  let recoil = 0;
  let energy = 0.18;

  if (state.bowVisualPressed) {
    const startedAt = Number(state.bowVisualPressAt) || now;
    charge = Math.max(0, Math.min(1, (now - startedAt) / BOW_CHARGE_MS));
    energy = 0.30 + charge * 0.70;
  } else {
    const releaseAt = Number(state.bowVisualReleaseAt) || 0;
    const releaseAge = releaseAt > 0 ? Math.max(0, now - releaseAt) : Infinity;

    if (releaseAge < 135) {
      const p = releaseAge / 135;
      recoil = Math.sin(p * Math.PI) * (1 - p * 0.28);
      energy = (state.bowVisualReleaseCharged ? 1 : 0.68) * (1 - p * 0.72);
    }
  }

  return {
    charge,
    recoil,
    energy,
    charged: charge >= 1,
  };
}

function getBowGeometry(state) {
  const now = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

  const r = 22;
  const readyBottomFactor = Number(CONFIG.READY_ARROW_BOTTOM_FACTOR) || 5;
  const baseY = LOGICAL_HEIGHT - r * readyBottomFactor;
  const arrowHalf = r * 2.1;
  const visual = getBowVisualState(state);
  const hoverLift = 4.5 + Math.sin(now / 320) * 1.3;
  const bowY = baseY + arrowHalf - hoverLift;

  const tipHalfWidth = 57 - visual.charge * 3.2 + visual.recoil * 1.6;
  const tipY = 2 + visual.charge * 3.6 - visual.recoil * 2.4;
  const bowCrownY = -20 + visual.charge * 1.6;
  const stringNockY =
    5 + visual.charge * 31 - visual.recoil * 8;

  return {
    r,
    baseY,
    arrowHalf,
    bowY,
    visual,
    hoverLift,
    tipHalfWidth,
    tipY,
    bowCrownY,
    stringNockY,
  };
}

function drawBowLauncher(ctx, state, canvasW) {
  if (state.phase !== 'playing') return;

  const cx = canvasW / 2;
  const g = getBowGeometry(state);
  const compact = getCanvasLayout(ctx) === 'compact';
  const launcherY = g.bowY - (compact ? 0 : 12);
  const {
    visual,
    hoverLift,
    tipHalfWidth,
    tipY,
    bowCrownY,
    stringNockY,
  } = g;

  ctx.save();
  ctx.translate(cx, launcherY);

  // Sombra de apoyo.
  ctx.beginPath();
  ctx.ellipse(0, 34 + hoverLift * 0.9, 44, 5.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.fill();

  // Cuerpo del arco: una curva ∩. El arco rígido queda sobre la cuerda.
  ctx.beginPath();
  ctx.moveTo(-tipHalfWidth, tipY);
  ctx.bezierCurveTo(
    -48 + visual.charge * 2.5,
    -4 + visual.charge * 1.8,
    -28,
    bowCrownY - 1,
    -8,
    bowCrownY,
  );
  ctx.bezierCurveTo(
    -3,
    bowCrownY - 1.5,
    3,
    bowCrownY - 1.5,
    8,
    bowCrownY,
  );
  ctx.bezierCurveTo(
    28,
    bowCrownY - 1,
    48 - visual.charge * 2.5,
    -4 + visual.charge * 1.8,
    tipHalfWidth,
    tipY,
  );
  ctx.strokeStyle = '#FF9900';
  ctx.lineWidth = 5.4;
  ctx.lineCap = 'round';
  ctx.shadowColor = '#FF9900';
  ctx.shadowBlur = 7 + visual.energy * 7;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Brillo interior del cuerpo.
  ctx.beginPath();
  ctx.moveTo(-tipHalfWidth + 2, tipY - 1);
  ctx.bezierCurveTo(-45, -5, -27, bowCrownY + 1, -9, bowCrownY + 1);
  ctx.moveTo(tipHalfWidth - 2, tipY - 1);
  ctx.bezierCurveTo(45, -5, 27, bowCrownY + 1, 9, bowCrownY + 1);
  ctx.strokeStyle = 'rgba(255,211,140,.80)';
  ctx.lineWidth = 1.15;
  ctx.stroke();

  // Empuñadura integrada en la parte superior/central del arco.
  roundedRectPath(ctx, -8, bowCrownY - 7, 16, 17, 5);
  const gripGradient = ctx.createLinearGradient(0, bowCrownY - 7, 0, bowCrownY + 10);
  gripGradient.addColorStop(0, '#2A3645');
  gripGradient.addColorStop(1, '#101720');
  ctx.fillStyle = gripGradient;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,153,0,.74)';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Cuerda: los extremos se fijan a las puntas y el culatín baja al cargar.
  ctx.beginPath();
  ctx.moveTo(-tipHalfWidth, tipY);
  ctx.lineTo(0, stringNockY);
  ctx.lineTo(tipHalfWidth, tipY);
  ctx.strokeStyle = `rgba(238,245,255,${0.68 + visual.energy * 0.28})`;
  ctx.lineWidth = visual.charged ? 1.75 : 1.25;
  ctx.shadowColor = visual.charged ? '#FFD166' : '#DCEBFF';
  ctx.shadowBlur = 4 + visual.energy * 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Punto de enganche de la flecha a la cuerda.
  ctx.beginPath();
  ctx.arc(0, stringNockY, 2.5 + visual.energy * 1.2, 0, Math.PI * 2);
  ctx.fillStyle = visual.charged ? '#FFF1A8' : '#FFD28A';
  ctx.shadowColor = visual.charged ? '#FFD166' : '#FF9900';
  ctx.shadowBlur = 5 + visual.energy * 9;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Progreso de carga alrededor del culatín. No ocupa espacio extra de HUD.
  if (state.bowVisualPressed) {
    ctx.beginPath();
    ctx.arc(
      0,
      stringNockY,
      10.5,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * visual.charge,
    );
    ctx.strokeStyle = visual.charged ? '#5FE1AE' : '#FFD166';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 7;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 9px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = visual.charged ? '#5FE1AE' : 'rgba(255,209,102,.90)';
    ctx.fillText(
      visual.charged ? 'SPLIT LISTO' : `CARGA ${Math.round(visual.charge * 100)}%`,
      67,
      -7,
    );
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// drawReadyArrow — flecha montada sobre la cuerda.
// ---------------------------------------------------------------------------
function drawReadyArrow(ctx, state, assets, canvasW, canvasH) {
  if (state.flyingProjectile) return;
  if (state.phase !== 'playing') return;

  const cx = canvasW / 2;
  const g = getBowGeometry(state);
  const compact = getCanvasLayout(ctx) === 'compact';
  const launcherY = g.bowY - (compact ? 0 : 12);
  const t = Date.now() / 1000;

  // El extremo trasero de la flecha coincide con el culatín de la cuerda.
  const readyY = launcherY + g.stringNockY - g.arrowHalf;

  if (g.visual.charged) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, readyY, g.r * 1.18, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(95,225,174,.72)';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = '#5FE1AE';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.restore();
  }

  ctx.globalAlpha = 0.94 + 0.06 * Math.sin(t * Math.PI * 0.8);
  drawArrow(ctx, cx, readyY, g.r, 0, state.nextArrowId, assets);
  ctx.globalAlpha = 1;
}

function drawSplitArrowFragments(ctx, state) {
  const fragments = Array.isArray(state.splitArrowFragments)
    ? state.splitArrowFragments
    : [];

  for (const fragment of fragments) {
    const life = Math.max(0, Number(fragment.life) || 0);
    const maxLife = Math.max(0.001, Number(fragment.maxLife) || 0.55);
    if (life <= 0) continue;

    const alpha = Math.min(1, life / maxLife);
    const len = Math.max(10, Number(fragment.length) || 22);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(fragment.x, fragment.y);
    ctx.rotate(fragment.rotation || 0);

    ctx.beginPath();
    ctx.moveTo(0, -len / 2);
    ctx.lineTo(0, len / 2);
    ctx.strokeStyle = '#C8A96E';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.shadowColor = fragment.color ?? '#FFD166';
    ctx.shadowBlur = 5 * alpha;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-3.4, fragment.side < 0 ? -len / 2 : len / 2);
    ctx.lineTo(3.4, fragment.side < 0 ? -len / 2 : len / 2);
    ctx.strokeStyle = fragment.color ?? '#FFD166';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}

function drawChargedProjectileAura(ctx, fp) {
  if (!fp?.chargedShot) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(fp.x, fp.y, fp.radius * 1.05, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(95,225,174,.68)';
  ctx.lineWidth = 1.8;
  ctx.shadowColor = '#5FE1AE';
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();
}

function drawLevelCompleteOverlay(ctx, state) {
  if (state.phase !== 'levelcomplete') return;

  const remaining = Math.max(0, state.levelTransitionTimer ?? 0);
  const progress = 1 - Math.min(1, remaining / LEVEL_COMPLETE_DELAY);
  const fadeIn = Math.min(1, progress * 5);
  const fadeOut = Math.min(1, remaining * 3.2);
  const alpha = Math.min(fadeIn, fadeOut);
  const level = state.completedLevel || state.level || 1;
  const nextLevel = level + 1;
  const theme = getLevelTheme(level);

  ctx.save();
  ctx.globalAlpha = Math.max(0.15, alpha);
  ctx.fillStyle = 'rgba(8,12,18,.58)';
  const screenH = getLogicalCanvasHeight(ctx);
  ctx.fillRect(-getSceneOffsetX(ctx), 0, getLogicalCanvasWidth(ctx), screenH);

  const cardW = 360;
  const cardH = 172;
  const x = (LOGICAL_WIDTH - cardW) / 2;
  const y = (screenH - cardH) / 2 - 8;
  roundedRectPath(ctx, x, y, cardW, cardH, 18);
  ctx.fillStyle = 'rgba(26,35,50,.94)';
  ctx.fill();
  ctx.strokeStyle = theme.ring;
  ctx.lineWidth = 2;
  ctx.shadowColor = theme.ring;
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = theme.accent;
  ctx.fillText(`NIVEL ${level}`, LOGICAL_WIDTH / 2, y + 28);

  ctx.font = 'bold 30px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('¡COMPLETADO!', LOGICAL_WIDTH / 2, y + 59);

  ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFD166';
  ctx.fillText(`BONO DE NIVEL  +${state.levelCompleteBonus ?? 0}`, LOGICAL_WIDTH / 2, y + 88);

  ctx.font = 'bold 12px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFD166';
  ctx.fillText(`MONEDAS  +${state.lastCoinReward ?? 0}`, LOGICAL_WIDTH / 2, y + 113);

  ctx.font = '10px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.66)';
  ctx.fillText(`SIGUE: NIVEL ${nextLevel}  •  ${getLevelTarget(nextLevel)} FLECHAS`, LOGICAL_WIDTH / 2, y + 142);
  ctx.restore();
}

function drawLifeLostOverlay(ctx, state) {
  if (state.phase !== 'lifelost') return;

  const screenH = getLogicalCanvasHeight(ctx);
  const remaining = Math.max(0, Number(state.lifeLostTimer) || 0);
  const progress = 1 - Math.min(1, remaining / 1.35);
  const pulse = 0.7 + Math.sin(progress * Math.PI) * 0.3;

  ctx.save();
  ctx.fillStyle = 'rgba(8,12,18,.62)';
  ctx.fillRect(-getSceneOffsetX(ctx), 0, getLogicalCanvasWidth(ctx), screenH);

  const w = 330;
  const h = 138;
  const x = (LOGICAL_WIDTH - w) / 2;
  const y = (screenH - h) / 2 - 4;
  roundedRectPath(ctx, x, y, w, h, 18);
  ctx.fillStyle = 'rgba(20,25,36,.96)';
  ctx.fill();
  ctx.strokeStyle = '#FF6688';
  ctx.lineWidth = 2;
  ctx.globalAlpha = pulse;
  ctx.shadowColor = '#FF4D73';
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 14px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FF9AB0';
  ctx.fillText('CONTINUACIÓN', LOGICAL_WIDTH / 2, y + 28);

  ctx.font = 'bold 28px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('¡VIDA PERDIDA!', LOGICAL_WIDTH / 2, y + 62);

  ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FF7799';
  ctx.fillText(
    `${state.currentLives} ${state.currentLives === 1 ? 'VIDA RESTANTE' : 'VIDAS RESTANTES'}`,
    LOGICAL_WIDTH / 2,
    y + 94,
  );

  ctx.font = '10px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.58)';
  ctx.fillText(`REINICIANDO NIVEL ${state.level}…`, LOGICAL_WIDTH / 2, y + 117);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// render — función principal exportada
// ---------------------------------------------------------------------------
export function render(ctx, state, assets, progression = null) {
  const { centralElement: ce, anchoredProjectiles, flyingProjectile } = state;
  const { canvas } = ctx;

  const screenW = getLogicalCanvasWidth(ctx);
  const screenH = getLogicalCanvasHeight(ctx);
  const sceneOffsetX = getSceneOffsetX(ctx);
  const sceneOffsetY = getSceneOffsetY(ctx);
  const sceneScale = getSceneScale(ctx);

  ctx.setTransform(
    canvas.width / screenW,
    0,
    0,
    canvas.height / screenH,
    0,
    0,
  );

  ctx.clearRect(0, 0, screenW, screenH);
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, screenW, screenH);

  const shake = getBossShakeOffset(state);
  ctx.save();
  ctx.translate(shake.x, shake.y);

  drawHUD(ctx, state, progression, screenW, assets);
  drawEconomyStatus(ctx, state, screenW);

  if (isR61WideHud(ctx)) {
    drawR61WideHud(ctx, state, progression);
  } else {
    const mobileBossHud =
      getCanvasLayout(ctx) === 'compact' &&
      !isCompactDesktop(ctx) &&
      Boolean(state.boss?.active && !state.boss?.defeated);

    if (!mobileBossHud) {
      drawDifficultyIndicator(ctx, screenW, state.difficulty);
    }

    drawLevelProgress(ctx, state, screenW);
    drawStability(ctx, state, screenW);
    drawBossProgress(ctx, state, screenW);
  }

  drawComboBadge(ctx, state);

  ctx.save();
  ctx.translate(sceneOffsetX, sceneOffsetY);

  if (sceneScale !== 1) {
    ctx.translate(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
    ctx.scale(sceneScale, sceneScale);
    ctx.translate(-LOGICAL_WIDTH / 2, -LOGICAL_HEIGHT / 2);
  }

  if (state.boss?.active) drawBoss(ctx, state, progression);
  else drawDisc(ctx, ce, progression, state.level);

  for (const ap of anchoredProjectiles) {
    const renderDistance = Number.isFinite(ap.renderDistance)
      ? ap.renderDistance
      : ap.distance;
    const apX = ce.x + renderDistance * Math.cos(ap.angle);
    const apY = ce.y + renderDistance * Math.sin(ap.angle);
    const arrowAngle = ap.angle - Math.PI / 2;
    drawArrow(ctx, apX, apY, ap.radius, arrowAngle, ap.awsIconId, assets);
  }

  if (state.boss?.active && anchoredProjectiles.length > 0) {
    drawEmbeddedArrowMasks(ctx, state, progression);
  }

  drawBossDetachedDebris(ctx, state);
  drawBossDetachedArrows(ctx, state, assets);
  drawSplitArrowFragments(ctx, state);
  drawPowerCore(ctx, state, assets);
  drawCompactCoreReadableLabel(ctx, state);

  drawBowLauncher(ctx, state, LOGICAL_WIDTH);

  if (flyingProjectile) {
    const fp = flyingProjectile;
    drawChargedProjectileAura(ctx, fp);
    const flyAngle = Math.atan2(fp.vy, fp.vx) + Math.PI / 2;
    drawArrow(ctx, fp.x, fp.y, fp.radius, flyAngle, fp.awsIconId, assets);
  }

  drawReadyArrow(ctx, state, assets, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  ctx.restore();

  drawPowerUpDock(ctx, state, screenW, screenH, assets);
  drawR61PowerChargeFix(ctx, state, screenW, screenH);
  drawBottomHint(ctx, state, screenW, screenH);

  ctx.save();
  ctx.translate(sceneOffsetX, 0);
  drawBossIntroOverlay(ctx, state);
  drawLifeLostOverlay(ctx, state);
  if (!drawBossCompleteOverlay(ctx, state)) {
    drawLevelCompleteOverlay(ctx, state);
  }
  ctx.restore();

  drawVersion(ctx, screenW, screenH);
  ctx.restore();

  ctx.save();
  ctx.translate(sceneOffsetX, 0);
  drawBossPhaseBreakOverlay(ctx, state);
  ctx.restore();
}
