/* Stardust Snap — tiny synth sound effects (no audio files). Toggle with the 🔊 button or M. */
'use strict';
(() => {
let ac, muted = localStorage.getItem('stardust-mute') === '1';
const btn = document.getElementById('soundBtn');
const paint = () => { if(btn) btn.textContent = muted ? '✕ Sound' : '♪ Sound'; };

function ctx(){
  if(!ac){ try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if(ac.state === 'suspended') ac.resume();
  return ac;
}
function tone(f0, f1, dur, type = 'sine', vol = .15, delay = 0){
  const a = ctx(); if(!a || muted) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur);
}
function noise(dur, vol = .2){
  const a = ctx(); if(!a || muted) return;
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = buf.getChannelData(0);
  for(let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = a.createBufferSource(), g = a.createGain();
  s.buffer = buf; g.gain.value = vol; s.connect(g).connect(a.destination); s.start();
}

const SFX = {
  open:  () => { noise(.6, .35); tone(120, 30, .6, 'sine', .4); tone(660, 990, .3, 'triangle', .1, .15); },   // boom
  fist:  () => tone(900, 200, .35, 'sawtooth', .08),
  peace: () => { tone(660, 660, .12, 'square', .07); tone(990, 990, .18, 'square', .07, .1); },
  thumb: () => { for(let i = 0; i < 5; i++) tone(500 + Math.random() * 1500, 100, .25, 'triangle', .08, i * .08); },
  love:  () => { tone(523, 523, .15, 'sine', .12); tone(659, 659, .15, 'sine', .12, .12); tone(784, 784, .3, 'sine', .12, .24); },
  point: () => tone(1200, 1800, .1, 'sine', .06),
  type:  () => tone(1800, 1600, .03, 'square', .02),
  beam:  () => tone(80, 900, 1.2, 'sawtooth', .07),
  grant: () => { tone(440, 440, .12, 'square', .08); tone(880, 880, .35, 'square', .08, .12); },
};

/* ---- background music: put your own file at assets/music.mp3 ---- */
const music = new Audio('assets/music.mp3');
music.loop = true; music.volume = .45; music.preload = 'auto';
let musicOk = true; music.addEventListener('error', () => { musicOk = false; });
function playMusic(){ if(musicOk && !muted) music.play().catch(() => {}); }
addEventListener('pointerdown', playMusic, {once: true});
addEventListener('keydown', playMusic, {once: true});

window.Sfx = { play: n => SFX[n] && SFX[n]() };
if(btn) btn.addEventListener('click', () => { muted = !muted; localStorage.setItem('stardust-mute', muted ? '1' : '0'); paint(); muted ? music.pause() : playMusic(); SFX.peace(); });
addEventListener('keydown', e => { if(e.key.toLowerCase() === 'm') btn && btn.click(); });
addEventListener('pointerdown', () => ctx(), {once: true});     // browsers need a click before sound
paint();
})();
