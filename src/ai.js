import { CONFIG as C } from './config.js';

// Return a possible strike; the engine resolves all strikes together.
// Windup and recovery stay independent of the CPU's brief hit flash.
export function updateOpponent(cpu, player, dt) {
  const distance = Math.abs(player.x - cpu.x);
  cpu.facing = Math.sign(player.x - cpu.x) || cpu.facing;
  cpu.moving = false;

  if (cpu.phase === 'windup') {
    cpu.phaseTime -= dt;
    if (cpu.phaseTime <= 0) {
      cpu.phase = 'recovery';
      cpu.phaseTime = C.cpuRecovery;
      cpu.attackVisual = C.attackVisualDuration;
      return distance <= C.cpuReach && player.dodgeRemaining <= 0
        ? { target: 'player', damage: C.cpuDamage } : null;
    }
    return null;
  }

  if (cpu.phase === 'recovery') {
    cpu.phaseTime = Math.max(0, cpu.phaseTime - dt);
    if (cpu.phaseTime === 0) cpu.phase = 'idle';
    return null;
  }

  if (distance > C.cpuStopDistance) {
    const amount = Math.min(C.cpuSpeed * dt, distance - C.cpuStopDistance);
    cpu.x += cpu.facing * amount;
    cpu.moving = true;
  } else {
    cpu.phase = 'windup';
    cpu.phaseTime = C.cpuWindup;
  }
  return null;
}
