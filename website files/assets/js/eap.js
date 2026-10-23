/* Pravadh Labs Early Access Program (EAP) — application form.
 *
 * Sends each application straight into Pravadh SI as a lead in the EAP
 * pipeline, carrying the lead Source (linkedin / google / website / email …)
 * from attribution.js. If Pravadh SI can't be reached, the application is
 * emailed through the existing Web3Forms inbox instead so it is never lost.
 */
(function () {
  // ---- Config ---------------------------------------------------------------
  var CONFIG = {
    siIntakeUrl: 'https://pravadhsi.pravadhlabs.com/api/public/eap/applications',
    program: 'EAP',
    formVersion: 'eap-2026-10',
    timeoutMs: 12000,
    // Backup route: the same Web3Forms inbox the contact form already uses.
    backupUrl: 'https://api.web3forms.com/submit',
    backupKey: '9427ca7d-4e4b-4a61-93be-13c1de8d9e66'
  };
  // Allow a staging override without editing this file: <html data-si-intake="...">
  var override = document.documentElement.getAttribute('data-si-intake');
  if (override) CONFIG.siIntakeUrl = override;
  CONFIG.siCaptchaUrl = CONFIG.siIntakeUrl.replace(/\/applications\/?$/, '/captcha');
  var INTERNAL_DOMAINS = ['pravadhlabs.com', 'pravadh.com'];

  var form = document.getElementById('eapForm');
  if (!form) return;
  var statusEl = document.getElementById('eapStatus');
  var submitBtn = form.querySelector('button[type="submit"]');
  var successPanel = document.getElementById('eapSuccess');
  var captchaQ = document.getElementById('captchaQuestion');
  var captchaInput = document.getElementById('captchaAnswer');
  var captchaToken = '';
  var captchaOffline = false;

  // Signed, single-use maths question from Pravadh SI. The answer is checked on the server.
  function loadCaptcha() {
    captchaToken = '';
    if (captchaInput) captchaInput.value = '';
    if (captchaQ) captchaQ.textContent = 'loading…';
    return fetch(CONFIG.siCaptchaUrl, { mode: 'cors', credentials: 'omit', cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('captcha ' + r.status); return r.json(); })
      .then(function (d) {
        captchaToken = d.token;
        captchaOffline = false;
        if (captchaQ) captchaQ.textContent = d.question;
      })
      .catch(function () {
        captchaOffline = true;
        if (captchaQ) captchaQ.textContent = 'unavailable right now (you can still apply)';
      });
  }
  loadCaptcha();
  var refresh = document.getElementById('captchaRefresh');
  if (refresh) refresh.addEventListener('click', loadCaptcha);

  var NAME_RE = /^[\p{L}\s.'-]+$/u;
  var VOWEL_RE = /[aeiouy]/i;

  function setStatus(msg, isError) {
    statusEl.textContent = msg;
    statusEl.classList.toggle('is-error', !!isError);
  }

  function looksReal(text, minChars, minWords) {
    var t = String(text || '').trim();
    if (t.length < minChars) return false;
    var words = t.split(/\s+/).filter(Boolean);
    if (words.length < minWords) return false;
    return words.filter(function (w) { return VOWEL_RE.test(w); }).length >= words.length * 0.5;
  }

  function fail(field, msg) {
    setStatus(msg, true);
    if (field && field.focus) {
      field.classList.add('is-invalid');
      field.focus();
    }
    return false;
  }

  function selectedProducts() {
    return Array.prototype.slice
      .call(form.querySelectorAll('input[name="products"]:checked'))
      .map(function (el) { return el.value; });
  }

  // Preselect a product from ?product=pravadhiq etc. (used by product-page CTAs)
  (function preselect() {
    try {
      var p = new URLSearchParams(window.location.search).get('product');
      if (!p) return;
      var box = form.querySelector('input[name="products"][value="' + p.toLowerCase().replace(/[^a-z-]/g, '') + '"]');
      if (box) box.checked = true;
    } catch (e) { /* ignore */ }
  })();

  form.addEventListener('input', function (e) {
    if (e.target.classList) e.target.classList.remove('is-invalid');
  });

  function validate() {
    if (!NAME_RE.test(form.fullName.value.trim()) || form.fullName.value.trim().length < 2) {
      return fail(form.fullName, 'Please enter your full name.');
    }
    if (!window.PravadhEmail || !window.PravadhEmail.isBusinessEmail(form.email.value)) {
      return fail(form.email, window.PravadhEmail ? window.PravadhEmail.message : 'Please use a company email.');
    }
    if (form.company.value.trim().length < 2) return fail(form.company, 'Please enter your company name.');
    if (form.role.value.trim().length < 2) return fail(form.role, 'Please enter your role.');
    if (!form.companySize.value) return fail(form.companySize, 'Please choose your company size.');
    if (!form.country.value.trim()) return fail(form.country, 'Please enter your country.');
    if (!selectedProducts().length) {
      return fail(form.querySelector('input[name="products"]'), 'Pick at least one product you want early access to.');
    }
    if (!looksReal(form.challenge.value, 30, 6)) {
      return fail(form.challenge, 'Tell us a little more about the business problem (a sentence or two). It is how we review applications.');
    }
    if (!form.timeline.value) return fail(form.timeline, 'Please choose when you would want to start.');
    var domain = form.email.value.trim().toLowerCase().split('@')[1] || '';
    if (INTERNAL_DOMAINS.some(function (d) { return domain === d || domain.slice(-d.length - 1) === '.' + d; })) {
      return fail(form.email, 'The Early Access Program is for external businesses. Pravadh Labs team members cannot apply.');
    }
    var phone = form.phone.value.trim();
    if (phone && (!/^[+\d\s().-]{7,25}$/.test(phone) || phone.replace(/\D/g, '').length < 7)) {
      return fail(form.phone, 'Please enter a valid phone number, or leave it blank.');
    }
    if (!captchaOffline && !/^\d{1,3}$/.test(captchaInput.value.trim())) {
      return fail(captchaInput, 'Please answer the quick maths question.');
    }
    if (!form.consent.checked) return fail(form.consent, 'Please confirm we can contact you about your application.');
    return true;
  }

  function buildPayload() {
    var attr = window.PravadhAttribution ? window.PravadhAttribution.get() : { source: 'website', first_source: 'website', detail: {} };
    return {
      program: CONFIG.program,
      form_version: CONFIG.formVersion,
      submitted_at: new Date().toISOString(),
      applicant: {
        full_name: form.fullName.value.trim(),
        email: form.email.value.trim().toLowerCase(),
        phone: form.phone.value.trim() || null,
        company: form.company.value.trim(),
        company_website: form.website.value.trim() || null,
        role: form.role.value.trim(),
        company_size: form.companySize.value,
        country: form.country.value.trim()
      },
      application: {
        products: selectedProducts(),
        challenge: form.challenge.value.trim(),
        current_tools: form.currentTools.value.trim() || null,
        timeline: form.timeline.value,
        consent: true
      },
      // Internal only — never rendered to the applicant.
      source: attr.source,
      first_source: attr.first_source,
      attribution: attr.detail,
      captcha_token: captchaToken,
      captcha_answer: captchaInput ? captchaInput.value.trim() : '',
      hp: form.companyFax.value // honeypot; must stay empty
    };
  }

  function postToSI(payload) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, CONFIG.timeoutMs) : null;
    return fetch(CONFIG.siIntakeUrl, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.status === 409 || (data && data.duplicate)) return { ok: true, duplicate: true, ref: data.reference };
        if (res.ok && data.ok !== false) return { ok: true, ref: data.reference };
        var err = new Error(data.error || ('HTTP ' + res.status));
        // 4xx = Pravadh SI looked at the application and refused it. Show why; never email it
        // through the backup route. Only an outage (5xx / network) falls back to email.
        err.rejected = res.status >= 400 && res.status < 500;
        err.field = data.field;
        throw err;
      });
    });
  }

  function postToBackup(payload) {
    var a = payload.applicant, app = payload.application;
    var fd = new FormData();
    fd.append('access_key', CONFIG.backupKey);
    fd.append('subject', '[EAP application — SI unreachable] ' + a.company + ' (' + payload.source + ')');
    fd.append('from_name', 'Pravadh Labs EAP');
    fd.append('name', a.full_name);
    fd.append('email', a.email);
    fd.append('message', [
      'Pravadh SI did not accept this application, so it was emailed instead. Add it to SI manually.',
      '',
      'Source: ' + payload.source + ' (first touch: ' + payload.first_source + ')',
      'Company: ' + a.company + (a.company_website ? ' — ' + a.company_website : ''),
      'Role: ' + a.role + ' | Size: ' + a.company_size + ' | Country: ' + a.country,
      'Phone: ' + (a.phone || '—'),
      'Products: ' + app.products.join(', '),
      'Timeline: ' + app.timeline,
      'Current tools: ' + (app.current_tools || '—'),
      '',
      'Challenge:',
      app.challenge,
      '',
      'Raw JSON:',
      JSON.stringify(payload)
    ].join('\n'));
    return fetch(CONFIG.backupUrl, { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (!d.success) throw new Error('backup failed'); return { ok: true, backup: true }; });
  }

  function showSuccess(result) {
    form.hidden = true;
    successPanel.hidden = false;
    var refEl = document.getElementById('eapRef');
    if (result.ref && refEl) {
      refEl.textContent = 'Application reference: ' + result.ref;
      refEl.hidden = false;
    }
    if (result.duplicate) {
      document.getElementById('eapSuccessMsg').textContent =
        'We already have your application. Our team will review it and reply from a pravadhlabs.com address — no need to apply again.';
    }
    successPanel.focus();
    try { window.scrollTo({ top: successPanel.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' }); } catch (e) { /* ignore */ }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.companyFax.value) return; // bot
    if (!validate()) return;

    var payload = buildPayload();
    submitBtn.disabled = true;
    setStatus('Submitting your application…');

    var FIELD_IDS = { fullName: 'fullName', email: 'email', company: 'company', website: 'website', role: 'role',
      companySize: 'companySize', country: 'country', phone: 'phone', challenge: 'challenge', timeline: 'timeline',
      consent: 'consent', captcha: 'captchaAnswer' };

    postToSI(payload)
      .catch(function (err) {
        if (err && err.rejected) throw err;
        return postToBackup(payload); // SI unreachable or failing — email it so nothing is lost
      })
      .then(showSuccess)
      .catch(function (err) {
        submitBtn.disabled = false;
        if (err && err.rejected) {
          var el = err.field === 'products' ? form.querySelector('input[name="products"]') : document.getElementById(FIELD_IDS[err.field] || '');
          setStatus(err.message, true);
          if (el) { el.classList.add('is-invalid'); if (el.focus) el.focus(); }
          loadCaptcha(); // every question is single-use
          return;
        }
        setStatus('We could not submit that just now. Please try again, or email inquire@pravadhlabs.com with "EAP" in the subject.', true);
      });
  });
})();
