/* Pravadh Labs — analytics with consent (Google Tag Manager GTM-NP8DTJPZ → GA4 G-47YMCNDQP0).
 *
 * Nothing is stored or tracked until the visitor clicks Accept. Before that,
 * Google Consent Mode v2 runs with everything "denied", so Google gets only
 * cookieless pings. The choice is remembered for 180 days. Any element with
 * data-cookie-settings re-opens the banner so a visitor can change their mind.
 */
(function () {
  var GTM_ID = 'GTM-NP8DTJPZ';
  var KEY = 'pravadh-consent-v1';
  var MAX_AGE = 180 * 24 * 60 * 60 * 1000;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && (v.choice === 'granted' || v.choice === 'denied') && Date.now() - v.at < MAX_AGE) return v.choice;
    } catch (e) {}
    return null;
  }
  function save(choice) {
    try { localStorage.setItem(KEY, JSON.stringify({ choice: choice, at: Date.now() })); } catch (e) {}
  }
  function state(choice) {
    return {
      analytics_storage: choice,
      ad_storage: choice,
      ad_user_data: choice,
      ad_personalization: choice
    };
  }

  var stored = read();
  var d = state('denied');
  d.wait_for_update = 500;
  gtag('consent', 'default', d);
  if (stored === 'granted') gtag('consent', 'update', state('granted'));

  /* Google Tag Manager */
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
  (document.head || document.documentElement).appendChild(s);

  /* Banner */
  var CSS =
    '.pv-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;' +
    'background:#fff;color:#14171F;border:1px solid rgba(7,20,48,.12);border-radius:14px;' +
    'box-shadow:0 16px 40px rgba(7,20,48,.18);padding:16px 18px;font:14px/1.5 Inter,system-ui,sans-serif}' +
    'html[data-theme="dark"] .pv-consent{background:#14171F;color:#E8ECF4;border-color:rgba(255,255,255,.12)}' +
    '.pv-consent p{margin:0 0 12px}' +
    '.pv-consent__row{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}' +
    '.pv-consent button{font:600 14px/1 Inter,system-ui,sans-serif;padding:10px 16px;border-radius:10px;cursor:pointer;' +
    'border:1px solid rgba(7,20,48,.18);background:transparent;color:inherit}' +
    'html[data-theme="dark"] .pv-consent button{border-color:rgba(255,255,255,.22)}' +
    '.pv-consent button.pv-consent__ok{border:0;color:#fff;background:linear-gradient(135deg,#2563eb 0%,#0ea5e9 100%)}' +
    '.pv-consent button:focus-visible{outline:2px solid #2563eb;outline-offset:2px}';

  var box;
  function close() { if (box && box.parentNode) box.parentNode.removeChild(box); box = null; }
  function choose(choice) {
    save(choice);
    gtag('consent', 'update', state(choice));
    window.dataLayer.push({ event: 'consent_' + choice });
    close();
  }
  function open() {
    if (box) return;
    if (!document.getElementById('pv-consent-css')) {
      var st = document.createElement('style');
      st.id = 'pv-consent-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    box = document.createElement('div');
    box.className = 'pv-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Cookie choice');
    box.innerHTML =
      '<p>We use cookies to see how visitors use this site, so we can make it better. ' +
      'Nothing is tracked unless you accept.</p>' +
      '<div class="pv-consent__row">' +
      '<button type="button" class="pv-consent__no">Reject</button>' +
      '<button type="button" class="pv-consent__ok">Accept</button></div>';
    box.querySelector('.pv-consent__no').onclick = function () { choose('denied'); };
    box.querySelector('.pv-consent__ok').onclick = function () { choose('granted'); };
    document.body.appendChild(box);
  }

  function ready() {
    if (!read()) open();
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest && e.target.closest('[data-cookie-settings]');
      if (t) { e.preventDefault(); open(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();

  window.pravadhConsent = { open: open };
})();
