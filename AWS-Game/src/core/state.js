/**
 * state.js — Fuente única de verdad del juego.
 */

import { CONFIG, DIFFICULTIES } from './config.js';
import {
  createActivePowerUps,
  createPowerUpInventory,
} from '../systems/powerups/powerups.js?build=v1432-structure-final1';
import { createPowerCoreState } from '../systems/powerups/powercore.js?build=v1432-structure-final1';
import { createInactiveBossState } from '../systems/boss/boss.js';
import { STABILITY_CONFIG } from '../systems/progression/stability.js';
import { ECONOMY_CONFIG } from '../systems/economy/economy.js?build=v1432-structure-final1';

function randomIcon() {
  return CONFIG.AWS_ICONS[
    Math.floor(Math.random() * CONFIG.AWS_ICONS.length)
  ];
}

/**
 * @typedef {Object} GameState
 * @property {'idle'|'playing'|'bossintro'|'lifelost'|'levelcomplete'|'gameover'} phase
 * @property {number} score
 * @property {number} highScore
 * @property {number} level
 * @property {number} levelHits
 * @property {number} levelTransitionTimer
 * @property {number} levelCompleteBonus
 * @property {number} completedLevel
 * @property {Object} centralElement
 * @property {Object|null} flyingProjectile
 * @property {Object[]} anchoredProjectiles
 * @property {boolean} pendingLaunch
 * @property {boolean} bowVisualPressed
 * @property {number} bowVisualPressAt
 * @property {number} bowVisualReleaseAt
 * @property {boolean} bowVisualReleaseCharged
 * @property {boolean} pendingLaunchCharged
 * @property {Object[]} splitArrowFragments
 * @property {string|null} pendingPowerUpActivation
 * @property {number} gameOverTimestamp
 * @property {string|null} gameOverReason
 * @property {string} nextArrowId
 * @property {{freezeTimer:number, shieldCharges:number, doubleScoreHits:number}} activePowerUps
 * @property {{freeze:number, shield:number, double:number, cleanup:number}} powerUpInventory
 * @property {number} powerUpCharge
 * @property {Object} powerCore
 * @property {Object} boss
 * @property {Object[]} detachedBossArrows
 * @property {Object[]} detachedBossDebris
 * @property {number} stability
 * @property {string|null} hoveredPowerUpSlot
 * @property {string} difficulty
 * @property {number} lastReverseScore
 */

export function createInitialState(
  highScore = 0,
  difficulty = CONFIG.DEFAULT_DIFFICULTY,
  stats = null,
  economy = null,
) {
  const diff = DIFFICULTIES[difficulty] ?? DIFFICULTIES.medium;
  const maxLives = Math.max(
    ECONOMY_CONFIG.initialMaxLives,
    Math.floor(Number(economy?.maxLives) || ECONOMY_CONFIG.initialMaxLives),
  );

  return {
    phase: 'idle',
    score: 0,
    highScore,

    level: 1,
    levelHits: 0,
    levelTransitionTimer: 0,
    levelCompleteBonus: 0,
    completedLevel: 0,
    levelStartScore: 0,
    levelPerfectShots: 0,
    levelBestCombo: 1,
    lastCoinReward: 0,

    currentLives: maxLives,
    lifeLostTimer: 0,
    lifeLostReason: null,

    centralElement: {
      x: CONFIG.CANVAS_WIDTH / 2,
      y: CONFIG.CANVAS_HEIGHT / 2,
      radius: CONFIG.CENTRAL_RADIUS,
      angle: 0,
      speed: diff.baseSpeed,
      baseSpeed: diff.baseSpeed,
      direction: 1,
      reverseTimer: 0,
    },

    flyingProjectile: null,
    anchoredProjectiles: [],
    pendingLaunch: false,
    pendingPowerUpActivation: null,
    hoveredPowerUpSlot: null,

    // Estado exclusivamente visual del arco. No participa en físicas,
    // colisiones ni cadencia de disparo.
    bowVisualPressed: false,
    bowVisualPressAt: 0,
    bowVisualReleaseAt: 0,
    bowVisualReleaseCharged: false,
    pendingLaunchCharged: false,
    splitArrowFragments: [],
    gameOverTimestamp: 0,
    gameOverReason: null,
    stability: STABILITY_CONFIG.max,

    nextArrowId: randomIcon(),
    nextPowerUp: null,

    activePowerUps: createActivePowerUps(),
    powerUpInventory: createPowerUpInventory(),
    powerUpCharge: 0,
    powerCore: createPowerCoreState(),
    boss: createInactiveBossState(1),
    detachedBossArrows: [],
    detachedBossDebris: [],
    lastPreparedWasPowerUp: false,

    difficulty,
    lastReverseScore: 0,
    lastTier: 1,
    comboLevel: 1,
    lastAnchorTime: 0,

    stats,
    economy,
  };
}

export { randomIcon };
