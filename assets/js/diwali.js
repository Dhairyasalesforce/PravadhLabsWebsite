/* Diwali 2026 — light festive touches. Self-removes after 11 Nov 2026 (IST).
   To switch off early: delete the <script src="assets/js/diwali.js"> tag from the pages. */
(function () {
  'use strict';
  var END = Date.parse('2026-11-12T00:00:00+05:30');
  if (Date.now() >= END) return;

  var KEY = 'pravadh-diwali-2026-hidden';
  try { if (localStorage.getItem(KEY) === '1') return; } catch (e) {}

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = [
    /* garland of twinkling lights under the header */
    '.dw-garland{position:absolute;left:0;right:0;bottom:-7px;height:14px;pointer-events:none;z-index:2;display:flex;justify-content:space-around;overflow:hidden}',
    '.dw-garland::before{content:"";position:absolute;left:0;right:0;top:3px;height:1px;background:linear-gradient(90deg,transparent,rgba(253,158,1,.55),transparent)}',
    '.dw-garland i{position:relative;width:6px;height:6px;margin-top:1px;border-radius:50%;background:#FD9E01;box-shadow:0 0 6px 2px rgba(253,158,1,.55);animation:dw-twinkle 2.4s ease-in-out infinite}',
    '.dw-garland i:nth-child(3n){background:#ffd166;animation-delay:.8s}',
    '.dw-garland i:nth-child(3n+1){background:#ff7a3d;animation-delay:1.6s}',
    '@keyframes dw-twinkle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}',
    /* greeting */
    '.dw-greet{position:fixed;left:20px;bottom:24px;z-index:150;display:flex;align-items:center;gap:10px;padding:8px 10px 8px 12px;border-radius:999px;background:#0b1b3a;color:#fff;border:1px solid rgba(253,158,1,.45);box-shadow:0 10px 30px rgba(7,20,48,.35),0 0 24px rgba(253,158,1,.18);font:600 13.5px/1.2 Inter,system-ui,sans-serif;opacity:0;transform:translateY(12px);transition:opacity .5s ease,transform .5s cubic-bezier(.16,1,.3,1)}',
    '.dw-greet.is-in{opacity:1;transform:none}',
    '.dw-greet small{display:block;font-weight:400;font-size:11.5px;color:#cbd5e1;margin-top:2px}',
    '.dw-greet button{margin-left:4px;width:26px;height:26px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:#cbd5e1;cursor:pointer;font-size:16px;line-height:26px;padding:0}',
    '.dw-greet button:hover{background:rgba(255,255,255,.16);color:#fff}',
    '.dw-diya{width:34px;height:30px;flex:none}',
    '.dw-flame{transform-origin:17px 15px;animation:dw-flicker 1.6s ease-in-out infinite}',
    '@keyframes dw-flicker{0%,100%{transform:scale(1) rotate(-2deg)}25%{transform:scale(1.08,.94) rotate(2deg)}50%{transform:scale(.94,1.06) rotate(-1deg)}75%{transform:scale(1.04,.98) rotate(1deg)}}',
    '@media (max-width:640px){.dw-greet{left:50%;right:auto;top:84px;bottom:auto;transform:translate(-50%,-10px);font-size:12.5px;padding:6px 8px 6px 10px;gap:8px;white-space:nowrap}.dw-greet.is-in{transform:translate(-50%,0)}.dw-greet small{display:none}.dw-greet .dw-diya{width:28px;height:25px}}',
    /* sparkles */
    '.dw-sparks{position:fixed;inset:0;pointer-events:none;z-index:140;overflow:hidden;transition:opacity 1.2s ease}',
    '.dw-sparks i{position:absolute;bottom:-12px;width:5px;height:5px;border-radius:50%;background:#ffd166;box-shadow:0 0 8px 2px rgba(253,158,1,.6);opacity:0;animation:dw-rise linear forwards}',
    '@keyframes dw-rise{0%{opacity:0;transform:translate(0,0)}10%{opacity:.9}80%{opacity:.6}100%{opacity:0;transform:translate(var(--dx),-70vh)}}',
    /* corner diyas that light up in dark mode */
    '.dw-lamp{position:fixed;bottom:14px;z-index:145;width:56px;height:50px;pointer-events:none;opacity:0;transform:translateY(16px) scale(.85);transition:opacity .7s ease,transform .7s cubic-bezier(.16,1,.3,1)}',
    '.dw-lamp--l{left:18px}',
    '.dw-lamp--r{right:98px}',
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
    'html.dw-lit .dw-garland i{box-shadow:0 0 10px 3px rgba(253,158,1,.75)}',
    '@media (max-width:640px){.dw-lamp{display:none}html.dw-lit .dw-greet{left:50%}.dw-pool{width:75vw;height:75vw}}',
    '@media (prefers-reduced-motion:reduce){.dw-garland i,.dw-flame,html.dw-lit .dw-lamp .dw-lamp-flicker,html.dw-lit .dw-lamp .dw-lamp-halo{animation:none}}'
  ].join('\n');

  function init() {
    var style = document.createElement('style');
    style.id = 'dw-style';
    style.textContent = css;
    document.head.appendChild(style);

    /* garland */
    var header = document.querySelector('.site-header');
    var garland;
    if (header) {
      if (getComputedStyle(header).position === 'static') header.style.position = 'relative';
      garland = document.createElement('div');
      garland.className = 'dw-garland';
      garland.setAttribute('aria-hidden', 'true');
      var n = Math.max(12, Math.round(window.innerWidth / 48));
      for (var i = 0; i < n; i++) {
        var b = document.createElement('i');
        b.style.animationDelay = (Math.random() * 2.4).toFixed(2) + 's';
        garland.appendChild(b);
      }
      header.appendChild(garland);
    }

    /* greeting with a flickering diya */
    var g = document.createElement('div');
    g.className = 'dw-greet';
    g.setAttribute('role', 'status');
    g.innerHTML =
      '<svg class="dw-diya" viewBox="0 0 34 30" aria-hidden="true">' +
        '<defs><radialGradient id="dwGlow" cx="50%" cy="45%" r="50%"><stop offset="0" stop-color="#ffd166" stop-opacity=".9"/><stop offset="1" stop-color="#FD9E01" stop-opacity="0"/></radialGradient></defs>' +
        '<circle cx="17" cy="10" r="10" fill="url(#dwGlow)"/>' +
        '<path class="dw-flame" d="M17 2c3 4 4 7 4 9a4 4 0 0 1-8 0c0-2 1-5 4-9z" fill="#FD9E01"/>' +
        '<path class="dw-flame" d="M17 7c1.4 2 2 3.4 2 4.4a2 2 0 0 1-4 0c0-1 .6-2.4 2-4.4z" fill="#fff4d6"/>' +
        '<path d="M3 17h28c-1 6-6 10-14 10S4 23 3 17z" fill="#d97706"/>' +
        '<path d="M3 17h28" stroke="#ffd166" stroke-width="1.5" stroke-linecap="round"/>' +
        '<circle cx="11" cy="21" r="1.2" fill="#ffd166"/><circle cx="17" cy="22.5" r="1.2" fill="#ffd166"/><circle cx="23" cy="21" r="1.2" fill="#ffd166"/>' +
      '</svg>' +
      '<span>Happy Diwali<small>Light, clarity and a great year ahead — Pravadh Labs</small></span>' +
      '<button type="button" aria-label="Hide Diwali greeting">&times;</button>';
    document.body.appendChild(g);
    requestAnimationFrame(function () { setTimeout(function () { g.classList.add('is-in'); }, 400); });
    /* phones: show the greeting briefly at the top, then let it go */
    if (window.matchMedia && window.matchMedia('(max-width: 640px)').matches) {
      setTimeout(function () {
        g.classList.remove('is-in');
        setTimeout(function () { if (g.parentNode) g.remove(); }, 600);
      }, 6000);
    }

    /* a short burst of rising sparkles after load */
    var sparks;
    if (!reduce) {
      sparks = document.createElement('div');
      sparks.className = 'dw-sparks';
      sparks.setAttribute('aria-hidden', 'true');
      document.body.appendChild(sparks);
      var count = window.innerWidth < 640 ? 10 : 22;
      for (var k = 0; k < count; k++) {
        var s = document.createElement('i');
        s.style.left = (Math.random() * 100).toFixed(1) + '%';
        s.style.setProperty('--dx', ((Math.random() - 0.5) * 120).toFixed(0) + 'px');
        var size = (3 + Math.random() * 4).toFixed(1) + 'px';
        s.style.width = size; s.style.height = size;
        s.style.animationDuration = (4 + Math.random() * 4).toFixed(2) + 's';
        s.style.animationDelay = (Math.random() * 3).toFixed(2) + 's';
        sparks.appendChild(s);
      }
      setTimeout(function () { if (sparks) sparks.remove(); }, 11500);
    }

    /* corner diyas: light up when the site is in dark mode */
    var lampSvg =
      '<svg viewBox="0 0 56 50" aria-hidden="true">' +
        '<defs><radialGradient id="dwLampGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd166" stop-opacity=".95"/><stop offset=".45" stop-color="#FD9E01" stop-opacity=".45"/><stop offset="1" stop-color="#FD9E01" stop-opacity="0"/></radialGradient></defs>' +
        '<g class="dw-lamp-flame">' +
          '<circle class="dw-lamp-halo" cx="28" cy="16" r="18" fill="url(#dwLampGlow)"/>' +
          '<g class="dw-lamp-flicker" style="transform-origin:28px 24px">' +
            '<path d="M28 2c5 7 7 11 7 15a7 7 0 0 1-14 0c0-4 2-8 7-15z" fill="#FD9E01"/>' +
            '<path d="M28 10c2.4 3.4 3.4 5.8 3.4 7.6a3.4 3.4 0 0 1-6.8 0c0-1.8 1-4.2 3.4-7.6z" fill="#fff4d6"/>' +
          '</g>' +
        '</g>' +
        '<path d="M4 28h48c-2 11-11 18-24 18S6 39 4 28z" fill="#d97706"/>' +
        '<path d="M4 28h48" stroke="#ffd166" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M10 33c6 3 12 4 18 4s12-1 18-4" stroke="#7c2d12" stroke-width="1.4" fill="none" opacity=".55"/>' +
        '<circle cx="18" cy="38" r="1.6" fill="#ffd166"/><circle cx="28" cy="40" r="1.6" fill="#ffd166"/><circle cx="38" cy="38" r="1.6" fill="#ffd166"/>' +
      '</svg>';
    var extras = [];
    ['l', 'r'].forEach(function (side) {
      var pool = document.createElement('div');
      pool.className = 'dw-pool dw-pool--' + side;
      pool.setAttribute('aria-hidden', 'true');
      var lamp = document.createElement('div');
      lamp.className = 'dw-lamp dw-lamp--' + side;
      lamp.setAttribute('aria-hidden', 'true');
      lamp.innerHTML = lampSvg;
      document.body.appendChild(pool);
      document.body.appendChild(lamp);
      extras.push(pool, lamp);
    });
    var root = document.documentElement;
    function isDark() {
      return root.getAttribute('data-theme') === 'dark'; /* site default is light */
    }
    function syncLamps() { root.classList.toggle('dw-lit', isDark()); }
    setTimeout(syncLamps, 600);
    var mo = new MutationObserver(syncLamps);
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    g.querySelector('button').addEventListener('click', function () {
      mo.disconnect();
      root.classList.remove('dw-lit');
      extras.forEach(function (el) { el.remove(); });
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      g.classList.remove('is-in');
      setTimeout(function () { g.remove(); }, 500);
      if (garland) garland.remove();
      if (sparks) sparks.remove();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
