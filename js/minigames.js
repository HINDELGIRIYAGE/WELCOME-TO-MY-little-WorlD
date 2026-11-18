/* Stardust Snap — games menu + Tic-Tac-Toe (vs computer) + Snake */
'use strict';
(() => {
const btn = document.getElementById('gameBtn');
if(!btn) return;
const sfx = n => window.Sfx && Sfx.play(n);
let layer = null;

function close(){ if(layer){ layer.cleanup && layer.cleanup(); layer.el.remove(); layer = null; document.body.classList.remove('gaming'); } }
function open(html, cleanup){
  close();
  const el = document.createElement('div'); el.className = 'gm-layer'; el.innerHTML = html;
  document.body.appendChild(el); document.body.classList.add('gaming');
  layer = {el, cleanup};
  el.querySelector('.gm-x')?.addEventListener('click', close);
  return el;
}
addEventListener('keydown', e => { if(e.key === 'Escape' && layer) close(); });

/* ---------- menu ---------- */
function menu(){
  const el = open(`<div class="gm-box"><button class="gm-x" type="button">✕</button>
    <h2>// SELECT GAME</h2>
    <button class="gm-opt" data-g="def">[01] Lyoko Defender<small>shoot the XANA bits</small></button>
    <button class="gm-opt" data-g="ttt">[02] Tic-Tac-Toe<small>you vs the supercomputer</small></button>
    <button class="gm-opt" data-g="snk">[03] Snake<small>eat data, don't crash</small></button></div>`);
  el.querySelectorAll('.gm-opt').forEach(b => b.addEventListener('click', () => {
    const g = b.dataset.g; close();
    if(g === 'def') window.startDefender && startDefender();
    if(g === 'ttt') ttt(); if(g === 'snk') snake();
  }));
}
btn.addEventListener('click', menu);

/* ---------- Tic-Tac-Toe ---------- */
function ttt(){
  const L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  let b, over, score = JSON.parse(localStorage.getItem('stardust-ttt') || '{"w":0,"l":0,"d":0}');
  const el = open(`<div class="gm-box"><button class="gm-x" type="button">✕</button>
    <h2>// TIC-TAC-TOE</h2><div class="ttt-grid">${'<button class="ttt-c" type="button"></button>'.repeat(9)}</div>
    <p class="gm-msg"></p><p class="gm-score"></p><button class="gm-opt gm-again" type="button">> New game</button></div>`);
  const cells = [...el.querySelectorAll('.ttt-c')], msg = el.querySelector('.gm-msg'), sc = el.querySelector('.gm-score');
  const win = (bd, p) => L.some(l => l.every(i => bd[i] === p));
  const draw = () => cells.forEach((c, i) => { c.textContent = b[i] || ''; c.className = 'ttt-c ' + (b[i] || ''); });
  const paint = () => sc.textContent = `YOU ${score.w}  ·  PC ${score.l}  ·  DRAW ${score.d}`;
  function finish(r){
    over = true;
    if(r === 'X'){ score.w++; msg.textContent = '> YOU WIN!'; sfx('love'); }
    else if(r === 'O'){ score.l++; msg.textContent = '> SYSTEM WINS'; sfx('fist'); }
    else { score.d++; msg.textContent = '> DRAW'; sfx('peace'); }
    localStorage.setItem('stardust-ttt', JSON.stringify(score)); paint();
  }
  function minimax(bd, p){                       // unbeatable-ish, but picks randomly among equal moves
    if(win(bd, 'O')) return {s: 1}; if(win(bd, 'X')) return {s: -1};
    const free = bd.map((v, i) => v ? -1 : i).filter(i => i >= 0); if(!free.length) return {s: 0};
    let best = null;
    for(const i of free){ bd[i] = p; const r = minimax(bd, p === 'O' ? 'X' : 'O'); bd[i] = null;
      if(best === null || (p === 'O' ? r.s > best.s : r.s < best.s) || (r.s === best.s && Math.random() < .3)) best = {s: r.s, m: i}; }
    return best;
  }
  function reset(){ b = Array(9).fill(null); over = false; msg.textContent = '> YOUR MOVE (X)'; draw(); paint(); }
  cells.forEach((c, i) => c.addEventListener('click', () => {
    if(over || b[i]) return;
    b[i] = 'X'; sfx('point'); draw();
    if(win(b, 'X')) return finish('X'); if(b.every(Boolean)) return finish('D');
    const mv = Math.random() < .2 ? b.map((v, k) => v ? -1 : k).filter(k => k >= 0)[0] : minimax(b.slice(), 'O').m;   // 20% "mistake"
    b[mv] = 'O'; draw();
    if(win(b, 'O')) return finish('O'); if(b.every(Boolean)) finish('D');
  }));
  el.querySelector('.gm-again').addEventListener('click', reset); reset();
}

/* ---------- Snake ---------- */
function snake(){
  const N = 20; let dir, next, sn, food, alive, timer, score, best = +(localStorage.getItem('stardust-snake') || 0), speed;
  const el = open(`<div class="gm-box"><button class="gm-x" type="button">✕</button>
    <h2>// SNAKE</h2><canvas class="snk-cv" width="400" height="400"></canvas>
    <p class="gm-score"></p><p class="gm-msg">arrow keys / WASD / swipe</p></div>`, () => { clearTimeout(timer); removeEventListener('keydown', key); });
  const cv = el.querySelector('canvas'), g = cv.getContext('2d'), S = cv.width / N, sc = el.querySelector('.gm-score'), msg = el.querySelector('.gm-msg');
  function reset(){
    sn = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}]; dir = next = {x: 1, y: 0}; score = 0; speed = 140; alive = true; msg.textContent = 'arrow keys / WASD / swipe';
    place(); clearTimeout(timer); tick();
  }
  function place(){ do { food = {x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N)}; } while(sn.some(s => s.x === food.x && s.y === food.y)); }
  function tick(){
    if(!alive) return;
    dir = next; const h = {x: sn[0].x + dir.x, y: sn[0].y + dir.y};
    if(h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || sn.some(s => s.x === h.x && s.y === h.y)){
      alive = false; if(score > best){ best = score; localStorage.setItem('stardust-snake', best); }
      msg.textContent = '> CRASHED · press Enter / tap to retry'; sfx('fist'); draw(); return;
    }
    sn.unshift(h);
    if(h.x === food.x && h.y === food.y){ score++; speed = Math.max(55, speed - 4); place(); sfx('point'); } else sn.pop();
    draw(); timer = setTimeout(tick, speed);
  }
  function draw(){
    g.fillStyle = '#02050b'; g.fillRect(0, 0, 400, 400);
    g.strokeStyle = 'rgba(77,243,255,.08)'; for(let i = 0; i <= N; i++){ g.beginPath(); g.moveTo(i * S, 0); g.lineTo(i * S, 400); g.moveTo(0, i * S); g.lineTo(400, i * S); g.stroke(); }
    g.shadowBlur = 12; g.shadowColor = '#ff4fd8'; g.fillStyle = '#ff4fd8'; g.fillRect(food.x * S + 4, food.y * S + 4, S - 8, S - 8);
    g.shadowColor = '#4df3ff';
    sn.forEach((s, i) => { g.fillStyle = i ? 'rgba(77,243,255,' + (1 - i / (sn.length + 4)) + ')' : '#ffffff'; g.fillRect(s.x * S + 1, s.y * S + 1, S - 2, S - 2); });
    g.shadowBlur = 0; sc.textContent = `SCORE ${score}  ·  BEST ${best}`;
  }
  function turn(x, y){ if(x !== -dir.x || y !== -dir.y) next = {x, y}; }
  function key(e){
    const k = e.key.toLowerCase();
    if(k === 'arrowup' || k === 'w') turn(0, -1); else if(k === 'arrowdown' || k === 's') turn(0, 1);
    else if(k === 'arrowleft' || k === 'a') turn(-1, 0); else if(k === 'arrowright' || k === 'd') turn(1, 0);
    else if(k === 'enter' && !alive) reset(); else return;
    e.preventDefault();
  }
  addEventListener('keydown', key);
  let sx, sy;                                       // swipe controls
  cv.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; if(!alive) reset(); });
  cv.addEventListener('pointerup', e => {
    const dx = e.clientX - sx, dy = e.clientY - sy; if(Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    Math.abs(dx) > Math.abs(dy) ? turn(dx > 0 ? 1 : -1, 0) : turn(0, dy > 0 ? 1 : -1);
  });
  reset();
}
})();
