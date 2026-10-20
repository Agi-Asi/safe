/* Round F2: player side panel (Overview · Chapters · Up Next), chapter ticks on the seek bar,
   upload meta on Theater cards, upload sorts, a Year filter, hover summaries and a Theater stats strip. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, win = window;
  var META = win.VMETA || {};
  var VIDEOS = Array.isArray(win.THEATER) ? win.THEATER : [];
  var BY_ID = {};
  VIDEOS.forEach(function (v) { BY_ID[v.id] = v; });
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function clock(s) {
    s = Math.max(0, Math.floor(s || 0));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h ? h + ":" + pad(m) + ":" + pad(x) : pad(m) + ":" + pad(x);
  }
  function date(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? +m[3] + " " + MON[+m[2] - 1] + " " + m[1] : "—";
  }
  function compact(n) {
    if (n == null || isNaN(n)) return "—";
    n = +n;
    var units = [[1e9, "B"], [1e6, "M"], [1e3, "K"]];
    for (var i = 0; i < units.length; i++) {
      if (n >= units[i][0]) {
        var v = n / units[i][0];
        v = v < 100 ? Math.floor(v * 10) / 10 : Math.floor(v);
        return String(v).replace(/\.0$/, "") + units[i][1];
      }
    }
    return String(n);
  }
  function meta(id) { return META[id] || null; }
  function lengthOf(id) { var m = meta(id), v = BY_ID[id]; return (m && m.length_sec) || (v && v.d) || 0; }
  function metaLine(id) {
    var m = meta(id);
    if (!m) return "—";
    return date(m.published) + " · " + compact(m.views) + " views · 👍 " + compact(m.likes);
  }
  function motionOk() { return !root.classList.contains("x-rm") && !(win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  var asOf = "";
  for (var k in META) { if (META[k] && META[k].stats_as_of) { asOf = META[k].stats_as_of; break; } }
  var AS_OF = "Views & likes as of " + (asOf ? date(asOf) : "20 Oct 2026");

  // =====================================================================
  // 1. Player side panel
  // =====================================================================
  (function () {
    var modal = doc.querySelector(".x-tvm");
    if (!modal) return;
    var next = modal.querySelector(".x-tvm__next"), info = modal.querySelector(".x-tvm__info");
    var list = modal.querySelector(".x-tvm__list");
    if (!next || !info || !list) return;

    var TABS = [["ov", "Overview"], ["ch", "Chapters"], ["up", "Up Next"]];
    next.classList.add("x-sp");
    var h4 = next.querySelector("h4");
    if (h4) h4.hidden = true;
    var tabs = doc.createElement("div");
    tabs.className = "x-tabs x-sp__tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Video details");
    tabs.innerHTML = TABS.map(function (t, i) {
      return '<button class="x-tab" type="button" role="tab" id="x-sp-tab-' + t[0] + '" data-sp="' + t[0] + '" aria-controls="x-sp-' + t[0] + '" aria-selected="' + (i === 0) + '">' + t[1] + "</button>";
    }).join("");
    var panels = {};
    next.insertBefore(tabs, next.firstChild);
    TABS.forEach(function (t, i) {
      var p = doc.createElement("div");
      p.className = "x-sp__panel";
      p.id = "x-sp-" + t[0];
      p.setAttribute("role", "tabpanel");
      p.setAttribute("aria-labelledby", "x-sp-tab-" + t[0]);
      p.hidden = i !== 0;
      next.appendChild(p);
      panels[t[0]] = p;
    });
    panels.up.appendChild(list);
    var cur = "ov";

    function select(key) {
      cur = key;
      [].forEach.call(tabs.children, function (b) { b.setAttribute("aria-selected", b.getAttribute("data-sp") === key ? "true" : "false"); });
      for (var p in panels) panels[p].hidden = p !== key;
      if (key === "ov") replayReveal();
      if (key === "ch") { activeIdx = -2; highlight(lastT, true); }
    }
    tabs.addEventListener("click", function (e) {
      var b = e.target.closest("[data-sp]");
      if (b) select(b.getAttribute("data-sp"));
    });

    // ---------- Overview ----------
    function chip(icon, label, value) {
      return '<li class="x-sp__stat" title="' + esc(label) + '"><span aria-hidden="true">' + icon + '</span><span class="x-sp__sr">' + esc(label) + ": </span>" + esc(value) + "</li>";
    }
    function overview(v) {
      var m = meta(v.id);
      var title = '<p class="x-sp__title">' + esc(v.t) + "</p>";
      if (!m) return title + '<p class="x-sp__ch">' + esc(v.ch || "—") + '</p><p class="x-sp__none">—</p>';
      var badge = m.official
        ? '<span class="x-sp__badge"><span aria-hidden="true">✔</span> Official channel</span>'
        : '<span class="x-sp__badge x-sp__badge--re">Re-upload</span>';
      var len = m.length_sec || v.d || 0;
      var kp = (m.key_points || []).map(function (p, i) {
        return '<li style="--i:' + i + '"><span class="x-kp__n" aria-hidden="true">' + (i + 1) + "</span><p>" + esc(p) + "</p></li>";
      }).join("");
      return title +
        '<p class="x-sp__ch">' + esc(m.channel || v.ch || "—") + " " + badge + "</p>" +
        '<ul class="x-sp__stats">' +
        chip("📅", "Uploaded", date(m.published)) +
        chip("👁", "Views", compact(m.views)) +
        chip("👍", "Likes", compact(m.likes)) +
        chip("⏱", "Length", len ? clock(len) : "—") + "</ul>" +
        '<p class="fineprint">' + esc(m.stats_as_of ? "Views & likes as of " + date(m.stats_as_of) : AS_OF) + "</p>" +
        (m.summary ? '<p class="x-sp__sum">' + esc(m.summary) + "</p>" : "") +
        (kp ? '<h4 class="x-sp__h">Key points</h4><ol class="x-kp">' + kp + "</ol>" : "");
    }
    function replayReveal() {
      var ol = panels.ov.querySelector(".x-kp");
      if (!ol) return;
      ol.classList.remove("is-in");
      if (!motionOk()) { ol.classList.add("is-in", "is-still"); return; }
      ol.classList.remove("is-still");
      void ol.offsetWidth;
      ol.classList.add("is-in");
    }

    // ---------- Chapters ----------
    var chapters = [], activeIdx = -1, lastT = 0, vid = "";
    function chaptersHTML(v) {
      var m = meta(v.id);
      if (!m || !(m.chapters || []).length) return '<p class="x-sp__none">—</p><p class="fineprint">No chapters for this video.</p>';
      var src = m.chapters_source === "description" ? "Chapters from the video description"
        : m.chapters_source === "transcript_estimated" ? "Chapters generated from the transcript (approximate)"
        : m.chapters_source === "transcript" ? "Chapters generated from the transcript" : "Chapters";
      return '<p class="fineprint x-sp__src">' + src + "</p>" +
        '<ol class="x-chap">' + chapters.map(function (c, i) {
          return '<li><button class="x-chap__btn" type="button" data-chap="' + i + '" aria-label="Jump to ' + esc(clock(c.t)) + ", " + esc(c.label) + '">' +
            '<span class="x-chap__t">' + clock(c.t) + '</span><span class="x-chap__l">' + esc(c.label) + "</span></button></li>";
        }).join("") + "</ol>";
    }
    panels.ch.addEventListener("click", function (e) {
      var b = e.target.closest("[data-chap]");
      if (!b) return;
      var c = chapters[+b.getAttribute("data-chap")];
      if (!c) return;
      if (win.HarkPlayer && typeof win.HarkPlayer.seek === "function") win.HarkPlayer.seek(c.t);
      lastT = c.t;
      highlight(c.t, true);
    });
    function indexAt(t) {
      var idx = -1;
      for (var i = 0; i < chapters.length; i++) if (chapters[i].t <= t + 0.5) idx = i;
      return idx;
    }
    function highlight(t, force) {
      var idx = indexAt(t);
      if (idx === activeIdx && !force) return;
      activeIdx = idx;
      var btns = panels.ch.querySelectorAll("[data-chap]");
      [].forEach.call(btns, function (b, i) {
        if (i === idx) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      });
      var on = btns[idx];
      if (!on || panels.ch.hidden) return;
      var box = panels.ch.querySelector(".x-chap");
      [box, panels.ch].forEach(function (sc) {
        if (!sc || sc.scrollHeight <= sc.clientHeight + 2) return;
        var r = on.getBoundingClientRect(), s = sc.getBoundingClientRect();
        if (r.top < s.top || r.bottom > s.bottom) {
          var to = sc.scrollTop + (r.top - s.top) - (sc.clientHeight - r.height) / 2;
          if (sc.scrollTo) sc.scrollTo({ top: to, behavior: motionOk() ? "smooth" : "auto" }); else sc.scrollTop = to;
        }
      });
    }

    // ---------- Chapter ticks on the seek bar ----------
    var seekEl = modal.querySelector(".x-pc__seek"), tickBox = null, tickDur = 0;
    if (seekEl) {
      var wrap = doc.createElement("div");
      wrap.className = "x-pc__seekwrap";
      seekEl.parentNode.insertBefore(wrap, seekEl);
      wrap.appendChild(seekEl);
      tickBox = doc.createElement("div");
      tickBox.className = "x-pc__ticks";
      tickBox.setAttribute("aria-hidden", "true");
      wrap.appendChild(tickBox);
    }
    function drawTicks(d) {
      if (!tickBox) return;
      d = d || lengthOf(vid);
      tickDur = d;
      if (!d || chapters.length < 2) { tickBox.innerHTML = ""; return; }
      tickBox.innerHTML = chapters.filter(function (c) { return c.t > 0 && c.t < d; }).map(function (c) {
        return '<span style="--x:' + (c.t / d).toFixed(5) + '"></span>';
      }).join("");
    }

    // ---------- Render for the current video ----------
    function render() {
      var v = typeof win.theaterCurrent === "function" ? win.theaterCurrent() : null;
      if (!v || v.id === vid) return;
      vid = v.id;
      var m = meta(v.id);
      chapters = (m && m.chapters ? m.chapters.slice() : []).sort(function (a, b) { return a.t - b.t; });
      activeIdx = -1; lastT = 0;
      panels.ov.innerHTML = overview(v);
      panels.ch.innerHTML = chaptersHTML(v);
      var chTab = tabs.querySelector('[data-sp="ch"]');
      chTab.textContent = chapters.length ? "Chapters (" + chapters.length + ")" : "Chapters";
      panels.ov.scrollTop = 0; panels.ch.scrollTop = 0; panels.up.scrollTop = 0;
      if (cur === "ov") replayReveal();
      highlight(0, true);
      drawTicks(0);
    }
    new MutationObserver(function () { vid = ""; render(); }).observe(info, { childList: true });
    render();

    if (win.HarkPlayer && typeof win.HarkPlayer.onTick === "function") {
      win.HarkPlayer.onTick(function (t, d, id) {
        if (id && id !== vid) return;
        lastT = t || 0;
        if (d && Math.abs(d - tickDur) > 1) drawTicks(d);
        if (chapters.length) highlight(lastT, false);
      });
    }
  })();

  // =====================================================================
  // 2a. Sorts and Year filter
  // =====================================================================
  var EXT = win.TV_EXT;
  function pub(v) { var m = meta(v.id); return (m && m.published) || ""; }
  function num(v, key) { var m = meta(v.id); return m && m[key] != null ? +m[key] : -1; }
  if (EXT && EXT.sorts) {
    EXT.sorts["up-new"] = function (a, b) { var x = pub(a), y = pub(b); return x === y ? a._i - b._i : (!x ? 1 : !y ? -1 : (x < y ? 1 : -1)); };
    EXT.sorts["up-old"] = function (a, b) { var x = pub(a), y = pub(b); return x === y ? a._i - b._i : (!x ? 1 : !y ? -1 : (x < y ? -1 : 1)); };
    EXT.sorts.views = function (a, b) { return num(b, "views") - num(a, "views") || a._i - b._i; };
    EXT.sorts.likes = function (a, b) { return num(b, "likes") - num(a, "likes") || a._i - b._i; };
  }
  var yearSel = doc.getElementById("tv-year");
  if (yearSel && EXT && EXT.filters) {
    var years = {};
    VIDEOS.forEach(function (v) { var y = pub(v).slice(0, 4); if (y) years[y] = (years[y] || 0) + 1; });
    yearSel.insertAdjacentHTML("beforeend", Object.keys(years).sort().reverse().map(function (y) {
      return '<option value="' + y + '">' + y + " (" + years[y] + ")</option>";
    }).join(""));
    var year = "";
    EXT.filters.push(function (v) { return !year || pub(v).slice(0, 4) === year; });
    yearSel.addEventListener("change", function () { year = yearSel.value; if (EXT.rerender) EXT.rerender(); });
  } else if (yearSel) yearSel.hidden = true;

  // =====================================================================
  // 2b. Meta line on cards and in the profile Videos tab
  // =====================================================================
  var CARD_SEL = ".x-vcard[data-tv], .x-vcard[data-play], .x-pvids [data-pvid]";
  function cardId(el) { return el.getAttribute("data-tv") || el.getAttribute("data-play") || el.getAttribute("data-pvid") || ""; }
  function decorate(scope) {
    [].forEach.call((scope || doc).querySelectorAll(CARD_SEL), function (el) {
      if (el.hasAttribute("data-m15")) return;
      el.setAttribute("data-m15", "");
      var id = cardId(el);
      if (!BY_ID[id] && !meta(id)) return;
      var line = metaLine(id);
      var body = el.querySelector(".x-vcard__body");
      if (body) body.insertAdjacentHTML("beforeend", '<span class="x-vcard__sub x-m15">' + esc(line) + "</span>");
      else {
        var box = el.querySelector("div");
        if (box) box.insertAdjacentHTML("beforeend", '<small class="x-m15">' + esc(line) + "</small>");
      }
    });
  }
  var pend = 0;
  function schedule() { if (!pend) pend = requestAnimationFrame(function () { pend = 0; decorate(); }); }
  ["theater", "pro-body"].forEach(function (id) {
    var el = doc.getElementById(id);
    if (el) new MutationObserver(schedule).observe(el, { childList: true, subtree: true });
  });
  decorate();

  // =====================================================================
  // 2c. Glass tooltip: summary and first three key points
  // =====================================================================
  (function () {
    var tip = doc.createElement("div");
    tip.className = "x-vtip";
    tip.id = "x-vtip";
    tip.setAttribute("role", "tooltip");
    tip.hidden = true;
    doc.body.appendChild(tip);
    var owner = null, timer = 0;
    var hoverOk = win.matchMedia ? win.matchMedia("(hover: hover) and (pointer: fine)") : { matches: true };

    function show(el) {
      var m = meta(cardId(el));
      if (!m || !m.summary) return;
      owner = el;
      tip.innerHTML = '<p class="x-vtip__sum">' + esc(m.summary) + "</p>" +
        ((m.key_points || []).length ? '<ul class="x-vtip__kp">' + m.key_points.slice(0, 3).map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>" : "");
      tip.hidden = false;
      el.setAttribute("aria-describedby", "x-vtip");
      place(el);
      tip.classList.remove("is-on");
      void tip.offsetWidth;
      tip.classList.add("is-on");
    }
    function hide() {
      clearTimeout(timer);
      if (owner) owner.removeAttribute("aria-describedby");
      owner = null;
      tip.hidden = true;
      tip.classList.remove("is-on");
    }
    function place(el) {
      var r = el.getBoundingClientRect(), vw = root.clientWidth, vh = win.innerHeight, g = 10;
      var w = tip.offsetWidth, h = tip.offsetHeight;
      var left = Math.min(Math.max(g, r.left + r.width / 2 - w / 2), vw - w - g);
      var top = r.bottom + g;
      if (top + h > vh - g) top = r.top - h - g;
      if (top < g) top = Math.max(g, Math.min(vh - h - g, r.top + 12));
      tip.style.left = Math.max(g, left) + "px";
      tip.style.top = top + "px";
    }
    function target(e) { var t = e.target; return t && t.closest ? t.closest(CARD_SEL) : null; }
    doc.addEventListener("mouseover", function (e) {
      if (!hoverOk.matches) return;
      var el = target(e);
      if (!el || el === owner) return;
      clearTimeout(timer);
      timer = setTimeout(function () { show(el); }, 380);
    });
    doc.addEventListener("mouseout", function (e) {
      var el = target(e);
      if (!el) return;
      if (e.relatedTarget && el.contains(e.relatedTarget)) return;
      clearTimeout(timer);
      if (owner === el && doc.activeElement !== el) hide();
    });
    doc.addEventListener("focusin", function (e) {
      var el = target(e);
      if (!el) { if (owner) hide(); return; }
      var vis = true;
      try { vis = el.matches(":focus-visible"); } catch (err) { vis = true; }
      if (vis) { clearTimeout(timer); show(el); }
    });
    doc.addEventListener("focusout", function (e) { if (target(e) === owner) hide(); });
    doc.addEventListener("click", hide, true);
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && owner) hide(); }, true);
    win.addEventListener("scroll", function () { if (owner) hide(); }, { passive: true, capture: true });
    win.addEventListener("resize", hide);
  })();

  // =====================================================================
  // 2d. Theater stats strip
  // =====================================================================
  (function () {
    var box = doc.getElementById("tv-meta-stats");
    if (!box || !VIDEOS.length) return;
    var views = 0, secs = 0, known = 0, dates = [], top = null, topViews = -1;
    VIDEOS.forEach(function (v) {
      var m = meta(v.id);
      var len = lengthOf(v.id);
      if (len) { secs += len; known++; }
      if (!m) return;
      views += +m.views || 0;
      if (m.published) dates.push(m.published);
      if ((+m.views || 0) > topViews) { topViews = +m.views || 0; top = v; }
    });
    dates.sort();
    var hours = Math.round(secs / 3600);
    var tm = top ? meta(top.id) : null;
    box.innerHTML = '<h3 class="x-tvrow__title">The library on YouTube</h3>' +
      '<section class="stats" aria-label="Theater YouTube stats">' +
      '<div class="stat"><span class="stat__fig" title="' + views.toLocaleString("en-US") + ' views">' + compact(views) + '</span><span class="stat__label">Total views</span></div>' +
      '<div class="stat"><span class="stat__fig">' + hours.toLocaleString("en-US") + '</span><span class="stat__label">Watch hours available</span></div>' +
      '<div class="stat"><span class="stat__fig">' + esc(dates.length ? date(dates[0]) : "—") + '</span><span class="stat__label">Oldest upload</span></div>' +
      '<div class="stat"><span class="stat__fig">' + esc(dates.length ? date(dates[dates.length - 1]) : "—") + '</span><span class="stat__label">Newest upload</span></div>' +
      "</section>" +
      (top ? '<button class="x-tvmv" type="button" data-tvmv="' + esc(top.id) + '"><img src="https://i.ytimg.com/vi/' + esc(top.id) + '/hqdefault.jpg" alt="" loading="lazy" />' +
        '<span class="x-tvmv__txt"><span class="x-tvmv__eye">Most viewed</span><span class="x-tvmv__t">' + esc(top.t) + "</span>" +
        "<small>" + esc((tm && tm.channel) || top.ch) + " · " + esc(metaLine(top.id)) + "</small></span></button>" : "") +
      '<p class="fineprint">' + esc(AS_OF) + ". Watch hours count the " + known + " of " + VIDEOS.length + " videos with a known length.</p>";
    box.hidden = false;
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tvmv]");
      if (b && typeof win.openTheater === "function") win.openTheater(b.getAttribute("data-tvmv"), b);
    });
  })();
})();
