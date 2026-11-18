/* Stardust Snap — "Lyoko Defender" mini game (Tech theme)
   Move: mouse / touch / ← →   |   Auto-fire   |   Esc or ✕ to quit */
'use strict';
(() => {
const btn = document.getElementById('gameBtn');
if(!btn) return;

let cv, g, raf, running = false;
let W, H, dpr, ship, bullets, foes, parts, stars, score, lives, level, last, spawnT, shotT, keys = {}, over;
let best = +(localStorage.getItem('stardust-best') || 0);

function sfx(n){ window.Sfx && Sfx.play(n); }

function start(){
  document.body.classList.add('gaming');
  cv = document.createElement('canvas'); cv.id = 'gameCv'; document.body.appendChild(cv);
  g = cv.getContext('2d'); dpr = Math.min(devicePixelRatio || 1, 2);
  resize(); addEventListener('resize', resize);
  const hud = document.createElement('div'); hud.id = 'gameHud';
  hud.innerHTML = '<span id="gScore">SCORE 0</span><span id="gLevel">LV 1</span><span id="gLives"></span><button id="gQuit" type="button">✕</button>';
  document.body.appendChild(hud);
  hud.querySelector('#gQuit').addEventListener('click', stop);
  reset(); running = true; last = performance.now(); raf = requestAnimationFrame(loop);
  addEventListener('keydown', onKey); addEventListener('keyup', onKeyUp);
  cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerdown', onMove);
}
function stop(){
  running = false; cancelAnimationFrame(raf);
  removeEventListener('resize', resize); removeEventListener('keydown', onKey); removeEventListener('keyup', onKeyUp);
  document.getElementById('gameHud')?.remove(); cv?.remove();
  document.body.classList.remove('gaming');
}
function resize(){ W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; cv.style.width = '100%'; cv.style.height = '100%'; if(ship) ship.y = H - 90 * dpr; }
function reset(){
  ship = {x: W / 2, y: H - 90 * dpr, w: 22 * dpr};
  bullets = []; foes = []; parts = []; score = 0; lives = 3; level = 1; spawnT = 0; shotT = 0; over = false;
  stars = Array.from({length: 90}, () => ({x: Math.random() * W, y: Math.random() * H, s: (.5 + Math.random() * 2) * dpr}));
  hud();
}
function hud(){
  document.getElementById('gScore').textContent = 'SCORE ' + score;
  document.getElementById('gLevel').textContent = 'LV ' + level + ' · BEST ' + best;
  document.getElementById('gLives').textContent = '♥'.repeat(Math.max(0, lives));
}
function onMove(e){ if(over){ if(e.type === 'pointerdown') reset(); return; } ship.x = Math.max(ship.w, Math.min(W - ship.w, e.clientX * dpr)); }
function onKey(e){
  if(e.key === 'Escape') return stop();
  keys[e.key] = true;
  if(over && (e.key === 'Enter' || e.key === ' ')) reset();
  e.stopPropagation();
}
function onKeyUp(e){ keys[e.key] = false; }

function spawn(){
  const type = Math.random() < .18 + level * .02 ? 'tank' : 'bit';
  foes.push({x: 30 * dpr + Math.random() * (W - 60 * dpr), y: -20 * dpr, type,
    hp: type === 'tank' ? 3 : 1, r: (type === 'tank' ? 22 : 13) * dpr,
    vy: (type === 'tank' ? .9 : 1.6 + Math.random()) * (1 + level * .12) * dpr, ph: Math.random() * 6});
}
function boom(x, y, n, col){
  for(let i = 0; i < n; i++){ const a = Math.random() * 6.28, s = (1 + Math.random() * 4) * dpr; parts.push({x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 1, col}); }
}

function loop(now){
  if(!running) return;
  const dt = Math.min(2, (now - last) / 16.7); last = now;
  update(dt); draw();
  raf = requestAnimationFrame(loop);
}

function update(dt){
  if(over) return;
  if(keys.ArrowLeft || keys.a) ship.x = Math.max(ship.w, ship.x - 9 * dpr * dt);
  if(keys.ArrowRight || keys.d) ship.x = Math.min(W - ship.w, ship.x + 9 * dpr * dt);
  shotT -= dt; if(shotT <= 0){ bullets.push({x: ship.x, y: ship.y - 18 * dpr}); shotT = 9; }
  spawnT -= dt; if(spawnT <= 0){ spawn(); spawnT = Math.max(14, 55 - level * 5); }
  bullets.forEach(b => b.y -= 12 * dpr * dt); bullets = bullets.filter(b => b.y > -10);
  for(const f of foes){ f.y += f.vy * dt; f.x += Math.sin(f.y / 40 + f.ph) * .8 * dpr * dt; }
  for(const f of foes) for(const b of bullets){
    if(!b.dead && Math.hypot(b.x - f.x, b.y - f.y) < f.r + 4 * dpr){ b.dead = true; f.hp--; boom(b.x, b.y, 4, '#4df3ff');
      if(f.hp <= 0){ f.dead = true; score += f.type === 'tank' ? 30 : 10; boom(f.x, f.y, 18, f.type === 'tank' ? '#ff4fd8' : '#7cf0ff'); sfx('point'); } }
  }
  bullets = bullets.filter(b => !b.dead);
  for(const f of foes){
    if(!f.dead && f.y > H - 40 * dpr){ f.dead = true; lives--; boom(f.x, H - 40 * dpr, 24, '#ff4f4f'); sfx('fist'); }
    else if(!f.dead && Math.hypot(f.x - ship.x, f.y - ship.y) < f.r + ship.w * .7){ f.dead = true; lives--; boom(ship.x, ship.y, 30, '#ff4f4f'); sfx('fist'); }
  }
  foes = foes.filter(f => !f.dead);
  const nl = 1 + Math.floor(score / 200); if(nl > level){ level = nl; sfx('peace'); }
  if(lives <= 0){ over = true; if(score > best){ best = score; localStorage.setItem('stardust-best', best); } sfx('open'); }
  parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.l -= .03 * dt; }); parts = parts.filter(p => p.l > 0);
  stars.forEach(s => { s.y += s.s * .6 * dt; if(s.y > H) s.y = 0; });
  hud();
}

function draw(){
  g.fillStyle = 'rgba(2,5,11,.35)'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#9fe9ff'; stars.forEach(s => { g.globalAlpha = .5; g.fillRect(s.x, s.y, s.s, s.s); });
  g.globalAlpha = 1;
  // core line (what you defend)
  g.strokeStyle = 'rgba(77,243,255,.6)'; g.lineWidth = 2 * dpr; g.setLineDash([10 * dpr, 8 * dpr]);
  g.beginPath(); g.moveTo(0, H - 40 * dpr); g.lineTo(W, H - 40 * dpr); g.stroke(); g.setLineDash([]);
  g.font = (11 * dpr) + 'px "Share Tech Mono", monospace'; g.fillStyle = 'rgba(77,243,255,.6)'; g.textAlign = 'center';
  g.fillText('LYOKO CORE', W / 2, H - 22 * dpr);
  // bullets
  g.fillStyle = '#4df3ff'; g.shadowColor = '#4df3ff'; g.shadowBlur = 10 * dpr;
  bullets.forEach(b => g.fillRect(b.x - 2 * dpr, b.y - 8 * dpr, 4 * dpr, 14 * dpr));
  // foes (XANA bits)
  for(const f of foes){
    g.shadowColor = f.type === 'tank' ? '#ff4fd8' : '#7cf0ff'; g.strokeStyle = g.shadowColor; g.lineWidth = 2 * dpr; g.fillStyle = 'rgba(0,0,0,.6)';
    g.beginPath(); for(let i = 0; i < 4; i++){ const a = i * Math.PI / 2 + Math.PI / 4 + f.y / 60; g.lineTo(f.x + Math.cos(a) * f.r * 1.3, f.y + Math.sin(a) * f.r * 1.3); }
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = g.strokeStyle; g.fillText(f.type === 'tank' ? 'X' : (f.ph > 3 ? '1' : '0'), f.x, f.y + 4 * dpr);
  }
  // ship
  g.shadowColor = '#4df3ff'; g.fillStyle = '#d6fbff'; g.strokeStyle = '#4df3ff';
  g.beginPath(); g.moveTo(ship.x, ship.y - 20 * dpr); g.lineTo(ship.x + ship.w, ship.y + 14 * dpr); g.lineTo(ship.x, ship.y + 6 * dpr); g.lineTo(ship.x - ship.w, ship.y + 14 * dpr); g.closePath(); g.fill(); g.stroke();
  // particles
  parts.forEach(p => { g.globalAlpha = p.l; g.fillStyle = p.col; g.shadowColor = p.col; g.fillRect(p.x, p.y, 3 * dpr, 3 * dpr); });
  g.globalAlpha = 1; g.shadowBlur = 0;
  if(over){
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#4df3ff'; g.font = '800 ' + (40 * dpr) + 'px Orbitron, sans-serif'; g.fillText('CORE LOST', W / 2, H / 2 - 20 * dpr);
    g.font = (16 * dpr) + 'px "Share Tech Mono", monospace'; g.fillStyle = '#d6fbff';
    g.fillText('SCORE ' + score + '   BEST ' + best, W / 2, H / 2 + 18 * dpr);
    g.fillText('click / Enter to retry · Esc to quit', W / 2, H / 2 + 48 * dpr);
  }
}

window.startDefender = () => { if(!running) start(); };
})();
