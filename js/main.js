/* ==========================================================
   Stardust Snap — universe, stardust name & heart animation
   ----------------------------------------------------------
   Flow:  gather → formed → (snap) boom → heart → burst → gather
   ========================================================== */
'use strict';

(() => {

/* ---------- Settings (change these to customise) ---------- */
const CONFIG = {
  name: 'Oshani Hind',                           // or use  ?name=YourName  in the URL
  theme: 'tech',                                 // 'tech' or 'deco'  (or ?theme=deco)
};

const THEMES = {
  tech: {                                        // neon, futuristic
    label: 'Tech', tagline: '// written in code',
    font: '800 {size}px "Orbitron", sans-serif', thicken: 0, upper: true,
    color: '#4df3ff',
    colors: ['#4df3ff', '#a78bfa', '#3b82ff', '#34f5a4', '#ff4fd8', '#ffffff'],
    heartColors: ['#ffffff', '#c9fbff', '#7cf0ff', '#3fd0ff', '#3b82ff', '#7c4dff'],
    fw: ['#4df3ff', '#a78bfa', '#3b82ff', '#34f5a4', '#ff4fd8', '#ffffff'],
    minis: ['#4df3ff', '#a78bfa', '#ff4fd8'], pixelHearts: true,
    star: '#bdf6ff', glitter: '#4df3ff',
    heartRim: '#3fd0ff', heartFill: '#7c4dff', wave: '#4df3ff', flash: '77,243,255',
  },
  deco: {                                        // Sakura: soft pink, falling petals
    label: 'Sakura', tagline: 'made with love ♡',
    font: '400 {size}px "Great Vibes", cursive', thicken: .03, upper: false,
    color: '#ffb7d5',
    colors: ['#ffb7d5', '#ff8fb8', '#e7c6ff', '#b8e8ff', '#fff0f6', '#ffd6a5'],
    heartColors: ['#fff5fa', '#ffd9ea', '#ffb7d5', '#ff8fb8', '#ff6b9d', '#e84a85'],
    fw: ['#ffb7d5', '#ff8fb8', '#e7c6ff', '#b8e8ff', '#fff0f6', '#ffd6a5'],
    minis: ['#ffb7d5', '#ff8fb8', '#e7c6ff'], pixelHearts: false,
    star: '#ffe0ee', glitter: '#ffb7d5',
    heartRim: '#ff8fb8', heartFill: '#ffb7d5', wave: '#ffb7d5', flash: '255,183,213',
  },};

const params = new URLSearchParams(location.search);
const urlName = params.get('name');
const RAW_NAME = (urlName && urlName.trim().slice(0, 24)) || CONFIG.name;
let themeName = THEMES[params.get('theme')] ? params.get('theme') : CONFIG.theme;

let T = THEMES[themeName];
let WORD = T.upper ? RAW_NAME.toUpperCase() : RAW_NAME;

const cv  = document.getElementById('space');
const ctx = cv.getContext('2d');
const dpr = Math.min(devicePixelRatio || 1, 2);

let W, H, CX, CY, HS;                 // canvas size, centre, heart scale
let dust = [], stars = [], galaxy = [], rain = [], waves = [], sparks = [], minis = [], fireworks = [];
let nameColor = T.color, nameLayout;
let nameGlow, heartGlow;              // pre-blurred glow images
let state = 'gather', timer = 0, heartStart = 0, glowA = 0, heartA = 0;
const pointer = {x: -9999, y: -9999};

/* ==========================================================
   Helpers
   ========================================================== */
function mixWhite(hex, t){            // lighten a colour towards white
  const n = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return '#' + n.map(v => Math.round(v + (255 - v) * t).toString(16).padStart(2, '0')).join('');
}

function makeSprite(color){           // soft glowing dot
  const s = document.createElement('canvas'); s.width = s.height = 64;
  const g = s.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(.12, color);
  gr.addColorStop(.35, color + '55'); gr.addColorStop(1, color + '00');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return s;
}

function makeFlare(color){            // 4-point star sparkle ✦
  const s = document.createElement('canvas'); s.width = s.height = 128;
  const g = s.getContext('2d');
  g.translate(64, 64);
  for(const [w, h] of [[128, 3], [3, 128]]){
    const gr = w > h ? g.createLinearGradient(-64, 0, 64, 0) : g.createLinearGradient(0, -64, 0, 64);
    gr.addColorStop(0, color + '00'); gr.addColorStop(.5, '#ffffff'); gr.addColorStop(1, color + '00');
    g.fillStyle = gr; g.fillRect(-w / 2, -h / 2, w, h);
  }
  g.drawImage(makeSprite(color), -24, -24, 48, 48);
  return s;
}

// name: one colour, with a few lighter shades for depth
let nameSprites, nameFlare, fwSprites, heartSprites, starSprite, glitterFlare, heartFlare, miniHearts;
function buildNameSprites(){
  nameSprites = [nameColor, mixWhite(nameColor, .35), mixWhite(nameColor, .7)].map(makeSprite);
  nameFlare = makeFlare(nameColor);
}
function buildThemeSprites(){
  buildNameSprites();
  fwSprites    = T.fw.map(makeSprite);
  heartSprites = T.heartColors.map(makeSprite);
  starSprite   = makeSprite(T.star);
  glitterFlare = makeFlare(T.glitter);
  heartFlare   = makeFlare(T.glitter);
  miniHearts   = T.minis.map(c => T.pixelHearts ? makePixelHeart(c) : makeMiniHeart(c));
}

function makeMiniHeart(color){        // small glowing heart ♥ for the floating hearts
  const s = document.createElement('canvas'); s.width = s.height = 64;
  const g = s.getContext('2d');
  g.shadowColor = color; g.shadowBlur = 14; g.fillStyle = color;
  g.beginPath();
  for(let i = 0; i <= 60; i++){
    const p = heartXY(i / 60 * Math.PI * 2, 1);
    g.lineTo(32 + p.x * 1.35, 34 + p.y * 1.35);
  }
  g.fill();
  return s;
}
function makePixelHeart(color){       // 8-bit pixel heart for the tech theme
  const map = ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000'];
  const s = document.createElement('canvas'); s.width = s.height = 64;
  const g = s.getContext('2d');
  g.shadowColor = color; g.shadowBlur = 10; g.fillStyle = color;
  map.forEach((row, y) => [...row].forEach((c, x) => { if(c === '1') g.fillRect(4 + x * 7, 8 + y * 7, 6, 6); }));
  return s;
}
buildThemeSprites();

/* ==========================================================
   1. The name → target points (wraps to 2 lines on phones)
   ========================================================== */
function layoutName(){
  const o = document.createElement('canvas').getContext('2d');
  // real ink width (script fonts have swashes that stick out of the normal box)
  const inkW = (txt, sz) => {
    o.font = T.font.replace('{size}', sz);
    const m = o.measureText(txt);
    return Math.max(m.width, m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
  };
  const MAXW = W * .82;
  const single = WORD.replace(/ /g, '\u2002');            // extra space between words
  let size = Math.min(H * (T.upper ? .2 : .26), (T.upper ? 150 : 210) * dpr);
  let lines = [single];
  if(W < H && inkW(single, size) > MAXW && WORD.includes(' ')){     // portrait → two lines
    lines = WORD.split(' ');
    const widest = Math.max(...lines.map(l => inkW(l, 100)));
    size = Math.min(size * 1.15, MAXW / (widest / 100));
  } else if(inkW(single, size) > MAXW){
    size = MAXW / (inkW(single, 100) / 100);
  }
  return {size, lines, lh: size * 1.0};
}

function drawName(g, L, fill){
  g.font = T.font.replace('{size}', L.size);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fill;
  const top = CY - (L.lines.length - 1) * L.lh / 2;
  g.strokeStyle = fill; g.lineWidth = L.size * T.thicken; g.lineJoin = 'round';   // thicken thin script fonts
  L.lines.forEach((l, i) => { g.fillText(l, CX, top + i * L.lh); if(T.thicken) g.strokeText(l, CX, top + i * L.lh); });
}

function nameTargets(){
  const L = layoutName();
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const o = off.getContext('2d');
  drawName(o, L, '#fff');

  nameLayout = L;
  buildNameGlow();

  const data = o.getImageData(0, 0, W, H).data;
  const step = Math.max(2.5 * dpr, Math.round(L.size / 48));
  const pts = [];
  for(let y = 0; y < H; y += step)
    for(let x = 0; x < W; x += step)
      if(data[(y * W + x) * 4 + 3] > 130) pts.push({x, y});
  return pts;
}

function buildNameGlow(){                // soft bloom behind the letters
  nameGlow = document.createElement('canvas'); nameGlow.width = W; nameGlow.height = H;
  const ng = nameGlow.getContext('2d');
  ng.filter = `blur(${nameLayout.size * .12}px)`;
  drawName(ng, nameLayout, nameColor);
}

/* heart:  x = 16sin³t ,  y = 13cos t − 5cos2t − 2cos3t − cos4t */
function heartXY(t, k){
  return {x: 16 * Math.pow(Math.sin(t), 3) * k,
          y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * k};
}
let heartPath, pathCtx;
function heartPoint(){
  if(!heartPath){
    heartPath = new Path2D();
    for(let i = 0; i <= 200; i++){ const p = heartXY(i / 200 * Math.PI * 2, 1); heartPath.lineTo(p.x, p.y); }
    pathCtx = document.createElement('canvas').getContext('2d');
  }
  const r = Math.random();
  let p, edge = false;
  if(r < .38){                                   // bright outline
    p = heartXY(Math.random() * Math.PI * 2, 1 + (Math.random() - .5) * .03); edge = true;
  } else if(r < .5){                             // soft inner outline
    p = heartXY(Math.random() * Math.PI * 2, .9 + (Math.random() - .5) * .03);
  } else {                                       // evenly filled inside (no seam)
    do { p = {x: (Math.random() * 2 - 1) * 16, y: -16 + Math.random() * 29}; }
    while(!pathCtx.isPointInPath(heartPath, p.x, p.y));
  }
  // shade: light at the top-left, deeper red towards the bottom-right → 3D look
  const shade = Math.min(1, Math.max(0, ((p.x + 9) * .5 + (p.y + 9)) / 34 + (Math.random() - .5) * .25));
  p.c = edge ? (Math.random() < .5 ? 0 : 1) : 1 + Math.round(shade * 4);
  return p;
}
function buildHeartGlow(){
  const R = HS * 22;
  heartGlow = document.createElement('canvas'); heartGlow.width = heartGlow.height = Math.ceil(R * 2);
  const g = heartGlow.getContext('2d');
  g.beginPath();
  for(let i = 0; i <= 100; i++){
    const p = heartXY(i / 100 * Math.PI * 2, 1);
    g.lineTo(R + p.x * HS, R + p.y * HS);
  }
  g.closePath();
  // glowing rim + a very faint inner light
  g.filter = `blur(${HS * 1.4}px)`;
  g.strokeStyle = T.heartRim; g.lineWidth = HS * 1.6; g.stroke();
  g.filter = `blur(${HS * 3}px)`;
  g.globalAlpha = .25; g.fillStyle = T.heartFill; g.fill();
}

function scatter(p){
  const a = Math.random() * Math.PI * 2, d = Math.max(W, H) * (.4 + Math.random() * .5);
  p.x = CX + Math.cos(a) * d; p.y = CY + Math.sin(a) * d;
  p.vx = 0; p.vy = 0; p.a = 0;
}
function buildDust(){
  dust = nameTargets().map(tg => {
    const hp = heartPoint(), rnd = Math.random();
    const p = {
      tx: tg.x, ty: tg.y, hx: hp.x, hy: hp.y,
      ci: rnd < .7 ? 0 : rnd < .92 ? 1 : 2,                   // mostly main colour
      hci: hp.c,
      flare: Math.random() < .018,                           // a few big sparkles
      r: (Math.random() * 1.1 + 1) * dpr, seed: Math.random() * 1000,
    };
    scatter(p); return p;
  });
}

/* ==========================================================
   2. Background helpers: rising data bits + twinkling stars
   ========================================================== */
function newBubble(fromBottom){
  return {x: Math.random() * W, y: fromBottom ? H + Math.random() * H * .1 : Math.random() * H,
          r: (1 + Math.random() * 3.5) * dpr, vy: (.3 + Math.random() * .9) * dpr,
          sway: Math.random() * 6, a: .2 + Math.random() * .45};
}
function newGlitter(){
  return {x: Math.random() * W, y: Math.random() * H, s: (.8 + Math.random() * 1.8) * dpr,
          tw: Math.random() * 6, sp: .6 + Math.random() * 2, flare: Math.random() < .12};
}

function setup(){
  W = cv.width  = Math.floor(innerWidth * dpr);
  H = cv.height = Math.floor(innerHeight * dpr);
  CX = W / 2; CY = H * .44; HS = Math.min(W, H) / (W > H ? 52 : 46);
  stars  = Array.from({length: 260}, newGlitter);
  galaxy = Array.from({length: 70}, () => newBubble(false));
  buildDust(); buildHeartGlow();
  setState('gather');
}

function setState(s){
  state = s; timer = 0;
  document.body.classList.toggle('formed', s === 'formed');
  if(s === 'formed') document.body.classList.add('ready');
}

/* ==========================================================
   3. SNAP → BOOM → heart → burst
   ========================================================== */
function snap(){
  if(state !== 'formed') return;
  setState('boom');
  dust.forEach(p => {
    const dx = p.x - CX, dy = p.y - CY, d = Math.hypot(dx, dy) || 1;
    const sp = (6 + Math.random() * 14) * dpr;
    p.vx = dx / d * sp + (Math.random() - .5) * 6 * dpr;
    p.vy = dy / d * sp + (Math.random() - .5) * 6 * dpr;
  });
  waves.push({r: 0, a: 1}, {r: -60 * dpr, a: .7});
}
/* ✊ bring the name back */
function gatherName(){
  if(state === 'gather' || state === 'formed') return false;
  dust.forEach(p => { if(p.a <= 0) scatter(p); else p.a = Math.max(p.a, .4); });
  setState('gather'); timer = 60;
  return true;
}

/* ✌️ next colour */
function nextColor(){
  const list = T.colors, i = list.indexOf(nameColor);
  nameColor = list[(i + 1) % list.length];
  buildNameSprites(); buildNameGlow();
  document.documentElement.style.setProperty('--accent', nameColor);
  dust.forEach(p => { p.vx += (Math.random() - .5) * 8 * dpr; p.vy += (Math.random() - .5) * 8 * dpr; });  // little shimmer
  return true;
}

/* 👍 fireworks */
function launchFireworks(){
  for(let k = 0; k < 4; k++) setTimeout(() => {
    const x = W * (.15 + Math.random() * .7), y = H * (.12 + Math.random() * .35);
    const c = Math.floor(Math.random() * fwSprites.length), n = 110;
    for(let i = 0; i < n; i++){
      const a = i / n * Math.PI * 2, sp = (2.5 + Math.random() * 6.5) * dpr;
      fireworks.push({x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1,
                      c: Math.random() < .8 ? c : 5, size: (8 + Math.random() * 9) * dpr});
    }
  }, k * 380);
  return true;
}

/* 🤟 rain of little hearts */
function loveRain(){
  for(let i = 0; i < 70; i++) setTimeout(() => {
    minis.push({x: Math.random() * W, y: H + 20 * dpr, vy: -(1.2 + Math.random() * 2.2) * dpr,
                sway: Math.random() * 6, size: (14 + Math.random() * 22) * dpr, life: 1.4, decay: .0035, c: Math.floor(Math.random() * 3)});
  }, i * 35);
  return true;
}

/* ☝️ magic wand: x, y are 0–1 screen positions (or null to stop) */
function wand(x, y){
  if(x == null){ pointer.x = pointer.y = -9999; return; }
  pointer.x = x * W; pointer.y = y * H;
  addSparks(pointer.x, pointer.y, 3);
}

/* switch theme (Tech ⇄ Sakura) */
function setTheme(name){
  if(!THEMES[name]) return;
  themeName = name; T = THEMES[name];
  WORD = T.upper ? RAW_NAME.toUpperCase() : RAW_NAME;
  nameColor = T.color;
  document.body.classList.remove('theme-tech', 'theme-deco');
  document.body.classList.add('theme-' + name);
  document.documentElement.style.setProperty('--accent', nameColor);
  const tag = document.querySelector('.tagline'); if(tag) tag.textContent = T.tagline;
  const tb = document.getElementById('themeBtn');
  if(tb) tb.textContent = '◐ ' + THEMES[name === 'tech' ? 'deco' : 'tech'].label;
  try { localStorage.setItem('stardust-theme', name); } catch {}
  buildThemeSprites();
  if(W) document.fonts.load(T.font.replace('{size}', 100)).then(setup);
}
function toggleTheme(){
  document.querySelectorAll('.welcome-card').forEach(e => e.remove());
  setTheme(themeName === 'tech' ? 'deco' : 'tech');
  if(themeName === 'deco'){ cuteCard(); }
}

function cuteCard(){
  document.querySelectorAll('.welcome-card').forEach(e => e.remove());
  const c = document.createElement('div'); c.className = 'welcome-card';
  c.innerHTML = '<h2>Hi, I am Oshani Hind ♡</h2><p class="big">Welcome to my tech world</p><p>I am a CS &amp; AI undergraduate<br>who is passionate about tech &amp; robotics</p>';
  c.addEventListener('pointerdown', e => e.stopPropagation());
  document.body.appendChild(c);
}
// public API used by hand-tracking.js
window.Stardust = {
  snap: () => { if(state !== 'formed') return false; snap(); return true; },
  gatherName, nextColor, launchFireworks, loveRain, wand, toggleTheme,
  isReady: () => state === 'formed',
};

/* ==========================================================
   4. Animation loop
   ========================================================== */
function drawBackdrop(t){
  if(themeName === 'tech') techBackdrop(t); else decoBackdrop(t);
}

/* pink falling 1 / 0 rain for Sakura */
function pinkRain(t){
  const cw = 18 * dpr, n = Math.ceil(W / cw);
  if(rain.length !== n) rain = Array.from({length: n}, (_, i) => ({x: i * cw + cw / 2, y: Math.random() * H, sp: (2 + Math.random() * 5) * dpr, len: 6 + Math.floor(Math.random() * 12), on: Math.random() < .5}));
  ctx.font = (13 * dpr) + 'px "Share Tech Mono", monospace'; ctx.textAlign = 'center';
  for(const c of rain){
    if(!c.on){ if(Math.random() < .004) c.on = true; continue; }
    c.y += c.sp;
    if(c.y - c.len * cw > H){ c.y = -cw; c.sp = (2 + Math.random() * 5) * dpr; c.on = Math.random() < .8; }
    for(let k = 0; k < c.len; k++){
      const yy = c.y - k * cw;
      if(yy < 0 || yy > H) continue;
      ctx.globalAlpha = k === 0 ? .95 : .45 * (1 - k / c.len);
      ctx.fillStyle = k === 0 ? '#ffffff' : '#ff8fb8';
      ctx.fillText(Math.sin(c.x * 12.9 + Math.floor(yy / cw) * 78.2 + Math.floor(t * 3 + k)) > 0 ? '1' : '0', c.x, yy);
    }
  }
  ctx.globalAlpha = 1;
}
/* ---- Sakura: pink glow, twinkles, falling petals ---- */
function decoBackdrop(t){
  ctx.globalAlpha = 1; pinkRain(t);
}

/* ---- Tech: neon grid floor, scan line, rising data ---- */
const PAL = {
  tech: {glow1:'rgba(40,120,255,.14)', glow0:'rgba(40,120,255,0)', line:'#3fd0ff', haze1:'rgba(60,160,255,.18)', haze0:'rgba(60,160,255,0)', scan0:'rgba(77,243,255,0)', scan1:'rgba(77,243,255,.07)', txt:'#7cf0ff', rain:'#4df3ff'},
  deco: {glow1:'rgba(255,60,160,.16)', glow0:'rgba(255,60,160,0)', line:'#ff7ac0', haze1:'rgba(255,100,190,.2)', haze0:'rgba(255,100,190,0)', scan0:'rgba(255,143,184,0)', scan1:'rgba(255,143,184,.08)', txt:'#ffc2dc', rain:'#ff8fb8'},
};
 function techBackdrop(t){
  const P = PAL[themeName];
  const R = Math.max(W, H);
  const glow = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * .6);
  glow.addColorStop(0, P.glow1); glow.addColorStop(1, P.glow0);
  ctx.globalAlpha = 1; ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // perspective grid floor moving towards you
  const hz = H * .7, depth = H - hz;
  ctx.strokeStyle = P.line; ctx.lineWidth = dpr;
  for(let i = -14; i <= 14; i++){
    ctx.globalAlpha = .16;
    ctx.beginPath(); ctx.moveTo(CX + i * W * .025, hz); ctx.lineTo(CX + i * W * .16, H); ctx.stroke();
  }
  for(let k = 0; k < 12; k++){
    const z = ((k + t * .6) % 12) / 12, y = hz + depth * Math.pow(z, 2.2);
    ctx.globalAlpha = .05 + z * .25;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  const fade = ctx.createLinearGradient(0, hz, 0, hz + depth * .35);     // horizon haze
  fade.addColorStop(0, P.haze1); fade.addColorStop(1, P.haze0);
  ctx.globalAlpha = 1; ctx.fillStyle = fade; ctx.fillRect(0, hz, W, depth * .35);

  // slow scanning line
  const sy = ((t * .18) % 1.2) * H;
  const sg = ctx.createLinearGradient(0, sy - 60 * dpr, 0, sy);
  sg.addColorStop(0, P.scan0); sg.addColorStop(1, P.scan1);
  ctx.fillStyle = sg; ctx.fillRect(0, sy - 60 * dpr, W, 60 * dpr);

  drawGlitter(t);

  // rising binary / hex data
  ctx.font = `${11 * dpr}px "Share Tech Mono", monospace`; ctx.textAlign = 'center';
  for(const b of galaxy){
    b.y -= b.vy * .8;
    if(b.y < -10 * dpr) Object.assign(b, newBubble(true));
    if(Math.random() < .01) b.ch = '01ABCDEF<>/'[Math.floor(Math.random() * 11)];
    ctx.globalAlpha = b.a * .7; ctx.fillStyle = P.txt;
    ctx.fillText(b.ch || '0', b.x, b.y);
  }

  // falling 1 / 0 binary rain (matrix style)
  const cw = 18 * dpr, n = Math.ceil(W / cw);
  if(rain.length !== n) rain = Array.from({length: n}, (_, i) => ({x: i * cw + cw / 2, y: Math.random() * H, sp: (2 + Math.random() * 5) * dpr, len: 6 + Math.floor(Math.random() * 12), on: Math.random() < .45}));
  ctx.font = `${13 * dpr}px \"Share Tech Mono\", monospace`;
  for(const c of rain){
    if(!c.on){ if(Math.random() < .004) c.on = true; continue; }
    c.y += c.sp;
    if(c.y - c.len * cw > H){ c.y = -cw; c.sp = (2 + Math.random() * 5) * dpr; c.on = Math.random() < .8; }
    for(let k = 0; k < c.len; k++){
      const yy = c.y - k * cw;
      if(yy < 0 || yy > H) continue;
      ctx.globalAlpha = k === 0 ? .95 : .4 * (1 - k / c.len);
      ctx.fillStyle = k === 0 ? '#ffffff' : P.rain;
      ctx.fillText(((Math.sin(c.x * 12.9 + Math.floor(yy / cw) * 78.2 + Math.floor(t * 3 + k)) * 43758) % 1) > 0 ? '1' : '0', c.x, yy);
    }
  }
  ctx.globalAlpha = 1;
}

function drawGlitter(t){                                    // sharp twinkles
  for(const g of stars){
    const tw = Math.pow(Math.max(0, Math.sin(t * g.sp + g.tw)), 6);
    if(tw < .02) continue;
    ctx.globalAlpha = tw;
    if(g.flare){ const fs = g.s * 12; ctx.drawImage(glitterFlare, g.x - fs / 2, g.y - fs / 2, fs, fs); }
    else { const sz = g.s * 4; ctx.drawImage(starSprite, g.x - sz / 2, g.y - sz / 2, sz, sz); }
  }
}

function frame(now){
  const t = now / 1000; timer++;
  ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  drawBackdrop(t);
  if(themeName === 'deco'){ fireworks = []; minis = []; sparks = []; ctx.globalCompositeOperation = 'source-over'; requestAnimationFrame(frame); return; }

  // heartbeat (lub-dub)
  const b = (t - heartStart) % 1.1;
  const beat = 1 + .1 * Math.exp(-Math.pow((b - .15) * 14, 2)) + .06 * Math.exp(-Math.pow((b - .45) * 14, 2));

  // glows behind the name / heart
  glowA  += ((state === 'formed' ? .55 : 0) - glowA) * .04;
  heartA += ((state === 'heart'  ? .7 : 0) - heartA) * .06;
  if(glowA > .01){ ctx.globalAlpha = glowA * (.85 + .15 * Math.sin(t * 2)); ctx.drawImage(nameGlow, 0, 0); }
  if(heartA > .01){
    const s = heartGlow.width * beat;
    ctx.globalAlpha = heartA; ctx.drawImage(heartGlow, CX - s / 2, CY - s / 2, s, s);
  }

  // shockwaves + flash
  waves = waves.filter(w => w.a > 0);
  for(const w of waves){
    w.r += 22 * dpr; w.a -= .025;
    if(w.r <= 0) continue;
    ctx.globalAlpha = w.a; ctx.strokeStyle = T.wave; ctx.lineWidth = 3 * dpr * w.a + .5;
    ctx.beginPath(); ctx.arc(w.x ?? CX, w.y ?? CY, w.r, 0, 7); ctx.stroke();
  }
  if(state === 'boom' && timer < 10){
    ctx.globalAlpha = (10 - timer) / 10 * .5;
    const f = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H) * .6);
    f.addColorStop(0, '#ffffff'); f.addColorStop(1, `rgba(${T.flash},0)`);
    ctx.fillStyle = f; ctx.fillRect(0, 0, W, H);
  }

  // ---- the stardust ----
  let visible = 0;
  const toHeart = state === 'heart' || state === 'burst';
  for(const p of dust){
    if(state === 'gather' || state === 'formed'){
      const dx0 = p.tx - p.x, dy0 = p.ty - p.y;
      p.vx += dx0 * .028 + (state === 'gather' ? -dy0 * .004 : 0) + Math.sin(t * 2 + p.seed) * .02 * dpr;
      p.vy += dy0 * .028 + (state === 'gather' ?  dx0 * .004 : 0) + Math.cos(t * 2.3 + p.seed) * .02 * dpr;
      const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy, R = 75 * dpr;
      if(d2 < R * R){ const d = Math.sqrt(d2) || 1, f = (R - d) / R * 6; p.vx += dx / d * f; p.vy += dy / d * f; }
      p.vx *= .86; p.vy *= .86;
      p.a = Math.min(1, p.a + .015);
    } else if(state === 'boom'){
      p.vx *= .93; p.vy *= .93;
    } else if(state === 'heart'){
      p.vx += (CX + p.hx * HS * beat - p.x) * .04;
      p.vy += (CY + p.hy * HS * beat - p.y) * .04;
      p.vx *= .84; p.vy *= .84;
    } else if(state === 'burst'){
      p.vx *= 1.02; p.vy = p.vy * 1.02 + .02 * dpr;
      p.a -= .011;
    }
    p.x += p.vx; p.y += p.vy;
    if(p.a <= 0) continue;
    visible++;

    const tw = .75 + .25 * Math.sin(t * 3 + p.seed);       // twinkle
    const useHeart = toHeart || (state === 'boom' && timer > 12);
    ctx.globalAlpha = p.a * tw;
    if(p.flare && (state === 'formed' || state === 'heart')){
      const fs = p.r * (14 + 8 * Math.sin(t * 2.5 + p.seed));
      ctx.drawImage(useHeart ? heartFlare : nameFlare, p.x - fs / 2, p.y - fs / 2, fs, fs);
    } else {
      const s = p.r * (useHeart ? 3.8 : 3.9);
      ctx.drawImage(useHeart ? heartSprites[p.hci] : nameSprites[p.ci], p.x - s / 2, p.y - s / 2, s, s);
    }
  }

  // cursor / finger sparkle trail
  sparks = sparks.filter(s => s.life > 0);
  for(const s of sparks){
    s.x += s.vx; s.y += s.vy; s.vy += .04 * dpr; s.life -= .025;
    const sz = s.size * s.life;
    ctx.globalAlpha = s.life;
    ctx.drawImage(s.flare ? nameFlare : nameSprites[s.ci], s.x - sz / 2, s.y - sz / 2, sz, sz);
  }
  // fireworks
  fireworks = fireworks.filter(f => f.life > 0);
  for(const f of fireworks){
    f.vx *= .975; f.vy = f.vy * .975 + .05 * dpr; f.x += f.vx; f.y += f.vy; f.life -= .011;
    ctx.globalAlpha = f.life * (.7 + .3 * Math.sin(t * 30 + f.x));
    const sz = f.size * (.5 + .5 * f.life);
    ctx.drawImage(fwSprites[f.c], f.x - sz / 2, f.y - sz / 2, sz, sz);
  }

  // little hearts floating up around the big heart
  if(state === 'heart' && Math.random() < .25){
    const a = Math.random() * Math.PI * 2, p = heartXY(a, 1.15 + Math.random() * .3);
    minis.push({x: CX + p.x * HS, y: CY + p.y * HS, vy: -(0.6 + Math.random()) * dpr,
                sway: Math.random() * 6, size: (10 + Math.random() * 14) * dpr, life: 1, c: Math.floor(Math.random() * 3)});
  }
  minis = minis.filter(m => m.life > 0);
  for(const m of minis){
    m.y += m.vy; m.life -= m.decay || .008;
    const x = m.x + Math.sin(t * 2 + m.sway) * 6 * dpr, sz = m.size * (.6 + .4 * m.life);
    ctx.globalAlpha = Math.min(1, m.life * 1.5) * .9;
    if(m.y < -40 * dpr) m.life = 0;
    ctx.drawImage(miniHearts[m.c], x - sz / 2, m.y - sz / 2, sz, sz);
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

  // state changes
  if(state === 'gather' && timer > 190) setState('formed');
  else if(state === 'boom' && timer > 38){ setState('heart'); heartStart = t; }
  else if(state === 'heart' && timer > 230){
    setState('burst'); waves.push({r: HS * 10, a: .8});
    dust.forEach(p => {
      const dx = p.x - CX, dy = p.y - CY, d = Math.hypot(dx, dy) || 1, sp = (2 + Math.random() * 7) * dpr;
      p.vx = dx / d * sp; p.vy = dy / d * sp;
    });
  }
  else if(state === 'burst' && visible === 0){
    setState('waiting');
    setTimeout(() => { dust.forEach(scatter); setState('gather'); }, 1400);
  }
  requestAnimationFrame(frame);
}

/* ==========================================================
   5. Input
   ========================================================== */
addEventListener('touchstart', e => { if(e.touches.length >= 5 && state === 'formed') snap(); }, {passive: true});

function addSparks(x, y, n){
  for(let i = 0; i < n; i++){
    sparks.push({
      x, y, vx: (Math.random() - .5) * 2 * dpr, vy: (Math.random() - .8) * 2 * dpr,
      size: (6 + Math.random() * 10) * dpr, life: 1,
      ci: Math.floor(Math.random() * 3), flare: Math.random() < .12,
    });
  }
  if(sparks.length > 400) sparks.splice(0, sparks.length - 400);
}
addEventListener('pointermove', e => {
  pointer.x = e.clientX * dpr; pointer.y = e.clientY * dpr;
  addSparks(pointer.x, pointer.y, window.wandMode ? 7 : 2);
});
addEventListener('pointerleave', () => { pointer.x = pointer.y = -9999; });
addEventListener('pointerup', e => { if(e.pointerType !== 'mouse') pointer.x = pointer.y = -9999; });

let resizeTimer;
addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(setup, 200); });

document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
addEventListener('keydown', e => { if((e.key === 't' || e.key === 'T') && !document.body.classList.contains('gaming')) toggleTheme(); });

setTheme(themeName);
// start once fonts are ready (and after the intro, if it is playing)
const fontsReady = Promise.all(Object.values(THEMES).map(th => document.fonts.load(th.font.replace('{size}', 100)))).catch(() => {});
const introDone  = window.__introPlaying ? new Promise(r => addEventListener('introdone', r, {once: true})) : Promise.resolve();
Promise.all([fontsReady, introDone]).then(() => { setup(); requestAnimationFrame(frame); });

})();
