/**
 * centralElement.js — Rotación con soporte de progresión automática.
 */

export function updateRotation(state, deltaTime, progression) {
  const ce = state.centralElement;

  // Derivar suavemente la velocidad hacia el target de la progresión
  // (interpolación exponencial: más rápido al inicio, suave al llegar)
  const targetSpeed = progression.speed;
  ce.speed += (targetSpeed - ce.speed) * Math.min(1, deltaTime * 0.8);
  ce.speed  = Math.max(0.2, ce.speed);

  // Variación aleatoria de velocidad (hard / easy avanzado)
  if (progression.speedVariance > 0) {
    const noise  = (Math.random() - 0.5) * progression.speedVariance * deltaTime * 3;
    ce.speed    += noise;
    ce.speed     = Math.max(0.2, Math.min(ce.speed, progression.speed + progression.speedVariance));
  }

  // Inversión aleatoria por probabilidad
  if (progression.reverseChance > 0 && ce.reverseTimer <= 0) {
    // reverseChance fue calibrado originalmente por frame a ~60 FPS.
    // Convertimos esa probabilidad a deltaTime para conservar exactamente
    // la misma frecuencia temporal al renderizar a 30/60/90/120 FPS.
    const reverseChanceThisFrame =
      1 - Math.pow(
        1 - progression.reverseChance,
        Math.max(0, deltaTime) * 60,
      );

    if (Math.random() < reverseChanceThisFrame) {
      ce.direction    *= -1;
      ce.reverseTimer  = 1.2 + Math.random() * 0.8;
    }
  }

  // Decrementar timer de inversión temporal
  if (ce.reverseTimer > 0) {
    ce.reverseTimer -= deltaTime;
    if (ce.reverseTimer <= 0) {
      ce.reverseTimer = 0;
      ce.direction   *= -1;   // vuelve al sentido original
    }
  }

  // Aplicar rotación
  const delta = ce.speed * ce.direction * deltaTime;
  ce.angle += delta;
  for (const ap of state.anchoredProjectiles) {
    ap.angle += delta;
  }
}

export function triggerReverse(state) {
  const ce = state.centralElement;
  if (ce.reverseTimer <= 0) {
    ce.direction    *= -1;
    ce.reverseTimer  = 1.5;
  }
}
