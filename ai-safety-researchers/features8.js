/* Round B2: Theater rows, watchlist, stats strip + donut, profile Videos tab, player lights + keys. */
(function () {
  "use strict";
  var doc = document;
  function $(id) { return doc.getElementById(id); }
  var VIDEOS = window.THEATER || [];
  var rowsBox = $("tv-rows");
  if (!rowsBox || !VIDEOS.length) return;

  var PEOPLE = window.DATA || [];
  var BY_SLUG = {}, BY_ID = {};
  PEOPLE.forEach(function (p) { BY_SLUG[p.slug] = p; });
  VIDEOS.forEach(function (v) { BY_ID[v.id] = v; });
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function motionOk() { return !reduce && !doc.documentElement.classList.contains("x-rm"); }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dur(d) {
    if (!d && d !== 0) return "";
    var h = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60), s = Math.floor(d % 60);
    return h ? h + ":" + pad(m) + ":" + pad(s) : m + ":" + pad(s);
  }
  function person(v) { var p = BY_SLUG[v.s]; return p ? p.name : v.s; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
  function thumb(id) { return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"; }
  function play(id, from) { if (typeof window.openTheater === "function") window.openTheater(id, from); }
  var PLAY = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
  var CHEV_L = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
  var CHEV_R = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  // ---------- Watchlist (in memory, mirrored to localStorage when allowed) ----------
  var KEY = "x-watchlist";
  var WL = [];
  try { var raw = localStorage.getItem(KEY); if (raw) WL = JSON.parse(raw).filter(function (id) { return BY_ID[id]; }); } catch (e) { WL = []; }
  function inWL(id) { return WL.indexOf(id) >= 0; }
  function saveWL() { try { localStorage.setItem(KEY, JSON.stringify(WL)); } catch (e) { /* storage unavailable: keep in memory */ } }
  function wlLabel(on) { return on ? "✓ On watchlist" : "+ Watchlist"; }
  function wlBtn(v, extra) {
    var on = inWL(v.id);
    return '<button class="x-wl' + (extra ? " " + extra : "") + '" type="button" data-wl="' + esc(v.id) + '" aria-pressed="' + on + '" aria-label="' + (on ? "Remove from" : "Add to") + " watchlist: " + esc(v.t) + '">' + wlLabel(on) + "</button>";
  }
  function syncWL() {
    [].forEach.call(doc.querySelectorAll("[data-wl]"), function (b) {
      var id = b.getAttribute("data-wl"), on = inWL(id), v = BY_ID[id];
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.textContent = wlLabel(on);
      if (v) b.setAttribute("aria-label", (on ? "Remove from" : "Add to") + " watchlist: " + v.t);
    });
    renderWatchRow();
  }
  function toggleWL(id) {
    var i = WL.indexOf(id);
    if (i >= 0) WL.splice(i, 1); else WL.unshift(id);
    saveWL();
    syncWL();
  }
  doc.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-wl]");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    var inRow = watchSlot && watchSlot.contains(b);
    var idx = inRow ? [].indexOf.call(watchSlot.querySelectorAll("[data-wl]"), b) : -1;
    toggleWL(b.getAttribute("data-wl"));
    if (!doc.contains(b)) {
      var left = watchSlot.querySelectorAll("[data-wl]");
      var f = left.length ? left[Math.min(idx, left.length - 1)] : rowsBox.querySelector(".x-srow__track");
      if (f) f.focus({ preventScroll: true });
    }
  });

  // ---------- Cards ----------
  function card(v) {
    var d = dur(v.d);
    return '<li class="x-srow__item"><div class="x-wlwrap"><button class="x-vcard" type="button" data-play="' + esc(v.id) + '" aria-label="Play ' + esc(v.t) + (d ? ", " + d : "") + '">' +
      '<span class="x-vcard__media"><img src="' + thumb(v.id) + '" alt="" loading="lazy" decoding="async" />' +
      '<span class="x-vcard__play" aria-hidden="true">' + PLAY + "</span>" + (d ? '<span class="x-vcard__dur">' + d + "</span>" : "") + "</span>" +
      '<span class="x-vcard__body"><span class="x-vcard__title">' + esc(v.t) + "</span>" +
      '<span class="x-vcard__sub">' + esc(person(v)) + "</span>" +
      '<span class="x-vcard__sub">' + esc(v.ch) + (v.y ? " · " + v.y : "") + "</span></span></button>" + wlBtn(v) + "</div></li>";
  }
  var ORIGINALS = [].map.call(doc.querySelectorAll("#vgrid [data-video]"), function (b) {
    var img = b.querySelector("img");
    var sub = b.querySelectorAll(".x-vcard__sub");
    return { name: b.getAttribute("data-video"), title: b.getAttribute("data-title") || "", sub: sub.length ? sub[0].textContent : "",
      dur: (b.querySelector(".x-vcard__dur") || {}).textContent || "", src: img ? img.getAttribute("src") : "" };
  });
  function originalCard(o) {
    return '<li class="x-srow__item"><div class="x-wlwrap"><button class="x-vcard" type="button" data-orig="' + esc(o.name) + '" aria-label="Play ' + esc(o.title) + (o.dur ? ", " + o.dur : "") + '">' +
      '<span class="x-vcard__media">' + (o.src ? '<img src="' + esc(o.src) + '" alt="" />' : "") +
      '<span class="x-vcard__play" aria-hidden="true">' + PLAY + "</span>" + (o.dur ? '<span class="x-vcard__dur">' + esc(o.dur) + "</span>" : "") + "</span>" +
      '<span class="x-vcard__body"><span class="x-vcard__title">' + esc(o.title) + '</span><span class="x-vcard__sub">' + esc(o.sub) + '</span><span class="x-vcard__sub">Hark original</span></span></button></div></li>';
  }

  // ---------- Rows ----------
  var NOTABLE = ["geoffrey-hinton", "yoshua-bengio", "stuart-russell", "eliezer-yudkowsky", "dario-amodei", "chris-olah", "jan-leike", "paul-christiano", "ilya-sutskever", "demis-hassabis"];
  function newest(a, b) { return (b.y || 0) - (a.y || 0); }
  function notable() {
    var lists = NOTABLE.map(function (s) { return VIDEOS.filter(function (v) { return v.s === s; }).sort(newest); }).filter(function (l) { return l.length; });
    var out = [], i = 0;
    while (out.length < 16 && lists.some(function (l) { return l.length > i; })) {
      lists.forEach(function (l) { if (l[i] && out.length < 16) out.push(l[i]); });
      i++;
    }
    return out;
  }
  function isInterp(v) {
    return v.c === "interpretability" || (v.tg || []).some(function (t) { return /interpretab|mechanistic/i.test(t); }) || /interpretab|mechanistic|inside neural/i.test(v.t);
  }
  var ROWS = [
    ["originals", "Originals", null],
    ["notable", "Most notable voices", notable()],
    ["podcasts", "Podcasts", VIDEOS.filter(function (v) { return v.k === "podcast"; }).sort(newest)],
    ["talks", "Talks & lectures", VIDEOS.filter(function (v) { return v.k === "talk" || v.k === "lecture"; }).sort(newest)],
    ["interp", "Interpretability", VIDEOS.filter(isInterp).sort(newest)],
    ["gov", "Governance & policy", VIDEOS.filter(function (v) { return v.c === "governance-policy"; }).sort(newest)],
    ["pioneers", "Pioneers & archives", VIDEOS.filter(function (v) { return v.c === "pioneer-public-voice"; }).sort(function (a, b) { return (a.y || 9999) - (b.y || 9999); })]
  ];
  function rowHTML(key, title, items, total) {
    var count = total != null ? total : items.length;
    return '<section class="x-srow" data-row="' + key + '" aria-labelledby="x-srow-' + key + '">' +
      '<div class="x-srow__head"><h3 class="x-tvrow__title" id="x-srow-' + key + '">' + esc(title) + ' <span class="pill">' + count + "</span></h3>" +
      '<div class="x-srow__nav"><button class="x-iconbtn" type="button" data-dir="-1" aria-label="Scroll ' + esc(title) + ' left">' + CHEV_L + "</button>" +
      '<button class="x-iconbtn" type="button" data-dir="1" aria-label="Scroll ' + esc(title) + ' right">' + CHEV_R + "</button></div></div>" +
      '<ul class="x-srow__track" tabindex="-1">' + items + "</ul></section>";
  }
  var html = '<div data-row-slot="watch"></div>';
  ROWS.forEach(function (r) {
    if (r[0] === "originals") {
      if (ORIGINALS.length) html += rowHTML("originals", r[1], ORIGINALS.map(originalCard).join(""), ORIGINALS.length);
      return;
    }
    if (!r[2].length) return;
    html += rowHTML(r[0], r[1], r[2].slice(0, 16).map(card).join(""), r[2].length);
  });
  rowsBox.innerHTML = html;
  var watchSlot = rowsBox.querySelector('[data-row-slot="watch"]');

  function updateArrows(sec) {
    var t = sec.querySelector(".x-srow__track");
    if (!t) return;
    var max = t.scrollWidth - t.clientWidth - 2;
    var l = sec.querySelector('[data-dir="-1"]'), r = sec.querySelector('[data-dir="1"]');
    if (l) l.disabled = t.scrollLeft <= 2;
    if (r) r.disabled = t.scrollLeft >= max;
    var nav = sec.querySelector(".x-srow__nav");
    if (nav) nav.hidden = max <= 0;
  }
  function wireRow(sec) {
    var t = sec.querySelector(".x-srow__track");
    if (!t || t._wired) return;
    t._wired = true;
    var raf = 0;
    t.addEventListener("scroll", function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { updateArrows(sec); }); }, { passive: true });
    updateArrows(sec);
  }
  function wireAll() { [].forEach.call(rowsBox.querySelectorAll(".x-srow"), wireRow); }
  function refreshArrows() { [].forEach.call(rowsBox.querySelectorAll(".x-srow"), updateArrows); }
  wireAll();
  window.addEventListener("resize", refreshArrows);
  window.addEventListener("load", refreshArrows);

  function renderWatchRow() {
    var items = WL.map(function (id) { return BY_ID[id]; }).filter(Boolean);
    var old = watchSlot.querySelector(".x-srow");
    var keepScroll = old ? old.querySelector(".x-srow__track").scrollLeft : 0;
    watchSlot.innerHTML = items.length ? rowHTML("watch", "My watchlist", items.slice(0, 16).map(card).join(""), items.length) : "";
    var sec = watchSlot.querySelector(".x-srow");
    if (sec) { sec.querySelector(".x-srow__track").scrollLeft = keepScroll; wireRow(sec); }
  }
  renderWatchRow();

  rowsBox.addEventListener("click", function (e) {
    var d = e.target.closest("[data-dir]");
    if (d) {
      var t = d.closest(".x-srow").querySelector(".x-srow__track");
      t.scrollBy({ left: +d.getAttribute("data-dir") * Math.max(240, t.clientWidth * 0.9), behavior: motionOk() ? "smooth" : "auto" });
      return;
    }
    var p = e.target.closest("[data-play]");
    if (p) { play(p.getAttribute("data-play"), p); return; }
    var o = e.target.closest("[data-orig]");
    if (o) {
      var src = doc.querySelector('#vgrid [data-video="' + o.getAttribute("data-orig") + '"]');
      if (src) src.click();
    }
  });

  // ---------- Watchlist toggle on the library grid's cards ----------
  var grid = $("tv-grid");
  function wrapGrid() {
    if (!grid) return;
    [].forEach.call(grid.children, function (c) {
      if (!c.classList.contains("x-vcard")) return;
      var v = BY_ID[c.getAttribute("data-tv")];
      if (!v) return;
      var w = doc.createElement("div");
      w.className = "x-wlwrap";
      grid.replaceChild(w, c);
      w.appendChild(c);
      w.insertAdjacentHTML("beforeend", wlBtn(v));
    });
  }
  if (grid) {
    new MutationObserver(wrapGrid).observe(grid, { childList: true });
    wrapGrid();
  }

  // ---------- Stats strip + donut ----------
  (function () {
    var top = rowsBox.parentNode.querySelector(".x-tvtop");
    var stats = top && top.querySelector(".stats");
    if (!stats) return;
    var secs = 0;
    VIDEOS.forEach(function (v) { if (v.d) secs += v.d; });
    ORIGINALS.forEach(function (o) {
      var m = /^(\d+):(\d{2})$/.exec(o.dur.trim());
      if (m) secs += +m[1] * 60 + +m[2];
    });
    var people = {}, channels = {};
    VIDEOS.forEach(function (v) { people[v.s] = 1; channels[v.ch] = 1; });
    var vals = { videos: VIDEOS.length + ORIGINALS.length, hours: Math.round(secs / 3600), people: Object.keys(people).length, channels: Object.keys(channels).length };
    Object.keys(vals).forEach(function (k) {
      var el = stats.querySelector('[data-tv-stat="' + k + '"]');
      if (el && el.textContent.replace(/\D/g, "") !== String(vals[k])) el.textContent = vals[k].toLocaleString("en-US");
    });

    var counts = {};
    VIDEOS.forEach(function (v) { counts[v.k] = (counts[v.k] || 0) + 1; });
    var kinds = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    var total = VIDEOS.length, R = 40, C = 2 * Math.PI * R, acc = 0;
    var segs = kinds.map(function (k, i) {
      var len = (counts[k] / total) * C;
      var s = '<circle cx="50" cy="50" r="' + R + '" fill="none" stroke="var(--chart-' + (i % 7 + 1) + ')" stroke-width="14" stroke-dasharray="' + len.toFixed(2) + " " + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-acc).toFixed(2) + '"><title>' + esc(cap(k)) + ": " + counts[k] + "</title></circle>";
      acc += len;
      return s;
    }).join("");
    var label = kinds.map(function (k) { return cap(k) + " " + counts[k]; }).join(", ");
    var fig = doc.createElement("figure");
    fig.className = "x-donut";
    fig.innerHTML = '<svg class="x-donut__svg" viewBox="0 0 100 100" role="img" aria-label="YouTube videos by kind: ' + esc(label) + '">' +
      '<g transform="rotate(-90 50 50)">' + segs + "</g>" +
      '<text x="50" y="49" text-anchor="middle" class="x-donut__fig">' + total + '</text><text x="50" y="62" text-anchor="middle" class="x-donut__lbl">videos</text></svg>' +
      '<figcaption class="x-donut__cap"><span class="x-donut__title">By kind <small>Tap a kind to filter the library</small></span><ul class="x-donut__legend">' +
      kinds.map(function (k, i) {
        return '<li><button type="button" data-kind="' + esc(k) + '"><i style="background:var(--chart-' + (i % 7 + 1) + ')"></i>' + esc(cap(k)) + " <b>" + counts[k] + "</b></button></li>";
      }).join("") + "</ul></figcaption>";
    var strip = doc.createElement("div");
    strip.className = "x-tvstrip";
    stats.parentNode.insertBefore(strip, stats);
    strip.appendChild(stats);
    strip.appendChild(fig);
    fig.addEventListener("click", function (e) {
      var b = e.target.closest("[data-kind]");
      if (!b) return;
      var chip = doc.querySelector('#tv-kinds [data-v="' + b.getAttribute("data-kind") + '"]');
      if (chip) chip.click();
      var br = $("tv-browse");
      if (br) br.scrollIntoView({ behavior: motionOk() ? "smooth" : "auto", block: "start" });
    });
  })();

  // ---------- Player: watchlist, lights, keys ----------
  var modal = doc.querySelector(".x-tvm");
  if (modal) {
    var bar = modal.querySelector(".x-vmodal__bar"), nextBtn = modal.querySelector("[data-tvnext]"), info = modal.querySelector(".x-tvm__info");
    var lights = doc.createElement("button");
    lights.type = "button";
    lights.className = "x-iconbtn x-lightsbtn";
    lights.setAttribute("aria-pressed", "false");
    lights.setAttribute("aria-keyshortcuts", "L");
    lights.title = "Lights (L) · Next (N)";
    lights.textContent = "Lights off";
    if (bar) bar.insertBefore(lights, nextBtn || bar.lastChild);
    if (nextBtn) nextBtn.setAttribute("aria-keyshortcuts", "N");
    var dark = false;
    function setLights(on) {
      dark = on;
      modal.classList.toggle("x-lights", on);
      lights.setAttribute("aria-pressed", on ? "true" : "false");
      lights.textContent = on ? "Lights on" : "Lights off";
    }
    lights.addEventListener("click", function () { setLights(!dark); });

    function addPlayerWL() {
      var v = typeof window.theaterCurrent === "function" ? window.theaterCurrent() : null;
      if (!v || !info) return;
      var links = info.querySelector(".links");
      if (!links || links.querySelector("[data-wl]")) return;
      links.insertAdjacentHTML("beforeend", wlBtn(v, "btn x-wl--player"));
    }
    if (info) new MutationObserver(addPlayerWL).observe(info, { childList: true });

    // Restore a profile's hash after the player closes, if it was opened from one
    var savedHash = "";
    new MutationObserver(function () {
      if (!modal.hidden || !savedHash) return;
      var h = savedHash;
      savedHash = "";
      if (/^#theater/.test(location.hash)) { try { history.replaceState(null, "", location.pathname + location.search + h); } catch (e) { /* ignore */ } }
    }).observe(modal, { attributes: true, attributeFilter: ["hidden"] });
    window.__xTheaterFromProfile = function () { if (modal.hidden) savedHash = location.hash; };

    window.addEventListener("keydown", function (e) {
      if (modal.hidden) return;
      var pal = doc.querySelector(".x-cmd");
      if (pal && !pal.hidden) return;
      var ov = $("overlay");
      if (ov && !ov.hidden && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.stopPropagation(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      var k = e.key.toLowerCase();
      if (k === "n") { e.preventDefault(); if (nextBtn) nextBtn.click(); }
      else if (k === "l") { e.preventDefault(); setLights(!dark); }
    }, true);
  }

  // ---------- Profile overlay: Videos tab ----------
  var body = $("pro-body");
  function slugNow() { var s = ""; try { s = decodeURIComponent(location.hash.slice(1)); } catch (e) { s = location.hash.slice(1); } return s; }
  function addTab() {
    if (!body) return;
    var tabs = body.querySelector(".x-tabs");
    if (!tabs || tabs.querySelector('[data-tab="videos"]')) return;
    var slug = slugNow();
    var vids = VIDEOS.filter(function (v) { return v.s === slug; }).sort(newest);
    if (!vids.length) return;
    var b = doc.createElement("button");
    b.className = "x-tab";
    b.type = "button";
    b.setAttribute("role", "tab");
    b.id = "x-tab-videos";
    b.setAttribute("data-tab", "videos");
    b.setAttribute("aria-controls", "x-tp-videos");
    b.setAttribute("aria-selected", "false");
    b.tabIndex = -1;
    b.textContent = "Videos (" + vids.length + ")";
    var after = tabs.querySelector('[data-tab="interviews"]');
    if (after && after.nextSibling) tabs.insertBefore(b, after.nextSibling); else tabs.appendChild(b);
    var p = doc.createElement("div");
    p.className = "x-tabpanel";
    p.id = "x-tp-videos";
    p.setAttribute("role", "tabpanel");
    p.setAttribute("aria-labelledby", "x-tab-videos");
    p.setAttribute("data-panel", "videos");
    p.hidden = true;
    p.innerHTML = '<section class="x-block"><h3>Videos in the Theater</h3><ul class="x-pvids">' + vids.map(function (v) {
      return '<li><button class="x-tvm__item" type="button" data-pvid="' + esc(v.id) + '"><img src="' + thumb(v.id) + '" alt="" loading="lazy" />' +
        "<div><span>" + esc(v.t) + "</span><small>" + esc(v.ch) + (v.y ? " · " + v.y : "") + (v.d ? " · " + dur(v.d) : "") + "</small></div></button></li>";
    }).join("") + "</ul></section>";
    body.appendChild(p);
  }
  if (body) {
    new MutationObserver(addTab).observe(body, { childList: true });
    window.addEventListener("hashchange", function () { setTimeout(addTab, 0); });
    addTab();
    body.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pvid]");
      if (!b) return;
      if (window.__xTheaterFromProfile) window.__xTheaterFromProfile();
      play(b.getAttribute("data-pvid"), b);
    });
  }
})();
