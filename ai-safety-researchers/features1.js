/* Step 1 additions: Light / Dark / System theme, nav tools, progress bar, back-to-top, command palette, person of the day. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var DATA = Array.isArray(window.DATA) ? window.DATA : [];
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var KEY = "hark-theme";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } return null; }
  function svg(path) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + "</svg>"; }
  var ICON = {
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
    monitor: svg('<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>'),
    shuffle: svg('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    up: svg('<path d="M12 19V5M5 12l7-7 7 7"/>'),
    hash: svg('<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>')
  };
  var PHOTO = {};
  [].forEach.call(doc.querySelectorAll("#photo-bank img"), function (im) { PHOTO[im.getAttribute("data-p")] = im.getAttribute("src"); });
  function initials(name) {
    var p = String(name).replace(/\(.*?\)/g, "").trim().split(/\s+/);
    return ((p[0] || "")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }
  function avatar(r, size, cls, alt) {
    var src = r.photo && PHOTO[r.photo];
    var st = size ? ' style="--av:' + size + 'px"' : "";
    if (src) return '<img class="x-av ' + (cls || "") + '"' + st + ' src="' + esc(src) + '" alt="' + esc(alt || "") + '" />';
    return '<span class="x-av x-av--init ' + (cls || "") + '"' + st + ' aria-hidden="true">' + esc(initials(r.name)) + "</span>";
  }
  function openPerson(r) { if (r) location.hash = r.slug; }
  function randomPerson() { if (DATA.length) openPerson(DATA[Math.floor(Math.random() * DATA.length)]); }

  // ---------- Theme: system / light / dark ----------
  var MODES = ["system", "light", "dark"];
  var LABEL = { system: "System", light: "Light", dark: "Dark" };
  var mode = (function () { var s = store(KEY); return s === "light" || s === "dark" ? s : "system"; })();
  var themeBtn = null;
  function effective() { return mode === "system" ? (mq.matches ? "dark" : "light") : mode; }
  function applyTheme(m, save) {
    mode = MODES.indexOf(m) > -1 ? m : "system";
    if (mode === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", mode);
    if (save) store(KEY, mode);
    if (themeBtn) {
      var next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      themeBtn.innerHTML = ICON[mode === "system" ? "monitor" : mode === "light" ? "sun" : "moon"];
      themeBtn.setAttribute("aria-label", "Theme: " + LABEL[mode] + (mode === "system" ? " (" + effective() + ")" : "") + ". Switch to " + LABEL[next]);
      themeBtn.title = "Theme: " + LABEL[mode];
    }
  }
  function cycleTheme() { applyTheme(MODES[(MODES.indexOf(mode) + 1) % MODES.length], true); }
  mq.addEventListener("change", function () { if (mode === "system") applyTheme("system", false); });

  // ---------- Person of the day ----------
  function dayIndex(n) {
    var d = new Date(), key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    var h = 2166136261;
    String(key).split("").forEach(function (c) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; });
    return h % n;
  }
  function buildSpotlight() {
    var box = doc.getElementById("potd");
    if (!box || !DATA.length) return;
    var sorted = DATA.slice().sort(function (a, b) { return a.slug < b.slug ? -1 : 1; });
    var r = sorted[dayIndex(sorted.length)];
    var qs = (r.quotes || []).filter(function (q) { return q && q.text; });
    var q = qs.filter(function (q) { return !q.unverified && q.text.length < 280; })[0] || qs[0];
    var date = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    box.innerHTML = avatar(r, 0, "x-potd__img", "Portrait of " + r.name) +
      '<div class="x-potd__body"><p class="x-potd__date">' + esc(date) + "</p>" +
      "<h3>" + esc(r.name) + "</h3>" +
      '<p class="x-potd__role">' + esc(r.current_role) + "</p>" +
      (q ? '<blockquote class="x-potd__quote">“' + esc(String(q.text).trim()) + "”</blockquote>" : "") +
      '<div class="links"><a class="btn" href="#' + esc(r.slug) + '">Open profile</a>' +
      '<button class="btn" type="button" data-x-random>' + ICON.shuffle.replace("<svg", '<svg width="14" height="14"') + " Random researcher</button></div></div>";
  }

  // ---------- Command palette ----------
  var cmd, input, list, items = [], sel = 0, lastFocus = null;
  function sections() {
    var s = [{ id: "top", label: "Top" }];
    [].forEach.call(doc.querySelectorAll("section[data-nav]"), function (el) { s.push({ id: el.id, label: el.getAttribute("data-nav"), sub: (el.querySelector("h2") || {}).textContent || "" }); });
    return s;
  }
  function goSection(id) {
    var el = doc.getElementById(id);
    function go() { if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
    if (location.hash.slice(1) !== id) {
      // Runs after the page's own hashchange handler has closed any open profile.
      window.addEventListener("hashchange", function () { setTimeout(go, 0); }, { once: true });
      location.hash = id;
    } else go();
  }
  function actions() {
    return [
      { kind: "Action", icon: ICON.shuffle, name: "Random researcher", sub: "Open a random profile", run: randomPerson },
      { kind: "Action", icon: ICON[effective() === "dark" ? "sun" : "moon"], name: "Toggle theme", sub: "Now " + LABEL[mode] + ", switch to " + LABEL[MODES[(MODES.indexOf(mode) + 1) % 3]], run: cycleTheme },
      { kind: "Theme", icon: ICON.sun, name: "Light theme", run: function () { applyTheme("light", true); } },
      { kind: "Theme", icon: ICON.moon, name: "Dark theme", run: function () { applyTheme("dark", true); } },
      { kind: "Theme", icon: ICON.monitor, name: "System theme", sub: "Follow the device setting", run: function () { applyTheme("system", true); } },
      { kind: "Action", icon: ICON.search, name: "Search the directory", sub: "Shortcut: /", run: focusSearch }
    ].concat(typeof window.XCMP_ACTIONS === "function" ? window.XCMP_ACTIONS() : []);
  }
  // Fuzzy score: substring beats scattered letters; word starts score higher. -1 means no match.
  function score(q, text) {
    text = norm(text);
    if (!q) return 0;
    var i = text.indexOf(q);
    if (i > -1) return 200 - i + (i === 0 || text[i - 1] === " " ? 60 : 0);
    var t = 0, s = 0, run = 0;
    for (var k = 0; k < q.length; k++) {
      var f = text.indexOf(q[k], t);
      if (f < 0) return -1;
      run = f === t ? run + 1 : 0;
      s += 2 + run * 3 + (f === 0 || text[f - 1] === " " ? 6 : 0) - Math.min(f - t, 6);
      t = f + 1;
    }
    return s;
  }
  function clip(s, n) { s = String(s || "").trim(); return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s; }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function build(qRaw) {
    var q = norm(qRaw).trim();
    var acts = actions(), secs = sections().map(function (s) { return { kind: "Section", icon: ICON.hash, name: s.label, sub: s.sub, run: function () { goSection(s.id); } }; });
    var ppl = DATA.map(function (r) { return { kind: "Person", r: r, name: r.name, sub: r.current_role, run: function () { openPerson(r); } }; });
    function rank(arr, cap, extra) {
      if (!q) return arr.slice(0, cap);
      return arr.map(function (it) {
        var sc = Math.max(score(q, it.name) * 2, score(q, it.sub || ""), extra ? Math.min(score(q, extra(it)), 60) : -1);
        return { it: it, sc: sc };
      }).filter(function (x) { return x.sc > 0; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, cap).map(function (x) { return x.it; });
    }
    var groups = [
      ["People", rank(ppl, q ? 12 : DATA.length, function (it) { return it.r._hay || ""; })],
      ["Sections", rank(secs, 10)],
      ["Actions", rank(acts, 10)]
    ];
    if (!q) groups = [groups[2], groups[1], groups[0]];
    items = [];
    var html = "";
    groups.forEach(function (g) {
      if (!g[1].length) return;
      html += '<li class="x-cmd__group" role="presentation">' + g[0] + "</li>";
      g[1].forEach(function (it) {
        var i = items.length; items.push(it);
        var ico = it.r ? avatar(it.r, 32, "", "") : '<span class="x-cmd__ico">' + it.icon + "</span>";
        html += '<li class="x-cmd__opt" role="option" id="x-cmd-' + i + '" data-i="' + i + '" aria-selected="false">' + ico +
          '<span class="x-cmd__txt"><span class="x-cmd__name">' + esc(it.name) + "</span>" + (it.sub ? '<span class="x-cmd__sub">' + esc(clip(it.sub, 80)) + "</span>" : "") + "</span>" +
          '<span class="x-cmd__kind">' + it.kind + "</span></li>";
      });
    });
    list.innerHTML = html || '<li class="x-cmd__empty" role="presentation">Nothing matches “' + esc(qRaw) + "”.</li>";
    select(0);
  }
  function select(i) {
    if (!items.length) { input.removeAttribute("aria-activedescendant"); return; }
    sel = (i + items.length) % items.length;
    [].forEach.call(list.querySelectorAll(".x-cmd__opt"), function (el) { el.setAttribute("aria-selected", +el.getAttribute("data-i") === sel ? "true" : "false"); });
    var cur = doc.getElementById("x-cmd-" + sel);
    input.setAttribute("aria-activedescendant", "x-cmd-" + sel);
    if (cur) cur.scrollIntoView({ block: "nearest" });
  }
  function makePalette() {
    cmd = doc.createElement("div");
    cmd.className = "x-cmd"; cmd.hidden = true;
    cmd.innerHTML = '<div class="x-cmd__panel" role="dialog" aria-modal="true" aria-label="Command palette">' +
      '<div class="x-cmd__top">' + ICON.search + '<input class="x-cmd__input" type="text" placeholder="Search people, sections and actions…" role="combobox" aria-expanded="true" aria-controls="x-cmd-list" aria-autocomplete="list" autocomplete="off" spellcheck="false" /></div>' +
      '<ul class="x-cmd__list" id="x-cmd-list" role="listbox" aria-label="Results"></ul>' +
      '<div class="x-cmd__foot"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div></div>';
    doc.body.appendChild(cmd);
    input = cmd.querySelector("input"); list = cmd.querySelector("ul");
    input.addEventListener("input", function () { build(input.value); });
    list.addEventListener("mousemove", function (e) { var o = e.target.closest(".x-cmd__opt"); if (o && +o.dataset.i !== sel) select(+o.dataset.i); });
    list.addEventListener("click", function (e) { var o = e.target.closest(".x-cmd__opt"); if (o) runItem(+o.dataset.i); });
    cmd.addEventListener("mousedown", function (e) { if (e.target === cmd) { e.preventDefault(); closePalette(true); } });
  }
  function openPalette() {
    if (!cmd) makePalette();
    if (!cmd.hidden) { input.select(); return; }
    lastFocus = doc.activeElement;
    cmd.hidden = false;
    input.value = "";
    build("");
    input.focus();
  }
  function closePalette(restore) {
    if (!cmd || cmd.hidden) return;
    cmd.hidden = true;
    if (restore && lastFocus && lastFocus.focus && doc.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
  }
  function runItem(i) {
    var it = items[i];
    if (!it) return;
    closePalette(it.kind === "Theme" || it.name === "Toggle theme");
    it.run();
  }
  function focusSearch() {
    var q = doc.getElementById("q");
    if (!q) return;
    var ov = doc.getElementById("overlay");
    if (ov && !ov.hidden) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignore */ } window.dispatchEvent(new HashChangeEvent("hashchange")); }
    doc.getElementById("directory").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    q.focus({ preventScroll: true });
    q.select();
  }

  window.addEventListener("keydown", function (e) {
    var k = e.key;
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (k === "k" || k === "K")) {
      e.preventDefault(); e.stopPropagation();
      if (cmd && !cmd.hidden) closePalette(true); else openPalette();
      return;
    }
    if (cmd && !cmd.hidden) {
      e.stopPropagation(); // keep the profile drawer's keys out while the palette is open
      if (k === "Escape") { e.preventDefault(); closePalette(true); }
      else if (k === "ArrowDown") { e.preventDefault(); select(sel + 1); }
      else if (k === "ArrowUp") { e.preventDefault(); select(sel - 1); }
      else if (k === "Home" && e.ctrlKey) { e.preventDefault(); select(0); }
      else if (k === "Enter") { e.preventDefault(); runItem(sel); }
      else if (k === "Tab") { e.preventDefault(); input.focus(); }
      return;
    }
    if (k === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var t = e.target, tag = t && t.tagName;
      if (/INPUT|TEXTAREA|SELECT/.test(tag) || (t && t.isContentEditable)) return;
      e.preventDefault();
      focusSearch();
    }
  }, true);

  // ---------- Nav tools, progress bar, back to top ----------
  function setupNav() {
    var nav = doc.querySelector("header.nav");
    var old = doc.getElementById("theme-btn");
    if (nav) {
      var pal = doc.createElement("button");
      pal.type = "button"; pal.className = "x-navbtn"; pal.setAttribute("aria-label", "Open command palette (Ctrl or Cmd + K)"); pal.title = "Search everything (Ctrl/⌘ K)";
      pal.innerHTML = ICON.search + '<kbd class="x-navbtn__txt">' + (/Mac|iPhone|iPad/.test(navigator.platform || "") ? "⌘K" : "Ctrl K") + "</kbd>";
      pal.addEventListener("click", openPalette);
      var rnd = doc.createElement("button");
      rnd.type = "button"; rnd.className = "x-navbtn"; rnd.setAttribute("aria-label", "Open a random researcher"); rnd.title = "Random researcher";
      rnd.innerHTML = ICON.shuffle + '<span class="x-navbtn__txt">Random</span>';
      rnd.addEventListener("click", randomPerson);
      themeBtn = doc.createElement("button");
      themeBtn.type = "button"; themeBtn.className = "x-navbtn x-navbtn--icon"; themeBtn.id = "theme-btn";
      themeBtn.addEventListener("click", cycleTheme);
      if (old) old.replaceWith(themeBtn); else nav.appendChild(themeBtn);
      nav.insertBefore(rnd, themeBtn);
      nav.insertBefore(pal, rnd);
    }
    applyTheme(mode, false);

    var bar = doc.createElement("div");
    bar.className = "x-progress"; bar.setAttribute("aria-hidden", "true");
    doc.body.appendChild(bar);
    var top = doc.createElement("button");
    top.type = "button"; top.className = "x-totop glass"; top.setAttribute("aria-label", "Back to top"); top.innerHTML = ICON.up;
    top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      var first = doc.querySelector(".nav button, .nav a");
      if (first) first.focus({ preventScroll: true });
    });
    doc.body.appendChild(top);
    var ticking = false;
    function onScroll() {
      ticking = false;
      var max = root.scrollHeight - window.innerHeight, y = window.scrollY || root.scrollTop;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
      var on = y > 600;
      if (top.classList.contains("is-on") !== on) { top.classList.toggle("is-on", on); top.tabIndex = on ? 0 : -1; }
    }
    top.tabIndex = -1;
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
  }

  function start() {
    setupNav();
    buildSpotlight();
    doc.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-x-random]");
      if (b) { e.preventDefault(); randomPerson(); }
    });
  }
  // hark.js builds the nav on DOMContentLoaded; this file loads after it, so its listener runs second.
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start);
  else start();
})();
