import './style.css';
import { Game, POWER_DURATION } from './game.js';
import { World } from './world.js';
const $ = id => document.getElementById(id);
const names = { magnet: 'Coin magnet', jetpack: 'Jetpack', sneakers: 'Super sneakers', multiplier: 'Double score', board: 'Hoverboard' };
const symbols = { magnet: '∩', jetpack: '↑', sneakers: '»', multiplier: '×2', board: '◇' };
const game = new Game();
let world, sound = false, audio, lastCoinSound = 0, best = 0, wallet = 0, skin = 0, toastTime = 0, missionDone = false;
try { const saved = JSON.parse(localStorage.getItem('subway-rush-v2') || '{}'); best = Math.max(0, Number(saved.best) || 0); wallet = Math.max(0, Number(saved.wallet) || 0); skin = [0, 1, 2].includes(saved.skin) ? saved.skin : 0; } catch { /* Local storage is optional. */ }
function save() { try { localStorage.setItem('subway-rush-v2', JSON.stringify({ best, wallet, skin })); } catch { /* Runs remain playable in private contexts. */ } }
function syncHome() { $('homeBest').textContent = best.toLocaleString(); $('wallet').textContent = wallet.toLocaleString(); }
function setState(state) { game.state = state; document.body.dataset.state = state; }
function toast(text, seconds = 2.5) { $('toast').textContent = text; $('toast').hidden = false; toastTime = seconds; }
function tone(frequency, duration = .1, shape = 'sine', volume = .035) {
  if (!sound) return;
  try { audio ??= new AudioContext(); void audio.resume(); const osc = audio.createOscillator(), gain = audio.createGain(); osc.type = shape; osc.frequency.setValueAtTime(frequency, audio.currentTime); osc.frequency.exponentialRampToValueAtTime(frequency * .75, audio.currentTime + duration); gain.gain.setValueAtTime(volume, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration); osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + duration); } catch { /* Sound is optional. */ }
}
function start() {
  game.reset(); setState('running'); missionDone = false; $('home').hidden = true; $('result').hidden = true;
  for (const id of ['hud', 'pause', 'mission', 'playControls', 'touch']) $(id).hidden = false;
  document.activeElement?.blur(); toast('↑ Jump barriers · ↓ Roll under gates', 4); tone(520, .14);
  $('pause').setAttribute('aria-label', 'Pause game'); updateHUD();
}
function showResult(paused) {
  $('result').hidden = false; $('runStats').hidden = paused; $('pauseText').hidden = !paused;
  $('resultKicker').textContent = paused ? 'TAKE A BREATHER' : 'NICE RUN!';
  $('resultTitle').textContent = paused ? 'Paused' : 'Caught you!';
  $('resume').innerHTML = paused ? 'KEEP RUNNING <span aria-hidden="true">▶</span>' : 'RUN AGAIN <span aria-hidden="true">▶</span>';
  if (!paused) {
    const score = Math.floor(game.score), record = score > best;
    best = Math.max(best, score); wallet += game.coins; save(); syncHome();
    $('finalScore').textContent = score.toLocaleString(); $('finalCoins').textContent = game.coins;
    $('finalDistance').textContent = Math.floor(game.distance); $('record').textContent = record ? 'A new personal best!' : `Best score: ${best.toLocaleString()}`;
    $('pause').hidden = true; $('touch').hidden = true; $('playControls').hidden = true; $('toast').hidden = true;
  }
  $('resume').focus();
}
function pause() {
  if (game.state === 'running') { setState('paused'); showResult(true); $('pause').setAttribute('aria-label', 'Resume game'); }
  else if (game.state === 'paused') { setState('running'); $('result').hidden = true; document.activeElement?.blur(); $('pause').setAttribute('aria-label', 'Pause game'); }
}
function goHome() {
  game.reset(); setState('home'); game.entities = [];
  game.train(-1, -17); game.train(1, -37); game.line(0, -9, 12);
  game.add('barrier', 0, -48);
  $('home').hidden = false;
  for (const id of ['hud', 'pause', 'mission', 'playControls', 'touch', 'result', 'toast']) $(id).hidden = true;
  $('powerBars').replaceChildren(); syncHome(); document.activeElement?.blur();
}
function updateHUD() {
  $('score').textContent = Math.floor(game.score).toString().padStart(6, '0'); $('coins').textContent = game.coins;
  $('distance').textContent = `${Math.floor(game.distance)} m`;
  $('multiplier').textContent = game.powers.multiplier ? '★ ×2' : '★ ×1';
  $('boards').textContent = game.boards; $('board').disabled = !!game.board || game.boards === 0 || !!game.powers.jetpack;
  const goal = game.coins >= 50; $('missionLabel').textContent = goal ? 'Run 1,000 meters' : 'Collect 50 coins';
  const value = goal ? Math.min(1000, Math.floor(game.distance)) : Math.min(50, game.coins), target = goal ? 1000 : 50;
  $('missionCount').textContent = `${value}/${target}`; $('missionProgress').style.width = `${Math.min(100, value / target * 100)}%`;
  if (game.coins >= 50 && !missionDone) { missionDone = true; toast('Mission complete: 50 coins!', 3); tone(1200, .25); }
  if (goal && game.distance >= 1000) $('missionLabel').textContent = 'Both missions complete!';
  const active = { ...game.powers, board: game.board };
  for (const [key, time] of Object.entries(active)) {
    let meter = document.getElementById(`meter-${key}`);
    if (!time) { meter?.remove(); continue; }
    if (!meter) {
      meter = document.createElement('div'); meter.id = `meter-${key}`; meter.className = 'power-meter';
      const symbol = document.createElement('span'); symbol.className = 'power-symbol'; symbol.textContent = symbols[key];
      const details = document.createElement('div'), title = document.createElement('b'), progress = document.createElement('div'), fill = document.createElement('i');
      title.textContent = names[key]; progress.className = 'progress'; progress.append(fill); details.append(title, progress); meter.append(symbol, details); $('powerBars').append(meter);
    }
    meter.querySelector('i').style.width = `${time / (key === 'board' ? 30 : POWER_DURATION) * 100}%`;
    meter.setAttribute('aria-label', `${names[key]}: ${Math.ceil(time)} seconds`);
  }
}
function openModal(kind) {
  if (game.state !== 'home') return;
  const content = $('modalContent'); content.replaceChildren();
  if (kind === 'help') {
    content.innerHTML = `<h2>Own the tracks.</h2><div class="instructions"><b>← → / A D</b><span>Switch between three lanes</span><b>↑ / W</b><span>Jump over low barriers</span><b>↓ / S</b><span>Roll under high barriers</span><b>SPACE</b><span>Use a hoverboard. It saves one crash.</span><b>P / ESC</b><span>Pause your run</span></div><p>On a phone, swipe in any direction. Double-tap to activate a hoverboard, or use the on-screen buttons.</p><div class="power-guide"><p><b>Take the high road.</b> Run up wooden ramps onto train roofs. Jump between roofs and dodge oncoming trains.</p><p><b>Grab a boost.</b> Magnets attract coins, super sneakers jump higher, jetpacks fly above traffic, and ×2 stars double distance points. Each lasts 12 seconds.</p><p>You get three hoverboards per run. Each lasts up to 30 seconds. Your high score and collected coins are saved on this device.</p></div>`;
  } else {
    const h = document.createElement('h2'); h.textContent = 'Pick your runner.'; content.append(h);
    const options = document.createElement('div'); options.className = 'skin-options';
    const skins = [['Original', '#f5ead2', '#eb493c'], ['Fresh mint', '#53c2b3', '#774caf'], ['Gold rush', '#ffbf48', '#268dcc']];
    skins.forEach(([name, shirt, cap], index) => {
      const b = document.createElement('button'); b.className = 'skin-choice'; b.setAttribute('aria-pressed', String(index === skin));
      const avatar = document.createElement('span'); avatar.className = 'skin-avatar'; avatar.style.setProperty('--shirt', shirt); avatar.style.setProperty('--cap', cap); avatar.setAttribute('aria-hidden', 'true');
      b.append(avatar, name); b.onclick = () => { skin = index; world.skin(skin); save(); options.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index))); tone(540); }; options.append(b);
    });
    const p = document.createElement('p'); p.textContent = 'Three looks. All unlocked. Same fast feet.'; content.append(options, p);
  }
  $('modal').showModal();
}
$('play').onclick = start; $('pause').onclick = pause;
$('resume').onclick = () => game.state === 'paused' ? pause() : start();
$('homeButton').onclick = goHome; $('runners').onclick = () => openModal('runners'); $('help').onclick = () => openModal('help');
$('closeModal').onclick = () => $('modal').close(); $('reload').onclick = () => location.reload();
$('board').onclick = () => { game.action('board'); $('board').blur(); };
$('sound').onclick = () => { sound = !sound; $('sound').setAttribute('aria-pressed', String(sound)); $('sound').setAttribute('aria-label', sound ? 'Disable sound' : 'Enable sound'); $('soundWaves').setAttribute('d', sound ? 'M16 7c4 2 4 8 0 10M19 3c7 5 7 13 0 18' : 'm16 8 6 8m0-8-6 8'); tone(650); $('sound').blur(); };
const actions = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', ArrowDown: 'slide', KeyS: 'slide', Space: 'board' };
addEventListener('keydown', e => {
  if ($('modal').open) return;
  if (!$('result').hidden && e.code === 'Tab') {
    const first = $('resume'), last = $('homeButton');
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    return;
  }
  if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); if (!e.repeat) pause(); return; }
  if (game.state === 'running' && actions[e.code]) { e.preventDefault(); if (!e.repeat) game.action(actions[e.code]); }
  else if (e.code === 'Enter' && game.state === 'home' && !(e.target instanceof HTMLButtonElement)) start();
});
let touchStart = null, lastTap = 0;
$('world').addEventListener('pointerdown', e => { touchStart = { x: e.clientX, y: e.clientY, id: e.pointerId }; $('world').setPointerCapture(e.pointerId); });
$('world').addEventListener('pointermove', e => {
  if (!touchStart || touchStart.used || e.pointerId !== touchStart.id) return;
  const dx = e.clientX - touchStart.x, dy = e.clientY - touchStart.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) > 22) {
    game.action(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy < 0 ? 'jump' : 'slide');
    touchStart.used = true;
  }
});
$('world').addEventListener('pointerup', e => {
  if (!touchStart || e.pointerId !== touchStart.id) return;
  if (touchStart.used) { touchStart = null; return; }
  const dx = e.clientX - touchStart.x, dy = e.clientY - touchStart.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) > 22) game.action(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy < 0 ? 'jump' : 'slide');
  else { const now = performance.now(); if (now - lastTap < 320) { game.action('board'); lastTap = 0; } else lastTap = now; }
  touchStart = null;
});
$('world').addEventListener('pointercancel', () => touchStart = null);
document.querySelectorAll('[data-action]').forEach(b => {
  b.addEventListener('pointerdown', e => { e.preventDefault(); game.action(b.dataset.action); });
  b.addEventListener('click', e => { if (e.detail === 0) game.action(b.dataset.action); });
});
document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === 'running') pause(); });
addEventListener('resize', () => world?.resize());
$('world').addEventListener('webglcontextlost', e => { e.preventDefault(); if (game.state === 'running') pause(); $('failureText').textContent = 'The graphics connection was interrupted. Reload the game to continue.'; $('failure').hidden = false; });
try { world = new World($('world')); world.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches; world.skin(skin); goHome(); }
catch (error) { $('failureText').textContent = 'The 3D scene could not start. Try reloading. If the problem continues, check that hardware acceleration is enabled.'; $('failure').hidden = false; console.error(error); }
let previous = performance.now(), clock = 0, accumulator = 0;
function frame(now) {
  requestAnimationFrame(frame); if (!world) return;
  const dt = Math.min((now - previous) / 1000, .05); previous = now;
  if (game.state !== 'paused') clock += dt;
  if (game.state === 'running') {
    accumulator += dt;
    while (accumulator >= 1 / 120) { game.update(1 / 120); accumulator -= 1 / 120; }
    for (const event of game.drainEvents()) {
      if (event.type === 'coin') { world.burst(event.x, event.y); if (clock - lastCoinSound > .045) { tone(1000 + game.coins % 5 * 100, .065); lastCoinSound = clock; } }
      if (event.type === 'jump') tone(430, .13);
      if (event.type === 'board') { toast('Hoverboard on — one crash protected'); tone(350, .25, 'triangle'); }
      if (event.type === 'shield') { toast('Board saved you!'); world.burst(game.x, 1, '#7ce6ff', 24); tone(140, .22, 'triangle'); }
      if (event.type === 'power') { toast(`${names[event.power]}!`); world.burst(game.x, 2, '#ffef79', 18); tone(800, .3, 'triangle'); }
      if (event.type === 'crash') { setState('over'); tone(100, .4, 'triangle', .07); showResult(false); }
    }
    updateHUD();
  } else accumulator = 0;
  if (toastTime > 0 && game.state === 'running') { toastTime -= dt; if (toastTime <= 0) $('toast').hidden = true; }
  world.render(game, game.state === 'paused' ? 0 : dt, clock);
}
requestAnimationFrame(frame);
