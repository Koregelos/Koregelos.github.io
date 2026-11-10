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
  var land = document.getElementById('land'), layers = [];
  (function buildLand() {
    var r = rng(916), svg = '';
    var defs = [
      // base y, height, peakiness (1 = jagged mountains, 0 = rolling hills), top color, bottom color, pines, pine size
      { base: 520, amp: 175, peak: 1, c1: '#d9a0b4', c2: '#c98aa8', pines: 0 },
      { base: 575, amp: 150, peak: .85, c1: '#b07aa6', c2: '#9a6a9c', pines: 0 },
      { base: 640, amp: 120, peak: .55, c1: '#7d5a94', c2: '#6a4d88', pines: 0 },
      { base: 705, amp: 95, peak: .25, c1: '#51417a', c2: '#43376c', pines: 46, size: 20 },
      { base: 790, amp: 80, peak: .1, c1: '#2e2857', c2: '#252049', pines: 30, size: 40 },
      { base: 905, amp: 48, peak: 0, c1: '#15132f', c2: '#100e26', pines: 9, size: 120 }
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
      if (i === 2) { var fx = 1010, fy = Y(fx); body += '<path d="M' + fx + ' ' + fy + ' v-26" stroke="#f6e9dc" stroke-width="1.4"/><path d="M' + fx + ' ' + (fy - 26) + ' l13 4.5 -13 4.5z" fill="#ff8b6b"/>'; }
      for (var k = 0; k < d.pines; k++) {
        var px = i === 5 ? (r() < .5 ? -60 + r() * 380 : 1280 + r() * 380) : -100 + r() * 1800;
        var h = d.size * (.7 + r() * .7), w = h * .3, py = Y(px) + 3, tree = '';
        for (var s = 0; s < 4; s++) { var top = py - h + s * h * .2, ww = w * (.45 + s * .2); tree += 'M' + px.toFixed(1) + ' ' + top.toFixed(1) + ' l' + ww.toFixed(1) + ' ' + (h * .38).toFixed(1) + ' h-' + (ww * 2).toFixed(1) + 'z '; }
        body += '<path fill="' + d.c2 + '" d="' + tree + 'M' + (px - w * .1).toFixed(1) + ' ' + (py - 4).toFixed(1) + ' h' + (w * .2).toFixed(1) + ' v8 h-' + (w * .2).toFixed(1) + 'z"/>';
      }
      // haze sitting in the valley behind this ridge
      var mist = i > 0 && i < 5 ? '<rect x="-120" y="' + (d.base - d.amp * .25) + '" width="1840" height="' + (d.amp * .9) + '" fill="url(#mist)" opacity="' + (.5 - i * .07) + '"/>' : '';
      var water = '';
      if (i === 5) { // a lake in the last valley, catching the sky
        water = '<g id="water"><rect x="-120" y="790" width="1840" height="176" fill="url(#lake)"/><ellipse id="sunref" cx="1296" cy="856" rx="20" ry="74" fill="url(#ref)"/>';
        for (var q = 0; q < 26; q++) { var wx = -60 + r() * 1720, wy = 826 + r() * 60, wl = 14 + r() * 44; water += '<path class="shim" style="animation-delay:-' + (r() * 4).toFixed(1) + 's" d="M' + wx.toFixed(0) + ' ' + wy.toFixed(0) + ' h' + wl.toFixed(0) + '" stroke="#fff1dc" stroke-width="1.2" stroke-linecap="round"/>'; }
        water += '<rect class="fog" x="-200" y="770" width="2000" height="90" fill="url(#mist)" opacity=".5"/></g>';
      }
      svg += '<defs>' + g + '</defs>' + mist + water + '<g data-depth="' + (i + 1) + '">' + body + '</g>';
    });
    land.innerHTML = '<defs><linearGradient id="lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5e9c" stop-opacity="0"/><stop offset=".22" stop-color="#6a5092"/><stop offset=".5" stop-color="#4a3b7a"/><stop offset="1" stop-color="#2b2556"/></linearGradient><radialGradient id="ref"><stop offset="0" stop-color="#fff3d0" stop-opacity=".95"/><stop offset=".5" stop-color="#ffc98f" stop-opacity=".5"/><stop offset="1" stop-color="#ffc98f" stop-opacity="0"/></radialGradient><linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9c2" stop-opacity="0"/><stop offset=".5" stop-color="#ffd9c2" stop-opacity=".55"/><stop offset="1" stop-color="#ffd9c2" stop-opacity="0"/></linearGradient></defs>' + svg;
    layers = Array.prototype.slice.call(land.querySelectorAll('g[data-depth]'));
  })();

  /* Stars and fireflies */
  (function () {
    var r = rng(41), s = '', n = window.innerWidth < 700 ? 90 : 230;
    for (var i = 0; i < n; i++) {
      var size = r() < .12 ? 3 : r() < .5 ? 2 : 1.4;
      s += '<i' + (r() < .3 ? ' class="tw"' : '') + ' style="left:' + (r() * 100).toFixed(2) + '%;top:' + (r() * 100).toFixed(2) + '%;width:' + size + 'px;height:' + size + 'px;opacity:' + (.45 + r() * .55).toFixed(2) + ';animation-delay:' + (r() * 4).toFixed(1) + 's"></i>';
    }
    document.getElementById('stars').innerHTML = s;
    var f = '', m = window.innerWidth < 700 ? 12 : 26;
    function d() { return ((r() - .5) * 90).toFixed(0) + 'px'; }
    for (var k = 0; k < m; k++) {
      var sz = 3 + r() * 3;
      f += '<i style="left:' + (r() * 100).toFixed(1) + '%;top:' + (56 + r() * 42).toFixed(1) + '%;width:' + sz.toFixed(1) + 'px;height:' + sz.toFixed(1) + 'px;--x1:' + d() + ';--y1:' + d() + ';--x2:' + d() + ';--y2:' + d() + ';--x3:' + d() + ';--y3:' + d() + ';--dur:' + (10 + r() * 14).toFixed(0) + 's;--bl:' + (2.4 + r() * 3).toFixed(1) + 's;--del:-' + (r() * 8).toFixed(1) + 's"></i>';
    }
    document.getElementById('flies').innerHTML = f;
  })();

  /* Scroll sets the time of day; the pointer and scroll shift the ridges for depth */
  var tx = 0, ty = 0, ticking = false, clock = document.getElementById('clock'), hint = document.getElementById('hint'), spot = document.getElementById('spot');
  var sunref = document.getElementById('sunref'), sunEl = document.querySelector('.sun');
  function placeReflection() { // line the lake's reflection up under the sun at any window shape
    var w = window.innerWidth, h = window.innerHeight, scale = Math.max(w / 1600, h / 900);
    var sx = parseFloat(getComputedStyle(sunEl).left);
    if (sunref && !isNaN(sx)) sunref.setAttribute('cx', (800 + (sx - w / 2) / scale).toFixed(0));
  }
  placeReflection(); window.addEventListener('resize', placeReflection);
  function paint() {
    ticking = false;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var p = Math.min(1, Math.max(0, (window.scrollY || 0) / max));
    var t = Math.min(1, p * 1.25);
    root.style.setProperty('--t', t.toFixed(3));
    root.classList.toggle('night', t > .7);
    var mins = Math.round(18.5 * 60 + t * 5 * 60), hh = Math.floor(mins / 60), mm = mins % 60;
    if (clock) clock.textContent = (hh > 12 ? hh - 12 : hh) + ':' + (mm < 10 ? '0' : '') + mm + ' pm';
    if (sunref) { sunref.setAttribute('opacity', Math.max(0, 1 - t * 2.2).toFixed(2)); }
    if (p > .01 && hint && !hint.hidden) { hint.classList.add('out'); }
    if (reduce) return;
    for (var i = 0; i < layers.length; i++) {
      var dpt = i + 1;
      layers[i].setAttribute('transform', 'translate(' + (-tx * dpt * 5).toFixed(1) + ' ' + (p * dpt * 7 - ty * dpt * 2).toFixed(1) + ')');
    }
  }
  function ask() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', ask);
  window.addEventListener('pointermove', function (e) { tx = e.clientX / window.innerWidth - .5; ty = e.clientY / window.innerHeight - .5; if (spot && e.pointerType !== 'touch') { spot.style.setProperty('--sx', e.clientX + 'px'); spot.style.setProperty('--sy', e.clientY + 'px'); spot.classList.add('on'); } ask(); }, { passive: true });
  paint();

  /* ---------- The ending: 78 fireflies settle into 13 bins as a bell curve ---------- */
  var heap = document.getElementById('heap');
  (function buildHeap() {
    var r = rng(2028), bins = [1, 2, 4, 6, 9, 11, 12, 11, 9, 6, 4, 2, 1];
    var avail = Math.min(window.innerWidth - 96, 468), step = Math.max(18, Math.min(36, Math.floor(avail / 13)));
    var W = 13 * step, AX = 30, H = 12 * step + 30 + AX, base = H - AX, html = '', sig = 2.55, mu = 6.5;
    heap.style.width = W + 'px'; heap.style.height = H + 'px';
    for (var b = 0; b < 13; b++) for (var k = 0; k < bins[b]; k++) {
      var core = b >= 4 && b <= 8;                                // within one standard deviation of the mean
      var ang = r() * 6.2832, dist = 220 + r() * 420;
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
  })();
  function armHeap() {
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
  Array.prototype.forEach.call(document.querySelectorAll('.card:not(.ghost)'), function (card) {
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
  document.getElementById('trading').querySelector('.card').addEventListener('click', function () { simulate((Math.random() * 1e9) | 0); playSim(); });

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
          var s = document.createElement('span'); s.className = 'tok'; s.textContent = part; frag.appendChild(s);
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
  function finish() {
    if (done) return; done = true;
    clearTimeout(timer);
    sig.style.setProperty('--sig-t', '.01s'); sig.classList.add('in');
    tokens.forEach(function (t) { t.el.classList.add('in'); });
    root.classList.add('lit'); root.classList.remove('intro');
    pill.classList.add('out'); setTimeout(function () { pill.hidden = true; }, 600);
    if (!armed) { armed = true; armSim(); armReveals(); armHeap(); armNav(); }
    if (hint && (window.scrollY || 0) < 10) { hint.hidden = false; hint.classList.remove('out'); setTimeout(function () { hint.classList.add('out'); }, 9000); }
    ask();
  }
  function step() {
    if (done) return;
    if (idx >= tokens.length) { later(finish, 900); return; }
    var t = tokens[idx++];
    later(function () {
      t.el.classList.add('in');
      // scrolling is locked during the intro, so follow the writing on short screens
      var box = t.el.getBoundingClientRect();
      var line = window.innerHeight * .6;
      if (box.bottom > line) { goalY = Math.max(goalY, (window.scrollY || 0) + box.bottom - line); if (!gliding) { gliding = true; requestAnimationFrame(glide); } }
      var hold = t.ico ? 70 : t.rich ? 370 : 148;
      if (/[.!?]$/.test(t.text)) hold += 420; else if (/,$/.test(t.text)) hold += 170;
      later(step, hold);
    }, t.para && idx > 1 ? 700 : 0);
  }
  function startIntro() {
    lockY = 0; goalY = 0; jump(0); root.classList.add('ready'); setTimeout(pin, 300); setTimeout(pin, 1200);
    pill.hidden = false; pill.classList.remove('out');
    requestAnimationFrame(function () { requestAnimationFrame(function () { sig.classList.add('in'); }); });
    timer = setTimeout(function () { root.classList.add('lit'); step(); }, 1900);
  }
  document.getElementById('skip').addEventListener('click', finish);
  ff.addEventListener('click', function () { speed = speed === 1 ? 6 : 1; ff.setAttribute('aria-pressed', speed > 1); });
  window.scrollTo(0, 0);
  if (document.fonts && document.fonts.ready) {
    var go = false, once = function () { if (!go) { go = true; startIntro(); } };
    document.fonts.ready.then(once); setTimeout(once, 1500);
  } else startIntro();

  document.getElementById('replay').addEventListener('click', function () {
    clearTimeout(timer); lockY = 0; done = false; idx = 0; speed = 1; ff.setAttribute('aria-pressed', 'false');
    window.scrollTo(0, 0);
    sig.style.removeProperty('--sig-t'); sig.classList.remove('in');
    tokens.forEach(function (t) { t.el.classList.remove('in'); });
    root.classList.add('intro');
    setTimeout(startIntro, 400);
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
  function armNav() {
    if (!('IntersectionObserver' in window)) return;
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav nav a'));
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); }); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    links.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) io.observe(s); });
  }
})();
