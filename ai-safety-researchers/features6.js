/* Round A: hover effects, motion, motion toggle. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, win = window;
  var mqReduce = win.matchMedia("(prefers-reduced-motion: reduce)");
  var mqFine = win.matchMedia("(hover: hover) and (pointer: fine)");
  var KEY = "x-motion";

  function store(v) {
    try { if (v === undefined) return localStorage.getItem(KEY); localStorage.setItem(KEY, v); } catch (e) { return null; }
    return null;
  }
  var saved = store();
  var full = saved ? saved === "full" : !mqReduce.matches;
  function motionOn() { return full; }
  function tiltOn() { return full && !mqReduce.matches && mqFine.matches; }
  function applyMotion() { root.classList.toggle("x-rm", !full); }
  applyMotion();

  var listeners = [];
  function onMotion(fn) { listeners.push(fn); }
  function setMotion(v) {
    full = v; store(v ? "full" : "reduced"); applyMotion();
    listeners.forEach(function (fn) { try { fn(full); } catch (e) {} });
  }

  // ---------- Category colours ----------
  var DATA = Array.isArray(win.DATA) ? win.DATA : [];
  var BY = {};
  DATA.forEach(function (r) { if (r && r.slug) BY[r.slug] = r; });
  function catKeys() { return (win.XDIR && win.XDIR.catLabel) ? Object.keys(win.XDIR.catLabel) : []; }
  function catColor(slug) {
    var r = BY[slug]; if (!r) return "";
    var i = catKeys().indexOf(r.category);
    return "var(--chart-" + (i < 0 ? 6 : i + 1) + ")";
  }
  function slugOf(el) {
    var s = el.getAttribute("data-slug");
    if (s) return s;
    var a = el.querySelector('.x-qc__who[href^="#"], .x-ivc__person[href^="#"], a.link[href^="#"], a[href^="#"]');
    return a ? a.getAttribute("href").slice(1) : "";
  }
  var CARD_SEL = ".x-card, .x-vcard[data-slug], .x-qc, .x-ivc, .x-rtable tbody tr";
  function tag(scope) {
    [].forEach.call((scope || doc).querySelectorAll(CARD_SEL), function (el) {
      if (el.hasAttribute("data-x-cat")) return;
      el.setAttribute("data-x-cat", "");
      var c = catColor(slugOf(el));
      if (c) el.style.setProperty("--cat", c);
    });
  }

  // ---------- Pointer: spotlight + tilt ----------
  var TILT_SEL = ".x-card, .x-vcard, .x-qc, .x-ivc, .x-iv";
  var cur = null, pending = null, raf = 0;
  function resetTilt(el) { el.style.removeProperty("--x-rx"); el.style.removeProperty("--x-ry"); }
  function frame() {
    raf = 0;
    if (!pending) return;
    var el = pending.el, r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var x = pending.x - r.left, y = pending.y - r.top;
    el.style.setProperty("--mx", x.toFixed(0) + "px");
    el.style.setProperty("--my", y.toFixed(0) + "px");
    if (tiltOn()) {
      var px = x / r.width - 0.5, py = y / r.height - 0.5;
      el.style.setProperty("--x-ry", (px * 12).toFixed(2) + "deg");
      el.style.setProperty("--x-rx", (-py * 12).toFixed(2) + "deg");
    } else resetTilt(el);
  }
  doc.addEventListener("pointermove", function (e) {
    if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    var el = e.target.closest ? e.target.closest(TILT_SEL) : null;
    if (cur && cur !== el) resetTilt(cur);
    cur = el;
    if (!el) return;
    pending = { el: el, x: e.clientX, y: e.clientY };
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  root.addEventListener("mouseleave", function () { if (cur) resetTilt(cur); cur = null; });

  // ---------- Ripple ----------
  var RIPPLE_SEL = ".btn, .x-navbtn, .x-iconbtn, .x-cmpbtn, .x-seg__btn, .x-favbtn, .x-tray__go, .x-filter, .x-quiz__choice";
  doc.addEventListener("pointerdown", function (e) {
    if (!motionOn() || e.button > 0) return;
    var b = e.target.closest ? e.target.closest(RIPPLE_SEL) : null;
    if (!b || b.disabled) return;
    var r = b.getBoundingClientRect();
    var s = doc.createElement("span");
    s.className = "x-ripple"; s.setAttribute("aria-hidden", "true");
    s.style.left = (e.clientX - r.left) + "px";
    s.style.top = (e.clientY - r.top) + "px";
    s.style.setProperty("--x-rs", String(Math.ceil(Math.max(r.width, r.height) / 5)));
    b.appendChild(s);
    var kill = function () { if (s.parentNode) s.parentNode.removeChild(s); };
    s.addEventListener("animationend", kill);
    setTimeout(kill, 900);
  }, { passive: true });

  // ---------- Reveal on scroll ----------
  var io = ("IntersectionObserver" in win) ? new IntersectionObserver(function (entries) {
    var batch = 0;
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      el.style.setProperty("--x-d", Math.min(batch++, 6) * 70 + "ms");
      el.classList.add("x-in");
      io.unobserve(el);
      setTimeout(function () { el.classList.remove("x-rv", "x-rv--blur", "x-in"); el.style.removeProperty("--x-d"); }, 1400);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }) : null;
  function reveal(el, blur) {
    if (!io || !motionOn() || el.classList.contains("x-rv")) return;
    var r = el.getBoundingClientRect();
    if (r.top < win.innerHeight && r.bottom > 0) return; // already on screen: leave it
    el.classList.add("x-rv");
    if (blur) el.classList.add("x-rv--blur");
    io.observe(el);
  }
  var REVEAL_CARDS = ".x-vcard, .x-qc, .x-ivc, .x-cmpwrap, #grid > .x-card, .x-potd, .x-quotes, .chart, .x-orgbox";
  function revealIn(scope) {
    [].forEach.call((scope || doc).querySelectorAll(REVEAL_CARDS), function (el) { reveal(el, true); });
  }
  onMotion(function (on) {
    if (!on) [].forEach.call(doc.querySelectorAll(".x-rv"), function (el) { if (io) io.unobserve(el); el.classList.remove("x-rv", "x-rv--blur", "x-in"); });
  });

  // ---------- Count-up on the headline figures ----------
  function countUp() {
    var figs = [].slice.call(doc.querySelectorAll(".stats .stat__fig"));
    if (!figs.length || !io) return;
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var el = en.target, txt = el.textContent.trim(), m = txt.match(/^(\D*)([\d,]+)(.*)$/);
        if (!m || !motionOn()) return;
        var end = parseInt(m[2].replace(/,/g, ""), 10), t0 = 0, dur = 1400;
        if (!(end > 0)) return;
        el.style.fontVariantNumeric = "tabular-nums";
        function step(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = m[1] + Math.round(end * e).toLocaleString("en-US") + m[3];
          if (p < 1 && motionOn()) requestAnimationFrame(step); else el.textContent = txt;
        }
        el.textContent = m[1] + "0" + m[3];
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    figs.forEach(function (f) { cio.observe(f); });
  }

  // ---------- FLIP on the directory ----------
  var grid = doc.getElementById("grid"), snap = null;
  function unitOf(card) { return card.parentNode && card.parentNode.classList && card.parentNode.classList.contains("x-cmpwrap") ? card.parentNode : card; }
  function snapshot() {
    if (!grid || !motionOn() || !grid.animate) return;
    snap = {};
    [].forEach.call(grid.querySelectorAll(".x-card[data-slug]"), function (c) {
      var r = unitOf(c).getBoundingClientRect();
      if (r.bottom > -200 && r.top < win.innerHeight + 200) snap[c.getAttribute("data-slug")] = r;
    });
  }
  function flip() {
    var s = snap; snap = null;
    if (!s) return;
    var vh = win.innerHeight, n = 0;
    [].forEach.call(grid.querySelectorAll(".x-card[data-slug]"), function (c) {
      var u = unitOf(c), r = u.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var o = s[c.getAttribute("data-slug")];
      if (o) {
        var dx = o.left - r.left, dy = o.top - r.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        u.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" });
      } else {
        u.animate([{ opacity: 0, transform: "scale(.94)", filter: "blur(4px)" }, { opacity: 1, transform: "none", filter: "none" }], { duration: 360, delay: Math.min(n++, 8) * 25, easing: "ease-out", fill: "backwards" });
      }
    });
  }
  if (grid) {
    ["click", "input", "change"].forEach(function (type) {
      doc.addEventListener(type, function (e) {
        var t = e.target;
        if (!t || !t.closest) return;
        if (t.closest("#filters [data-cat], #orgs [data-org], .x-ticker button") || (type !== "click" && (t.id === "q" || t.id === "sort"))) snapshot();
      }, true);
    });
  }

  // ---------- Observe dynamic grids ----------
  var flipRaf = 0;
  function watch(id, after) {
    var el = doc.getElementById(id);
    if (!el) return;
    tag(el);
    new MutationObserver(function () {
      tag(el);
      if (after) after(el);
    }).observe(el, { childList: true, subtree: id === "rd-body" ? false : true });
  }

  // ---------- Hero: aurora + particle network ----------
  function heroFx() {
    var hero = doc.querySelector(".main > .hero");
    if (!hero) return;
    var fx = doc.createElement("div");
    fx.className = "x-hero-fx"; fx.setAttribute("aria-hidden", "true");
    fx.innerHTML = '<span class="x-blob"></span><span class="x-blob"></span><span class="x-blob"></span><span class="x-blob"></span><canvas></canvas>';
    var img = hero.querySelector(".hero__img");
    if (img && img.nextSibling) hero.insertBefore(fx, img.nextSibling); else hero.insertBefore(fx, hero.firstChild);
    var cv = fx.querySelector("canvas"), ctx = cv.getContext && cv.getContext("2d");
    if (!ctx) return;
    var W = 0, H = 0, dpr = 1, pts = [], visible = true, running = false, last = 0;
    function size() {
      var r = hero.getBoundingClientRect();
      dpr = Math.min(2, win.devicePixelRatio || 1);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(64, Math.max(18, W * H / 16000)));
      while (pts.length < n) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: 0.8 + Math.random() * 1.4 });
      pts.length = n;
      pts.forEach(function (p) { p.x = Math.min(p.x, W); p.y = Math.min(p.y, H); });
      draw(0);
    }
    var LINK = 120;
    function draw(dt) {
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, dx, dy, d;
      for (i = 0; i < pts.length; i++) {
        a = pts[i];
        if (dt) {
          a.x += a.vx * dt; a.y += a.vy * dt;
          if (a.x < 0 || a.x > W) a.vx *= -1;
          if (a.y < 0 || a.y > H) a.vy *= -1;
        }
      }
      ctx.lineWidth = 0.6;
      for (i = 0; i < pts.length; i++) {
        a = pts[i];
        for (j = i + 1; j < pts.length; j++) {
          b = pts[j]; dx = a.x - b.x; dy = a.y - b.y;
          if (Math.abs(dx) > LINK || Math.abs(dy) > LINK) continue;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.strokeStyle = "rgba(180,235,255," + (0.22 * (1 - d / LINK)).toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(245,245,247,0.7)";
      for (i = 0; i < pts.length; i++) { a = pts[i]; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill(); }
    }
    function loop(t) {
      if (!running) return;
      var dt = last ? Math.min(3, (t - last) / 16.67) : 1;
      last = t;
      draw(dt);
      requestAnimationFrame(loop);
    }
    function update() {
      var should = visible && motionOn() && !doc.hidden;
      hero.classList.toggle("x-fx-paused", !should);
      if (should && !running) { running = true; last = 0; requestAnimationFrame(loop); }
      else if (!should) running = false;
    }
    size();
    if ("ResizeObserver" in win) new ResizeObserver(function () { size(); }).observe(hero);
    else win.addEventListener("resize", size);
    if ("IntersectionObserver" in win) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; update(); }).observe(hero);
    doc.addEventListener("visibilitychange", update);
    onMotion(update);
    update();
  }

  // ---------- Ticker of organisations ----------
  function ticker() {
    var hero = doc.querySelector(".main > .hero"), orgs = doc.querySelectorAll("#orgs [data-org]");
    if (!hero || !orgs.length) return;
    var items = [].map.call(orgs, function (b, i) {
      var name = (b.firstChild && b.firstChild.nodeType === 3 ? b.firstChild.nodeValue : b.textContent).trim();
      return { i: b.getAttribute("data-org"), name: name, c: "var(--chart-" + (i % 7 + 1) + ")" };
    });
    function set(hidden) {
      return '<ul class="x-ticker__set"' + (hidden ? ' aria-hidden="true"' : "") + ">" + items.map(function (o) {
        return '<li><button type="button" data-tick="' + o.i + '" style="--c:' + o.c + '"' + (hidden ? ' tabindex="-1"' : "") + ">" + o.name.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }) + "</button></li>";
      }).join("") + "</ul>";
    }
    var t = doc.createElement("div");
    t.className = "x-ticker"; t.setAttribute("role", "region"); t.setAttribute("aria-label", "Organisations in the directory");
    t.innerHTML = '<div class="x-ticker__track">' + set(false) + set(true) + "</div>";
    t.style.setProperty("--x-dur", Math.max(40, items.length * 2.6) + "s");
    hero.parentNode.insertBefore(t, hero.nextSibling);
    t.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tick]");
      if (!b) return;
      var src = doc.querySelector('#orgs [data-org="' + b.getAttribute("data-tick") + '"]');
      if (src) src.click();
    });
  }

  // ---------- Cursor glow ----------
  function cursorGlow() {
    if (!mqFine.matches) return;
    var g = doc.createElement("div");
    g.className = "x-cursor"; g.setAttribute("aria-hidden", "true");
    doc.body.appendChild(g);
    var x = 0, y = 0, tx = 0, ty = 0, on = false, running = false;
    function tick() {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      g.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) requestAnimationFrame(tick); else running = false;
    }
    doc.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || !motionOn()) return;
      tx = e.clientX; ty = e.clientY;
      if (!on) { on = true; x = tx; y = ty; g.classList.add("is-on"); }
      if (!running) { running = true; requestAnimationFrame(tick); }
    }, { passive: true });
    doc.documentElement.addEventListener("mouseleave", function () { on = false; g.classList.remove("is-on"); });
  }

  // ---------- Motion toggle in the nav ----------
  var ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M4 12c2.5-5 5.5-5 8 0s5.5 5 8 0"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M4 12h16"/></svg>';
  function motionBtn() {
    var nav = doc.querySelector("header.nav");
    if (!nav) return;
    var b = doc.createElement("button");
    b.type = "button"; b.className = "x-navbtn";
    function paint() {
      b.setAttribute("aria-pressed", full ? "true" : "false");
      b.setAttribute("aria-label", "Motion: " + (full ? "Full" : "Reduced") + ". Switch to " + (full ? "reduced" : "full") + " motion");
      b.title = "Motion: " + (full ? "Full" : "Reduced");
      b.innerHTML = (full ? ICON_ON : ICON_OFF) + '<span class="x-navbtn__txt">' + (full ? "Full" : "Reduced") + "</span>";
    }
    b.addEventListener("click", function () { setMotion(!full); paint(); });
    paint();
    var theme = doc.getElementById("theme-btn");
    if (theme && theme.parentNode === nav) nav.insertBefore(b, theme); else nav.appendChild(b);
  }

  function start() {
    motionBtn();
    tag(doc);
    watch("grid", function () {
      if (!flipRaf) flipRaf = requestAnimationFrame(function () { flipRaf = 0; flip(); });
    });
    watch("qx-grid", revealIn);
    watch("iv-grid", revealIn);
    watch("rd-body");
    watch("vgrid");
    heroFx();
    ticker();
    cursorGlow();
    countUp();
    revealIn(doc);
    [].forEach.call(doc.querySelectorAll(".main > .section"), function (s) {
      var h = s.querySelector(":scope > .head");
      if (h) reveal(h, false);
    });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start);
  else start();
})();
