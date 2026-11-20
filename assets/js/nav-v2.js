/* Pravadh Labs header menu v2: dropdowns (click, hover on desktop, keyboard) */
(function () {
  var items = document.querySelectorAll('nav.primary.nv .nv-item');
  if (!items.length) return;
  var canHover = window.matchMedia('(hover: hover) and (min-width: 861px)');
  var closeTimer;

  function setOpen(item, open) {
    item.classList.toggle('is-open', open);
    var t = item.querySelector('.nv-trigger');
    if (t) t.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeAll(except) { items.forEach(function (i) { if (i !== except) setOpen(i, false); }); }

  items.forEach(function (item) {
    var trigger = item.querySelector('.nv-trigger');
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      var isOpen = item.classList.contains('is-open');
      var open = !isOpen || item.dataset.via === 'hover';
      if (canHover.matches) closeAll(item);
      item.dataset.via = 'click';
      setOpen(item, open);
    });
    item.addEventListener('mouseenter', function () {
      if (!canHover.matches) return;
      clearTimeout(closeTimer); closeAll(item);
      if (!item.classList.contains('is-open')) item.dataset.via = 'hover';
      setOpen(item, true);
    });
    item.addEventListener('mouseleave', function () {
      if (!canHover.matches) return;
      closeTimer = setTimeout(function () { setOpen(item, false); }, 160);
    });
    item.addEventListener('focusout', function (e) {
      if (canHover.matches && !item.contains(e.relatedTarget)) setOpen(item, false);
    });
  });

  document.addEventListener('click', function (e) {
    if (canHover.matches && !e.target.closest('.nv-item')) closeAll();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelector('.nv-item.is-open .nv-trigger');
    closeAll(); if (open && canHover.matches) open.focus();
  });
})();
