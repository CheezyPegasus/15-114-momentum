import { CONFIG as C } from './config.js';
import { createGame, updateGame, nextHitDamage } from './engine.js';
import { KeyboardInput } from './input.js';
import { ArenaRenderer } from './render.js';
import { FightAudio } from './audio.js';

const el = id => document.getElementById(id);
const input = new KeyboardInput();
const renderer = new ArenaRenderer(el('arena'));
const sound = new FightAudio();
let game = createGame();
let ready = false, loadError = false;
let previous = performance.now(), messageTime = 0;
const pips = [...el('streak-pips').children];
const clock = seconds => `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(Math.floor(seconds % 60)).padStart(2,'0')}`;

renderer.ready.then(() => {
  ready = true; el('start-button').disabled = false; el('start-button').textContent = 'FIGHT';
  el('load-message').textContent = '';
}).catch(() => {
  loadError = true; el('start-button').disabled = false; el('start-button').textContent = 'RETRY';
  el('load-message').textContent = 'The fighters could not load. Try again.';
});

function startMatch() {
  if (loadError) { location.reload(); return; }
  if (!ready) return;
  sound.unlock();
  game = createGame('playing'); input.clear(); renderer.clear(); messageTime = 0;
  for (const name of ['start-screen','pause-screen','result-screen']) el(name).hidden = true;
  el('feedback').className = 'feedback';
  previous = performance.now(); el('arena').focus({preventScroll:true});
  renderHud(); renderer.draw(game,0);
}

function pause() {
  if (game.status !== 'playing') return;
  game.status = 'paused'; input.clear(); el('pause-screen').hidden = false;
  renderHud();
}
function resume() {
  if (game.status !== 'paused') return;
  game.status = 'playing'; input.clear(); el('pause-screen').hidden = true;
  previous = performance.now(); el('arena').focus({preventScroll:true});
}

el('start-button').addEventListener('click',startMatch);
el('restart-button').addEventListener('click',startMatch);
el('pause-restart-button').addEventListener('click',startMatch);
el('pause-button').addEventListener('click',pause);
el('resume-button').addEventListener('click',resume);
el('dodge-button').addEventListener('click',()=>{ input.dodgeQueued = true; el('arena').focus({preventScroll:true}); });
window.addEventListener('keydown',event=>{
  if (event.repeat) return;
  if (event.code === 'Enter' && game.status === 'title') { event.preventDefault(); startMatch(); }
  if (event.code === 'KeyR' && game.status === 'over') { event.preventDefault(); startMatch(); }
  if (event.code === 'Escape') { event.preventDefault(); game.status === 'paused' ? resume() : pause(); }
});
window.addEventListener('blur',pause);
document.addEventListener('visibilitychange',()=>{ if(document.hidden) pause(); });
el('sound-button').addEventListener('click',()=>{
  sound.muted = !sound.muted;
  el('sound-button').textContent = sound.muted ? 'SOUND OFF' : 'SOUND ON';
  el('sound-button').setAttribute('aria-pressed',String(!sound.muted));
  if (!sound.muted) sound.unlock();
});
el('fullscreen-button').hidden = !document.fullscreenEnabled;
el('fullscreen-button').addEventListener('click',async()=>{
  try { document.fullscreenElement ? await document.exitFullscreen() : await document.documentElement.requestFullscreen(); }
  catch { el('fullscreen-button').textContent = 'FULLSCREEN UNAVAILABLE'; }
});
document.addEventListener('fullscreenchange',()=>{ el('fullscreen-button').textContent = document.fullscreenElement ? 'EXIT FULLSCREEN' : 'FULLSCREEN'; });

function renderHud() {
  for (const name of ['player','cpu']) {
    const hp = game[name].hp;
    el(`${name}-hp`).textContent = hp;
    el(`${name}-health`).setAttribute('aria-valuenow',hp);
    el(`${name}-health`).classList.toggle('low',hp <= 25);
    el(`${name}-health-fill`).style.transform = `scaleX(${hp/C.maxHealth})`;
  }
  el('clock').textContent = clock(game.time);
  el('streak').textContent = String(game.streak).padStart(2,'0');
  el('next-damage').textContent = nextHitDamage(game.streak);
  pips.forEach((pip,index)=>pip.classList.toggle('active',index < game.streak));
  const state = el('opponent-state');
  state.classList.toggle('warning',game.status === 'playing' && game.cpu.phase === 'windup');
  state.textContent = game.status !== 'playing' ? 'FIGHTER 02' : game.cpu.phase === 'windup' ? 'ATTACK INCOMING'
    : game.cpu.phase === 'recovery' ? 'RECOVERING' : 'FIGHTER 02';
  el('dodge-status').textContent = game.player.dodgeCooldown > 0 ? `${game.player.dodgeCooldown.toFixed(1)}s` : 'READY';
  el('dodge-button').disabled = game.status !== 'playing' || game.player.dodgeCooldown > 0;
  el('pause-button').disabled = game.status !== 'playing';
}

function feedback(text,lost=false) {
  el('feedback').textContent = text; el('feedback').className = `feedback visible${lost ? ' lost' : ''}`; messageTime = 1.1;
}
function showResult() {
  const copy = { win:['YOU WIN','Momentum held.'],loss:['YOU LOSE','Watch the windup. Protect the streak.'],draw:['DRAW','Both fighters fell together.'] }[game.result];
  el('result-title').textContent = copy[0]; el('result-copy').textContent = copy[1];
  el('result-screen').querySelector('.menu').className = `menu result-menu ${game.result}`;
  el('result-streak').textContent = game.bestStreak; el('result-time').textContent = clock(game.time);
  el('result-screen').hidden = false; el('feedback').className = 'feedback';
}
function frame(now) {
  const dt = Math.min((now-previous)/1000,.05); previous = now;
  updateGame(game,dt,input.read());
  renderer.consume(game.events,game);
  for (const event of game.events) {
    if (['hit','swing','dodge'].includes(event.type)) sound.play(event.type);
    if (event.type === 'streakLost') feedback('STREAK BROKEN',true);
    if (event.type === 'hit' && event.target === 'cpu' && game.streak >= 2) feedback(`${game.streak} HIT STREAK`);
    if (event.type === 'gameOver') showResult();
  }
  messageTime = Math.max(0,messageTime-dt);
  if (!messageTime) el('feedback').classList.remove('visible');
  renderer.draw(game,game.status === 'paused' ? 0 : dt); renderHud(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
