import { CONFIG as C } from './config.js';
import { loadFighters, loadImage } from './atlas.js';

export class ArenaRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.actors = null;
    this.backgroundImage = null;
    this.effects = [];
    this.shake = 0;
    this.clock = 0;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.ready = Promise.all([loadFighters(), loadImage('assets/rooftop-arena.png')]).then(([actors, background]) => {
      this.actors = actors; this.backgroundImage = background;
    });
  }

  resize() {
    this.ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = C.width * this.ratio;
    this.canvas.height = C.height * this.ratio;
  }

  clear() { this.effects = []; this.shake = 0; }

  consume(events, game) {
    for (const event of events) {
      if (event.type !== 'hit') continue;
      const target = game[event.target];
      this.effects.push({x: event.x + target.facing * 48, y: C.floor - C.actorHeight * .64,
        damage: event.damage, life: .42, color: event.target === 'cpu' ? '#f9dda6' : '#b9d9ff'});
      if (!this.reducedMotion) this.shake = .09;
    }
  }

  draw(game, dt) {
    const c = this.ctx;
    c.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    c.globalAlpha = 1;
    this.clock += dt;
    this.shake = Math.max(0, this.shake - dt);
    c.save();
    if (this.shake) c.translate(Math.sin(this.clock * 190) * 3, Math.cos(this.clock * 113) * 1.5);
    this.background(c);
    if (this.actors) {
      this.fighter(c, game.player, game.time);
      this.fighter(c, game.cpu, game.time);
    }
    this.effects = this.effects.filter(effect => effect.life > 0);
    for (const effect of this.effects) {
      effect.life -= dt;
      const progress = 1 - effect.life / .42;
      c.save();
      c.globalAlpha = Math.max(0, effect.life / .42);
      c.strokeStyle = effect.color;
      c.lineWidth = 2;
      for (let i = 0; i < 9; i++) {
        const angle = i * Math.PI * 2 / 9 + .2;
        c.beginPath();
        c.moveTo(effect.x + Math.cos(angle) * (5 + progress * 16), effect.y + Math.sin(angle) * (5 + progress * 16));
        c.lineTo(effect.x + Math.cos(angle) * (30 + progress * 42), effect.y + Math.sin(angle) * (30 + progress * 42));
        c.stroke();
      }
      c.fillStyle = effect.color;
      c.shadowColor = '#050811'; c.shadowBlur = 7;
      c.font = 'italic bold 27px Georgia'; c.textAlign = 'center';
      c.fillText(String(effect.damage), effect.x, effect.y - 48 - progress * 27);
      c.restore();
    }
    c.restore();
  }

  background(c) {
    c.fillStyle = '#0b1120'; c.fillRect(0, 0, C.width, C.height);
    if (this.backgroundImage) c.drawImage(this.backgroundImage, 0, 0, C.width, C.height);
    const shade = c.createLinearGradient(0, 0, 0, C.height);
    shade.addColorStop(0, '#030713c7'); shade.addColorStop(.3, '#03071312');
    shade.addColorStop(.7, '#0307130d'); shade.addColorStop(1, '#030713b8');
    c.fillStyle = shade; c.fillRect(0, 0, C.width, C.height);
  }

  frameFor(fighter, time) {
    if (fighter.dodgeRemaining > 0) return 7;
    if (fighter.hitFlash > .09) return 6;
    if (fighter.attackVisual > .12) return 4;
    if (fighter.attackVisual > 0) return 5;
    if (fighter.phase === 'windup') return 3;
    if (fighter.moving) return 1 + Math.floor(time * 7) % 2;
    return 0;
  }

  sprite(c, actor, frameIndex, x, facing, scale, alpha = 1, y = C.floor) {
    const frame = actor.frames[frameIndex];
    c.save();
    c.translate(x, y); c.scale(facing * scale, scale);
    c.globalAlpha = alpha;
    c.drawImage(frame.image, -frame.anchor[0], -frame.anchor[1]);
    c.restore();
  }

  fighter(c, f, time) {
    const actor = this.actors[f.id];
    const height = C.actorHeight * (f.id === 'cpu' ? 1.045 : 1);
    const scale = height / actor.referenceHeight;
    const frame = this.frameFor(f, time);
    c.save(); c.fillStyle = '#0008';
    c.beginPath(); c.ellipse(f.x, C.floor + 2, 70, 12, 0, 0, Math.PI * 2); c.fill(); c.restore();
    if (f.dodgeRemaining > 0 && !this.reducedMotion) {
      this.sprite(c, actor, 7, f.x - f.dodgeDirection * 45, f.facing, scale, .12);
      this.sprite(c, actor, 7, f.x - f.dodgeDirection * 24, f.facing, scale, .2);
    }
    const recoil = f.hitFlash > 0 ? -f.facing * f.hitFlash * 65 : 0;
    const breathing = frame === 0 && !this.reducedMotion ? Math.sin(time * 3.5) * 1.2 : 0;
    this.sprite(c, actor, frame, f.x + recoil, f.facing, scale, 1, C.floor + breathing);
    if (f.phase === 'windup') {
      const x = f.x, y = C.floor - height - 29;
      c.save(); c.translate(x, y); c.rotate(Math.PI / 4);
      c.strokeStyle = '#ffe0a4'; c.fillStyle = '#17111ce0'; c.lineWidth = 1.5;
      c.fillRect(-11, -11, 22, 22); c.strokeRect(-11, -11, 22, 22);
      c.restore(); c.save(); c.fillStyle = '#ffe0a4'; c.font = 'bold 19px Georgia'; c.textAlign = 'center';
      c.fillText('!', x, y + 6);
      c.fillStyle = '#ffdb9c';
      c.fillRect(x - 24, y + 23, 48 * (1 - f.phaseTime / C.cpuWindup), 2);
      c.restore();
    }
  }
}
