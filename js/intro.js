/* ==========================================================
   Stardust Snap — "virtualization" intro
   ----------------------------------------------------------
   boot terminal → scanner beam → WELCOME glitch → flash
   Then fires  window 'introdone'  so main.js can start.
   Skip with the button, Enter / Esc, or  ?intro=0  in the URL.
   ========================================================== */
'use strict';

(() => {
const params = new URLSearchParams(location.search);
const intro = document.getElementById('intro');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if(!intro || params.get('intro') === '0' || reduce){
  intro?.remove();
  return;                                   // main.js starts straight away
}
window.__introPlaying = true;

const NAME   = ((params.get('name') || 'Oshani Hind').trim().slice(0, 24)).toUpperCase();
const SECTOR = `${NAME}'S GITHUB`;

const boot = document.getElementById('boot');
const fx = document.getElementById('introFx'), g = fx.getContext('2d');
const dpr = Math.min(devicePixelRatio || 1, 2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let done = false, phase = 'rain';

/* ---------- background: falling code + pixels pulled into the beam ---------- */
let cols = [], bits = [];
function sizeFx(){
  fx.width = Math.max(1, innerWidth * dpr); fx.height = Math.max(1, innerHeight * dpr);
  const n = Math.ceil(fx.width / (16 * dpr));
  cols = Array.from({length: n}, (_, i) => ({x: i * 16 * dpr, y: Math.random() * fx.height, sp: (2 + Math.random() * 5) * dpr}));
}
sizeFx(); addEventListener('resize', sizeFx);

const accent = () => getComputedStyle(intro).getPropertyValue('--c').trim() || '57,255,136';
function loop(){
  if(done) return;
  const c = accent();
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, fx.width, fx.height);   // fading trails
  g.font = `${13 * dpr}px "Share Tech Mono", monospace`;
  const pull = phase === 'beam';
  for(const col of cols){
    col.y += col.sp * (pull ? 2.2 : 1);
    if(col.y > fx.height + 20) col.y = -20;
    g.fillStyle = `rgba(${c},${pull ? .25 : .35})`;
    g.fillText(Math.random() < .5 ? '0' : '1', col.x, col.y);
    if(pull && Math.random() < .25){               // spawn a pixel that flies to the beam
      bits.push({x: col.x, y: col.y, life: 1});
    }
  }
  if(pull){
    const cx = fx.width / 2;
    for(const b of bits){
      b.x += (cx - b.x) * .08; b.y -= 1.5 * dpr; b.life -= .02;
      g.fillStyle = `rgba(${c},${b.life})`;
      g.fillRect(b.x, b.y, 3 * dpr, 3 * dpr);
    }
    bits = bits.filter(b => b.life > 0);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ---------- text helpers ---------- */
async function typeLine(text, speed = 18){
  const line = document.createElement('div');
  line.className = 'boot-line';
  boot.appendChild(line);
  for(let i = 1; i <= text.length && !done; i++){
    line.textContent = text.slice(0, i);
    await sleep(speed);
  }
  return line;
}

const GLYPHS = '!<>-_\\/[]{}=+*^?#01ABCDEFXZ';
function scramble(el, finalText, ms = 1200){
  return new Promise(res => {
    const start = performance.now();
    (function tick(now){
      const p = Math.min(1, (now - start) / ms);
      const fixed = Math.floor(p * finalText.length);
      el.textContent = finalText.split('').map((ch, i) =>
        i < fixed || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join('');
      if(p < 1 && !done) requestAnimationFrame(tick); else { el.textContent = finalText; res(); }
    })(start);
  });
}

/* ---------- the sequence ---------- */
async function play(){
  await sleep(400);
  const lines = [
    ['> SUPERCOMPUTER ONLINE ............. ', 'OK'],
    ['> TOWER ACTIVATED .................. ', 'OK'],
    ['> LOADING LYOKO_OS v2.0 ............ ', 'OK'],
    [`> TRANSFER ${NAME}`, ''],
    [`> SCANNER ${NAME}`, ''],
  ];
  for(const [txt, ok] of lines){
    if(done) return;
    const l = await typeLine(txt);
    if(ok){ const s = document.createElement('span'); s.className = 'ok'; s.textContent = ok; l.appendChild(s); }
    await sleep(160);
  }

  // progress bar
  const bar = await typeLine('> VIRTUALIZATION! ');
  const meter = document.createElement('span'); meter.className = 'meter';
  bar.appendChild(meter);
  for(let p = 0; p <= 100 && !done; p += 4){
    const filled = Math.round(p / 5);
    meter.textContent = `[${'█'.repeat(filled)}${'░'.repeat(20 - filled)}] ${p}%`;
    await sleep(45);
  }
  if(done) return;
  await sleep(350);

  // scanner beam
  intro.classList.add('beam-on'); phase = 'beam'; window.Sfx && Sfx.play('beam');
  const info = document.getElementById('sysinfo');
  const hex = () => Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
  const iv = setInterval(() => {
    if(done) return clearInterval(iv);
    info.textContent = `SCAN  ${(Math.random() * 100).toFixed(1)}%\nSTAR_COUNT  ${2000 + Math.floor(Math.random() * 99)}\nMEM  0x${hex()}${hex()}\nSIGNAL  ${'|'.repeat(4 + Math.floor(Math.random() * 12))}`;
  }, 90);
  await sleep(1500);
  if(done) return;

  // welcome
  intro.classList.add('welcome-on');
  const w3 = intro.querySelector('.w3');
  await sleep(500);
  await scramble(w3, SECTOR, 1300);
  w3.dataset.text = SECTOR;
  await sleep(500);
  document.getElementById('stamp').classList.add('show'); window.Sfx && Sfx.play('grant');
  if(navigator.vibrate) navigator.vibrate([40, 30, 80]);
  await sleep(1500);
  finish();
}

function finish(){
  if(done) return;
  done = true;
  intro.classList.add('flash');
  window.__introPlaying = false;
  dispatchEvent(new Event('introdone'));
  setTimeout(() => intro.classList.add('gone'), 350);
  setTimeout(() => intro.remove(), 1400);
}

intro.querySelector('.skip').addEventListener('click', finish);
addEventListener('keydown', e => { if(e.key === 'Escape' || e.key === 'Enter') finish(); });

document.fonts.ready.catch(() => {}).then(play);
setTimeout(finish, 20000);                  // safety net
})();
