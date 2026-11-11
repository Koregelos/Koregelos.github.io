(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Seeded random so the scene is the same on every visit */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------- The landscape: layered ridgelines, pines and a distant flag, drawn as SVG ---------- */
  var land = document.getElementById('land');
  (function buildLand() {
    var r = rng(916), svg = '';
    var defs = [
      // base y, height, peakiness (1 = jagged mountains, 0 = rolling hills), top color, bottom color, pines, pine size
      { base: 520, amp: 175, peak: 1, c1: '#d9a0b4', c2: '#c98aa8', pines: 0 },
      { base: 575, amp: 150, peak: .85, c1: '#b07aa6', c2: '#9a6a9c', pines: 0 },
      { base: 640, amp: 120, peak: .55, c1: '#7d5a94', c2: '#6a4d88', pines: 0 },
      { base: 705, amp: 95, peak: .25, c1: '#51417a', c2: '#43376c', pines: 46, size: 20 },
      { base: 790, amp: 80, peak: .1, c1: '#2e2857', c2: '#252049', pines: 30, size: 40 },
      { base: 905, amp: 48, peak: 0, c1: '#15132f', c2: '#100e26', pines: 13, size: 120 }
    ];
    defs.forEach(function (d, i) {
      var f1 = .0028 + r() * .0016, f2 = .0071 + r() * .003, f3 = .019 + r() * .008, p1 = r() * 9, p2 = r() * 9, p3 = r() * 9;
      function Y(x) {
        var jag = .6 * (1 - Math.abs(Math.sin(x * f1 + p1))) + .3 * (1 - Math.abs(Math.sin(x * f2 + p2))) + .1 * (1 - Math.abs(Math.sin(x * f3 + p3)));
        var soft = .5 + .32 * Math.sin(x * f1 * 1.3 + p1) + .14 * Math.sin(x * f2 + p2) + .04 * Math.sin(x * f3 + p3);
        return d.base - d.amp * (d.peak * Math.pow(jag, 1.35) + (1 - d.peak) * soft);
      }
      var pts = [];
      for (var x = -120; x <= 1720; x += 10) pts.push(x + ' ' + Y(x).toFixed(1));
      var g = '<linearGradient id="lg' + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + d.c1 + '"/><stop offset="1" stop-color="' + d.c2 + '"/></linearGradient>';
      var body = '<path fill="url(#lg' + i + ')" d="M' + pts.join(' L') + ' L1720 960 L-120 960 Z"/>';
      if (i < 4) body += '<path fill="none" stroke="#ffe6cc" stroke-opacity="' + (.5 - i * .1) + '" stroke-width="1.4" d="M' + pts.join(' L') + '"/>';
      // a pin flag on a far green: a small nod to the golf course
      if (i === 2) { var fx = 1292, fy = Y(fx); body += '<path d="M' + fx + ' ' + fy + ' v-26" stroke="#f6e9dc" stroke-width="1.4"/><path d="M' + fx + ' ' + (fy - 26) + ' l13 4.5 -13 4.5z" fill="#ff8b6b"/>'; }
      for (var k = 0; k < d.pines; k++) {
        var px = i === 5 ? (r() < .5 ? -60 + r() * 380 : 1280 + r() * 380) : -100 + r() * 1800;
        var h = d.size * (.7 + r() * .7), w = h * .3, py = Y(px) + 3, tree = '';
        for (var s = 0; s < 4; s++) { var top = py - h + s * h * .2, ww = w * (.45 + s * .2); tree += 'M' + px.toFixed(1) + ' ' + top.toFixed(1) + ' l' + ww.toFixed(1) + ' ' + (h * .38).toFixed(1) + ' h-' + (ww * 2).toFixed(1) + 'z '; }
        body += '<path fill="' + d.c2 + '" d="' + tree + 'M' + (px - w * .1).toFixed(1) + ' ' + (py - 4).toFixed(1) + ' h' + (w * .2).toFixed(1) + ' v8 h-' + (w * .2).toFixed(1) + 'z"/>';
      }
      if (i === 4) { // a cabin on the near shore, its window lit
        [[212, 1], [1418, .8]].forEach(function (c) {
          var cx = c[0], k2 = c[1], cy = Y(cx) + 4, w2 = 38 * k2, h2 = 20 * k2;
          body += '<path fill="#1b1838" d="M' + (cx - w2 / 2) + ' ' + cy + ' v-' + h2 + ' l' + (w2 / 2) + ' -' + (h2 * .8) + ' l' + (w2 / 2) + ' ' + (h2 * .8) + ' v' + h2 + 'z M' + (cx + w2 * .2) + ' ' + (cy - h2 * 1.2) + ' v-' + (h2 * .7) + ' h' + (w2 * .14) + ' v' + (h2 * .85) + 'z"/>' +
            '<circle class="win-glow" cx="' + (cx - w2 * .18) + '" cy="' + (cy - h2 * .5) + '" r="' + (16 * k2) + '" fill="url(#winglow)"/>' +
            '<rect class="win" x="' + (cx - w2 * .3) + '" y="' + (cy - h2 * .75) + '" width="' + (w2 * .24) + '" height="' + (h2 * .5) + '" rx="1" fill="#ffd27a"/>';
        });
      }
      // haze sitting in the valley behind this ridge
      var mist = i > 0 && i < 5 ? '<rect x="-120" y="' + (d.base - d.amp * .25) + '" width="1840" height="' + (d.amp * .9) + '" fill="url(#mist)" opacity="' + (.5 - i * .07) + '"/>' : '';
      var water = '';
      if (i === 5) { // a lake in the last valley, catching the sky
        water = '<g id="water"><rect x="-120" y="790" width="1840" height="176" fill="url(#lake)"/><rect x="-200" y="770" width="2000" height="90" fill="url(#mist)" opacity=".4"/></g>';
      }
      svg += '<defs>' + g + '</defs>' + mist + water + '<g data-depth="' + (i + 1) + '">' + body + '</g>';
    });
    land.innerHTML = '<defs><radialGradient id="winglow"><stop offset="0" stop-color="#ffc66b" stop-opacity=".55"/><stop offset="1" stop-color="#ffc66b" stop-opacity="0"/></radialGradient><linearGradient id="lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5e9c" stop-opacity="0"/><stop offset=".22" stop-color="#6a5092"/><stop offset=".5" stop-color="#4a3b7a"/><stop offset="1" stop-color="#2b2556"/></linearGradient><radialGradient id="ref"><stop offset="0" stop-color="#fff3d0" stop-opacity=".95"/><stop offset=".5" stop-color="#ffc98f" stop-opacity=".5"/><stop offset="1" stop-color="#ffc98f" stop-opacity="0"/></radialGradient><linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9c2" stop-opacity="0"/><stop offset=".5" stop-color="#ffd9c2" stop-opacity=".55"/><stop offset="1" stop-color="#ffd9c2" stop-opacity="0"/></linearGradient></defs>' + svg;
  })();

  /* Constellations for the side skies: a bell curve, a sigma and the five of a die */
  (function () {
    var el = document.getElementById('consts'); if (!el) return;
    function fig(pts, links, label, lx, ly) {
      var o = '<g>';
      links.forEach(function (l) { o += '<path d="M' + pts[l[0]][0] + ' ' + pts[l[0]][1] + ' L' + pts[l[1]][0] + ' ' + pts[l[1]][1] + '"/>'; });
      pts.forEach(function (q, n) { o += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + (n % 3 === 0 ? 2.6 : 1.9) + '"/>'; });
      if (label) o += '<text x="' + lx + '" y="' + ly + '">' + label + '</text>';
      return o + '</g>';
    }
    var bell = [], n, x; for (n = 0; n < 9; n++) { x = (n - 4) / 4 * 2.4; bell.push([Math.round(188 + n * 29), Math.round(404 - 116 * Math.exp(-x * x / 2))]); }
    var chain = []; for (n = 0; n < 8; n++) chain.push([n, n + 1]);
    el.innerHTML = fig([[1452, 118], [1352, 118], [1408, 186], [1350, 256], [1456, 256]], [[0, 1], [1, 2], [2, 3], [3, 4]], '\u03a3', 1478, 262) +
      fig([[1240, 318], [1296, 318], [1268, 346], [1240, 374], [1296, 374]], [[0, 1], [1, 4], [4, 3], [3, 0]], '', 0, 0);
  })();

  /* Stars and fireflies */
  (function () {
    var r = rng(41), s = '', n = window.innerWidth < 700 ? 80 : 190, tw = 0;
    for (var i = 0; i < n; i++) {
      var size = r() < .12 ? 3 : r() < .5 ? 2 : 1.4, y = r(), fade = 1 - Math.pow(y, 2.2);   // thin out toward the horizon
      var twk = r() < .3 && tw < 22; if (twk) tw++;
      s += '<i' + (twk ? ' class="tw"' : '') + ' style="left:' + (r() * 100).toFixed(2) + '%;top:' + (y * 100).toFixed(2) + '%;width:' + size + 'px;height:' + size + 'px;opacity:' + ((.45 + r() * .55) * fade).toFixed(2) + ';animation-delay:' + (r() * 4).toFixed(1) + 's"></i>';
    }
    document.getElementById('stars').innerHTML = s;
    var f = '', m = window.innerWidth < 700 ? 10 : 18;
    function d() { return ((r() - .5) * 90).toFixed(0) + 'px'; }
    for (var k = 0; k < m; k++) {
      var sz = 3 + r() * 3;
      f += '<i style="left:' + (r() * 100).toFixed(1) + '%;top:' + (56 + r() * 42).toFixed(1) + '%;width:' + sz.toFixed(1) + 'px;height:' + sz.toFixed(1) + 'px;--x1:' + d() + ';--y1:' + d() + ';--x2:' + d() + ';--y2:' + d() + ';--x3:' + d() + ';--y3:' + d() + ';--dur:' + (10 + r() * 14).toFixed(0) + 's;--bl:' + (2.4 + r() * 3).toFixed(1) + 's;--del:-' + (r() * 8).toFixed(1) + 's"></i>';
    }
    document.getElementById('flies').innerHTML = f;
  })();

  /* Scroll sets the time of day */
  var ticking = false, clock = document.getElementById('clock'), hint = null, spot = document.getElementById('spot');
  var scene = document.querySelector('.scene'), sunEl = document.querySelector('.sun'), lakefx = document.getElementById('lakefx'), sunref = document.getElementById('sunref'), fogband = document.getElementById('fogband');
  var wasScrolled = false, maxScroll = 1, lastT = -1, lastClock = '', isNight = false;
  /* Lake light lives in plain layers above the drawing, so the drawing itself never has to repaint */
  (function () {
    if (!lakefx) return; var r = rng(77), o = '';
    for (var q = 0; q < 16; q++) o += '<i style="left:' + (r() < .5 ? r() * 24 : 72 + r() * 24).toFixed(1) + '%;top:' + (r() * 92).toFixed(1) + '%;width:' + (14 + r() * 40).toFixed(0) + 'px;animation-delay:-' + (r() * 4).toFixed(1) + 's"></i>';
    lakefx.innerHTML = o;
  })();
  var parts = {};
  function fade(sel, o, tf) { // set one layer's opacity (and position) directly; hidden layers cost nothing
    var el = parts[sel] || (parts[sel] = scene.querySelector(sel)); if (!el) return;
    o = o < .004 ? 0 : o > 1 ? 1 : o;
    el.style.opacity = o.toFixed(3); el.style.visibility = o ? 'visible' : 'hidden';
    if (tf) el.style.transform = tf;
  }
  function measure() { // everything that depends on the window's size, done once per resize rather than per frame
    var w = window.innerWidth, h = window.innerHeight, scale = Math.max(w / 1600, h / 900);
    function Y(y) { return h - (900 - y) * scale; }
    maxScroll = Math.max(1, document.documentElement.scrollHeight - h); lastT = -1;
    if (lakefx) { lakefx.style.top = Y(822) + 'px'; lakefx.style.height = (70 * scale) + 'px'; }
    if (fogband) { fogband.style.top = Y(760) + 'px'; fogband.style.height = (110 * scale) + 'px'; }
    var sx = parseFloat(getComputedStyle(sunEl).left);
    if (sunref && !isNaN(sx)) { sunref.style.left = sx + 'px'; sunref.style.top = Y(800) + 'px'; sunref.style.height = (100 * scale) + 'px'; sunref.style.width = (34 * scale) + 'px'; }
  }
  measure();
  var measT = 0; function remeasure() { clearTimeout(measT); measT = setTimeout(function () { measure(); layRail(); ask(); }, 150); }
  window.addEventListener('resize', remeasure); window.addEventListener('load', remeasure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
  function paint() {
    ticking = false;
    var p = Math.min(1, Math.max(0, (window.scrollY || 0) / maxScroll));
    var t = Math.round(Math.min(1, p * 1.25) * 200) / 200;
    if (t !== lastT) {
      lastT = t; var vh = window.innerHeight;
      fade('.sky-night', t); fade('.nightwash', .8 * t); fade('.stars', 1.5 * t - .3); fade('.milky', (t - .5) * 2);
      fade('.aurora', Math.min(.85, (t - .55) * 1.9)); fade('.consts', 2.4 * t - 1.3); fade('.flies', .18 + .82 * t);
      fade('.sun', 1 - .9 * t, 'translate3d(0,' + (t * .3 * vh).toFixed(1) + 'px,0)');
      fade('.moon', 1.6 * t - .6, 'translate3d(0,' + ((1 - t) * .16 * vh).toFixed(1) + 'px,0) rotate(-20deg)');
      fade('.c1', .82 - .7 * t); fade('.c2', .82 - .7 * t); fade('.c3', .82 - .7 * t); fade('.c4', .55 - .5 * t); fade('.c5', .82 - .7 * t);
      fade('.birds', 1 - 3 * t); fade('.sunref', 1 - 2.2 * t); fade('.lakefx', .9 - .45 * t); fade('.fogband', 1 - .55 * t);
      var night = t > .7; if (night !== isNight) { isNight = night; root.classList.toggle('night', night); }
      var mins = Math.round(18.5 * 60 + t * 5 * 60), hh = Math.floor(mins / 60), mm = mins % 60, txt = (hh > 12 ? hh - 12 : hh) + ':' + (mm < 10 ? '0' : '') + mm + ' pm';
      if (clock && txt !== lastClock) { lastClock = txt; clock.textContent = txt; }
    }
    moveRail(p);
    var sc = (window.scrollY || 0) > 8; if (sc !== wasScrolled) { wasScrolled = sc; root.classList.toggle('scrolled', sc); }
    if (p > .01 && hint && !hint.hidden && !hint.classList.contains('out')) { hint.classList.add('out'); }
  }
  var px = 0, py = 0, spotTick = false;
  function moveSpot() { spotTick = false; spot.style.transform = 'translate3d(' + (px - 340) + 'px,' + (py - 340) + 'px,0)'; }

  /* The side rail: where you are on the page, as the evening passes */
  var rail = document.getElementById('rail'), railDot = document.getElementById('rail-dot'), railLinks = rail ? Array.prototype.slice.call(rail.querySelectorAll('a')) : [], railAt = [], railH = 0, railOn = -1;
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav nav a'));
  function layRail() {
    if (!rail) return;
    var max = maxScroll, n = railLinks.length; railH = rail.offsetHeight; railOn = -1;
    railAt = railLinks.map(function (a, i) {
      var el = document.querySelector(a.getAttribute('href')), y = el ? el.getBoundingClientRect().top + (window.scrollY || 0) - window.innerHeight * .42 : 0;
      a.style.top = (i / (n - 1) * 100).toFixed(2) + '%';        // labels sit evenly; the dot travels between them
      return Math.min(.965, Math.max(0, y / max));
    });
    for (var k = 1; k < n; k++) if (railAt[k] <= railAt[k - 1]) railAt[k] = railAt[k - 1] + .001;
  }
  function moveRail(p) {
    if (!rail || !railAt.length) return;
    var n = railAt.length, on = 0;
    for (var i = 0; i < n; i++) if (p >= railAt[i] - .004) on = i;
    if (on !== railOn) {
      railOn = on; var href = railLinks[on].getAttribute('href');
      railDot.style.transform = 'translate3d(0,' + (on / (n - 1) * railH).toFixed(1) + 'px,0)';
      railLinks.forEach(function (a, i) { a.classList.toggle('on', i === on); });
      navLinks.forEach(function (a) { var act = a.getAttribute('href') === href; a.classList.toggle('active', act); if (act) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }
  }
  function ask() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
  window.addEventListener('scroll', ask, { passive: true });
  if (spot && window.matchMedia && matchMedia('(hover: hover)').matches) window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return; px = e.clientX; py = e.clientY; spot.classList.add('on');
    if (!spotTick) { spotTick = true; requestAnimationFrame(moveSpot); }
  }, { passive: true });
  paint();

  /* ---------- The ending: 78 fireflies settle into 13 bins as a bell curve ---------- */
  var heap = document.getElementById('heap');
  var heapStep = 0;
  function buildHeap() {
    if (!heap) return;
    var r = rng(2028), bins = [1, 2, 4, 6, 9, 11, 12, 11, 9, 6, 4, 2, 1];
    // fit the whole figure, heading and caption on one screen, whatever its size
    var avail = Math.min(window.innerWidth - 40, 540), room = window.innerHeight - 300;
    var step = Math.max(13, Math.min(36, Math.floor(avail / 15.8), Math.floor((room - 60) / 12)));
    if (step === heapStep) return; if (heapStep && heap.classList.contains('in')) heap.classList.add('settled'); heapStep = step;
    var W = 13 * step, AX = 30, H = 12 * step + 30 + AX, base = H - AX, html = '', sig = 2.55, mu = 6.5;
    heap.style.width = W + 'px'; heap.style.height = H + 'px';
    for (var b = 0; b < 13; b++) for (var k = 0; k < bins[b]; k++) {
      var core = b >= 4 && b <= 8;                                // within one standard deviation of the mean
      var ang = r() * 6.2832, dist = Math.min(220 + r() * 420, window.innerWidth * .42);
      var sx = Math.cos(ang) * dist, sy = -Math.abs(Math.sin(ang)) * dist * .8 - 60, d = 200 + k * 120 + Math.abs(b - 6) * 70 + r() * 700;
      html += '<span' + (core ? ' class="core"' : '') + ' style="left:' + (b * step) + 'px;bottom:' + (AX + k * step) + 'px;width:' + step + 'px;height:' + step + 'px;--sx:' + sx.toFixed(0) + 'px;--sy:' + sy.toFixed(0) + 'px;--cx:' + ((r() - .5) * 120).toFixed(0) + 'px;--d:' + d.toFixed(0) + 'ms"><i class="fly" style="--sz:' + (30 + r() * 16).toFixed(0) + '%;--bl:' + (2.6 + r() * 3).toFixed(1) + 's;--bd:-' + (r() * 5).toFixed(1) + 's"></i></span>';
    }
    function Y(x) { var c = x - mu; return base - (12 * step + 10) * Math.exp(-c * c / (2 * sig * sig)); }
    var pts = [], band = [], x;
    for (x = -1.4; x <= 14.41; x += .1) pts.push((x * step).toFixed(1) + ' ' + Y(x).toFixed(1));
    for (x = mu - sig; x <= mu + sig + .001; x += .1) band.push((x * step).toFixed(1) + ' ' + Y(x).toFixed(1));
    var ticks = [[-2, '−2σ'], [-1, '−1σ'], [0, 'μ'], [1, '+1σ'], [2, '+2σ']], ax = '';
    ticks.forEach(function (t) {
      var tx = (mu + t[0] * sig) * step;
      ax += '<path class="axis" d="M' + tx.toFixed(1) + ' ' + base + ' v6"/><text class="' + (t[0] === 0 ? 'mid' : '') + '" x="' + tx.toFixed(1) + '" y="' + (base + 21) + '">' + t[1] + '</text>';
    });
    heap.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '"><defs><linearGradient id="bandfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc078" stop-opacity=".22"/><stop offset="1" stop-color="#ffc078" stop-opacity=".02"/></linearGradient></defs>' +
      '<g class="late"><path class="band" d="M' + ((mu - sig) * step).toFixed(1) + ' ' + base + ' L' + band.join(' L') + ' L' + ((mu + sig) * step).toFixed(1) + ' ' + base + ' Z"/>' +
      '<path class="axis" d="M' + (-1.4 * step).toFixed(1) + ' ' + base + ' H' + (14.4 * step).toFixed(1) + '"/>' + ax + '</g>' +
      '<path class="curve" pathLength="1" d="M' + pts.join(' L') + '"/></svg>' + html;
  }
  buildHeap();
  var heapT = 0, heapW = window.innerWidth, heapH = window.innerHeight;
  window.addEventListener('resize', function () { // only a real change of window, not a toolbar sliding away, is worth redrawing for
    if (window.innerWidth === heapW && Math.abs(window.innerHeight - heapH) < 140) return;
    heapW = window.innerWidth; heapH = window.innerHeight; clearTimeout(heapT); heapT = setTimeout(buildHeap, 200);
  });
  if (heap) { if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { heap.classList.toggle('live', en[0].isIntersecting); }, { rootMargin: '80px' }).observe(heap); else heap.classList.add('live'); }
  function armHeap() {
    if (!heap) return;
    if (reduce || !('IntersectionObserver' in window)) { heap.classList.add('in'); return; }
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { heap.classList.add('in'); io.disconnect(); } }, { threshold: .35 });
    io.observe(heap);
  }

  /* ---------- Count-up figures and gentle reveals ---------- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-to')), dec = +(el.getAttribute('data-dec') || 0), pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '';
    function fmt(v) { return pre + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; }
    if (reduce) { el.textContent = fmt(to); return; }
    var t0 = null;
    (function f(ts) { if (t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / 1600), e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(f); else el.textContent = fmt(to); })(performance.now());
  }
  function armReveals() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { Array.prototype.forEach.call(els, function (e) { e.classList.add('seen'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('seen'); io.unobserve(en.target);
        Array.prototype.forEach.call(en.target.querySelectorAll('[data-to]'), countUp);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    Array.prototype.forEach.call(els, function (e) { io.observe(e); });
  }

  /* Project cards tilt toward the pointer and catch the light */
  Array.prototype.forEach.call(document.querySelectorAll('#trading .card'), function (card) {
    if (reduce) return;
    card.addEventListener('pointermove', function (e) {
      var b = card.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      card.style.setProperty('--tx', ((.5 - y) * 7).toFixed(2) + 'deg'); card.style.setProperty('--ty', ((x - .5) * 9).toFixed(2) + 'deg');
      card.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', function () { card.style.setProperty('--tx', '0deg'); card.style.setProperty('--ty', '0deg'); });
  });

  /* ---------- Monte Carlo illustration inside the first project card ---------- */
  var canvas = document.getElementById('sim'), ctx = canvas.getContext('2d');
  var N = 160, T = 200, paths = [], p5 = [], p50 = [], p95 = [], lo = 0, hi = 1, prog = 1, simRaf = 0;
  function simulate(seed) {
    var r = rng(seed);
    function normal() { var u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * r()); }
    paths = []; p5 = []; p50 = []; p95 = []; lo = Infinity; hi = -Infinity;
    for (var i = 0; i < N; i++) {
      var p = new Float64Array(T + 1); p[0] = 100;
      for (var t = 1; t <= T; t++) p[t] = p[t - 1] * Math.exp(.0004 - .000072 + .012 * normal());
      paths.push(p);
    }
    for (var s = 0; s <= T; s++) {
      var col = paths.map(function (p) { return p[s]; }).sort(function (a, b) { return a - b; });
      p5.push(col[Math.floor(N * .05)]); p50.push(col[Math.floor(N * .5)]); p95.push(col[Math.floor(N * .95)]);
      lo = Math.min(lo, col[2]); hi = Math.max(hi, col[N - 3]);
    }
  }
  function drawSim() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    var L = 14, R = 14, B = 8, pw = w - L - R, ph = h - B - 6;
    function X(t) { return L + t / T * pw; }
    function Y(v) { return 6 + (1 - (v - lo) / (hi - lo)) * ph; }
    var end = Math.max(1, Math.round(prog * T)), i, t;
    ctx.lineWidth = .7; ctx.strokeStyle = 'rgba(214,196,255,.17)';
    for (i = 0; i < N; i++) { ctx.beginPath(); ctx.moveTo(X(0), Y(paths[i][0])); for (t = 1; t <= end; t++) ctx.lineTo(X(t), Y(paths[i][t])); ctx.stroke(); }
    ctx.fillStyle = 'rgba(150,120,255,.20)'; ctx.beginPath(); ctx.moveTo(X(0), Y(p95[0]));
    for (t = 1; t <= end; t++) ctx.lineTo(X(t), Y(p95[t]));
    for (t = end; t >= 0; t--) ctx.lineTo(X(t), Y(p5[t]));
    ctx.fill();
    ctx.strokeStyle = '#ffc078'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), Y(p50[0]));
    for (t = 1; t <= end; t++) ctx.lineTo(X(t), Y(p50[t]));
    ctx.stroke();
    ctx.fillStyle = '#ffc078'; ctx.beginPath(); ctx.arc(X(end), Y(p50[end]), 3.2, 0, 6.2832); ctx.fill();
  }
  function playSim() {
    cancelAnimationFrame(simRaf);
    if (reduce) { prog = 1; drawSim(); return; }
    var t0 = null; prog = 0;
    (function f(ts) { if (t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / 2400); prog = 1 - Math.pow(1 - k, 3); drawSim(); if (k < 1) simRaf = requestAnimationFrame(f); })(performance.now());
  }
  simulate(4217); drawSim();
  if ('ResizeObserver' in window) new ResizeObserver(drawSim).observe(canvas);
  function armSim() {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { playSim(); io.disconnect(); } }, { threshold: .45 });
    io.observe(canvas);
  }
  (function () {
    function again() { simulate((Math.random() * 1e9) | 0); playSim(); }
    document.getElementById('trading').querySelector('.card').addEventListener('click', again);
  })();

  /* ---------- The intro: sign the name, then write the story one word at a time ---------- */
  var sig = document.querySelector('.sig'), pill = document.getElementById('pill'), ff = document.getElementById('ff');
  var tokens = [];
  Array.prototype.forEach.call(document.querySelectorAll('[data-type]'), function (p) {
    var first = true;
    Array.prototype.slice.call(p.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement('span'); s.className = 'tok w'; s.textContent = part; frag.appendChild(s);
          tokens.push({ el: s, para: first, text: part }); first = false;
        });
        p.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        node.classList.add('tok');
        tokens.push({ el: node, para: first, rich: !node.classList.contains('ico'), ico: node.classList.contains('ico'), text: node.textContent }); first = false;
      }
    });
  });

  var speed = 1, timer = 0, idx = 0, done = false, armed = false, lockY = 0;
  // Browsers restore the old scroll position on reload, which would leave the intro playing off screen.
  // While the intro runs, the page is pinned to wherever the writing is.
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  var goalY = 0, gliding = false;
  function jump(y) { window.scrollTo({ left: 0, top: y, behavior: 'instant' }); }
  function pin() { if (!done && Math.abs((window.scrollY || 0) - lockY) > 2) jump(lockY); }
  function glide() { // ease the page down so the newest words stay comfortably in view
    if (done) { gliding = false; return; }
    var gap = goalY - lockY;
    if (Math.abs(gap) < .4) { gliding = false; return; }
    lockY += gap * .045; jump(lockY);
    requestAnimationFrame(glide);
  }
  window.addEventListener('scroll', pin, { passive: true });
  window.addEventListener('load', pin); window.addEventListener('pageshow', pin);
  function later(fn, ms) { timer = setTimeout(fn, ms / speed); }
  var held = [document.querySelector('.nav'), document.getElementById('rail')].concat(Array.prototype.slice.call(document.querySelectorAll('.after')));
  var heroLinks = Array.prototype.slice.call(document.querySelectorAll('.hero a'));
  function setInert(on) { heroLinks.forEach(function (a) { if (on) a.setAttribute('tabindex', '-1'); else a.removeAttribute('tabindex'); }); held.forEach(function (el) { if (!el) return; if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }); }
  var firstFinish = true, replayT = 0, replayPending = false;
  function finish() {
    if (done) return; done = true; clearTimeout(replayT); if (pen) pen.classList.remove('on');
    if (firstFinish) { // a link straight to a section still lands there once the intro is out of the way
      firstFinish = false; var target = null; try { target = location.hash.length > 1 && document.querySelector(location.hash); } catch (e) {}
      if (target) setTimeout(function () { target.scrollIntoView(); }, 60);
    }
    if (document.activeElement && pill.contains(document.activeElement)) { try { document.getElementById('top').focus({ preventScroll: true }); } catch (e) {} }
    clearTimeout(timer);
    sig.style.setProperty('--sig-t', '.01s'); sig.classList.add('in');
    tokens.forEach(function (t) { t.el.classList.add('in'); });
    root.classList.add('lit'); root.classList.remove('intro'); setInert(false);
    pill.classList.add('out'); setTimeout(function () { pill.hidden = true; }, 600);
    if (!armed) { armed = true; armSim(); armReveals(); armHeap(); armNav(); }
    remeasure();
    if (hint && (window.scrollY || 0) < 10) { hint.hidden = false; hint.classList.remove('out'); setTimeout(function () { hint.classList.add('out'); }, 5000); }
    ask();
  }
  /* The firefly pen: it leads the signature, then sits at the tip of the newest word */
  var pen = document.getElementById('pen'), hero = document.querySelector('.hero');
  function penTo(el, dur, atStart) {
    if (!pen || !el) return;
    var h = hero.getBoundingClientRect(), b = el.getBoundingClientRect();
    pen.style.setProperty('--pen-t', dur + 's');
    pen.style.transform = 'translate3d(' + ((atStart ? b.left : b.right + 5) - h.left).toFixed(1) + 'px,' + (b.top + b.height * .66 - h.top).toFixed(1) + 'px,0)';
  }
  function penAway() {
    if (!pen) return; pen.style.setProperty('--pen-t', '1.6s');
    var m = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(pen.style.transform || '');
    if (m) pen.style.transform = 'translate3d(' + (+m[1] + 90) + 'px,' + (+m[2] - 130) + 'px,0)';
    pen.classList.remove('on');
  }
  function step() {
    if (done) return;
    if (idx >= tokens.length) { penAway(); later(finish, 1100); return; }
    var t = tokens[idx++];
    later(function () {
      t.el.classList.add('in'); var la = t.el.tagName === 'A' ? t.el : t.el.querySelector && t.el.querySelector('a'); if (la) la.removeAttribute('tabindex');
      // scrolling is locked during the intro, so follow the writing on short screens
      var box = t.el.getBoundingClientRect(); var isScript = t.el.classList.contains('script'); penTo(t.el, isScript ? 1.1 : t.para ? .5 : .26);
      var line = window.innerHeight * .6;
      if (box.bottom > line) { goalY = Math.max(goalY, (window.scrollY || 0) + box.bottom - line); if (!gliding) { gliding = true; requestAnimationFrame(glide); } }
      var hold = isScript ? 1050 : t.ico ? 70 : t.rich ? 370 : 148;
      if (/[.!?]$/.test(t.text)) hold += 420; else if (/,$/.test(t.text)) hold += 170;
      later(step, hold);
    }, t.para && idx > 1 ? 700 : 0);
  }
  function startIntro() {
    replayPending = false; done = false; lockY = 0; goalY = 0; gliding = false; jump(0); root.classList.add('ready'); setInert(true); setTimeout(pin, 300); setTimeout(pin, 1200);
    pill.hidden = false; pill.classList.remove('out');
    try { document.getElementById('skip').focus({ preventScroll: true }); } catch (e) {}
    var sigSpan = sig.querySelector('span');
    if (pen) { pen.classList.remove('on'); penTo(sigSpan, 0, true); }
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      sig.classList.add('in');
      if (pen) { pen.classList.add('on'); pen.style.setProperty('--pen-t', '1.7s'); penTo(sigSpan, 1.7); pen.style.transitionTimingFunction = 'cubic-bezier(.45, .05, .35, 1)'; setTimeout(function () { pen.style.transitionTimingFunction = ''; }, 1800); }
    }); });
    timer = setTimeout(function () { root.classList.add('lit'); step(); }, 1900);
  }
  document.getElementById('skip').addEventListener('click', finish);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (replayPending) { clearTimeout(replayT); replayPending = false; done = false; }
    if (!done) finish();
  });
  document.querySelector('.hero').addEventListener('click', function (e) { // following a link in the story ends the intro first
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (a && !done) finish();
  });
  ff.addEventListener('click', function () { speed = speed === 1 ? 6 : 1; ff.setAttribute('aria-pressed', speed > 1); });
  window.scrollTo(0, 0);
  if (document.fonts && document.fonts.ready) {
    var go = false, once = function () { if (!go) { go = true; startIntro(); } };
    var sigFont = document.fonts.load ? document.fonts.load('52px "Mr Dafoe"') : document.fonts.ready;
    Promise.all([sigFont, document.fonts.ready]).then(once, once); setTimeout(once, 2500);
  } else startIntro();

  document.getElementById('replay').addEventListener('click', function () {
    clearTimeout(timer); clearTimeout(replayT); firstFinish = false; lockY = 0; done = true; idx = 0; speed = 1; ff.setAttribute('aria-pressed', 'false');
    window.scrollTo(0, 0);
    sig.style.removeProperty('--sig-t'); sig.classList.remove('in');
    tokens.forEach(function (t) { t.el.classList.remove('in'); });
    root.classList.add('intro'); setInert(true);
    replayPending = true; replayT = setTimeout(startIntro, 400);
  });

  /* ---------- Small touches: copy email, roll the logo die, mark the current section ---------- */
  var copy = document.getElementById('copy');
  copy.addEventListener('click', function () {
    var say = function (m) { copy.textContent = m; setTimeout(function () { copy.textContent = 'Copy email'; }, 1800); };
    try { navigator.clipboard.writeText(copy.getAttribute('data-text')).then(function () { say('Copied'); }, function () { say(copy.getAttribute('data-text')); }); }
    catch (e) { say(copy.getAttribute('data-text')); }
  });
  var logo = document.getElementById('logo'), LP = { 1: [[12, 12]], 2: [[8, 8], [16, 16]], 3: [[8, 8], [12, 12], [16, 16]], 4: [[8, 8], [16, 8], [8, 16], [16, 16]], 5: [[8, 8], [16, 8], [12, 12], [8, 16], [16, 16]], 6: [[8, 7.5], [16, 7.5], [8, 12], [16, 12], [8, 16.5], [16, 16.5]] };
  logo.addEventListener('click', function () {
    var n = 1 + Math.floor(Math.random() * 6);
    logo.querySelector('g').innerHTML = LP[n].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.9"/>'; }).join('');
    logo.classList.remove('roll'); void logo.offsetWidth; logo.classList.add('roll');
  });
  function armNav() { layRail(); ask(); }
})();

/* Project Olympus: switch between sheet tabs */
(function () {
  var tabs = document.querySelectorAll('.sh-tabs button');
  Array.prototype.forEach.call(tabs, function (b) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(tabs, function (o) {
        var on = o === b;
        o.classList.toggle('on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
        var t = document.getElementById(o.getAttribute('data-view'));
        if (t) t.hidden = !on;
      });
    });
  });
})();
