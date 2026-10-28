import { CONFIG as C } from './config.js';
import { updateOpponent } from './ai.js';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function nextHitDamage(streak) {
  return C.baseDamage + Math.min(streak, C.bonusCap) * C.streakStep;
}

function fighter(id, x, facing) {
  return { id, x, facing, hp: C.maxHealth, phase: 'idle', phaseTime: 0,
    cooldown: 0, attackVisual: 0, hitFlash: 0, moving: false,
    dodgeRemaining: 0, dodgeCooldown: 0, dodgeDirection: 0 };
}

export function createGame(status = 'title') {
  return {
    status, result: null, time: 0, streak: 0, bestStreak: 0, events: [],
    hitStop: 0, attackBuffer: 0, dodgeBuffer: 0,
    player: fighter('player', C.playerStart, 1),
    cpu: fighter('cpu', C.cpuStart, -1),
  };
}

function tickVisuals(fighter, dt) {
  for (const key of ['cooldown', 'attackVisual', 'hitFlash', 'dodgeRemaining', 'dodgeCooldown']) {
    fighter[key] = Math.max(0, fighter[key] - dt);
  }
}

// No DOM or canvas access here: the same rules run in the browser and Node tests.
export function updateGame(game, dt, input = {}) {
  game.events = [];
  if (game.status !== 'playing') return game;
  dt = clamp(dt, 0, 0.05);
  if (input.attackPressed) game.attackBuffer = 0.12;
  if (input.dodgePressed) game.dodgeBuffer = 0.12;
  if (game.hitStop > 0) {
    game.hitStop = Math.max(0, game.hitStop - dt);
    return game;
  }
  game.time += dt;
  const { player, cpu } = game;
  tickVisuals(player, dt);
  tickVisuals(cpu, dt);

  const direction = clamp(input.direction || 0, -1, 1);
  if (game.dodgeBuffer > 0 && player.dodgeCooldown === 0) {
    player.dodgeRemaining = C.dodgeDuration;
    player.dodgeCooldown = C.dodgeCooldown;
    player.dodgeDirection = direction || -Math.sign(cpu.x - player.x) || -player.facing;
    game.dodgeBuffer = 0;
    game.attackBuffer = 0;
    game.events.push({ type: 'dodge' });
  }
  const dodging = player.dodgeRemaining > 0;
  const moveDirection = dodging ? player.dodgeDirection : direction;
  player.moving = moveDirection !== 0;
  let nextX = player.x + moveDirection * (dodging ? C.dodgeSpeed : C.playerSpeed) * dt;
  const toward = Math.sign(cpu.x - player.x);
  if (moveDirection === toward && toward !== 0) {
    const available = Math.max(0, Math.abs(cpu.x - player.x) - C.minimumDistance);
    nextX = player.x + toward * Math.min(Math.abs(nextX - player.x), available);
  }
  player.x = clamp(nextX, C.boundary, C.width - C.boundary);
  const enemyStrike = updateOpponent(cpu, player, dt);
  cpu.x = clamp(cpu.x, C.boundary, C.width - C.boundary);
  player.facing = Math.sign(cpu.x - player.x) || player.facing;
  const hits = enemyStrike ? [enemyStrike] : [];

  if (dodging) game.attackBuffer = 0;
  if (game.attackBuffer > 0 && player.cooldown <= 0 && !dodging) {
    game.attackBuffer = 0;
    player.cooldown = C.attackCooldown;
    player.attackVisual = C.attackVisualDuration;
    game.events.push({ type: 'swing' });
    if (Math.abs(player.x - cpu.x) <= C.playerReach) {
      hits.push({ target: 'cpu', damage: nextHitDamage(game.streak) });
    }
  }

  // Resolve as a batch, so simultaneous lethal strikes can produce a draw.
  for (const hit of hits) {
    const target = game[hit.target];
    target.hp = Math.max(0, target.hp - hit.damage);
    target.hitFlash = 0.18;
    game.hitStop = C.hitStop;
    game.events.push({ type: 'hit', ...hit, x: target.x });
  }
  if (hits.some(hit => hit.target === 'cpu')) {
    game.streak += 1;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
  }
  if (hits.some(hit => hit.target === 'player')) {
    if (game.streak > 0) game.events.push({ type: 'streakLost', count: game.streak });
    game.streak = 0;
  }

  if (player.hp === 0 || cpu.hp === 0) {
    game.status = 'over';
    game.result = player.hp === 0 && cpu.hp === 0 ? 'draw' : cpu.hp === 0 ? 'win' : 'loss';
    player.moving = cpu.moving = false;
    game.events.push({ type: 'gameOver', result: game.result });
  }
  game.attackBuffer = Math.max(0, game.attackBuffer - dt);
  game.dodgeBuffer = Math.max(0, game.dodgeBuffer - dt);
  return game;
}
