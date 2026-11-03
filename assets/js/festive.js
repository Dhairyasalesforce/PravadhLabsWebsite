/* Pravadh Labs — festive calendar.
   Each festival switches itself on and off by the visitor's LOCAL date (inclusive windows).
   Edit FESTIVALS below to add or change dates. Preview any festival with ?festival=<id>,
   e.g. ?festival=holi (combine with ?theme=night to see it in dark).
   Visitors can close a festival with the × on its greeting; that is remembered for that festival and year. */
(function () {
  'use strict';

  /* ---------- the calendar ---------- */
  var FESTIVALS = [
    { id: 'diwali', rank: 1, dates: { 2026: ['11-06', '11-10'], 2027: ['10-27', '10-31'], 2028: ['10-15', '10-19'] },
      icon: 'diya', title: 'Happy Diwali', sub: 'Light, clarity and a great year ahead — Pravadh Labs',
      effects: ['garland', 'fireworks', 'lamps'], garland: ['#FD9E01', '#ffd166', '#ff7a3d'],
      fireworks: { dark: ['#ffd166', '#FD9E01', '#ff7a3d', '#fff4d6', '#60a5fa', '#f472b6'], light: ['#d97706', '#e11d48', '#2563eb', '#c2410c', '#7c3aed', '#059669'] } },
    { id: 'christmas', rank: 2, every: ['12-23', '12-27'],
      icon: '🎄', title: 'Merry Christmas', sub: 'Warm wishes for the holidays — Pravadh Labs',
      effects: ['garland', 'snow'], garland: ['#dc2626', '#16a34a', '#facc15'] },
    { id: 'newyear', rank: 2, every: ['01-01', '01-01'],
      icon: '🎆', title: 'Happy New Year {year}', sub: 'Here’s to a year of shipping what matters',
      effects: ['garland', 'fireworks', 'confetti'], garland: ['#facc15', '#60a5fa', '#f472b6'],
      fireworks: { dark: ['#facc15', '#60a5fa', '#f472b6', '#34d399', '#ffffff', '#fb923c'], light: ['#2563eb', '#db2777', '#d97706', '#059669', '#7c3aed', '#dc2626'] } },
    { id: 'kites', rank: 3, every: ['01-12', '01-15'],
      icon: '🪁', title: 'Happy Uttarayan & Makar Sankranti', sub: 'May your goals fly high this year',
      effects: ['kites'] },
    { id: 'lunar', rank: 3, dates: { 2027: ['02-06', '02-20'], 2028: ['01-26', '02-09'] }, zodiac: { 2027: 'Goat', 2028: 'Monkey' },
      icon: '🏮', title: 'Happy Lunar New Year', sub: 'Wishing you a prosperous Year of the {zodiac}',
      effects: ['garland', 'lanterns'], garland: ['#dc2626', '#facc15', '#dc2626'] },
    { id: 'holi', rank: 2, dates: { 2027: ['03-20', '03-24'], 2028: ['03-09', '03-13'] },
      icon: '🎨', title: 'Happy Holi', sub: 'A season of colour and new beginnings',
      effects: ['garland', 'holi'], garland: ['#ec4899', '#22c55e', '#facc15', '#3b82f6', '#a855f7'] },
    { id: 'us-independence', rank: 3, every: ['07-04', '07-04'],
      icon: '🎆', title: 'Happy 4th of July', sub: 'Warm wishes to our friends and partners in the US',
      effects: ['garland', 'fireworks'], garland: ['#dc2626', '#f8fafc', '#2563eb'],
      fireworks: { dark: ['#ef4444', '#ffffff', '#3b82f6'], light: ['#dc2626', '#1e3a8a', '#2563eb'] } },
    { id: 'india-independence', rank: 2, every: ['08-15', '08-15'],
      icon: 'tricolour', title: 'Happy Independence Day', sub: 'Jai Hind — from all of us at Pravadh Labs',
      effects: ['garland', 'fireworks'], garland: ['#FF9933', '#f8fafc', '#138808'],
      fireworks: { dark: ['#FF9933', '#ffffff', '#22c55e'], light: ['#ea7a12', '#1e3a8a', '#138808'] } },
    { id: 'gandhi-jayanti', rank: 2, every: ['10-02', '10-02'],
      icon: '🕊️', title: 'Gandhi Jayanti', sub: 'Remembering Mahatma Gandhi’s ideals of truth and non-violence',
      effects: [] },
    { id: 'ekta-diwas', rank: 2, every: ['10-31', '10-31'], audience: 'india',
      icon: 'tricolour', title: 'Rashtriya Ekta Diwas', sub: 'Remembering Sardar Vallabhbhai Patel, the Iron Man of India',
      effects: [] },
    { id: 'halloween', rank: 3, every: ['10-31', '10-31'], audience: 'world',
      icon: '🎃', title: 'Happy Halloween', sub: 'No tricks here — just treats from Pravadh Labs',
      effects: ['bats'] },
    { id: 'childrens-day', rank: 3, every: ['11-14', '11-14'],
      icon: '🎈', title: 'Happy Children’s Day', sub: 'To curious minds of every age',
      effects: ['balloons'] }
  ];

  /* ---------- pick today's festival ---------- */
  var now = new Date();
  var Y = now.getFullYear();
  var md = ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2);
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var inIndia = tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta';
  var forced = (location.search.match(/[?&]festival=([a-z-]+)/) || [])[1];

  function active(f) {
    if (f.audience === 'india' && !inIndia) return false;
    if (f.audience === 'world' && inIndia) return false;
    var w = f.every || (f.dates && f.dates[Y]);
    if (!w) return false;
    return w[0] <= w[1] ? (md >= w[0] && md <= w[1]) : (md >= w[0] || md <= w[1]);
  }
  var fest = null;
  if (forced) fest = FESTIVALS.filter(function (f) { return f.id === forced; })[0] || null;
  else fest = FESTIVALS.filter(active).sort(function (a, b) { return a.rank - b.rank; })[0] || null;
  if (!fest) return;

  var KEY = 'pravadh-festive-hidden-' + fest.id + '-' + Y;
  if (!forced) { try { if (localStorage.getItem(KEY) === '1') return; } catch (e) {} }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
  var root = document.documentElement;
  function isDark() { return root.getAttribute('data-theme') === 'dark'; }
  function has(e) { return fest.effects.indexOf(e) !== -1; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var cleanups = [];

  /* ---------- styles ---------- */
  var css = [
    '.dw-garland{position:absolute;left:0;right:0;bottom:-7px;height:14px;pointer-events:none;z-index:2;display:flex;justify-content:space-around;overflow:hidden}',
    '.dw-garland::before{content:"";position:absolute;left:0;right:0;top:3px;height:1px;background:linear-gradient(90deg,transparent,var(--fg-line,rgba(253,158,1,.55)),transparent)}',
    '.dw-garland i{position:relative;width:6px;height:6px;margin-top:1px;border-radius:50%;animation:dw-twinkle 2.4s ease-in-out infinite}',
    '@keyframes dw-twinkle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}',
    'html[data-theme="dark"] .dw-garland i{filter:brightness(1.15)}',
    '.dw-greet{position:fixed;left:20px;bottom:24px;z-index:150;display:flex;align-items:center;gap:10px;padding:8px 10px 8px 12px;border-radius:999px;background:#0b1b3a;color:#fff;border:1px solid rgba(253,158,1,.45);box-shadow:0 10px 30px rgba(7,20,48,.35),0 0 24px rgba(253,158,1,.18);font:600 13.5px/1.2 Inter,system-ui,sans-serif;opacity:0;transform:translateY(12px);transition:opacity .5s ease,transform .5s cubic-bezier(.16,1,.3,1)}',
    '.dw-greet.is-in{opacity:1;transform:none}',
    '.dw-greet small{display:block;font-weight:400;font-size:11.5px;color:#cbd5e1;margin-top:2px}',
    '.dw-greet button{margin-left:4px;width:26px;height:26px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:#cbd5e1;cursor:pointer;font-size:16px;line-height:26px;padding:0}',
    '.dw-greet button:hover{background:rgba(255,255,255,.16);color:#fff}',
    '.dw-icon{width:34px;height:30px;flex:none;display:grid;place-items:center;font-size:24px;line-height:1}',
    '.dw-flame{transform-origin:17px 15px;animation:dw-flicker 1.6s ease-in-out infinite}',
    '@keyframes dw-flicker{0%,100%{transform:scale(1) rotate(-2deg)}25%{transform:scale(1.08,.94) rotate(2deg)}50%{transform:scale(.94,1.06) rotate(-1deg)}75%{transform:scale(1.04,.98) rotate(1deg)}}',
    '@media (max-width:640px){.dw-greet{left:50%;right:auto;top:84px;bottom:auto;transform:translate(-50%,-10px);font-size:12.5px;padding:6px 8px 6px 10px;gap:8px;white-space:nowrap;max-width:calc(100vw - 24px)}.dw-greet.is-in{transform:translate(-50%,0)}.dw-greet small{display:none}.dw-icon{width:28px;height:25px;font-size:20px}}',
    '.dw-sparks{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:141}',
    '.dw-float{position:fixed;left:0;top:0;pointer-events:none;z-index:140;will-change:transform}',
    '.dw-bat svg{animation:dw-flap .28s ease-in-out infinite alternate;transform-origin:50% 60%}',
    '@keyframes dw-flap{from{transform:scaleY(1)}to{transform:scaleY(.7)}}',
    '.dw-lamp{position:fixed;bottom:14px;z-index:145;width:56px;height:50px;pointer-events:none;opacity:0;transform:translateY(16px) scale(.85);transition:opacity .7s ease,transform .7s cubic-bezier(.16,1,.3,1)}',
    '.dw-lamp--l{left:18px}.dw-lamp--r{right:98px}',
    '.dw-lamp svg{width:100%;height:100%;overflow:visible}',
    '.dw-lamp .dw-lamp-flame{transform-origin:28px 24px;transform:scale(0);transition:transform .6s cubic-bezier(.34,1.56,.64,1) .35s}',
    '.dw-pool{position:fixed;bottom:0;z-index:139;width:min(46vw,520px);height:min(46vw,520px);pointer-events:none;opacity:0;transition:opacity 1.2s ease .3s}',
    '.dw-pool--l{left:0;background:radial-gradient(circle at 0% 100%,rgba(253,158,1,.30),rgba(253,158,1,.10) 35%,transparent 68%)}',
    '.dw-pool--r{right:0;background:radial-gradient(circle at 100% 100%,rgba(253,158,1,.30),rgba(253,158,1,.10) 35%,transparent 68%)}',
    'html.dw-lit .dw-lamp{opacity:1;transform:none}',
    'html.dw-lit .dw-lamp .dw-lamp-flame{transform:scale(1)}',
    'html.dw-lit .dw-lamp .dw-lamp-flicker{animation:dw-flicker 1.4s ease-in-out infinite}',
    'html.dw-lit .dw-lamp .dw-lamp-halo{animation:dw-halo 2.8s ease-in-out infinite}',
    'html.dw-lit .dw-pool{opacity:1}',
    'html.dw-lit .dw-greet{left:86px}',
    '@keyframes dw-halo{0%,100%{opacity:.85;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}',
    '.dw-lamp-halo{transform-origin:28px 16px}',
    '@media (max-width:640px){.dw-lamp{display:none}html.dw-lit .dw-greet{left:50%}.dw-pool{width:75vw;height:75vw}}',
    '@media (prefers-reduced-motion:reduce){.dw-garland i,.dw-flame,.dw-bat svg,html.dw-lit .dw-lamp .dw-lamp-flicker,html.dw-lit .dw-lamp .dw-lamp-halo{animation:none}}'
  ].join('\n');

  /* ---------- icons ---------- */
  var DIYA = '<svg class="dw-icon" viewBox="0 0 34 30" aria-hidden="true"><defs><radialGradient id="dwGlow" cx="50%" cy="45%" r="50%"><stop offset="0" stop-color="#ffd166" stop-opacity=".9"/><stop offset="1" stop-color="#FD9E01" stop-opacity="0"/></radialGradient></defs><circle cx="17" cy="10" r="10" fill="url(#dwGlow)"/><path class="dw-flame" d="M17 2c3 4 4 7 4 9a4 4 0 0 1-8 0c0-2 1-5 4-9z" fill="#FD9E01"/><path class="dw-flame" d="M17 7c1.4 2 2 3.4 2 4.4a2 2 0 0 1-4 0c0-1 .6-2.4 2-4.4z" fill="#fff4d6"/><path d="M3 17h28c-1 6-6 10-14 10S4 23 3 17z" fill="#d97706"/><path d="M3 17h28" stroke="#ffd166" stroke-width="1.5" stroke-linecap="round"/><circle cx="11" cy="21" r="1.2" fill="#ffd166"/><circle cx="17" cy="22.5" r="1.2" fill="#ffd166"/><circle cx="23" cy="21" r="1.2" fill="#ffd166"/></svg>';
  var TRICOLOUR = '<svg class="dw-icon" viewBox="0 0 30 30" aria-hidden="true"><clipPath id="dwTc"><circle cx="15" cy="15" r="13"/></clipPath><g clip-path="url(#dwTc)"><rect x="0" y="0" width="30" height="10" fill="#FF9933"/><rect x="0" y="10" width="30" height="10" fill="#ffffff"/><rect x="0" y="20" width="30" height="10" fill="#138808"/></g><circle cx="15" cy="15" r="3.4" fill="none" stroke="#000080" stroke-width="1.1"/><circle cx="15" cy="15" r="13" fill="none" stroke="rgba(255,255,255,.35)"/></svg>';
  function iconHtml() {
    if (fest.icon === 'diya') return DIYA;
    if (fest.icon === 'tricolour') return TRICOLOUR;
    return '<span class="dw-icon" aria-hidden="true">' + fest.icon + '</span>';
  }
  function fill(t) {
    return t.replace('{year}', String(Y)).replace('{zodiac}', (fest.zodiac && fest.zodiac[Y]) || 'Goat');
  }

  /* ---------- shared particle canvas ---------- */
  var cv = null, ctx = null, raf = 0, parts = [], rockets = [], timers = [];
  function canvas() {
    if (cv) return;
    cv = document.createElement('canvas');
    cv.className = 'dw-sparks';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    size();
    window.addEventListener('resize', size);
  }
  function size() {
    if (!cv) return;
    var r = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = window.innerWidth * r; cv.height = window.innerHeight * r;
    ctx.setTransform(r, 0, 0, r, 0, 0);
  }
  function loop() { if (!raf) raf = requestAnimationFrame(tick); }
  function tick() {
    var w = window.innerWidth, h = window.innerHeight, dark = isDark();
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    for (var i = rockets.length - 1; i >= 0; i--) {
      var r = rockets[i], dx = r.tx - r.x, dy = r.ty - r.y, d = Math.sqrt(dx * dx + dy * dy);
      var nx = r.x + (dx / d) * r.v, ny = r.y + (dy / d) * r.v;
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      ctx.strokeStyle = r.col; ctx.globalAlpha = 0.9; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(r.x, r.y + 10); ctx.lineTo(nx, ny); ctx.stroke();
      r.x = nx; r.y = ny;
      if (d < r.v * 1.5) { burst(r.x, r.y); rockets.splice(i, 1); }
    }
    for (var j = parts.length - 1; j >= 0; j--) {
      var p = parts[j];
      p.life -= p.decay;
      if (p.life <= 0 || p.y > h + 40) { parts.splice(j, 1); continue; }
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      if (p.kind === 'spark') {
        p.px = p.x; p.py = p.y; p.vx *= 0.975; p.vy = p.vy * 0.975 + 0.045; p.x += p.vx; p.y += p.vy;
        ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
        ctx.strokeStyle = p.col; ctx.lineWidth = dark ? 2.2 : 3.2;
        ctx.beginPath(); ctx.moveTo(p.px - p.vx * 2, p.py - p.vy * 2); ctx.lineTo(p.x, p.y); ctx.stroke();
      } else if (p.kind === 'flake') {
        p.t += 0.02; p.x += Math.sin(p.t) * 0.6 + p.vx; p.y += p.vy;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = dark ? 'rgba(255,255,255,0.9)' : 'rgba(100,130,170,0.55)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'confetti') {
        p.t += p.spin; p.x += p.vx + Math.sin(p.t) * 0.8; p.y += p.vy;
        ctx.globalCompositeOperation = 'source-over';
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t); ctx.scale(1, Math.cos(p.t * 2));
        ctx.fillStyle = p.col; ctx.fillRect(-4, -2.5, 8, 5); ctx.restore();
      } else if (p.kind === 'puff') {
        p.r += (p.max - p.r) * 0.05;
        ctx.globalCompositeOperation = dark ? 'screen' : 'multiply';
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, p.col); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = Math.max(0, p.life) * (dark ? 0.55 : 0.45);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        for (var k = 0; k < p.dots.length; k++) {
          var dt = p.dots[k]; dt.x += dt.vx; dt.y += dt.vy; dt.vy += 0.03;
          ctx.globalAlpha = Math.max(0, p.life) * 0.8; ctx.fillStyle = p.col;
          ctx.beginPath(); ctx.arc(dt.x, dt.y, dt.r, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (parts.length || rockets.length) raf = requestAnimationFrame(tick);
    else { raf = 0; ctx.clearRect(0, 0, w, h); }
  }

  /* fireworks */
  function palette() { var f = fest.fireworks || {}; return (isDark() ? f.dark : f.light) || ['#FD9E01', '#2563eb', '#e11d48']; }
  function launch() {
    var w = window.innerWidth, h = window.innerHeight, x = w * rnd(0.15, 0.85);
    rockets.push({ x: x, y: h + 10, tx: x + rnd(-40, 40), ty: h * rnd(0.18, 0.48), v: rnd(9, 12), col: pick(palette()) });
    loop();
  }
  function burst(x, y) {
    var pal = palette(), n = mobile ? 34 : 56, c1 = pick(pal), c2 = pick(pal);
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i) / n + Math.random() * 0.2, sp = rnd(1.6, 5);
      parts.push({ kind: 'spark', x: x, y: y, px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: rnd(0.012, 0.024), col: i % 2 ? c1 : c2 });
    }
  }
  function fireworks(count, gap) {
    if (reduce) return; canvas();
    for (var k = 0; k < count; k++) timers.push(setTimeout(launch, 300 + k * gap + Math.random() * 250));
  }
  /* snow */
  function snow() {
    if (reduce) return; canvas();
    var n = mobile ? 45 : 90, w = window.innerWidth;
    for (var i = 0; i < n; i++) parts.push({ kind: 'flake', x: rnd(0, w), y: rnd(-window.innerHeight, -10), vx: rnd(-0.2, 0.2), vy: rnd(0.6, 1.6), r: rnd(1.2, 3.2), t: rnd(0, 6), life: 1.6, decay: 0.0018 });
    loop();
  }
  /* confetti */
  function confetti() {
    if (reduce) return; canvas();
    var cols = ['#facc15', '#60a5fa', '#f472b6', '#34d399', '#fb923c', '#a78bfa'], n = mobile ? 70 : 140, w = window.innerWidth;
    for (var i = 0; i < n; i++) parts.push({ kind: 'confetti', x: rnd(0, w), y: rnd(-window.innerHeight * 0.8, -10), vx: rnd(-0.6, 0.6), vy: rnd(1.4, 3), t: rnd(0, 6), spin: rnd(0.04, 0.12), col: pick(cols), life: 1.5, decay: 0.0025 });
    loop();
  }
  /* holi colour bursts */
  function holi() {
    if (reduce) return; canvas();
    var cols = ['#ec4899', '#22c55e', '#facc15', '#3b82f6', '#a855f7', '#f97316'], count = mobile ? 5 : 9;
    for (var k = 0; k < count; k++) timers.push(setTimeout(function () {
      var x = window.innerWidth * rnd(0.1, 0.9), y = window.innerHeight * rnd(0.2, 0.75), col = pick(cols), dots = [];
      for (var d = 0; d < 26; d++) { var a = rnd(0, Math.PI * 2), s = rnd(1, 4.5); dots.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, r: rnd(1.5, 3.5) }); }
      parts.push({ kind: 'puff', x: x, y: y, r: 10, max: rnd(90, 170) * (mobile ? 0.7 : 1), col: col, dots: dots, life: 1, decay: 0.006 });
      loop();
    }, 300 + k * 520));
  }

  /* ---------- floating DOM items (kites, lanterns, balloons, bats) ---------- */
  function floater(svg, w, frames, dur, delay, cls) {
    var el = document.createElement('div');
    el.className = 'dw-float' + (cls ? ' ' + cls : '');
    el.setAttribute('aria-hidden', 'true');
    el.style.width = w + 'px';
    el.innerHTML = svg;
    document.body.appendChild(el);
    var anim = el.animate(frames, { duration: dur, delay: delay, easing: 'linear', fill: 'both' });
    anim.onfinish = function () { el.remove(); };
    cleanups.push(function () { el.remove(); });
  }
  function kites() {
    if (reduce) return;
    var cols = [['#f97316', '#facc15'], ['#ec4899', '#8b5cf6'], ['#22c55e', '#0ea5e9'], ['#ef4444', '#facc15'], ['#2563eb', '#f472b6'], ['#14b8a6', '#f97316']];
    var n = mobile ? 3 : 6, W = window.innerWidth, H = window.innerHeight;
    for (var i = 0; i < n; i++) {
      var c = cols[i % cols.length], s = rnd(38, 62);
      var svg = '<svg viewBox="0 0 40 70" width="100%" style="overflow:visible"><path d="M20 0 L38 22 L20 46 L2 22 Z" fill="' + c[0] + '"/><path d="M20 0 L38 22 L20 22 Z" fill="' + c[1] + '"/><path d="M2 22 H38 M20 0 V46" stroke="rgba(0,0,0,.25)" stroke-width="1"/><path d="M20 46 q-6 6 0 12 q6 6 0 12" stroke="' + c[1] + '" stroke-width="1.6" fill="none"/><path d="M14 54 l6 -2 l-2 6 z M22 64 l6 -2 l-2 6 z" fill="' + c[0] + '"/></svg>';
      var x0 = rnd(-0.1, 0.5) * W, y0 = H + 60, x1 = x0 + rnd(0.3, 0.6) * W, y1 = rnd(0.05, 0.35) * H;
      var frames = [], steps = 8;
      for (var k = 0; k <= steps; k++) {
        var t = k / steps, x = x0 + (x1 - x0) * t + Math.sin(t * 9 + i) * 30, y = y0 + (y1 - y0) * Math.min(1, t * 1.6) + Math.sin(t * 7 + i) * 14;
        frames.push({ transform: 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px) rotate(' + (Math.sin(t * 8 + i) * 12).toFixed(1) + 'deg)', opacity: t > 0.85 ? (1 - t) / 0.15 : 1 });
      }
      floater(svg, s, frames, rnd(11000, 15000), i * 900, '');
    }
  }
  function lanterns() {
    if (reduce) return;
    var n = mobile ? 5 : 10, W = window.innerWidth, H = window.innerHeight;
    for (var i = 0; i < n; i++) {
      var s = rnd(26, 44);
      var svg = '<svg viewBox="0 0 30 46" width="100%" style="overflow:visible;filter:drop-shadow(0 0 10px rgba(255,120,60,.75))"><rect x="12" y="0" width="6" height="4" rx="1" fill="#facc15"/><rect x="3" y="4" width="24" height="30" rx="11" fill="#dc2626"/><path d="M9 6 v26 M15 5 v28 M21 6 v26" stroke="#f87171" stroke-width="1" opacity=".7"/><rect x="10" y="34" width="10" height="3" rx="1" fill="#facc15"/><path d="M15 37 v8" stroke="#facc15" stroke-width="1.5"/></svg>';
      var x0 = rnd(0.05, 0.95) * W, frames = [];
      for (var k = 0; k <= 6; k++) {
        var t = k / 6;
        frames.push({ transform: 'translate(' + (x0 + Math.sin(t * 6 + i) * 24).toFixed(0) + 'px,' + (H + 40 - t * (H + 140)).toFixed(0) + 'px) rotate(' + (Math.sin(t * 5 + i) * 6).toFixed(1) + 'deg)', opacity: t < 0.1 ? t / 0.1 : t > 0.8 ? (1 - t) / 0.2 : 1 });
      }
      floater(svg, s, frames, rnd(12000, 17000), i * 700, '');
    }
  }
  function balloons() {
    if (reduce) return;
    var cols = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'], n = mobile ? 5 : 10, W = window.innerWidth, H = window.innerHeight;
    for (var i = 0; i < n; i++) {
      var c = cols[i % cols.length], s = rnd(30, 48);
      var svg = '<svg viewBox="0 0 30 64" width="100%" style="overflow:visible"><ellipse cx="15" cy="16" rx="13" ry="16" fill="' + c + '"/><ellipse cx="10" cy="10" rx="3" ry="5" fill="rgba(255,255,255,.45)"/><path d="M13 31 l2 3 l2 -3 z" fill="' + c + '"/><path d="M15 34 q-4 8 0 15 q4 7 0 14" stroke="rgba(100,116,139,.8)" stroke-width="1" fill="none"/></svg>';
      var x0 = rnd(0.05, 0.95) * W, frames = [];
      for (var k = 0; k <= 6; k++) {
        var t = k / 6;
        frames.push({ transform: 'translate(' + (x0 + Math.sin(t * 5 + i) * 30).toFixed(0) + 'px,' + (H + 60 - t * (H + 180)).toFixed(0) + 'px) rotate(' + (Math.sin(t * 6 + i) * 8).toFixed(1) + 'deg)' });
      }
      floater(svg, s, frames, rnd(9000, 13000), i * 600, '');
    }
  }
  function bats() {
    if (reduce) return;
    var n = mobile ? 4 : 7, W = window.innerWidth, H = window.innerHeight;
    for (var i = 0; i < n; i++) {
      var s = rnd(56, 88), col = isDark() ? '#0a0612' : '#2e1065';
      var glow = isDark() ? 'filter:drop-shadow(0 0 4px rgba(251,146,60,.95)) drop-shadow(0 0 10px rgba(251,146,60,.6))' : '';
      var svg = '<svg viewBox="0 0 64 28" width="100%" style="overflow:visible;' + glow + '"><path d="M32 8 c2-4 4-4 5 0 c6-6 16-8 27 0 c-6 0-9 4-10 10 c-4-4-8-4-11 0 c-3-3-6-3-8 2 c-2-5-5-5-8-2 c-3-4-7-4-11 0 c-1-6-4-10-10-10 c11-8 21-6 27 0 c1-4 3-4 5 0 z" fill="' + col + '"/></svg>';
      var ltr = i % 2 === 0, y = rnd(0.12, 0.6) * H, frames = [];
      for (var k = 0; k <= 8; k++) {
        var t = k / 8, x = ltr ? -80 + t * (W + 160) : W + 80 - t * (W + 160);
        frames.push({ transform: 'translate(' + x.toFixed(0) + 'px,' + (y + Math.sin(t * 10 + i) * 40).toFixed(0) + 'px)' });
      }
      floater(svg, s, frames, rnd(6000, 9000), i * 800, 'dw-bat');
    }
  }

  /* ---------- build ---------- */
  function init() {
    var style = document.createElement('style');
    style.id = 'dw-style';
    style.textContent = css;
    document.head.appendChild(style);

    var garland = null, header = document.querySelector('.site-header');
    if (has('garland') && header) {
      if (getComputedStyle(header).position === 'static') header.style.position = 'relative';
      garland = document.createElement('div');
      garland.className = 'dw-garland';
      garland.setAttribute('aria-hidden', 'true');
      var cols = fest.garland || ['#FD9E01'];
      garland.style.setProperty('--fg-line', cols[0] + '88');
      var n = Math.max(12, Math.round(window.innerWidth / 48));
      for (var i = 0; i < n; i++) {
        var b = document.createElement('i'), c = cols[i % cols.length];
        b.style.background = c;
        b.style.boxShadow = '0 0 6px 2px ' + c + '8c';
        b.style.animationDelay = (Math.random() * 2.4).toFixed(2) + 's';
        garland.appendChild(b);
      }
      header.appendChild(garland);
    }

    var g = document.createElement('div');
    g.className = 'dw-greet';
    g.setAttribute('role', 'status');
    g.innerHTML = iconHtml() + '<span>' + fill(fest.title) + '<small>' + fill(fest.sub) + '</small></span>' +
      '<button type="button" aria-label="Hide greeting">&times;</button>';
    document.body.appendChild(g);
    requestAnimationFrame(function () { setTimeout(function () { g.classList.add('is-in'); }, 400); });
    if (mobile) setTimeout(function () { g.classList.remove('is-in'); setTimeout(function () { if (g.parentNode) g.remove(); }, 600); }, 6000);

    if (has('fireworks')) fireworks(mobile ? 4 : 7, 650);
    if (has('confetti')) timers.push(setTimeout(confetti, 1200));
    if (has('snow')) snow();
    if (has('holi')) holi();
    if (has('kites')) kites();
    if (has('lanterns')) lanterns();
    if (has('balloons')) balloons();
    if (has('bats')) bats();

    var extras = [], mo = null;
    if (has('lamps')) {
      var lampSvg = '<svg viewBox="0 0 56 50" aria-hidden="true"><defs><radialGradient id="dwLampGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd166" stop-opacity=".95"/><stop offset=".45" stop-color="#FD9E01" stop-opacity=".45"/><stop offset="1" stop-color="#FD9E01" stop-opacity="0"/></radialGradient></defs>' +
        '<g class="dw-lamp-flame"><circle class="dw-lamp-halo" cx="28" cy="16" r="18" fill="url(#dwLampGlow)"/><g class="dw-lamp-flicker" style="transform-origin:28px 24px"><path d="M28 2c5 7 7 11 7 15a7 7 0 0 1-14 0c0-4 2-8 7-15z" fill="#FD9E01"/><path d="M28 10c2.4 3.4 3.4 5.8 3.4 7.6a3.4 3.4 0 0 1-6.8 0c0-1.8 1-4.2 3.4-7.6z" fill="#fff4d6"/></g></g>' +
        '<path d="M4 28h48c-2 11-11 18-24 18S6 39 4 28z" fill="#d97706"/><path d="M4 28h48" stroke="#ffd166" stroke-width="2" stroke-linecap="round"/><path d="M10 33c6 3 12 4 18 4s12-1 18-4" stroke="#7c2d12" stroke-width="1.4" fill="none" opacity=".55"/><circle cx="18" cy="38" r="1.6" fill="#ffd166"/><circle cx="28" cy="40" r="1.6" fill="#ffd166"/><circle cx="38" cy="38" r="1.6" fill="#ffd166"/></svg>';
      ['l', 'r'].forEach(function (side) {
        var pool = document.createElement('div'); pool.className = 'dw-pool dw-pool--' + side; pool.setAttribute('aria-hidden', 'true');
        var lamp = document.createElement('div'); lamp.className = 'dw-lamp dw-lamp--' + side; lamp.setAttribute('aria-hidden', 'true'); lamp.innerHTML = lampSvg;
        document.body.appendChild(pool); document.body.appendChild(lamp); extras.push(pool, lamp);
      });
    }
    var first = true;
    function onTheme() {
      if (has('lamps')) root.classList.toggle('dw-lit', isDark());
      if (!first && has('fireworks')) fireworks(3, 450);
      first = false;
    }
    setTimeout(onTheme, 600);
    mo = new MutationObserver(onTheme);
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    g.querySelector('button').addEventListener('click', function () {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      mo.disconnect();
      root.classList.remove('dw-lit');
      timers.forEach(clearTimeout); parts = []; rockets = [];
      if (raf) cancelAnimationFrame(raf);
      if (cv) cv.remove();
      cleanups.forEach(function (f) { f(); });
      extras.forEach(function (el) { el.remove(); });
      if (garland) garland.remove();
      g.classList.remove('is-in');
      setTimeout(function () { g.remove(); }, 500);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
