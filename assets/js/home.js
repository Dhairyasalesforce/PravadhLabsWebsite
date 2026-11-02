/* Pravadh Labs — homepage interactions (v2, Oct 2026) */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- hero intro: one orchestrated moment ---------- */
  if (!reduce) {
    root.classList.add('hx-js');
    var go = function () { requestAnimationFrame(function () { root.classList.add('hx-ready'); }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
    setTimeout(function () { root.classList.add('hx-ready'); }, 1500); // never leave the hero hidden
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDesk();
    initTabs();
    initSteps();
    initFaqSingleOpen();
  });

  /* ---------- the approval desk ---------- */
  function initDesk() {
    var desk = document.getElementById('hxDesk');
    if (!desk) return;
    var el = {
      task: document.getElementById('hxTask'),
      mark: document.getElementById('hxTaskMark'),
      product: document.getElementById('hxTaskProduct'),
      title: document.getElementById('hxTaskTitle'),
      state: document.getElementById('hxTaskState'),
      log: document.getElementById('hxTaskLog'),
      bar: document.getElementById('hxTaskBar'),
      btn: document.getElementById('hxApprove'),
      hint: document.getElementById('hxHint'),
      done: document.getElementById('hxDone'),
      list: document.getElementById('hxDoneList'),
      cursor: document.getElementById('hxCursor')
    };

    var tasks = [
      { m: 'IQ', p: 'PravadhIQ', c: '#2563eb', t: 'Deploy release 4.3 to production', a: 'Approve deploy',
        log: ['Compared 14 changed components with production', 'Risk scored low, no destructive changes', 'Rollback plan ready'],
        d: 'Deployed release 4.3 with rollback plan' },
      { m: 'SI', p: 'Pravadh SI', c: '#0a66c2', t: 'Email the Head of RevOps at a fintech lead', a: 'Approve send',
        log: ['Lead scored 86 out of 100', 'Found a hiring signal from this week', 'Drafted a short, personal first email'],
        d: 'Sent a personal email to a scored lead' },
      { m: 'CB', p: 'Caliber', c: '#7c3aed', t: 'Shortlist for Salesforce Developer', a: 'Approve shortlist',
        log: ['Interviewed 9 candidates on camera', 'Scored answers against your rubric', 'Sealed each report'],
        d: 'Shortlisted 3 candidates for Salesforce Developer' },
      { m: 'GX', p: 'GovernX', c: '#d97706', t: 'Merge 212 duplicate accounts', a: 'Approve merge',
        log: ['Matched records across Salesforce and Zoho', 'Checked every merge against your policy', 'Undo snapshot saved'],
        d: 'Merged 212 duplicate accounts' },
      { m: 'PM', p: 'Pravadh PM', c: '#0f766e', t: 'Story WEB-142: export to CSV', a: 'Approve merge',
        log: ['Wrote the spec from the ticket', 'Built it on its own branch', '18 tests passing'],
        d: 'Merged WEB-142 after review' },
      { m: 'DS', p: 'DocSign', c: '#0891b2', t: 'Send the MSA for signature', a: 'Approve send',
        log: ['Generated the MSA from the Opportunity', 'Added two signers from Contacts', 'Will store the signed copy on the record'],
        d: 'Sent the MSA for signature, free' }
    ];

    var count = 128, i = 0, timers = [], visible = true, running = false, userClicked = false, awaiting = false;

    function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
    function clear() { timers.forEach(clearTimeout); timers = []; }

    function setState(s, label) {
      el.task.classList.remove('is-working', 'is-waiting', 'is-approved');
      el.task.classList.add(s);
      el.state.textContent = label;
    }

    function load(task) {
      el.task.style.setProperty('--c', task.c);
      el.mark.textContent = task.m;
      el.product.textContent = task.p;
      el.title.textContent = task.t;
      el.btn.textContent = task.a;
      el.log.innerHTML = '';
    }

    function addLog(text, typing) {
      var li = document.createElement('li');
      if (typing) li.className = 'is-typing';
      el.log.appendChild(li);
      var n = 0;
      (function type() {
        n += 2;
        li.textContent = text.slice(0, n);
        if (n < text.length) later(type, 18); else li.classList.remove('is-typing');
      })();
    }

    function run() {
      if (running || !visible) return;
      running = true;
      var task = tasks[i % tasks.length];
      el.task.classList.add('is-entering');
      load(task);
      setState('is-working', 'Working');
      el.btn.disabled = true;
      el.bar.style.setProperty('--p', 0);
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.task.classList.remove('is-entering'); }); });

      task.log.forEach(function (line, k) {
        later(function () { addLog(line, true); el.bar.style.setProperty('--p', (k + 1) / task.log.length); }, 450 + k * 900);
      });
      later(function () {
        setState('is-waiting', 'Waiting for you');
        el.btn.disabled = false;
        awaiting = true;
        // If the visitor doesn't click, show the idea with a ghost cursor.
        later(ghostClick, userClicked ? 5200 : 2600);
      }, 450 + task.log.length * 900 + 300);
    }

    function ghostClick() {
      if (!awaiting) return;
      var d = desk.getBoundingClientRect(), b = el.btn.getBoundingClientRect();
      el.cursor.style.transition = 'none';
      el.cursor.style.transform = 'translate(' + (d.width * 0.82) + 'px,' + (d.height * 0.95) + 'px)';
      el.cursor.style.opacity = '1';
      requestAnimationFrame(function () {
        el.cursor.style.transition = '';
        el.cursor.style.transform = 'translate(' + (b.left - d.left + b.width * 0.55) + 'px,' + (b.top - d.top + b.height * 0.45) + 'px)';
      });
      later(function () { el.btn.classList.add('is-pressed'); }, 950);
      later(function () { el.btn.classList.remove('is-pressed'); approve(false); }, 1120);
      later(function () { el.cursor.style.opacity = '0'; }, 1500);
    }

    function approve(byUser) {
      if (!awaiting) return;
      awaiting = false;
      clear();
      if (byUser) { userClicked = true; el.hint.textContent = 'Approved. The agent takes it from here.'; }
      var task = tasks[i % tasks.length];
      setState('is-approved', 'Approved');
      el.btn.disabled = true;
      count += 1;
      el.done.textContent = count;
      var li = document.createElement('li');
      li.className = 'is-new';
      li.style.setProperty('--c', task.c);
      var s = document.createElement('span'); s.textContent = task.p;
      li.appendChild(s); li.appendChild(document.createTextNode(' ' + task.d));
      el.list.insertBefore(li, el.list.firstChild);
      while (el.list.children.length > 2) el.list.removeChild(el.list.lastChild);

      later(function () { el.task.classList.add('is-leaving'); }, 1300);
      later(function () {
        el.task.classList.remove('is-leaving');
        i += 1; running = false;
        if (byUser) el.hint.textContent = 'Try it: nothing ships until you click.';
        run();
      }, 1750);
    }

    el.btn.addEventListener('click', function () { approve(true); });

    if (reduce) return; // static first task stays on screen, button still works once

    // Start fresh with the first task, pause when off-screen or tab hidden.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !running) run();
        if (!visible && running && !awaiting) { /* let current task finish */ }
      }, { threshold: 0.25 }).observe(desk);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clear(); running = false; awaiting = false; }
      else if (visible) run();
    });
    setTimeout(function () { if (!running) run(); }, 900);
  }

  /* ---------- product tabs (WAI-ARIA tabs pattern) ---------- */
  function initTabs() {
    document.querySelectorAll('[data-hx-tabs]').forEach(function (wrap) {
      var tabs = Array.prototype.slice.call(wrap.querySelectorAll('[role="tab"]'));
      function select(tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (!panel) return;
          if (on) {
            panel.hidden = false;
            panel.classList.remove('is-in'); void panel.offsetWidth; panel.classList.add('is-in');
          } else panel.hidden = true;
        });
        if (focus) tab.focus();
        if (tab.scrollIntoView && window.innerWidth < 861) tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
      }
      tabs.forEach(function (tab, k) {
        tab.addEventListener('click', function () { select(tab, false); });
        tab.addEventListener('keydown', function (e) {
          var n = null;
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = tabs[(k + 1) % tabs.length];
          if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = tabs[(k - 1 + tabs.length) % tabs.length];
          if (e.key === 'Home') n = tabs[0];
          if (e.key === 'End') n = tabs[tabs.length - 1];
          if (n) { e.preventDefault(); select(n, true); }
        });
      });
      // deep link: /#product-si opens that tab
      var m = location.hash.match(/^#product-(\w+)/);
      if (m) { var t = document.getElementById('tab-' + m[1]); if (t) select(t, false); }
    });
  }

  /* ---------- the 3-step line draws as you scroll ---------- */
  function initSteps() {
    var list = document.getElementById('hxSteps');
    if (!list) return;
    var items = list.querySelectorAll('li');
    if (reduce || !('IntersectionObserver' in window)) { items.forEach(function (li) { li.classList.add('is-lit'); }); return; }
    list.style.setProperty('--draw', 0);
    var ticking = false;
    function update() {
      ticking = false;
      var r = list.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height + vh * 0.25)));
      list.style.setProperty('--draw', p.toFixed(3));
      items.forEach(function (li, k) { li.classList.toggle('is-lit', p >= k / items.length + 0.02); });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- FAQ: one answer open at a time ---------- */
  function initFaqSingleOpen() {
    var all = document.querySelectorAll('.hx-faq__list details');
    all.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) all.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  }
})();
