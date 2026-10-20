/* reading21.js — rich link previews for key works + type filter and read-time sort for the Reading List. */
(function () {
  "use strict";
  var doc = document, win = window, root = doc.documentElement;
  var SEL = '#rd-body a[href^="http"], .x-works a[href^="http"]';
  var META = {}, WORKS = {}, BYNAME = {}, PHOTO = {}, DATA = [];
  var TYPES = { paper: "Paper", essay: "Essay", video: "Video", book: "Book", report: "Report", podcast: "Podcast", code: "Code", article: "Article" };
  var EYE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>';
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function key(u) { return String(u || "").trim().replace(/^https?:\/\/(www\.)?/i, "").replace(/#.*$/, "").replace(/\/+$/, "").toLowerCase(); }
  function host(u) { var m = /^https?:\/\/([^\/?#]+)/i.exec(u || ""); return m ? m[1].replace(/^www\./i, "") : ""; }
  function reduce() { return root.classList.contains("x-rm") || (win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function guess(u) {
    var h = host(u), s = String(u || "").toLowerCase();
    if (/arxiv\.org|openreview|aclanthology|nature\.com|science\.org|transformer-circuits|distill\.pub|neurips|proceedings|ssrn|pnas|acm\.org|ieee/.test(h) || /\.pdf($|[?#])/.test(s)) return "paper";
    if (/youtube\.com|youtu\.be|vimeo|ted\.com/.test(h)) return "video";
    if (/podcast|spotify|80000hours\.org\/podcast|lexfridman/.test(s)) return "podcast";
    if (/amazon\.|goodreads|penguin|harpercollins|books\.google|bookshop\.org/.test(h)) return "book";
    if (/substack|blog|lesswrong|alignmentforum|medium\.com|wordpress|astralcodexten|cold-takes|ghost\.io/.test(s)) return "essay";
    if (/github\.com/.test(h)) return "code";
    if (/\.gov|senate|congress|europa\.eu|un\.org|oecd/.test(h)) return "report";
    return "article";
  }
  function metaFor(u) { var m = META[key(u)]; return m && !/^(error|failed|missing)$/i.test(m.status || "") ? m : null; }
  function typeOf(u) { var m = metaFor(u); return String((m && m.type) || guess(u)).toLowerCase(); }
  function label(t) { return TYPES[t] || (t.charAt(0).toUpperCase() + t.slice(1)); }
  function fmtDate(d) {
    if (!d) return "";
    var m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(d);
    if (!m) return esc(d);
    if (!m[2]) return m[1];
    var mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+m[2] - 1];
    return (m[3] ? +m[3] + " " : "") + mo + " " + m[1];
  }

  function load() {
    var raw = win.READMETA || {};
    Object.keys(raw).forEach(function (u) { META[key(u)] = raw[u]; });
    try { DATA = (win.Hark && Hark.data) ? Hark.data("site-data") : JSON.parse(doc.getElementById("site-data").textContent); } catch (e) { DATA = []; }
    [].forEach.call(doc.querySelectorAll("#photo-bank img"), function (im) { PHOTO[im.getAttribute("data-p")] = im.getAttribute("src"); });
    arr(DATA).forEach(function (r) {
      BYNAME[String(r.name).toLowerCase()] = r;
      arr(r.key_works).forEach(function (w) {
        if (!w || !w.url) return;
        var k = key(w.url), x = WORKS[k] || (WORKS[k] = { title: w.title, year: w.year, url: w.url, people: [] });
        if (x.people.indexOf(r) < 0) x.people.push(r);
      });
    });
  }

  // ---------- Card ----------
  var card, scrim, cur = null, pinned = false, showT = 0, hideT = 0, busy = false;
  function people(u, m) {
    var w = WORKS[key(u)], list = w ? w.people.slice() : [];
    arr(m && m.authors).forEach(function (n) { var r = BYNAME[String(n).toLowerCase()]; if (r && list.indexOf(r) < 0) list.push(r); });
    return list;
  }
  function avatar(r) {
    var src = r.photo && PHOTO[r.photo];
    var ini = String(r.name).split(/\s+/).map(function (p) { return p.charAt(0); }).slice(0, 2).join("");
    return '<a class="x-pv__who" href="#' + esc(r.slug) + '">' + (src ? '<img src="' + esc(src) + '" alt="" />' : '<span aria-hidden="true">' + esc(ini) + "</span>") + "<b>" + esc(r.name) + "</b></a>";
  }
  function build(a) {
    var u = a.getAttribute("href"), m = metaFor(u), w = WORKS[key(u)] || {}, h = (m && m.site) || host(u), t = typeOf(u);
    var title = (w.title || a.textContent || "").trim(), ppl = people(u, m);
    var s = '<div class="x-pv__top"><span class="x-pv__type" data-t="' + esc(t) + '">' + esc(label(t)) + "</span>" +
      '<img class="x-pv__fav" src="https://www.google.com/s2/favicons?domain=' + encodeURIComponent(host(u)) + '&amp;sz=32" alt="" width="16" height="16" onerror="this.remove()" />' +
      '<span class="x-pv__site">' + esc(h) + '</span><button class="x-pv__x" type="button" aria-label="Close preview">×</button></div>' +
      '<p class="x-pv__title" id="x-pv-title">' + esc(title) + "</p>";
    if (m) {
      var meta = [fmtDate(m.date) || w.year, m.read_min ? m.read_min + " min read" : ""].filter(Boolean).join(" · ");
      if (arr(m.authors).length) s += '<p class="x-pv__by">' + esc(m.authors.join(", ")) + "</p>";
      if (meta) s += '<p class="x-pv__meta">' + esc(meta) + "</p>";
      if (m.tldr) s += '<p class="x-pv__tldr"><b>TL;DR</b> ' + esc(m.tldr) + "</p>";
      if (arr(m.key_points).length) s += '<p class="x-pv__h">What you\'ll find</p><ul class="x-pv__pts">' + m.key_points.map(function (p, i) { return '<li style="--i:' + i + '">' + esc(p) + "</li>"; }).join("") + "</ul>";
      if (arr(m.sections).length) s += '<p class="x-pv__h">Sections</p><ol class="x-pv__sec">' + m.sections.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ol>";
      if (m.why_it_matters) s += '<p class="x-pv__why"><b>Why it matters</b> ' + esc(m.why_it_matters) + "</p>";
    } else {
      s += '<p class="x-pv__meta">' + esc([w.year, h].filter(Boolean).join(" · ")) + '</p><p class="x-pv__none">No summary yet for this work.</p>';
    }
    if (ppl.length) s += '<p class="x-pv__h">On this site</p><div class="x-pv__ppl">' + ppl.map(avatar).join("") + "</div>";
    s += '<div class="links"><a class="btn x-pv__open" href="' + esc(u) + '" target="_blank" rel="noopener">Open ' + esc(label(t).toLowerCase()) + " ↗</a></div>";
    return s;
  }
  function sheet() { return win.matchMedia && win.matchMedia("(max-width: 640px)").matches; }
  function place(a) {
    if (sheet()) { card.classList.add("x-pv--sheet"); card.style.cssText = ""; scrim.hidden = false; return; }
    card.classList.remove("x-pv--sheet"); scrim.hidden = true;
    var r = a.getBoundingClientRect(), vw = root.clientWidth, vh = win.innerHeight, pad = 12;
    card.style.maxHeight = (vh - pad * 2) + "px"; card.style.left = "0px"; card.style.top = "0px";
    var cw = card.offsetWidth, ch = card.offsetHeight;
    var below = vh - r.bottom - pad, above = r.top - pad, top, origin = "top";
    if (ch + 8 <= below) top = r.bottom + 8;
    else if (ch + 8 <= above) { top = r.top - ch - 8; origin = "bottom"; }
    else top = Math.max(pad, vh - ch - pad);
    var left = Math.min(Math.max(pad, r.left), vw - cw - pad);
    card.style.left = Math.max(pad, left) + "px"; card.style.top = top + "px";
    card.style.transformOrigin = (r.left + 20 - left) + "px " + origin;
  }
  function open(a, pin) {
    clearTimeout(showT); clearTimeout(hideT);
    if (cur === a && card.classList.contains("is-on")) { if (pin) { pinned = true; focusCard(); } return; }
    cur = a; pinned = !!pin;
    card.innerHTML = build(a);
    card.setAttribute("aria-labelledby", "x-pv-title");
    card.classList.toggle("x-pv--still", reduce());
    card.hidden = false; card.classList.remove("is-on");
    place(a);
    void card.offsetWidth; card.classList.add("is-on");
    var eye = eyeOf(a); if (eye) eye.setAttribute("aria-expanded", "true");
    if (pin || sheet()) focusCard();
  }
  function focusCard() { var f = card.querySelector(".x-pv__x"); if (f) f.focus({ preventScroll: true }); }
  function close(restore) {
    clearTimeout(showT); clearTimeout(hideT);
    if (!cur) return;
    var a = cur, eye = eyeOf(a), wasPinned = pinned;
    cur = null; pinned = false; scrim.hidden = true;
    if (eye) eye.setAttribute("aria-expanded", "false");
    card.classList.remove("is-on");
    setTimeout(function () { if (!cur) card.hidden = true; }, reduce() ? 0 : 180);
    if (restore) { busy = true; ((wasPinned && eye) || a).focus({ preventScroll: true }); busy = false; }
  }
  function eyeOf(a) { var n = a && a.nextElementSibling; return n && n.classList.contains("x-pv-eye") ? n : null; }
  function inside(n) { return n && (card.contains(n) || (cur && (n === cur || n === eyeOf(cur)))); }

  function bindCard() {
    card = doc.createElement("div"); card.className = "x-pv"; card.id = "x-pv"; card.hidden = true;
    card.setAttribute("role", "dialog");
    scrim = doc.createElement("div"); scrim.className = "x-pv-scrim"; scrim.hidden = true;
    doc.body.appendChild(scrim); doc.body.appendChild(card);
    scrim.addEventListener("click", function () { close(true); });
    card.addEventListener("click", function (e) { if (e.target.closest(".x-pv__x")) close(true); else if (e.target.closest('a[href^="#"]')) close(false); });
    doc.addEventListener("pointerover", function (e) {
      if (e.pointerType === "touch") return;
      if (inside(e.target)) { clearTimeout(hideT); if (card.contains(e.target)) return; }
      var a = e.target.closest && e.target.closest(SEL);
      if (a && a !== cur) { clearTimeout(showT); showT = setTimeout(function () { open(a, false); }, 350); }
    });
    doc.addEventListener("pointerout", function (e) {
      if (e.pointerType === "touch") return;
      var a = e.target.closest && e.target.closest(SEL);
      if (a && !cur) clearTimeout(showT);
      if (!cur || pinned || !inside(e.target) || inside(e.relatedTarget)) return;
      clearTimeout(showT); hideT = setTimeout(function () { close(false); }, 200);
    });
    doc.addEventListener("focusin", function (e) {
      if (busy) return;
      var a = e.target.closest && e.target.closest(SEL);
      if (a && a.matches(":focus-visible")) { open(a, false); return; }
      if (cur && !inside(e.target)) close(false);
    });
    doc.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".x-pv-eye");
      if (b) { e.preventDefault(); var a = b.previousElementSibling; if (cur === a && pinned) close(true); else open(a, true); }
      else if (cur && !inside(e.target)) close(false);
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && cur) { e.preventDefault(); close(true); }
    });
    win.addEventListener("scroll", function () { if (cur && !sheet() && !pinned) close(false); else if (cur && !sheet()) place(cur); }, { passive: true });
    win.addEventListener("resize", function () { if (cur) place(cur); });
  }

  // ---------- Eye buttons ----------
  function decorate() {
    [].forEach.call(doc.querySelectorAll(SEL), function (a) {
      if (eyeOf(a)) return;
      a.insertAdjacentHTML("afterend", '<button class="x-pv-eye" type="button" aria-haspopup="dialog" aria-controls="x-pv" aria-expanded="false" aria-label="Preview: ' + esc(a.textContent.trim()) + '">' + EYE + "</button>");
    });
  }

  // ---------- Reading List: type chips + read-time sort ----------
  var body, more, sortSel, status, ftype = "", rdObs;
  function readMin(u) { var m = metaFor(u); return m && +m.read_min ? +m.read_min : Infinity; }
  function rdRefresh() {
    if (!body || busy) return;
    busy = true;
    var sortRead = sortSel.value === "read";
    if ((ftype || sortRead) && !more.hidden) {
      var prev = doc.activeElement, n = 0;
      while (!more.hidden && n++ < 60) more.click();
      if (prev && prev.focus) prev.focus({ preventScroll: true });
    }
    var rows = [].slice.call(body.querySelectorAll("tr")).filter(function (tr) { return tr.querySelector("th"); }), vis = 0;
    rows.forEach(function (tr, i) {
      var a = tr.querySelector('th a[href^="http"]'), u = a ? a.getAttribute("href") : "";
      tr._t = u ? typeOf(u) : "article"; tr._r = u ? readMin(u) : Infinity; tr._i = i;
      tr.hidden = !!ftype && tr._t !== ftype;
      if (!tr.hidden) vis++;
    });
    if (sortRead) rows.slice().sort(function (x, y) { return (x._r - y._r) || (x._i - y._i); }).forEach(function (tr) { body.appendChild(tr); });
    if (ftype && status) status.textContent = vis ? vis + " " + label(ftype).toLowerCase() + (vis === 1 ? "" : "s") + " shown" + (sortRead ? ", shortest read first" : "") : "No " + label(ftype).toLowerCase() + "s match. Try another type or category.";
    else if (sortRead && status) status.textContent += " · shortest read first";
    rdObs.takeRecords();
    busy = false;
  }
  function setupReading() {
    body = doc.getElementById("rd-body"); more = doc.getElementById("rd-more"); sortSel = doc.getElementById("rd-sort"); status = doc.getElementById("rd-status");
    if (!body || !more || !sortSel) return;
    var o = doc.createElement("option"); o.value = "read"; o.textContent = "Sort: Read time (shortest)"; sortSel.appendChild(o);
    var counts = {}, seen = {};
    arr(DATA).forEach(function (r) { arr(r.key_works).forEach(function (w) {
      if (!w || !w.title) return;
      var k = w.url ? key(w.url) : String(w.title).toLowerCase();
      if (seen[k]) return; seen[k] = 1;
      var t = w.url ? typeOf(w.url) : "article"; counts[t] = (counts[t] || 0) + 1;
    }); });
    var types = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x]; });
    var box = doc.createElement("div");
    box.className = "x-filters x-pv-types"; box.setAttribute("role", "group"); box.setAttribute("aria-label", "Filter works by type");
    box.innerHTML = '<button class="x-filter" type="button" data-rtype="" aria-pressed="true">All types</button>' + types.map(function (t) {
      return '<button class="x-filter" type="button" data-rtype="' + esc(t) + '" aria-pressed="false">' + esc(label(t)) + " <span>" + counts[t] + "</span></button>";
    }).join("");
    var cats = doc.getElementById("rd-cats");
    (cats || sortSel.parentNode).insertAdjacentElement("afterend", box);
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-rtype]"); if (!b) return;
      [].forEach.call(box.children, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      ftype = b.getAttribute("data-rtype");
      rdRefresh();
    });
    rdObs = new MutationObserver(function () { rdRefresh(); });
    rdObs.observe(body, { childList: true });
    rdRefresh();
  }

  function start() {
    load(); bindCard();
    try { setupReading(); } catch (e) { if (win.console) console.warn("reading21:", e); }
    decorate();
    var q = 0;
    new MutationObserver(function () { if (!q) q = requestAnimationFrame(function () { q = 0; decorate(); }); }).observe(doc.body, { childList: true, subtree: true });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start); else start();
})();
