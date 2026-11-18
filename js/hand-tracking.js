/* ==========================================================
   Stardust Snap — gestures (camera + buttons + keyboard)
   ----------------------------------------------------------
   Uses MediaPipe Hand Landmarker to read 21 points on the
   hand, works out which fingers are open, and turns that
   into a gesture:

     ✋ open   → name explodes into a heart
     ✊ fist   → back to the name
     ✌️ peace  → change the name colour
     ☝️ point  → magic wand (sparkles follow your finger)
     👍 thumb  → fireworks
     🤟 love   → rain of little hearts
   ========================================================== */
'use strict';

(() => {

const MP_VERSION = '0.10.14';
const MP_URL     = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}`;
const MODEL_URL  = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const HOLD_FRAMES = 6;             // a gesture must be held this many frames

const GESTURES = {
  open:  {emoji: '✋', label: 'Boom! A heart',      run: () => Stardust.snap()},
  fist:  {emoji: '✊', label: 'Back to the name',   run: () => Stardust.gatherName()},
  peace: {emoji: '✌️', label: 'New colour',         run: () => Stardust.nextColor()},
  point: {emoji: '☝️', label: 'Magic wand',         run: () => true},
  thumb: {emoji: '👍', label: 'Fireworks!',         run: () => Stardust.launchFireworks()},
  love:  {emoji: '🤟', label: 'Love rain',          run: () => Stardust.loveRain()},
};

const $ = id => document.getElementById(id);
const btn = $('camBtn'), box = $('camBox'), video = $('video'), status = $('camStatus');
const hc = $('handCanvas'), hctx = hc.getContext('2d');
const toast = $('toast');
const buttons = [...document.querySelectorAll('.g')];

/* ---------- toast + button highlight ---------- */
let toastTimer;
function showToast(g){
  toast.querySelector('.toast-emoji').textContent = GESTURES[g].emoji;
  toast.querySelector('.toast-text').textContent  = GESTURES[g].label;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
}
function highlight(g){
  buttons.forEach(b => b.classList.toggle('active', b.dataset.g === g));
}
function trigger(g){
  if(!g || !window.Stardust) return;
  if(GESTURES[g].run() !== false){ showToast(g); window.Sfx && Sfx.play(g); }
}

/* ---------- buttons + keyboard (work without a camera) ---------- */
buttons.forEach(b => b.addEventListener('click', () => {
  if(b.dataset.g === 'point'){ window.wandMode = !window.wandMode; b.classList.toggle('active', window.wandMode); showToast('point'); return; }   // wand = mouse / finger
  trigger(b.dataset.g);
}));
const keys = ['open', 'fist', 'peace', 'point', 'thumb', 'love'];
addEventListener('keydown', e => {
  if(document.body.classList.contains('gaming')) return;     // don't fire gestures while a game is open
  const g = keys[+e.key - 1];
  if(g && g !== 'point') trigger(g);
});

/* ---------- camera ---------- */
let FilesetResolver, HandLandmarker, tracker, lastTime = -1;

async function makeTracker(delegate){
  const files = await FilesetResolver.forVisionTasks(`${MP_URL}/wasm`);
  return HandLandmarker.createFromOptions(files, {
    baseOptions: {modelAssetPath: MODEL_URL, delegate},
    runningMode: 'VIDEO', numHands: 1,
  });
}

btn.addEventListener('click', async () => {
  btn.disabled = true; status.hidden = false;
  try{
    status.textContent = 'Loading hand tracker…';
    ({FilesetResolver, HandLandmarker} = await import(`${MP_URL}/vision_bundle.mjs`));
    try { tracker = await makeTracker('GPU'); }
    catch { tracker = await makeTracker('CPU'); }

    status.textContent = 'Allow camera access…';
    const stream = await navigator.mediaDevices.getUserMedia({video: {width: 640, height: 480, facingMode: 'user'}});
    video.srcObject = stream;
    await video.play();
    hc.width = video.videoWidth; hc.height = video.videoHeight;

    box.classList.add('on'); btn.style.display = 'none';
    status.textContent = 'Show your hand ✋';
    requestAnimationFrame(detect);
  }catch(err){
    console.error(err);
    btn.disabled = false;
    status.textContent = err && err.name === 'NotAllowedError'
      ? '⚠️ Camera permission was blocked. Allow it in the address bar and try again.'
      : !window.isSecureContext ? '⚠️ Open via http://localhost (Live Server), not by double-clicking the file.'
      : '⚠️ ' + (err && (err.name || err.message) || 'Error') + ' - check internet and camera.';
  }
});

/* ---------- which fingers are open? [thumb, index, middle, ring, pinky] ---------- */
function fingers(L){
  const d = (a, b) => Math.hypot(L[a].x - L[b].x, L[a].y - L[b].y);
  const open = (tip, pip) => d(tip, 0) > d(pip, 0) * 1.1;      // tip further from wrist than middle joint
  const thumb = d(4, 17) > d(3, 17) * 1.05 && d(4, 0) > d(2, 0) && d(4, 5) > d(2, 5) * .9;
  return [thumb, open(8, 6), open(12, 10), open(16, 14), open(20, 18)];
}

function classify(L){
  const [T, I, M, R, P] = fingers(L);
  if(T && I && M && R && P) return 'open';
  if(!I && !M && !R && !P){
    if(T && L[4].y < L[5].y - .05) return 'thumb';             // thumb pointing up
    return T ? null : 'fist';
  }
  if(I && M && !R && !P) return 'peace';
  if(I && !M && !R && P) return 'love';
  if(I && !M && !R && !P) return 'point';
  return null;
}

/* ---------- draw the hand skeleton on the preview ---------- */
function drawHand(L){
  hctx.clearRect(0, 0, hc.width, hc.height);
  if(!L) return;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff9ccf';
  hctx.strokeStyle = accent; hctx.lineWidth = 3;
  for(const c of HandLandmarker.HAND_CONNECTIONS){
    const a = L[c.start], b = L[c.end];
    hctx.beginPath(); hctx.moveTo(a.x * hc.width, a.y * hc.height); hctx.lineTo(b.x * hc.width, b.y * hc.height); hctx.stroke();
  }
  hctx.fillStyle = '#fff';
  for(const p of L){ hctx.beginPath(); hctx.arc(p.x * hc.width, p.y * hc.height, 4, 0, 7); hctx.fill(); }
}

/* ---------- main detection loop ---------- */
let candidate = null, count = 0, stable = null, wandOn = false;

function detect(){
  if(video.currentTime !== lastTime){
    lastTime = video.currentTime;
    const res = tracker.detectForVideo(video, performance.now());
    const L = res.landmarks && res.landmarks[0];
    drawHand(L);
    const g = L ? classify(L) : null;

    // a gesture only counts once it has been held for a few frames
    if(g === candidate) count++; else { candidate = g; count = 1; }
    if(count === HOLD_FRAMES && candidate !== stable){
      stable = candidate;
      if(stable && stable !== 'point') trigger(stable);       // fire once per new gesture
      if(stable === 'point') showToast('point');
    }

    // ☝️ wand follows the index fingertip (mirrored like a selfie)
    if(stable === 'point' && g === 'point'){ Stardust.wand(1 - L[8].x, L[8].y); wandOn = true; }
    else if(wandOn){ Stardust.wand(null); wandOn = false; }

    highlight(g);
    box.classList.toggle('palm', !!g);
    status.textContent = !L ? 'Show your hand ✋' : g ? `${GESTURES[g].emoji}  ${GESTURES[g].label}` : 'Try a gesture below';
  }
  requestAnimationFrame(detect);
}

})();
