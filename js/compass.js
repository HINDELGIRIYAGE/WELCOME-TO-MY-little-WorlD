/* Stardust Snap — HUD compass: needle points at your cursor / finger; on phones it follows the real compass */
'use strict';
(() => {
const el = document.getElementById('compass'); if(!el) return;
const needle = document.getElementById('cpNeedle'), ring = document.getElementById('cpRing'), read = document.getElementById('cpRead'), ticks = document.getElementById('cpTicks');
ticks.setAttribute('d', Array.from({length: 36}, (_, i) => { const a = i * Math.PI / 18, r1 = i % 9 ? 50 : 46, r2 = 54;
  return 'M' + (60 + Math.sin(a) * r1).toFixed(1) + ' ' + (60 - Math.cos(a) * r1).toFixed(1) + 'L' + (60 + Math.sin(a) * r2).toFixed(1) + ' ' + (60 - Math.cos(a) * r2).toFixed(1); }).join(''));
const DIRS = ['N','NE','E','SE','S','SW','W','NW'];
let target = 0, cur = 0, heading = null;

addEventListener('pointermove', e => {
  if(heading !== null) return;
  const r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  target = Math.atan2(dx, -dy) * 180 / Math.PI;                       // 0° = up (north)
});
addEventListener('deviceorientationabsolute', ev => { if(ev.alpha != null){ heading = (360 - ev.alpha) % 360; target = heading; } });
addEventListener('deviceorientation', ev => { if(ev.webkitCompassHeading != null){ heading = ev.webkitCompassHeading; target = heading; } });

(function tick(){
  let d = ((target - cur + 540) % 360) - 180; cur += d * .12;          // smooth, shortest turn
  needle.style.transform = 'rotate(' + cur + 'deg)'; needle.style.transformOrigin = '60px 60px';
  ring.style.transform = 'rotate(' + (heading !== null ? -cur : 0) + 'deg)'; ring.style.transformOrigin = '60px 60px';
  const deg = (Math.round(cur) % 360 + 360) % 360;
  read.textContent = String(deg).padStart(3, '0') + '° ' + DIRS[Math.round(deg / 45) % 8];
  requestAnimationFrame(tick);
})();
})();