/* Pravadh Labs — time-of-day theme.
   Phases follow the visitor's own clock:
     sunrise 05:00–08:00 · day 08:00–17:00 · dusk 17:00–19:30 · night 19:30–05:00
   sunrise/day use the light theme; dusk/night use the dark theme.
   The header button cycles Auto → Light → Dark → Auto (saved as 'pravadh-theme-mode').
   Preview any phase with ?theme=sunrise|day|dusk|night (not saved). */
(function () {
  'use strict';
  var root = document.documentElement;
  var KEY = 'pravadh-theme-mode';
  var LABEL = { sunrise: 'Sunrise', day: 'Day', dusk: 'Dusk', night: 'Night' };

  function phaseNow() {
    var d = new Date(), m = d.getHours() * 60 + d.getMinutes();
    if (m >= 300 && m < 480) return 'sunrise';
    if (m >= 480 && m < 1020) return 'day';
    if (m >= 1020 && m < 1170) return 'dusk';
    return 'night';
  }
  function getMode() {
    try { var v = localStorage.getItem(KEY); if (v === 'light' || v === 'dark') return v; } catch (e) {}
    return 'auto';
  }
  var preview = (location.search.match(/[?&]theme=(sunrise|day|dusk|night)\b/) || [])[1] || null;

  function apply(sky, mode, animate) {
    var theme = (sky === 'sunrise' || sky === 'day') ? 'light' : 'dark';
    var changed = root.getAttribute('data-sky') !== sky || root.getAttribute('data-theme') !== theme;
    if (animate && changed) {
      root.classList.add('sky-shift');
      clearTimeout(apply._t);
      apply._t = setTimeout(function () { root.classList.remove('sky-shift'); }, 1800);
    }
    root.setAttribute('data-sky', sky);
    root.setAttribute('data-theme-mode', preview ? 'preview' : mode);
    if (root.getAttribute('data-theme') !== theme) root.setAttribute('data-theme', theme);
    syncButton();
  }
  function current(mode) {
    if (preview) return preview;
    if (mode === 'light') return 'day';
    if (mode === 'dark') return 'night';
    return phaseNow();
  }

  var btn = document.getElementById('themeToggle');
  function syncButton() {
    if (!btn) return;
    var mode = preview ? 'auto' : getMode();
    var sky = root.getAttribute('data-sky') || 'day';
    var isDark = root.getAttribute('data-theme') === 'dark';
    btn.setAttribute('data-mode', mode);
    btn.setAttribute('aria-checked', String(isDark));
    var next = mode === 'auto' ? 'Light' : mode === 'light' ? 'Dark' : 'Auto';
    var now = mode === 'auto' ? 'Auto (' + LABEL[sky] + ', follows your local time)' : mode === 'light' ? 'Light' : 'Dark';
    btn.setAttribute('aria-label', 'Theme: ' + now + '. Switch to ' + next);
    btn.setAttribute('title', 'Theme: ' + now + ' — click for ' + next);
  }
  if (btn) {
    btn.addEventListener('click', function () {
      preview = null;
      var mode = getMode();
      var next = mode === 'auto' ? 'light' : mode === 'light' ? 'dark' : 'auto';
      try { if (next === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, next); } catch (e) {}
      apply(current(next), next, true);
    });
  }

  var glow = document.createElement('div');
  glow.className = 'sky-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(glow);

  apply(current(getMode()), getMode(), false);

  /* keep drifting with the clock while the page stays open */
  setInterval(function () { if (!preview && getMode() === 'auto') apply(phaseNow(), 'auto', true); }, 60000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !preview && getMode() === 'auto') apply(phaseNow(), 'auto', true);
  });

  window.pravadhSky = { phase: phaseNow, set: function (s) { preview = s; apply(s, 'auto', true); } };
})();
