/* =============================================================
   OBSIDIAN BASE — interactions
   ============================================================= */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header + scroll progress ---------- */
  var header = $('#header');
  var scrollProgress = $('#scrollProgress');
  var toTop = $('#toTop');

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    if (header) header.classList.toggle('is-stuck', y > 20);
    if (scrollProgress) scrollProgress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('is-on', y > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ---------- mouse glow ---------- */
  var glow = $('#cursorGlow');
  if (glow && !reduce && window.matchMedia('(pointer: fine)').matches) {
    var gx = 0, gy = 0, cx = 0, cy = 0, raf = null;

    window.addEventListener('pointermove', function (e) {
      gx = e.clientX; gy = e.clientY;
      glow.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    function loop() {
      cx += (gx - cx) * 0.12;
      cy += (gy - cy) * 0.12;
      glow.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      raf = (Math.abs(gx - cx) > 0.5 || Math.abs(gy - cy) > 0.5)
        ? requestAnimationFrame(loop)
        : null;
    }

    window.addEventListener('pointerleave', function () { glow.classList.remove('is-on'); });
  }

  /* ---------- mobile menu ---------- */
  var burger = $('#burger');
  var nav = $('#nav');

  function closeNav() {
    if (!nav) return;
    nav.classList.remove('is-open');
    if (burger) { burger.classList.remove('is-on'); burger.setAttribute('aria-expanded', 'false'); }
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.classList.toggle('is-on', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  }

  /* ---------- smooth anchors ---------- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    if (!id || id === '#') return;
    var target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    var top = target.getBoundingClientRect().top + window.pageYOffset - (header ? header.offsetHeight - 8 : 0);
    window.scrollTo({ top: Math.max(top, 0), behavior: reduce ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', id);
  });

  /* ---------- reveal on scroll ---------- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- counters ---------- */
  var counters = $$('[data-count]');
  function animateNumber(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var fmt = el.getAttribute('data-format');

    if (reduce) { el.textContent = fmtNumber(target, fmt) + suffix; return; }

    var dur = 1500;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmtNumber(Math.round(target * eased), fmt) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function fmtNumber(n, fmt) {
    if (fmt === 'k') return n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ');
    return n.toLocaleString('ru-RU');
  }

  if ('IntersectionObserver' in window) {
    var ioNum = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateNumber(entry.target);
        ioNum.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { ioNum.observe(el); });
  } else {
    counters.forEach(animateNumber);
  }

  /* ---------- hero rotator ---------- */
  var rotator = $('#rotator');
  if (rotator && !reduce) {
    var items = $$('.rotator__item', rotator);
    var idx = 0;
    setInterval(function () {
      items[idx].classList.remove('is-active');
      idx = (idx + 1) % items.length;
      items[idx].classList.add('is-active');
    }, 2800);
  }

  /* ---------- before / after switcher ---------- */
  var swTabs = $$('.switcher__tab');
  var swLists = $$('.painList');
  swTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var name = tab.getAttribute('data-panel');
      swTabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      swLists.forEach(function (l) {
        l.classList.toggle('is-on', l.getAttribute('data-name') === name);
      });
    });
  });

  /* ---------- faq: one open ---------- */
  var faq = $('#faq');
  if (faq) {
    faq.addEventListener('toggle', function (e) {
      var item = e.target;
      if (!item || item.tagName !== 'DETAILS' || !item.open) return;
      $$('details', faq).forEach(function (other) { if (other !== item) other.open = false; });
    }, true);
  }

  /* ---------- 3D tilt on cards ---------- */
  var fine = window.matchMedia('(pointer: fine)').matches;
  if (fine && !reduce) {
    $$('.tilt').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.transform =
          'perspective(900px) rotateX(' + ((0.5 - py) * 7).toFixed(2) + 'deg) rotateY(' +
          ((px - 0.5) * 9).toFixed(2) + 'deg) translateY(-8px)';
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) {
    $$('.magnetic').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(1.03)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  /* ---------- lead form ---------- */
  var form = $('#leadForm');
  var formOk = $('#formOk');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var valid = true;
      $$('[required]', form).forEach(function (field) {
        var ok = field.value.trim().length > 1;
        field.classList.toggle('is-invalid', !ok);
        if (!ok) valid = false;
      });
      if (!valid) {
        var bad = $('.is-invalid', form);
        if (bad) bad.focus();
        return;
      }

      var btn = $('button[type="submit"]', form);
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Бронируем…';

      // Демо-режим: подключите здесь свой бэкенд, CRM или Telegram-бота.
      setTimeout(function () {
        btn.disabled = false;
        btn.textContent = label;
        form.reset();
        if (formOk) formOk.hidden = false;
      }, 800);
    });

    form.addEventListener('input', function (e) {
      e.target.classList.remove('is-invalid');
    });
  }

  /* ---------- parallax on hero visual ---------- */
  if (fine && !reduce) {
    var visual = $('.hero__visual');
    var rings = $$('.orbit__ring');
    window.addEventListener('pointermove', function (e) {
      var cx = (e.clientX / window.innerWidth - 0.5);
      var cy = (e.clientY / window.innerHeight - 0.5);
      if (visual) visual.style.transform = 'translate3d(' + (cx * 22).toFixed(1) + 'px,' + (cy * 16).toFixed(1) + 'px,0)';
      rings.forEach(function (r, i) {
        r.style.marginLeft = (cx * (10 + i * 6)).toFixed(1) + 'px';
        r.style.marginTop = (cy * (10 + i * 6)).toFixed(1) + 'px';
      });
    }, { passive: true });
  }
})();