/**
 * Pravadh Labs — Premium Motion Layer
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const isMobile = window.matchMedia('(max-width: 860px)').matches;

  let lenis = null;

  function injectShell() {
    if (!document.querySelector('.page-transition')) {
      const overlay = document.createElement('div');
      overlay.className = 'page-transition';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.prepend(overlay);
    }

    if (!document.querySelector('.aurora-bg')) {
      const aurora = document.createElement('div');
      aurora.className = 'aurora-bg';
      aurora.setAttribute('aria-hidden', 'true');
      document.body.prepend(aurora);
    }

    if (!document.querySelector('.scroll-progress')) {
      const progress = document.createElement('div');
      progress.className = 'scroll-progress';
      progress.innerHTML = '<div class="scroll-progress__bar"></div>';
      document.body.prepend(progress);
    }

    if (!document.querySelector('.nav-backdrop')) {
      const backdrop = document.createElement('div');
      backdrop.className = 'nav-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }
  }

  function wrapHeaderActions() {
    const headerWrap = document.querySelector('.site-header .wrap');
    if (!headerWrap || headerWrap.querySelector('.header-actions')) return;

    const themeToggle = document.getElementById('themeToggle');
    const menuToggle = document.getElementById('menuToggle');
    if (!themeToggle && !menuToggle) return;

    const actions = document.createElement('div');
    actions.className = 'header-actions';
    if (themeToggle) actions.appendChild(themeToggle);
    if (menuToggle) actions.appendChild(menuToggle);
    headerWrap.appendChild(actions);
  }

  function initMobileNav() {
    const menuToggle = document.getElementById('menuToggle');
    const primaryNav = document.getElementById('primaryNav');
    const backdrop = document.querySelector('.nav-backdrop');
    const headerWrap = document.querySelector('.site-header .wrap');
    if (!menuToggle || !primaryNav || !headerWrap) return;

    // Fixed nav must not live inside backdrop-filter header (breaks mobile drawer)
    primaryNav.dataset.navHome = 'header-wrap';
    function placeNav() {
      if (window.innerWidth <= 860) {
        if (primaryNav.parentElement !== document.body) {
          document.body.appendChild(primaryNav);
        }
      } else if (primaryNav.parentElement !== headerWrap) {
        const anchor = headerWrap.querySelector('.header-actions');
        if (anchor) headerWrap.insertBefore(primaryNav, anchor);
        else headerWrap.appendChild(primaryNav);
      }
    }
    placeNav();
    window.addEventListener('resize', placeNav);

    const menuIcon = menuToggle.querySelector('svg path');
    const hamburgerPath = 'M3 6h16M3 11h16M3 16h16';
    const closePath = 'M4 4l14 14M18 4L4 18';

    function closeNav() {
      primaryNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
      backdrop?.classList.remove('is-visible');
      if (menuIcon) menuIcon.setAttribute('d', hamburgerPath);
    }

    function openNav() {
      primaryNav.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
      backdrop?.classList.add('is-visible');
      if (menuIcon) menuIcon.setAttribute('d', closePath);
    }

    menuToggle.addEventListener('click', () => {
      if (primaryNav.classList.contains('open')) closeNav();
      else openNav();
    });

    backdrop?.addEventListener('click', closeNav);

    primaryNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeNav);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) closeNav();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });
  }

  function initPageTransitions() {
    const overlay = document.querySelector('.page-transition');
    if (!overlay || prefersReducedMotion || isMobile) return;

    const supportsVT = typeof document.startViewTransition === 'function';

    if (sessionStorage.getItem('pravadh-page-enter') === '1') {
      sessionStorage.removeItem('pravadh-page-enter');
      overlay.classList.add('is-active');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => overlay.classList.remove('is-active'));
      });
    }

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank') return;
      if (link.hostname && link.hostname !== location.hostname) return;

      e.preventDefault();
      sessionStorage.setItem('pravadh-page-enter', '1');

      const navigate = () => { window.location.href = link.href; };

      if (supportsVT) {
        document.startViewTransition(navigate);
      } else {
        overlay.classList.add('is-active');
        setTimeout(navigate, 380);
      }
    });
  }

  function initLenis() {
    if (prefersReducedMotion || typeof Lenis === 'undefined') return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    document.documentElement.classList.add('lenis', 'lenis-smooth');

    lenis = new Lenis();

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function initGSAPReveals() {
    if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      document.querySelectorAll('.reveal, .reveal-stagger, .gsap-reveal').forEach(el => {
        el.classList.add('in-view');
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
      el.classList.add('gsap-managed');
    });

    gsap.utils.toArray('.reveal, .gsap-reveal').forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: isMobile ? 28 : 48 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' }
        }
      );
    });

    gsap.utils.toArray('.reveal-stagger').forEach((container) => {
      gsap.fromTo(container.children,
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0, duration: 0.75, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: container, start: 'top 88%', toggleActions: 'play none none none' }
        }
      );
    });

    gsap.utils.toArray('.section-head').forEach((el) => {
      const eyebrow = el.querySelector('.eyebrow');
      const h2 = el.querySelector('h2');
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%' } });
      if (eyebrow) tl.from(eyebrow, { opacity: 0, x: -20, duration: 0.6, ease: 'power2.out' });
      if (h2) tl.from(h2, { opacity: 0, y: 24, duration: 0.7, ease: 'power3.out' }, '-=0.3');
    });

    gsap.utils.toArray('.trust-item').forEach((item, i) => {
      gsap.from(item, {
        opacity: 0, x: -16, duration: 0.6, delay: i * 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: item, start: 'top 92%', toggleActions: 'play none none none' }
      });
    });

    gsap.utils.toArray('.persona').forEach((pill, i) => {
      gsap.from(pill, {
        opacity: 0, scale: 0.92, duration: 0.5, delay: i * 0.06, ease: 'back.out(1.4)',
        scrollTrigger: { trigger: pill.parentElement, start: 'top 88%', toggleActions: 'play none none none' }
      });
    });
  }

  function initHeroParticles() {
    const hero = document.querySelector('.hero');
    if (!hero || prefersReducedMotion) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-particles';
    canvas.setAttribute('aria-hidden', 'true');
    hero.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let nodes, mouse = { x: -9999, y: -9999 };
    const NODE_COUNT = isMobile ? 28 : 55;
    const CONNECT_DIST = isMobile ? 90 : 120;
    const MOUSE_DIST = 160;

    function resize() {
      const rect = hero.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.5 + 1
      }));
    }

    function tick() {
      const rect = hero.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > rect.width) n.vx *= -1;
        if (n.y < 0 || n.y > rect.height) n.vy *= -1;

        if (!isTouch) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_DIST) {
            n.x -= dx * 0.015;
            n.y -= dy * 0.015;
          }
        }
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.35;
            ctx.strokeStyle = `rgba(30, 92, 238, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach(n => {
        ctx.fillStyle = 'rgba(30, 92, 238, 0.7)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(tick);
    }

    if (!isTouch) {
      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });
      hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
    }

    resize();
    window.addEventListener('resize', resize);
    tick();
  }

  function initMagneticButtons() {
    if (prefersReducedMotion || isTouch) return;

    document.querySelectorAll('.btn, .nav-cta, .theme-toggle').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const dx = (x - rect.width / 2) * 0.28;
        const dy = (y - rect.height / 2) * 0.28;
        btn.style.setProperty('--glow-x', `${(x / rect.width) * 100}%`);
        btn.style.setProperty('--glow-y', `${(y / rect.height) * 100}%`);
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  function initGlassNav() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const onScroll = () => {
      const scrollY = lenis ? lenis.scroll : window.scrollY;
      header.classList.toggle('is-scrolled', scrollY > 24);
    };

    onScroll();
    if (lenis) lenis.on('scroll', onScroll);
    else window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initProductCards() {
    if (prefersReducedMotion || isTouch) return;

    document.querySelectorAll('.product-overview-card, .module-card, .office-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  function initScrollProgress() {
    const bar = document.querySelector('.scroll-progress__bar');
    if (!bar || prefersReducedMotion) return;

    const update = (scrollTop) => {
      const top = scrollTop ?? window.scrollY ?? document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (docHeight > 0 ? (top / docHeight) * 100 : 0) + '%';
    };

    if (lenis) lenis.on('scroll', ({ scroll }) => update(scroll));
    else window.addEventListener('scroll', () => update(), { passive: true });
    update();
  }

  function initPipelineCanvas() {
    const section = document.querySelector('.pipeline-section');
    if (!section) return;

    const connectors = section.querySelectorAll('.emie-flow__connector');
    const nodes = section.querySelectorAll('[data-pipe-node]');
    const prompts = section.querySelectorAll('.prompt-list li');

    function showStatic() {
      connectors.forEach((c) => c.classList.add('is-drawn'));
      nodes.forEach((n) => n.classList.add('is-active'));
      prompts.forEach((p) => p.classList.add('is-active'));
    }

    if (connectors.length) {
      if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        showStatic();
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 72%',
          toggleActions: 'play none none none'
        }
      });

      connectors.forEach((connector, i) => {
        tl.to(connector, {
          onStart: () => connector.classList.add('is-drawn'),
          duration: 0.01
        }, i * 0.22);
      });

      const nodeOrder = ['emie', 'sources', 'extract', 'transform', 'govern', 'notify'];
      nodeOrder.forEach((id, i) => {
        const node = section.querySelector(`[data-pipe-node="${id}"]`);
        if (!node) return;
        tl.to(node, {
          onStart: () => node.classList.add('is-active'),
          duration: 0.01
        }, 0.1 + i * 0.18);
      });

      prompts.forEach((prompt, i) => {
        tl.to(prompt, {
          onStart: () => {
            prompts.forEach((p) => p.classList.remove('is-active'));
            prompt.classList.add('is-active');
          },
          duration: 0.01
        }, 0.35 + i * 0.55);
      });

      tl.call(() => {
        prompts.forEach((p) => p.classList.remove('is-active'));
        prompts[prompts.length - 1]?.classList.add('is-active');
      });

      return;
    }

    const edges = [
      section.querySelector('#pipeEdge1'),
      section.querySelector('#pipeEdge2'),
      section.querySelector('#pipeEdge3'),
      section.querySelector('#pipeEdgeEmie')
    ].filter(Boolean);

    const packets = [
      section.querySelector('#pipePacket1'),
      section.querySelector('#pipePacket2'),
      section.querySelector('#pipePacket3')
    ].filter(Boolean);

    const legacyNodes = section.querySelectorAll('.pipeline-node');

    function prepareEdges() {
      edges.forEach((edge) => {
        const len = edge.getTotalLength();
        edge.style.strokeDasharray = String(len);
        edge.style.strokeDashoffset = String(len);
      });
    }

    function showLegacyStatic() {
      edges.forEach((edge) => { edge.style.strokeDashoffset = '0'; });
      legacyNodes.forEach((n) => n.classList.add('is-active'));
      prompts.forEach((p) => p.classList.add('is-active'));
      packets.forEach((p) => { p.style.opacity = '0'; });
    }

    prepareEdges();

    if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      showLegacyStatic();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 72%',
        toggleActions: 'play none none none'
      }
    });

    edges.forEach((edge, i) => {
      tl.to(edge, {
        strokeDashoffset: 0,
        duration: 0.85,
        ease: 'power2.out'
      }, i * 0.22);
    });

    const nodeOrder = ['sources', 'extract', 'transform', 'govern', 'emie', 'notify'];
    nodeOrder.forEach((id, i) => {
      const node = section.querySelector(`[data-pipe-node="${id}"]`);
      if (!node) return;
      tl.to(node, {
        onStart: () => node.classList.add('is-active'),
        duration: 0.01
      }, 0.15 + i * 0.2);
    });

    prompts.forEach((prompt, i) => {
      tl.to(prompt, {
        onStart: () => {
          prompts.forEach((p) => p.classList.remove('is-active'));
          prompt.classList.add('is-active');
        },
        duration: 0.01
      }, 0.4 + i * 0.55);
    });

    if (!isTouch && packets.length && edges.length >= 3) {
      const pathDefs = [
        { path: edges[0], packet: packets[0] },
        { path: edges[1], packet: packets[1] },
        { path: edges[2], packet: packets[2] }
      ];
      pathDefs.forEach(({ path, packet }, i) => {
        if (!path || !packet) return;
        const len = path.getTotalLength();
        const proxy = { t: 0 };
        tl.to(proxy, {
          t: 1,
          duration: 0.75,
          ease: 'none',
          onStart: () => { packet.style.opacity = '1'; },
          onUpdate: () => {
            const pt = path.getPointAtLength(proxy.t * len);
            packet.setAttribute('cx', pt.x);
            packet.setAttribute('cy', pt.y);
          },
          onComplete: () => { packet.style.opacity = '0'; }
        }, 0.3 + i * 0.35);
      });
    }

    tl.call(() => {
      prompts.forEach((p) => p.classList.remove('is-active'));
      prompts[prompts.length - 1]?.classList.add('is-active');
    });
  }

  function initRailNodes() {
    const section = document.querySelector('.rail-section');
    if (!section || prefersReducedMotion || typeof gsap === 'undefined') return;
    const targets = section.querySelectorAll('.rail-map__hub, .rail-product-card');
    if (!targets.length) {
      const groups = section.querySelectorAll('#railSvg > g');
      if (!groups.length) return;
      gsap.from(groups, {
        opacity: 0,
        scale: 0.96,
        transformOrigin: 'center',
        duration: 0.55,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 70%' }
      });
      return;
    }
    gsap.from(targets, {
      opacity: 0,
      y: 16,
      duration: 0.55,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: { trigger: section, start: 'top 72%' }
    });
  }

  function initChipReveal() {
    if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    document.querySelectorAll('.chip-row').forEach((row) => {
      gsap.from(row.querySelectorAll('.chip'), {
        opacity: 0,
        y: 8,
        duration: 0.4,
        stagger: 0.06,
        ease: 'power2.out',
        scrollTrigger: { trigger: row, start: 'top 92%' }
      });
    });
  }

  function initStackReplace() {
    if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    document.querySelectorAll('.stack-replace__list').forEach((list) => {
      gsap.from(list.children, {
        opacity: 0,
        y: 12,
        duration: 0.45,
        stagger: 0.05,
        ease: 'power2.out',
        scrollTrigger: { trigger: list, start: 'top 90%' }
      });
    });
  }

  function initAgentWorkflow() {
    const section = document.querySelector('.agent-workflow');
    if (!section || prefersReducedMotion) return;

    const steps = section.querySelectorAll('.agent-step');
    const lines = section.querySelectorAll('.agent-flow-line');

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top 70%', end: 'bottom 40%', scrub: 0.6 }
      });
      steps.forEach((step, i) => {
        tl.call(() => {
          steps.forEach((s, j) => s.classList.toggle('is-active', j <= i));
        }, null, i * 0.25);
      });
      lines.forEach((line, i) => {
        ScrollTrigger.create({
          trigger: section, start: 'top 75%',
          onEnter: () => setTimeout(() => line.classList.add('is-drawn'), i * 300)
        });
      });
    } else {
      steps[0]?.classList.add('is-active');
      lines.forEach(l => l.classList.add('is-drawn'));
    }
  }

  function initHeroEntrance() {
    if (prefersReducedMotion || typeof gsap === 'undefined') return;
    const hero = document.querySelector('.hero');
    if (!hero) return;

    hero.querySelectorAll('.eyebrow, h1, .sub, .actions').forEach(el => {
      el.style.animation = 'none';
    });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const eyebrow = hero.querySelector('.eyebrow');
    const h1 = hero.querySelector('h1');
    const sub = hero.querySelector('.sub');
    const actions = hero.querySelector('.actions');

    if (eyebrow) tl.from(eyebrow, { opacity: 0, y: 20, duration: 0.7 });
    if (h1) {
      tl.from(h1, { opacity: 0, y: 36, duration: 0.9 }, '-=0.45');
      const word = h1.querySelector('.hero-rotate__word');
      if (word) tl.from(word, { scale: 0.88, opacity: 0, duration: 0.65, ease: 'back.out(1.8)' }, '-=0.55');
    }
    if (sub) tl.from(sub, { opacity: 0, y: 24, duration: 0.7 }, '-=0.5');
    if (actions) {
      tl.from(actions, {
        opacity: 0,
        y: 12,
        duration: 0.5,
        clearProps: 'opacity,transform'
      }, '>');
    }
    const mess = hero.querySelector('.mess');
    if (mess) tl.from(mess, { opacity: 0, x: 28, duration: 0.9 }, '-=0.85');
  }

  function initRailAnimation() {
    const section = document.querySelector('.rail-section');
    if (!section) return;

    const railMap = section.querySelector('.rail-map');
    const paths = section.querySelectorAll('.rail-draw');

    if (railMap) {
      if (prefersReducedMotion) {
        railMap.classList.add('is-drawn');
        return;
      }
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          railMap.classList.toggle('is-drawn', entry.isIntersecting);
        });
      }, { threshold: 0.35 });
      observer.observe(section);
      return;
    }

    if (!paths.length) return;

    paths.forEach((path) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
    });

    if (prefersReducedMotion) {
      paths.forEach((path) => { path.style.strokeDashoffset = '0'; });
      return;
    }

    function resetPaths() {
      paths.forEach((path) => {
        path.style.transition = 'none';
        path.style.strokeDashoffset = `${path.getTotalLength()}`;
      });
    }

    function playPaths() {
      paths.forEach((path, i) => {
        setTimeout(() => {
          path.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)';
          path.style.strokeDashoffset = '0';
        }, i * 400);
      });
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          resetPaths();
          requestAnimationFrame(() => requestAnimationFrame(playPaths));
        } else {
          resetPaths();
        }
      });
    }, { threshold: 0.35 });

    observer.observe(section);
  }

  function initHeroWordRotate() {
    const word = document.querySelector('.hero-rotate__word');
    if (!word || prefersReducedMotion) return;

    const phrases = [
      { text: 'plugs in.', amber: false },
      { text: 'ships faster.', amber: false },
      { text: 'governs data.', amber: false },
      { text: 'qualifies leads.', amber: true }
    ];
    let idx = 0;

    function nextPhrase() {
      idx = (idx + 1) % phrases.length;
      const phrase = phrases[idx];

      const swap = () => {
        word.textContent = phrase.text;
        word.classList.toggle('is-amber', phrase.amber);
      };

      if (typeof gsap !== 'undefined') {
        gsap.to(word, {
          opacity: 0,
          y: -18,
          duration: 0.35,
          ease: 'power2.in',
          onComplete: () => {
            swap();
            gsap.fromTo(word, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
          }
        });
      } else {
        swap();
      }
    }

    setInterval(nextPhrase, 2800);
  }

  function initCapabilityHighlightCycle() {
    const cards = [...document.querySelectorAll('.capability-card')];
    if (!cards.length || prefersReducedMotion) return;

    let idx = 0;
    let running = false;

    const observer = new IntersectionObserver((entries) => {
      running = entries.some(e => e.isIntersecting);
    }, { threshold: 0.25 });

    observer.observe(cards[0].closest('.capability-grid') || cards[0]);

    setInterval(() => {
      if (!running) return;
      cards.forEach(c => c.classList.remove('is-highlighted'));
      cards[idx].classList.add('is-highlighted');
      idx = (idx + 1) % cards.length;
    }, 2200);
  }

  function initPersonaWave() {
    const personas = [...document.querySelectorAll('.persona')];
    if (!personas.length || prefersReducedMotion) return;

    let idx = 0;
    setInterval(() => {
      personas.forEach(p => p.classList.remove('is-wave'));
      personas[idx].classList.add('is-wave');
      idx = (idx + 1) % personas.length;
    }, 1800);
  }

  function initEmiePromptCycle() {
    const prompts = [...document.querySelectorAll('.prompt-list li')];
    if (!prompts.length || prefersReducedMotion) return;

    let idx = 0;
    setInterval(() => {
      prompts.forEach(p => p.classList.remove('is-typing', 'is-active'));
      prompts[idx].classList.add('is-typing', 'is-active');
      idx = (idx + 1) % prompts.length;
    }, 3200);
  }

  function initTermTips() {
    const wraps = [...document.querySelectorAll('.term-wrap')];
    if (!wraps.length) return;

    function setOpen(wrap, open) {
      wrap.classList.toggle('is-open', open);
      wrap.querySelector('.term')?.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function closeAll(except) {
      wraps.forEach((w) => {
        if (w !== except) setOpen(w, false);
      });
    }

    wraps.forEach((wrap) => {
      const btn = wrap.querySelector('.term');
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !wrap.classList.contains('is-open');
        closeAll(wrap);
        setOpen(wrap, next);
      });
    });

    document.addEventListener('click', () => closeAll());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });
  }

  function initProductDock() {
    const path = location.pathname;
    if (path.includes('partnersportal') || path.includes('investor')) return;
    if (document.querySelector('.product-dock')) return;
    if (document.querySelector('.product-ticker')) return;

    const onProducts = /products\.html/.test(path);
    const prefix = onProducts ? '' : 'products.html';
    const products = [
      { href: `${prefix}#pravadhiq`, label: 'PravadhIQ', dot: 'iq' },
      { href: `${prefix}#governx`, label: 'GovernX', dot: 'gx' },
      { href: `${prefix}#pravadhpm`, label: 'Pravadh PM', dot: 'pm' },
      { href: `${prefix}#pravadhsi`, label: 'Pravadh SI', dot: 'si' },
      { href: `${prefix}#pravadhdocsign`, label: 'DocSign', dot: 'ds' },
      { href: `${prefix}#caliber`, label: 'Caliber', dot: 'cb' }
    ];

    const dock = document.createElement('nav');
    dock.className = 'product-dock';
    dock.setAttribute('aria-label', 'Quick product links');
    dock.innerHTML = products.map((p) =>
      `<a href="${p.href}" class="product-dock__link" data-dock="${p.dot}"><span class="product-dock__dot product-ticker__dot product-ticker__dot--${p.dot}"></span>${p.label}</a>`
    ).join('');
    document.body.appendChild(dock);

    const links = [...dock.querySelectorAll('.product-dock__link')];
    let activeIdx = 0;

    function setActive(i) {
      links.forEach((l, j) => l.classList.toggle('is-active', j === i));
      activeIdx = i;
    }

    setActive(0);
    setInterval(() => {
      if (!prefersReducedMotion) setActive((activeIdx + 1) % links.length);
    }, 2600);

    links.forEach((l, i) => {
      l.addEventListener('mouseenter', () => setActive(i));
    });

    const hero = document.querySelector('.hero');
    const footerEl = document.querySelector('footer');
    const toggle = () => {
      const pastHero = window.scrollY > (hero?.offsetHeight || 280) * 0.25;
      const nearFooter = footerEl ? footerEl.getBoundingClientRect().top < window.innerHeight - 40 : false;
      dock.classList.toggle('is-visible', pastHero && !nearFooter);
    };
    toggle();
    window.addEventListener('scroll', toggle, { passive: true });
    window.addEventListener('resize', toggle, { passive: true });
    if (lenis) lenis.on('scroll', toggle);
  }

  function initHeroOrbs() {
    document.querySelectorAll('.hero').forEach((hero) => {
      if (hero.querySelector('.hero__orbs')) return;
      const orbs = document.createElement('div');
      orbs.className = 'hero__orbs';
      orbs.setAttribute('aria-hidden', 'true');
      orbs.innerHTML = '<span class="hero__orb hero__orb--blue"></span><span class="hero__orb hero__orb--amber"></span><span class="hero__orb hero__orb--teal"></span>';
      hero.prepend(orbs);
    });

    const hero404 = document.querySelector('.hero h1');
    if (hero404 && /isn't on the rail/i.test(hero404.textContent || '')) {
      hero404.closest('.hero')?.classList.add('hero--404');
    }
  }

  function initModuleHighlightCycle() {
    const grids = document.querySelectorAll('.modules');
    if (!grids.length || prefersReducedMotion) return;

    grids.forEach((grid) => {
      const cards = [...grid.querySelectorAll('.module-card')];
      if (!cards.length) return;
      let idx = 0;
      let running = false;

      const observer = new IntersectionObserver((entries) => {
        running = entries.some((e) => e.isIntersecting);
      }, { threshold: 0.2 });
      observer.observe(grid);

      setInterval(() => {
        if (!running) return;
        cards.forEach((c) => c.classList.remove('is-highlighted'));
        cards[idx].classList.add('is-highlighted');
        idx = (idx + 1) % cards.length;
      }, 2400);
    });
  }

  function initCompareTables() {
    const wraps = document.querySelectorAll('.compare-table-wrap');
    if (!wraps.length) return;

    wraps.forEach((wrap) => {
      const rows = [...wrap.querySelectorAll('tbody tr')];
      let idx = 0;
      let running = false;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            wrap.classList.add('is-lit');
            running = true;
          } else {
            running = false;
          }
        });
      }, { threshold: 0.35 });
      observer.observe(wrap);

      if (prefersReducedMotion || !rows.length) return;

      setInterval(() => {
        if (!running) return;
        rows.forEach((r) => r.classList.remove('is-row-active'));
        rows[idx].classList.add('is-row-active');
        idx = (idx + 1) % rows.length;
      }, 1800);

      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.from(rows, {
          opacity: 0,
          x: -12,
          duration: 0.45,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: { trigger: wrap, start: 'top 85%' }
        });
      }
    });
  }

  function initAboutMotion() {
    document.querySelectorAll('.about-block, .founder').forEach((el) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      observer.observe(el);
    });
  }

  function initOfficeCardCycle() {
    const cards = [...document.querySelectorAll('.office-card')];
    if (!cards.length) return;

    if (!isTouch) {
      cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
          card.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
          card.classList.add('is-spotlit');
        });
        card.addEventListener('mouseleave', () => card.classList.remove('is-spotlit'));
      });
    }

    if (prefersReducedMotion) return;
    let idx = 0;
    let running = false;
    const observer = new IntersectionObserver((entries) => {
      running = entries.some((e) => e.isIntersecting);
    }, { threshold: 0.25 });
    observer.observe(cards[0].parentElement || cards[0]);

    setInterval(() => {
      if (!running) return;
      cards.forEach((c) => c.classList.remove('is-highlighted'));
      cards[idx].classList.add('is-highlighted');
      idx = (idx + 1) % cards.length;
    }, 2200);
  }

  function bindPostCardMotion(root = document) {
    root.querySelectorAll('.post-card:not([data-motion-bound])').forEach((card, i) => {
      card.setAttribute('data-motion-bound', '1');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('is-visible'), prefersReducedMotion ? 0 : i * 70);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      observer.observe(card);
    });
  }

  function initBlogMotion() {
    const grid = document.getElementById('post-grid');
    if (!grid) return;
    bindPostCardMotion(grid);
    const mo = new MutationObserver(() => bindPostCardMotion(grid));
    mo.observe(grid, { childList: true });
  }

  function initDreamforceMotion() {
    if (!document.querySelector('.df-hero')) return;

    document.querySelectorAll('.df-checklist').forEach((list) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-drawn');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.35 });
      observer.observe(list);
    });

    document.querySelectorAll('.df-split__visual, .df-team__visual').forEach((el) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      observer.observe(el);
    });

    const roles = [...document.querySelectorAll('.df-role')];
    if (roles.length && !prefersReducedMotion) {
      let idx = 0;
      setInterval(() => {
        roles.forEach((r) => r.classList.remove('is-wave'));
        roles[idx].classList.add('is-wave');
        idx = (idx + 1) % roles.length;
      }, 2000);
    }

    const book = document.querySelector('.df-book__card');
    if (book && !prefersReducedMotion) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          book.classList.toggle('is-pulse', entry.isIntersecting);
        });
      }, { threshold: 0.35 });
      observer.observe(book);
    }

    const floatCta = document.getElementById('dfFloatCta');
    const hero = document.querySelector('.df-hero');
    if (floatCta && hero) {
      const toggle = () => {
        const past = window.scrollY > hero.offsetHeight * 0.45;
        const nearBook = document.getElementById('book');
        const bookTop = nearBook ? nearBook.getBoundingClientRect().top : 9999;
        floatCta.classList.toggle('is-visible', past && bookTop > 120);
      };
      toggle();
      window.addEventListener('scroll', toggle, { passive: true });
      if (lenis) lenis.on('scroll', toggle);
    }

    // Soften product dock on Dreamforce — float CTA owns booking
    document.querySelector('.product-dock')?.classList.add('is-df-page');
  }

  function initPageHeroShimmer() {
    document.querySelectorAll('.hero h1 em').forEach((em) => {
      if (!em.classList.contains('hero-rotate__word')) {
        em.style.animation = 'heroShimmer 5s ease-in-out infinite';
      }
    });
  }

  function initStatGlow() {
    document.querySelectorAll('[data-count-to]').forEach(el => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.closest('.stat')?.classList.add('is-counted');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      observer.observe(el);
    });
  }

  function initCapabilitySpotlight() {
    if (isTouch) return;
    document.querySelectorAll('.capability-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
        card.classList.add('is-spotlit');
      });
      card.addEventListener('mouseleave', () => card.classList.remove('is-spotlit'));
    });
  }

  function initCapabilityReveal() {
    const cards = document.querySelectorAll('.capability-card');
    if (!cards.length) return;

    if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      cards.forEach(c => c.classList.add('is-revealed'));
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    cards.forEach((card, i) => {
      ScrollTrigger.create({
        trigger: card,
        start: 'top 92%',
        onEnter: () => {
          setTimeout(() => card.classList.add('is-revealed'), i * 60);
        },
        once: true
      });
    });
  }

  function initPrincipleReveal() {
    const principles = document.querySelectorAll('.principle');
    if (!principles.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });

    principles.forEach((p, i) => {
      if (prefersReducedMotion) {
        p.classList.add('is-revealed');
        return;
      }
      p.style.transitionDelay = `${i * 0.1}s`;
      observer.observe(p);
    });
  }

  function initTrustStrip() {
    const items = document.querySelectorAll('.trust-item');
    if (!items.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          items.forEach((item, i) => {
            setTimeout(() => item.classList.add('is-revealed'), prefersReducedMotion ? 0 : i * 90);
          });
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });

    observer.observe(items[0].parentElement);
  }

  function initExplorePill() { /* superseded by initProductDock */ }

  function initScrollParallax() {
    if (prefersReducedMotion || isMobile || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const pairs = [
      { el: '.rail-map', trigger: '.rail-section', y: -36 },
      { el: '#emieCanvas', trigger: '.pipeline-section', y: -28 },
      { el: '.product-overview-grid', trigger: '.product-overview-grid', y: -20 }
    ];

    pairs.forEach(({ el, trigger, y }) => {
      const target = document.querySelector(el);
      const trig = document.querySelector(trigger);
      if (!target || !trig) return;
      target.classList.add('parallax-layer');
      gsap.to(target, {
        y,
        ease: 'none',
        scrollTrigger: {
          trigger: trig,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2
        }
      });
    });
  }

  function initProductGridHover() {
    document.querySelectorAll('.product-overview-card').forEach((card, i) => {
      card.style.setProperty('--card-index', String(i));
      card.addEventListener('mouseenter', () => {
        document.querySelectorAll('.product-overview-card').forEach((c, j) => {
          c.classList.toggle('is-dimmed', j !== i);
        });
      });
      card.addEventListener('mouseleave', () => {
        document.querySelectorAll('.product-overview-card').forEach(c => c.classList.remove('is-dimmed'));
      });
    });
  }

  function initHeroAccent() {
    const hero = document.querySelector('.hero');
    if (!hero || prefersReducedMotion) return;
    hero.classList.add('hero--motion-ready');
  }

  function initWorkflowDemo() {
    const root = document.getElementById('wfDemo');
    const stage = document.getElementById('motiveStage');
    if (!root || !stage) return;

    const TOTAL = 16000;
    const caption = document.getElementById('wfCaption');
    const titleEl = document.getElementById('wfTitle');
    const clock = document.getElementById('wfClock');
    const meter = document.getElementById('wfMeter');
    const badge = document.getElementById('motiveBadge');
    const approve = document.getElementById('motiveApprove');
    const gate = stage.querySelector('.motive__gate');

    const beats = [
      { at: 0, phase: 'mess', title: '01 · The mess', caption: 'The same customer lives in four systems. Nobody has one record.', badge: '4 systems · 4 versions' },
      { at: 4500, phase: 'unify', title: '02 · One record', caption: 'Foundation puts them on one rail. Disagreements stay visible.', badge: '1 record · 4 sources' },
      { at: 8500, phase: 'act', title: '03 · Next action', caption: 'One next action is queued. Nothing moves without you.', badge: '1 record · 4 sources' },
      { at: 12000, phase: 'stamped', title: '03 · Approved', caption: 'Unify the process. Drive the next action.', badge: '1 record · trail written' }
    ];

    let elapsed = 0;
    let lastTs = 0;
    let paused = false;
    let beatKey = '';

    function pad(n) {
      return n < 10 ? '0' + n : String(n);
    }

    function formatTime(ms) {
      const s = Math.min(16, Math.floor(ms / 1000));
      return Math.floor(s / 60) + ':' + pad(s % 60);
    }

    function setPhase(phase) {
      stage.classList.remove('is-mess', 'is-unify', 'is-act', 'is-stamped');
      stage.classList.add('is-' + phase);
      if (approve) {
        approve.textContent = phase === 'stamped' ? 'Approved · trail written' : 'Approve to run';
      }
      if (gate) {
        gate.textContent = phase === 'stamped' ? 'You stayed in the loop' : 'Nothing moves without you';
      }
    }

    function applyBeat(beat) {
      const key = beat.at + ':' + beat.phase;
      if (key === beatKey) return;
      beatKey = key;
      setPhase(beat.phase);
      if (beat.title && titleEl) titleEl.textContent = beat.title;
      if (beat.caption && caption) caption.textContent = beat.caption;
      if (beat.badge && badge) badge.textContent = beat.badge;
    }

    function beatAt(ms) {
      let current = beats[0];
      for (let i = 0; i < beats.length; i += 1) {
        if (ms >= beats[i].at) current = beats[i];
      }
      return current;
    }

    function paintStaticEnd() {
      applyBeat(beats[beats.length - 1]);
      if (clock) clock.textContent = '0:16';
      if (meter) meter.style.width = '100%';
    }

    function tick(now) {
      if (!lastTs) lastTs = now;
      const delta = now - lastTs;
      lastTs = now;
      if (!paused) {
        elapsed += delta;
        if (elapsed >= TOTAL) {
          elapsed = 0;
          beatKey = '';
        }
        applyBeat(beatAt(elapsed));
        if (clock) clock.textContent = formatTime(elapsed);
        if (meter) meter.style.width = ((elapsed / TOTAL) * 100) + '%';
      }
      window.requestAnimationFrame(tick);
    }

    if (approve) {
      approve.addEventListener('click', () => {
        applyBeat({
          at: 12000,
          phase: 'stamped',
          title: '03 · Approved',
          caption: 'You approved. The trail is written.',
          badge: '1 record · trail written'
        });
      });
    }

    if (!isTouch) {
      root.addEventListener('pointerenter', () => { paused = true; });
      root.addEventListener('pointerleave', () => { paused = false; });
    }

    if (prefersReducedMotion) {
      paintStaticEnd();
      return;
    }

    applyBeat(beats[0]);
    window.requestAnimationFrame(tick);
  }

  function boot() {
    injectShell();
    wrapHeaderActions();
    initMobileNav();
    initPageTransitions();
    initLenis();
    initGlassNav();
    initScrollProgress();
    initMagneticButtons();
    initProductCards();
    initHeroParticles();
    initRailAnimation();
    initRailNodes();
    initPipelineCanvas();
    initAgentWorkflow();
    initChipReveal();
    initStackReplace();
    initHeroEntrance();
    initGSAPReveals();
    initStatGlow();
    initCapabilitySpotlight();
    initCapabilityReveal();
    initPrincipleReveal();
    initTrustStrip();
    initTermTips();
    initProductDock();
    initScrollParallax();
    initProductGridHover();
    initHeroAccent();
    initHeroWordRotate();
    initWorkflowDemo();
    initCapabilityHighlightCycle();
    initPersonaWave();
    initEmiePromptCycle();
    initHeroOrbs();
    initModuleHighlightCycle();
    initCompareTables();
    initAboutMotion();
    initOfficeCardCycle();
    initBlogMotion();
    initDreamforceMotion();
    initPageHeroShimmer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
