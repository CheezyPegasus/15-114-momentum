export class KeyboardInput {
  constructor(target = window) {
    this.held = new Set();
    this.attackQueued = false;
    this.dodgeQueued = false;
    target.addEventListener('keydown', event => {
      if (!['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', 'KeyJ', 'KeyK'].includes(event.code)) return;
      event.preventDefault();
      this.held.add(event.code);
      if (event.code === 'KeyJ' && !event.repeat) this.attackQueued = true;
      if (event.code === 'KeyK' && !event.repeat) this.dodgeQueued = true;
    });
    target.addEventListener('keyup', event => this.held.delete(event.code));
    target.addEventListener('blur', () => this.clear());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.clear(); });
  }

  read() {
    const left = this.held.has('KeyA') || this.held.has('ArrowLeft');
    const right = this.held.has('KeyD') || this.held.has('ArrowRight');
    const result = { direction: Number(right) - Number(left), attackPressed: this.attackQueued, dodgePressed: this.dodgeQueued };
    this.attackQueued = false;
    this.dodgeQueued = false;
    return result;
  }

  clear() { this.held.clear(); this.attackQueued = false; this.dodgeQueued = false; }
}
