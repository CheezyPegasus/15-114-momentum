export class FightAudio {
  constructor() { this.context = null; this.muted = false; }

  unlock() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    this.context ||= new Audio();
    this.context.resume().catch(() => {});
  }

  play(type) {
    const c = this.context;
    if (!c || this.muted || c.state !== 'running') return;
    const hit = type === 'hit';
    const duration = hit ? 0.11 : 0.075;
    const buffer = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 2;
    const source = c.createBufferSource(); source.buffer = buffer;
    const filter = c.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = hit ? 240 : 850;
    const gain = c.createGain(); gain.gain.value = hit ? 0.32 : 0.08;
    source.connect(filter).connect(gain).connect(c.destination); source.start();
    if (hit) {
      const tone = c.createOscillator(); const envelope = c.createGain();
      tone.frequency.setValueAtTime(100, c.currentTime); tone.frequency.exponentialRampToValueAtTime(35, c.currentTime + duration);
      envelope.gain.setValueAtTime(0.12, c.currentTime); envelope.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      tone.connect(envelope).connect(c.destination); tone.start(); tone.stop(c.currentTime + duration);
    }
  }
}
