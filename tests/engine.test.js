import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, updateGame, nextHitDamage } from '../src/engine.js';
import { CONFIG as C } from '../src/config.js';

function closeMatch() {
  const game = createGame('playing');
  game.player.x = 500;
  game.cpu.x = game.player.x + C.cpuStopDistance;
  return game;
}

function advance(game, seconds, input = {}) {
  for (let time = 0; time < seconds; time += 1 / 120) updateGame(game, 1 / 120, input);
}

test('successful hits grow damage and cap the bonus without capping the streak', () => {
  const game = closeMatch();
  game.cpu.hp = 1000; // A durable target lets the test observe hits beyond a normal KO.
  game.cpu.phase = 'recovery';
  game.cpu.phaseTime = 100;
  const damage = [];
  for (let i = 0; i < 9; i++) {
    updateGame(game, 0.01, { attackPressed: true });
    damage.push(game.events.find(event => event.type === 'hit').damage);
    advance(game, C.attackCooldown + C.hitStop + 0.03);
  }
  assert.deepEqual(damage, [10, 12, 14, 16, 18, 20, 20, 20, 20]);
  assert.equal(game.streak, 9);
  assert.equal(game.bestStreak, 9);
  assert.equal(nextHitDamage(game.streak), 20);
});

test('misses consume recovery but preserve the existing streak', () => {
  const game = closeMatch();
  game.player.x = 100;
  game.streak = 3;
  updateGame(game, 0.01, { attackPressed: true });
  assert.equal(game.streak, 3);
  assert.equal(game.cpu.hp, 100);
  assert.equal(game.player.cooldown, C.attackCooldown);
});

test('repeated presses during recovery cannot multiply damage', () => {
  const game = closeMatch();
  updateGame(game, 0.01, { attackPressed: true });
  advance(game, 0.3, { attackPressed: true });
  assert.equal(game.cpu.hp, 90);
  assert.equal(game.streak, 1);
});

test('enemy damage resets momentum but preserves the best streak', () => {
  const game = closeMatch();
  game.streak = game.bestStreak = 4;
  game.cpu.phase = 'windup';
  game.cpu.phaseTime = 0.001;
  updateGame(game, 0.01);
  assert.equal(game.player.hp, 75);
  assert.equal(game.streak, 0);
  assert.equal(nextHitDamage(game.streak), 10);
  assert.equal(game.bestStreak, 4);
  assert.equal(game.events.some(event => event.type === 'streakLost'), true);
});

test('a player hit does not interrupt an enemy attack windup', () => {
  const game = closeMatch();
  game.cpu.phase = 'windup';
  game.cpu.phaseTime = 0.3;
  updateGame(game, 0.01, { attackPressed: true });
  assert.equal(game.cpu.phase, 'windup');
  assert.equal(game.cpu.hp, 90);
  advance(game, 0.3 + C.hitStop + 0.03);
  assert.equal(game.player.hp, 75);
});

test('enemy attacks check the current position when they connect', () => {
  const game = closeMatch();
  game.cpu.phase = 'windup';
  game.cpu.phaseTime = 0.3;
  advance(game, 0.31, { direction: -1 });
  assert.equal(game.player.hp, 100);
  assert.equal(game.cpu.phase, 'recovery');
});

test('simultaneous lethal strikes result in a draw and combat stops', () => {
  const game = closeMatch();
  game.player.hp = 25;
  game.cpu.hp = 10;
  game.cpu.phase = 'windup';
  game.cpu.phaseTime = 0.001;
  updateGame(game, 0.01, { attackPressed: true });
  assert.equal(game.status, 'over');
  assert.equal(game.result, 'draw');
  assert.equal(game.player.hp, 0);
  assert.equal(game.cpu.hp, 0);
  const position = game.player.x;
  advance(game, 1, { direction: 1, attackPressed: true });
  assert.equal(game.player.x, position);
  assert.equal(game.player.hp, 0);
  assert.equal(game.cpu.hp, 0);
});

test('a new match clears cooldowns, pending attacks, positions and momentum', () => {
  const previous = closeMatch();
  previous.cpu.phase = 'windup';
  previous.streak = 6;
  previous.player.cooldown = 0.4;
  const next = createGame('playing');
  assert.equal(next.player.x, C.playerStart);
  assert.equal(next.cpu.x, C.cpuStart);
  assert.equal(next.cpu.phase, 'idle');
  assert.equal(next.player.cooldown, 0);
  assert.equal(next.player.hp, 100);
  assert.equal(next.cpu.hp, 100);
  assert.equal(next.streak, 0);
  assert.equal(next.bestStreak, 0);
  assert.deepEqual(next.events, []);
});

test('movement stays inside the arena and automatically faces the rival', () => {
  const game = createGame('playing');
  game.cpu.phase = 'recovery';
  game.cpu.phaseTime = 100;
  advance(game, 20, { direction: -1 });
  assert.equal(game.player.x, C.boundary);
  assert.equal(game.player.facing, 1);
  game.cpu.x = C.boundary;
  advance(game, 20, { direction: 1 });
  assert.equal(game.player.x, C.width - C.boundary);
  assert.equal(game.player.facing, -1);
});

test('standing still and continuously requesting attacks loses a fresh match', () => {
  const game = createGame('playing');
  advance(game, 30, { attackPressed: true });
  assert.equal(game.result, 'loss');
  assert.ok(game.cpu.hp > 0);
});

test('retreating during the warning and counterattacking can win without damage', () => {
  const game = createGame('playing');
  for (let t = 0; t < 60 && game.status === 'playing'; t += 1 / 120) {
    const toward = Math.sign(game.cpu.x - game.player.x);
    const threatened = game.cpu.phase === 'windup' && game.cpu.phaseTime < 0.33;
    const gap = Math.abs(game.cpu.x - game.player.x);
    updateGame(game, 1 / 120, {
      direction: threatened ? -toward : gap > 105 ? toward : 0,
      attackPressed: !threatened && gap <= C.playerReach,
    });
  }
  assert.equal(game.result, 'win');
  assert.equal(game.player.hp, 100);
  assert.equal(game.bestStreak, 7);
});

test('moving into the rival stops at body distance instead of passing through', () => {
  const game = closeMatch();
  game.cpu.phase = 'recovery'; game.cpu.phaseTime = 100;
  advance(game, 1, { direction: 1 });
  assert.equal(game.cpu.x - game.player.x, C.minimumDistance);
});

test('dodge avoids an otherwise in-range strike and preserves momentum', () => {
  const game = closeMatch(); game.streak = 3;
  game.cpu.phase = 'windup'; game.cpu.phaseTime = .001;
  updateGame(game, .01, { dodgePressed: true, attackPressed: true, direction: 1 });
  assert.equal(game.player.hp, 100);
  assert.equal(game.cpu.hp, 100);
  assert.equal(game.streak, 3);
  assert.equal(game.player.dodgeDirection, 1);
  assert.ok(game.player.dodgeRemaining > 0);
  assert.equal(game.player.dodgeCooldown, C.dodgeCooldown);
});

test('dodge defaults away from the opponent and cannot be restarted during cooldown', () => {
  const game = closeMatch();
  const before = game.player.x;
  updateGame(game, .01, { dodgePressed: true });
  assert.ok(game.player.x < before);
  assert.equal(game.player.dodgeDirection, -1);
  const remaining = game.player.dodgeRemaining;
  updateGame(game, .05, { dodgePressed: true });
  assert.ok(game.player.dodgeRemaining < remaining);
  advance(game, .25);
  assert.equal(game.player.dodgeRemaining, 0);
  updateGame(game, .01, { dodgePressed: true });
  assert.equal(game.player.dodgeRemaining, 0);
  assert.equal(game.events.some(event => event.type === 'dodge'), false);
});

test('dodging does not grant invulnerability after the window ends', () => {
  const game = closeMatch();
  updateGame(game, .01, { dodgePressed: true });
  advance(game, .3);
  game.cpu.x = game.player.x + C.cpuStopDistance;
  game.cpu.phase = 'windup'; game.cpu.phaseTime = .001;
  updateGame(game, .01);
  assert.equal(game.player.hp, 75);
});

test('paused gameplay ignores movement and attack requests', () => {
  const game = closeMatch(); game.status = 'paused';
  const position = game.player.x;
  advance(game, 1, {direction:1,attackPressed:true,dodgePressed:true});
  assert.equal(game.player.x, position);
  assert.equal(game.cpu.hp, 100);
  assert.equal(game.time, 0);
});
