/* Pravadh Labs — our own form handling (Netlify Forms) + a simple sum check.
 *
 * Every form on the site posts to this Netlify site. Netlify stores the submission,
 * runs its built-in spam filter, and emails it to the address set under
 * Netlify → Site configuration → Forms → Form notifications (partners@pravadhlabs.com).
 *
 * Bots are stopped by:
 *   - a simple sum ("What is 3 + 4?") shown on the form,
 *   - a hidden honeypot field (bot-field) that only bots fill in,
 *   - a time check: nobody fills a form within 3 seconds of the page loading,
 *   - Netlify's spam filter on the server.
 *
 * Netlify only keeps fields it saw in the deployed HTML, so each form name used here has a
 * matching <form data-netlify="true"> in the HTML (see contact.html, partners.html, index.html, eap.html).
 */
(function (global) {
  var loadedAt = Date.now();

  // ---- Simple sum check ---------------------------------------------------------
  function newSum() {
    var a = 1 + Math.floor(Math.random() * 9), b = 1 + Math.floor(Math.random() * 9);
    return { q: 'What is ' + a + ' + ' + b + '?', a: a + b };
  }
  // Renders the sum into any element with [data-simple-captcha] inside the form.
  function mountSum(form) {
    var host = form.querySelector('[data-simple-captcha]');
    if (!host || host.__sum) return;
    var id = (form.id || 'f') + '-sum';
    host.classList.add('field');
    host.innerHTML =
      '<label for="' + id + '">Quick check: <span class="sum-q"></span></label>' +
      '<input type="text" id="' + id + '" inputmode="numeric" autocomplete="off" maxlength="3" placeholder="Your answer" style="max-width:160px">' +
      '<p class="field-hint">Answer the sum so we know you\'re a person.</p>';
    host.__refresh = function () {
      host.__sum = newSum();
      host.querySelector('.sum-q').textContent = host.__sum.q;
      host.querySelector('input').value = '';
    };
    host.__refresh();
  }
  function sumOk(form) {
    var host = form.querySelector('[data-simple-captcha]');
    if (!host || !host.__sum) return true;
    return parseInt(host.querySelector('input').value, 10) === host.__sum.a;
  }
  function sumRefresh(form) {
    var host = form.querySelector('[data-simple-captcha]');
    if (host && host.__refresh) host.__refresh();
  }

  // ---- Sending ---------------------------------------------------------------------
  // data: plain object of fields. Resolves when Netlify accepts it.
  function post(formName, data) {
    var body = new URLSearchParams();
    body.append('form-name', formName);
    Object.keys(data).forEach(function (k) {
      var v = data[k];
      if (v == null) return;
      body.append(k, Array.isArray(v) ? v.join(', ') : String(v));
    });
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      if (timer) clearTimeout(timer);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return { ok: true };
    });
  }

  function looksLikeBot(honeypotValue) {
    if (honeypotValue) return true;
    return Date.now() - loadedAt < 3000;
  }

  // For the HTML forms (contact, partners): checks the sum, honeypot and timing, then sends.
  // Resolves {ok:true} | {sumWrong:true}. A bot gets a fake {ok:true} and nothing is sent.
  function send(form) {
    if (!sumOk(form)) { sumRefresh(form); return Promise.resolve({ sumWrong: true }); }
    var fd = new FormData(form);
    if (looksLikeBot(fd.get('bot-field'))) return Promise.resolve({ ok: true, bot: true });
    var data = {};
    fd.forEach(function (v, k) { if (k !== 'form-name' && k !== 'bot-field') data[k] = v; });
    return post(form.getAttribute('name'), data).then(function (res) { sumRefresh(form); return res; });
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('form[data-netlify]'), mountSum);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  global.PravadhForms = { post: post, send: send, newSum: newSum, looksLikeBot: looksLikeBot, mountSum: mountSum };
  global.PravadhGuard = global.PravadhForms; // old name, kept so nothing breaks
})(window);
