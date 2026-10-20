/* Round F3: watch history, continue watching, coverage by category and researcher, and progress on every thumbnail. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, win = window;
  var META = win.VMETA || {};
  var YTV = Array.isArray(win.THEATER) ? win.THEATER : [];
  var PEOPLE = Array.isArray(win.DATA) ? win.DATA : [];
  var KEY = "x-watch-history-v1";
  var DONE = 90, PAGE = 24, CHIPS = 24;
  function $(id) { return doc.getElementById(id); }

  var CATS = [
    ["lab-safety", "Frontier Lab Safety"],
    ["academic-alignment", "Academic Alignment"],
    ["independent-org", "Independent Orgs"],
    ["interpretability", "Interpretability"],
    ["governance-policy", "Governance & Policy"],
    ["pioneer-public-voice", "Pioneers & Public Voices"],
    ["originals", "Hark originals"]
  ];
  var BY_SLUG = {};
  PEOPLE.forEach(function (p) { BY_SLUG[p.slug] = p; });
  function pname(s) { var p = BY_SLUG[s]; return p ? p.name : (s || ""); }

  // ---------- Helpers ----------
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function clock(s) {
    s = Math.max(0, Math.floor(s || 0));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h ? h + ":" + pad(m) + ":" + pad(x) : pad(m) + ":" + pad(x);
  }
  function mins(s) {
    var m = Math.round((s || 0) / 60);
    if (m < 60) return m + " min";
    var h = Math.floor(m / 60), r = m % 60;
    return h + " h" + (r ? " " + r + " min" : "");
  }
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function ago(ts) {
    if (!ts) return "—";
    var s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    if (s < 86400 * 7) return Math.floor(s / 86400) + " d ago";
    var d = new Date(ts);
    return d.getDate() + " " + MON[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? " " + d.getFullYear() : "");
  }
  function dayKey(ts) { var d = new Date(ts); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function motionOk() { return !root.classList.contains("x-rm") && !(win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function toast(msg) {
    var el = doc.querySelector(".x-toast");
    if (!el) { el = doc.createElement("div"); el.className = "x-toast"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); doc.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("is-on"); }, 2400);
  }
  var PLAY = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
  var CHEV_L = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
  var CHEV_R = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  // ---------- Catalog: the 7 originals, then every Theater video ----------
  var CAT = [], BY = {};
  function add(c) { if (!c.id || BY[c.id]) return; c.i = CAT.length; c.hay = (c.title + " " + pname(c.slug) + " " + c.ch).toLowerCase(); CAT.push(c); BY[c.id] = c; }
  [].forEach.call(doc.querySelectorAll("#vgrid [data-video]"), function (b) {
    var name = b.getAttribute("data-video"), slug = b.getAttribute("data-slug") || "";
    var img = b.querySelector("img"), sub = b.querySelector(".x-vcard__sub");
    var m = /^(?:(\d+):)?(\d+):(\d{2})$/.exec(((b.querySelector(".x-vcard__dur") || {}).textContent || "").trim());
    var p = BY_SLUG[slug];
    add({
      id: name, src: "orig", slug: slug,
      title: (b.getAttribute("data-title") || name) + (slug ? " · profile film" : ""),
      cat: slug && p && p.category ? p.category : "originals",
      dur: m ? (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) : 0,
      thumb: img ? img.getAttribute("src") : "", ch: "Hark original" + (sub && !slug ? " · " + sub.textContent : ""), y: 9999
    });
  });
  YTV.forEach(function (v) {
    var m = META[v.id];
    add({ id: v.id, src: "yt", slug: v.s || "", title: v.t || v.id, cat: v.c || "", dur: (m && m.length_sec) || v.d || 0,
      thumb: "https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg", ch: (m && m.channel) || v.ch || "", y: v.y || 0 });
  });
  if (!CAT.length) return;

  // ---------- Storage: localStorage when allowed, memory otherwise ----------
  function blank() { return { v: 1, items: {}, days: {} }; }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var o = JSON.parse(raw); if (o && typeof o.items === "object" && o.items) { o.days = o.days || {}; return o; } }
    } catch (e) { /* storage blocked: memory only */ }
    return blank();
  }
  var S = load(), dirty = false, lastPersist = 0;
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked: memory only */ }
    lastPersist = Date.now();
    dirty = false;
    schedule();
  }
  function flush() { if (dirty) persist(); }
  function recs() { return Object.keys(S.items).map(function (k) { return S.items[k]; }).filter(function (r) { return BY[r.id]; }); }
  function durOf(id) { var r = S.items[id], c = BY[id]; return (r && r.duration) || (c && c.dur) || 0; }
  function leftOf(id) {
    var d = durOf(id), r = S.items[id];
    if (!d) return 0;
    if (r && r.completed) return 0;
    return Math.max(0, d - (r ? r.position : 0));
  }

  function track(id, t, d, watched) {
    var c = BY[id];
    if (!c) return;
    var now = Date.now(), r = S.items[id];
    if (!r) {
      r = S.items[id] = { id: id, title: c.title, person: c.slug, category: c.cat, seconds: 0, duration: c.dur || 0,
        percent: 0, position: 0, firstWatched: now, lastWatched: now, completed: false };
    }
    if (d > 0 && isFinite(d)) r.duration = Math.round(d);
    t = Math.max(0, +t || 0);
    r.position = Math.round(t);
    if (r.duration) r.percent = Math.max(r.percent || 0, Math.min(100, Math.round(t / r.duration * 1000) / 10));
    if (watched > 0) {
      r.seconds = Math.round(((r.seconds || 0) + watched) * 10) / 10;
      var k = dayKey(now);
      S.days[k] = Math.round(((S.days[k] || 0) + watched) * 10) / 10;
    }
    r.completed = (r.percent || 0) >= DONE;
    r.lastWatched = now;
    dirty = true;
  }

  // ---------- YouTube: HarkPlayer ticks ----------
  var HP = win.HarkPlayer, pendingSeek = null;
  var yt = { id: null, t: 0, moving: false, still: 0 };
  if (HP && typeof HP.onTick === "function") {
    HP.onTick(function (t, d, id) {
      if (!id || !BY[id]) return;
      if (pendingSeek && pendingSeek.id === id && (d > 0 || t > 0)) {
        var to = pendingSeek.t;
        pendingSeek = null;
        try { HP.seek(to); } catch (e) { /* player not ready */ }
        yt = { id: id, t: to, moving: false, still: 0 };
        return;
      }
      if (id !== yt.id) { flush(); yt = { id: id, t: t, moving: false, still: 0 }; return; }
      var dt = t - yt.t;
      yt.t = t;
      if (dt > 0.01 && dt < 3) {
        yt.moving = true; yt.still = 0;
        track(id, t, d, dt);
        if (Date.now() - lastPersist >= 5000) persist();
      } else if (Math.abs(dt) <= 0.01) {
        if (yt.moving && ++yt.still >= 2) { yt.moving = false; if (S.items[id]) { track(id, t, d, 0); persist(); } }
      } else if (S.items[id]) track(id, t, d, 0);
    });
  }
  var tvm = doc.querySelector(".x-tvm"), mini = doc.querySelector(".x-mini");
  [tvm, mini].forEach(function (el) {
    if (el) new MutationObserver(function () { if (el.hidden) { flush(); yt.moving = false; } }).observe(el, { attributes: true, attributeFilter: ["hidden"] });
  });
  win.addEventListener("pagehide", flush);
  doc.addEventListener("visibilitychange", function () { if (doc.visibilityState === "hidden") flush(); });

  // ---------- The 7 originals: the HLS <video> element ----------
  var origName = "", origResume = null;
  doc.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#vgrid [data-video], [data-watch]");
    if (b) origName = b.getAttribute("data-video") || b.getAttribute("data-watch") || "";
  }, true);
  var hm = [].filter.call(doc.querySelectorAll(".x-vmodal"), function (m) { return !m.classList.contains("x-tvm"); })[0];
  var hst = hm && hm.querySelector(".x-vmodal__stage");
  function bindHls() {
    var v = hst.querySelector("video");
    if (!v || v._xh16) return;
    v._xh16 = true;
    var id = origName, c = BY[id];
    if (!c) return;
    var last = null, res = origResume && origResume.id === id ? origResume.t : 0;
    origResume = null;
    function D() { return isFinite(v.duration) && v.duration > 0 ? v.duration : c.dur; }
    if (res) {
      var once = function () { v.removeEventListener("loadedmetadata", once); try { v.currentTime = res; } catch (e) { /* ignore */ } };
      v.addEventListener("loadedmetadata", once);
    }
    v.addEventListener("playing", function () { last = v.currentTime; track(id, v.currentTime, D(), 0); });
    v.addEventListener("timeupdate", function () {
      var t = v.currentTime;
      if (last == null || v.paused || v.seeking) { last = t; return; }
      var dt = t - last;
      last = t;
      if (dt > 0 && dt < 3) { track(id, t, D(), dt); if (Date.now() - lastPersist >= 5000) persist(); }
    });
    v.addEventListener("seeked", function () { last = v.currentTime; if (S.items[id]) track(id, v.currentTime, D(), 0); });
    ["pause", "ended"].forEach(function (ev) {
      v.addEventListener(ev, function () { if (S.items[id]) { track(id, ev === "ended" ? D() : v.currentTime, D(), 0); persist(); } });
    });
  }
  if (hst) {
    new MutationObserver(bindHls).observe(hst, { childList: true });
    new MutationObserver(function () { if (hm.hidden) flush(); }).observe(hm, { attributes: true, attributeFilter: ["hidden"] });
  }

  // ---------- Play / resume ----------
  function resumeAt(id) {
    var r = S.items[id];
    if (!r || r.completed || !(r.position >= 5)) return 0;
    if (r.duration && r.position > r.duration - 5) return 0;
    return r.position;
  }
  function playItem(id, from) {
    var c = BY[id];
    if (!c) return;
    var t = resumeAt(id);
    if (c.src === "yt") {
      pendingSeek = t ? { id: id, t: t } : null;
      if (typeof win.openTheater === "function") win.openTheater(id, from);
    } else {
      origResume = t ? { id: id, t: t } : null;
      var b = doc.querySelector('#vgrid [data-video="' + id + '"]');
      if (b) b.click();
    }
  }
  function nextFor(slug) {
    var list = CAT.filter(function (c) { return c.slug === slug; }).sort(function (a, b) { return (b.y || 0) - (a.y || 0) || a.i - b.i; });
    var pick = null;
    list.some(function (c) { if (!S.items[c.id]) { pick = c; return true; } return false; });
    if (!pick) list.some(function (c) { if (!S.items[c.id].completed) { pick = c; return true; } return false; });
    return pick || list[0] || null;
  }

  // ---------- Player Overview: "You watched 62% · 14:03 left" ----------
  var ov = $("x-sp-ov"), info = tvm && tvm.querySelector(".x-tvm__info"), snap = null;
  function ensureOv() {
    if (!ov || !snap) return;
    var v = typeof win.theaterCurrent === "function" ? win.theaterCurrent() : null;
    if (!v || v.id !== snap.id) return;
    var ex = ov.querySelector(".x-hres");
    if (ex && ex.getAttribute("data-id") === snap.id) return;
    if (ex) ex.parentNode.removeChild(ex);
    if (!snap.rec || !(snap.rec.percent > 0)) return;
    var r = snap.rec, el = doc.createElement("div");
    el.className = "x-hres";
    el.setAttribute("data-id", snap.id);
    if (r.completed) {
      el.innerHTML = '<p class="x-hres__txt"><span class="dot">Completed</span> You watched this ' + esc(ago(r.lastWatched)) + ".</p>";
    } else {
      var left = r.duration ? Math.max(0, r.duration - r.position) : 0;
      var pct = Math.round(r.percent);
      el.innerHTML = '<span class="x-whprog" aria-hidden="true"><i style="--p:' + pct + '%"></i></span>' +
        '<p class="x-hres__txt">You watched <b>' + pct + "%</b>" + (left ? " · " + clock(left) + " left" : "") + "</p>" +
        (snap.resuming ? '<p class="x-hres__note">Resuming at ' + clock(r.position) + "</p>"
          : r.position >= 5 ? '<button class="btn" type="button" data-hres="' + r.position + '">Resume at ' + clock(r.position) + "</button>" : "");
    }
    var title = ov.querySelector(".x-sp__title");
    if (title) title.insertAdjacentElement("afterend", el); else ov.insertBefore(el, ov.firstChild);
  }
  if (info) new MutationObserver(function () {
    var v = typeof win.theaterCurrent === "function" ? win.theaterCurrent() : null;
    snap = v ? { id: v.id, rec: S.items[v.id] ? JSON.parse(JSON.stringify(S.items[v.id])) : null, resuming: !!(pendingSeek && pendingSeek.id === v.id) } : null;
    ensureOv();
  }).observe(info, { childList: true });
  if (ov) {
    new MutationObserver(ensureOv).observe(ov, { childList: true });
    ov.addEventListener("click", function (e) {
      var b = e.target.closest("[data-hres]");
      if (!b || !HP) return;
      HP.seek(+b.getAttribute("data-hres") || 0);
      var p = doc.createElement("p");
      p.className = "x-hres__note";
      p.textContent = "Resumed at " + clock(+b.getAttribute("data-hres"));
      b.parentNode.replaceChild(p, b);
    });
  }

  // ---------- Progress on every Theater and profile thumbnail ----------
  var CARD = ".x-vcard[data-tv], .x-vcard[data-play], .x-vcard[data-orig], #vgrid .x-vcard[data-video], .x-tvm__item[data-pvid], .x-tvm__item[data-tvup]";
  function cardId(el) { return el.getAttribute("data-tv") || el.getAttribute("data-play") || el.getAttribute("data-orig") || el.getAttribute("data-video") || el.getAttribute("data-pvid") || el.getAttribute("data-tvup") || ""; }
  function overlay(r) {
    if (!r) return "";
    if (r.completed) return '<span class="x-hdone" title="Watched"><span aria-hidden="true">✓</span><span class="x-hsr">Watched</span></span>';
    return '<span class="x-hp" aria-hidden="true"><i style="--p:' + Math.max(2, Math.round(r.percent || 0)) + '%"></i></span><span class="x-hsr">' + Math.round(r.percent || 0) + "% watched</span>";
  }
  function decorate() {
    [].forEach.call(doc.querySelectorAll(CARD), function (el) {
      var r = S.items[cardId(el)];
      var key = !r || !(r.percent > 0 || r.completed) ? "" : r.completed ? "done" : "p" + Math.round(r.percent);
      if ((el.getAttribute("data-hp") || "") === key) return;
      el.setAttribute("data-hp", key);
      var host = el.querySelector(".x-vcard__media");
      if (!host) {
        var img = el.querySelector(":scope > img");
        if (img && key) {
          host = doc.createElement("i");
          host.className = "x-hpth";
          img.parentNode.insertBefore(host, img);
          host.appendChild(img);
        } else host = el.querySelector(".x-hpth");
      }
      if (!host) return;
      [].forEach.call(host.querySelectorAll(".x-hp, .x-hdone, .x-hsr"), function (n) { n.parentNode.removeChild(n); });
      if (key) host.insertAdjacentHTML("beforeend", overlay(r));
    });
  }
  var dpend = 0;
  function scheduleDecorate() { if (!dpend) dpend = requestAnimationFrame(function () { dpend = 0; decorate(); }); }
  ["theater", "watch", "pro-body"].forEach(function (id) {
    var el = $(id);
    if (el) new MutationObserver(scheduleDecorate).observe(el, { childList: true, subtree: true });
  });
  if (tvm) new MutationObserver(scheduleDecorate).observe(tvm, { childList: true, subtree: true });

  // ---------- Theater: Continue watching + History rows ----------
  var cont = $("tv-continue");
  function rowCard(r) {
    var c = BY[r.id], pct = Math.round(r.percent || 0), left = leftOf(r.id), t = resumeAt(r.id);
    var line = r.completed ? "Watched" : pct + "% watched" + (left ? " · " + clock(left) + " left" : "");
    return '<li class="x-srow__item"><button class="x-vcard" type="button" data-hplay="' + esc(r.id) + '" aria-label="' + (t ? "Resume " : "Play ") + esc(c.title) + (t ? " at " + clock(t) : "") + ", " + esc(line) + '">' +
      '<span class="x-vcard__media">' + (c.thumb ? '<img src="' + esc(c.thumb) + '" alt="" loading="lazy" decoding="async" />' : "") +
      '<span class="x-vcard__play" aria-hidden="true">' + PLAY + "</span>" + (durOf(r.id) ? '<span class="x-vcard__dur">' + clock(durOf(r.id)) + "</span>" : "") + overlay(r) + "</span>" +
      '<span class="x-vcard__body"><span class="x-vcard__title">' + esc(c.title) + "</span>" +
      '<span class="x-vcard__sub">' + esc(line) + "</span>" +
      '<span class="x-vcard__sub">' + esc(pname(c.slug) || c.ch) + " · " + esc(ago(r.lastWatched)) + "</span></span></button></li>";
  }
  function rowHTML(key, title, list, extra) {
    return '<section class="x-srow" data-hrow="' + key + '" aria-labelledby="x-hrow-' + key + '">' +
      '<div class="x-srow__head"><h3 class="x-tvrow__title" id="x-hrow-' + key + '">' + esc(title) + ' <span class="pill">' + list.length + "</span></h3>" +
      '<div class="x-hrow__acts">' + (extra || "") + '<div class="x-srow__nav"><button class="x-iconbtn" type="button" data-hdir="-1" aria-label="Scroll ' + esc(title) + ' left">' + CHEV_L + "</button>" +
      '<button class="x-iconbtn" type="button" data-hdir="1" aria-label="Scroll ' + esc(title) + ' right">' + CHEV_R + "</button></div></div></div>" +
      '<ul class="x-srow__track" tabindex="-1">' + list.slice(0, 16).map(rowCard).join("") + "</ul></section>";
  }
  function arrows(sec) {
    var t = sec.querySelector(".x-srow__track");
    if (!t) return;
    var max = t.scrollWidth - t.clientWidth - 2;
    var l = sec.querySelector('[data-hdir="-1"]'), r = sec.querySelector('[data-hdir="1"]'), nav = sec.querySelector(".x-srow__nav");
    if (l) l.disabled = t.scrollLeft <= 2;
    if (r) r.disabled = t.scrollLeft >= max;
    if (nav) nav.hidden = max <= 0;
  }
  function renderRows() {
    if (!cont) return;
    var all = recs().sort(function (a, b) { return b.lastWatched - a.lastWatched; });
    var prog = all.filter(function (r) { return !r.completed && r.percent > 0; });
    var keep = {};
    [].forEach.call(cont.querySelectorAll(".x-srow"), function (s) { keep[s.getAttribute("data-hrow")] = s.querySelector(".x-srow__track").scrollLeft; });
    var fk = doc.activeElement && cont.contains(doc.activeElement) ? doc.activeElement.getAttribute("data-hplay") : null;
    cont.innerHTML = (prog.length ? rowHTML("continue", "Continue watching", prog) : "") +
      (all.length ? rowHTML("history", "History", all, '<a class="btn" href="#history">See all</a>') : "");
    cont.hidden = !all.length;
    [].forEach.call(cont.querySelectorAll(".x-srow"), function (s) {
      var t = s.querySelector(".x-srow__track");
      t.scrollLeft = keep[s.getAttribute("data-hrow")] || 0;
      t.addEventListener("scroll", function () { arrows(s); }, { passive: true });
      arrows(s);
    });
    if (fk) { var f = cont.querySelector('[data-hplay="' + fk + '"]'); if (f) f.focus({ preventScroll: true }); }
  }
  if (cont) {
    cont.addEventListener("click", function (e) {
      var d = e.target.closest("[data-hdir]");
      if (d) {
        var t = d.closest(".x-srow").querySelector(".x-srow__track");
        t.scrollBy({ left: +d.getAttribute("data-hdir") * Math.max(240, t.clientWidth * 0.9), behavior: motionOk() ? "smooth" : "auto" });
        return;
      }
      var p = e.target.closest("[data-hplay]");
      if (p) playItem(p.getAttribute("data-hplay"), p);
    });
    win.addEventListener("resize", function () { [].forEach.call(cont.querySelectorAll(".x-srow"), arrows); });
  }

  // ---------- History section ----------
  var sec = $("history"), grid = $("wh-grid");
  var st = { f: "all", q: "", sort: "recent", shown: PAGE, people: false };
  var ringChart = null, catChart = null;

  function streak() {
    var n = 0, d = new Date();
    if (!S.days[dayKey(d.getTime())]) d.setDate(d.getDate() - 1);
    while (S.days[dayKey(d.getTime())] > 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function counts() {
    var all = recs(), done = all.filter(function (r) { return r.completed; }).length;
    return { all: all.length, done: done, progress: all.length - done, none: CAT.length - all.length };
  }

  function charts(cn) {
    if (typeof Chart === "undefined") return;
    var rate = cn.all ? Math.round(cn.done / cn.all * 100) : 0;
    var fig = $("wh-ring-fig");
    if (fig) fig.textContent = rate + "%";
    var ring = $("wh-ring");
    if (ring) {
      ring.setAttribute("aria-label", cn.all ? "Completion rate " + rate + "%: " + cn.done + " completed, " + cn.progress + " in progress" : "Completion rate: no videos started yet");
      var data = cn.all ? [cn.done, cn.progress] : [0, 1];
      try {
        if (!ringChart) {
          ringChart = new Chart(ring, {
            type: "doughnut",
            data: { labels: ["Completed", "In progress"], datasets: [{ data: data, backgroundColor: ["var(--chart-ink)", "var(--chart-muted)"], borderWidth: 0 }] },
            options: { cutout: "78%", plugins: { legend: { display: false }, tooltip: { enabled: cn.all > 0 } } }
          });
        } else {
          ringChart.data.datasets[0].data = data;
          ringChart.options.plugins.tooltip.enabled = cn.all > 0;
          ringChart.update();
        }
      } catch (e) { /* the figure above still shows the rate */ }
    }
    var cv = $("wh-cats");
    if (cv) {
      var rows = CATS.map(function (c) {
        var o = { label: c[1], done: 0, prog: 0, none: 0, left: 0 };
        CAT.forEach(function (x) {
          if (x.cat !== c[0]) return;
          var r = S.items[x.id];
          if (!r) o.none++; else if (r.completed) o.done++; else o.prog++;
          o.left += leftOf(x.id);
        });
        return o;
      }).filter(function (o) { return o.done + o.prog + o.none > 0; });
      cv.setAttribute("aria-label", rows.map(function (o) { return o.label + ": " + o.done + " completed, " + o.prog + " in progress, " + o.none + " not started, " + mins(o.left) + " left"; }).join("; "));
      var sets = [
        { label: "Completed", data: rows.map(function (o) { return o.done; }), backgroundColor: "var(--chart-1)" },
        { label: "In progress", data: rows.map(function (o) { return o.prog; }), backgroundColor: "var(--chart-2)" },
        { label: "Not started", data: rows.map(function (o) { return o.none; }), backgroundColor: "var(--chart-muted)" }
      ];
      try {
        if (!catChart) {
          catChart = new Chart(cv, {
            type: "bar",
            data: { labels: rows.map(function (o) { return o.label; }), datasets: sets },
            options: {
              indexAxis: "y",
              scales: { x: { stacked: true }, y: { stacked: true } },
              plugins: { tooltip: { callbacks: { footer: function (items) { var o = catChart && catChart._xrows ? catChart._xrows[items[0].dataIndex] : null; return o ? mins(o.left) + " left to finish all" : ""; } } } }
            }
          });
        } else {
          catChart.data.labels = rows.map(function (o) { return o.label; });
          sets.forEach(function (s, i) { catChart.data.datasets[i].data = s.data; });
          catChart.update();
        }
        catChart._xrows = rows;
      } catch (e) { /* chart is a summary; the cards below still work */ }
    }
  }

  function people() {
    var box = $("wh-people"), more = $("wh-people-more");
    if (!box) return;
    var map = {};
    CAT.forEach(function (c) {
      if (!c.slug) return;
      var p = map[c.slug] || (map[c.slug] = { slug: c.slug, name: pname(c.slug), n: 0, done: 0, started: 0, left: 0, last: 0 });
      var r = S.items[c.id];
      p.n++;
      if (r) { p.started++; if (r.completed) p.done++; p.last = Math.max(p.last, r.lastWatched || 0); }
      p.left += leftOf(c.id);
    });
    var list = Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) {
      return (b.last ? 1 : 0) - (a.last ? 1 : 0) || b.last - a.last || b.n - a.n || a.name.localeCompare(b.name);
    });
    var shown = st.people ? list : list.slice(0, CHIPS);
    box.innerHTML = shown.map(function (p) {
      var pct = p.n ? Math.round(p.done / p.n * 100) : 0, all = p.done === p.n;
      var leftTxt = all ? "All watched" : p.left ? mins(p.left) + " left" : (p.n - p.done) + " to go";
      return '<button class="x-whchip' + (all ? " is-all" : p.started ? " is-on" : "") + '" type="button" data-hperson="' + esc(p.slug) + '" aria-label="' +
        esc(p.name + ": " + p.done + " of " + p.n + " watched, " + leftTxt + ". Play " + (all ? "again" : "next unwatched video")) + '">' +
        '<span class="x-whchip__ring" style="--p:' + pct + '%" aria-hidden="true"></span>' +
        '<span class="x-whchip__name">' + esc(p.name) + "</span>" +
        '<span class="x-whchip__n">' + p.done + "/" + p.n + "</span>" +
        '<span class="x-whchip__left">' + esc(leftTxt) + "</span></button>";
    }).join("");
    if (more) {
      more.hidden = list.length <= CHIPS;
      more.textContent = st.people ? "Show fewer" : "Show everyone (" + list.length + ")";
      more.setAttribute("aria-expanded", st.people ? "true" : "false");
    }
  }

  function listFor() {
    var items;
    if (st.f === "none") items = CAT.filter(function (c) { return !S.items[c.id]; });
    else {
      items = recs().filter(function (r) { return st.f === "all" || (st.f === "done" ? r.completed : !r.completed); }).map(function (r) { return BY[r.id]; });
    }
    if (st.q) {
      var terms = st.q.split(/\s+/);
      items = items.filter(function (c) { return terms.every(function (t) { return c.hay.indexOf(t) >= 0; }); });
    }
    function R(c) { return S.items[c.id] || {}; }
    var sorts = {
      recent: function (a, b) { return (R(b).lastWatched || 0) - (R(a).lastWatched || 0) || (b.y || 0) - (a.y || 0) || a.i - b.i; },
      progress: function (a, b) { return (R(b).percent || 0) - (R(a).percent || 0) || a.i - b.i; },
      left: function (a, b) { var x = leftOf(a.id) || 1e9, y = leftOf(b.id) || 1e9; return x - y || a.i - b.i; },
      long: function (a, b) { return durOf(b.id) - durOf(a.id) || a.i - b.i; },
      az: function (a, b) { return a.title.localeCompare(b.title); }
    };
    return items.sort(sorts[st.sort] || sorts.recent);
  }
  function histCard(c) {
    var r = S.items[c.id], d = durOf(c.id), t = resumeAt(c.id);
    var pct = r ? Math.round(r.percent || 0) : 0, left = leftOf(c.id);
    var prog = !r ? "Not started" + (d ? " · " + clock(d) : "")
      : r.completed ? "Watched" + (r.seconds ? " · " + mins(r.seconds) + " viewed" : "")
      : pct + "% watched" + (left ? " · " + clock(left) + " left" : "");
    var badge = !r ? "" : r.completed ? '<span class="dot">Completed</span>' : '<span class="chip">In progress</span>';
    var who = pname(c.slug);
    return '<article class="x-whcard" data-hid="' + esc(c.id) + '">' +
      '<button class="x-whcard__main" type="button" data-hplay="' + esc(c.id) + '" aria-label="' + (t ? "Resume " : "Play ") + esc(c.title) + (t ? " at " + clock(t) : "") + ". " + esc(prog) + '">' +
      '<span class="x-vcard__media">' + (c.thumb ? '<img src="' + esc(c.thumb) + '" alt="" loading="lazy" decoding="async" />' : "") +
      '<span class="x-vcard__play" aria-hidden="true">' + PLAY + "</span>" + (d ? '<span class="x-vcard__dur">' + clock(d) + "</span>" : "") + "</span>" +
      '<span class="x-whcard__body"><span class="x-whcard__title">' + esc(c.title) + "</span>" +
      '<span class="x-whcard__sub">' + esc([who, c.ch].filter(Boolean).join(" · ")) + "</span>" +
      (r ? '<span class="x-whprog" aria-hidden="true"><i style="--p:' + pct + '%"></i></span>' : "") +
      '<span class="x-whcard__prog">' + esc(prog) + "</span>" +
      (r ? '<span class="x-whcard__foot">' + badge + '<span class="x-whcard__ago">Last watched ' + esc(ago(r.lastWatched)) + "</span></span>" : "") +
      "</span></button>" +
      (r ? '<button class="x-iconbtn x-whcard__x" type="button" data-hrm="' + esc(c.id) + '" aria-label="Remove ' + esc(c.title) + ' from history" title="Remove from history">✕</button>' : "") +
      "</article>";
  }
  function renderHistory() {
    if (!sec) return;
    var cn = counts();
    var v = $("wh-videos"), h = $("wh-hours"), s = $("wh-streak");
    var secs = recs().reduce(function (a, r) { return a + (r.seconds || 0); }, 0), hrs = secs / 3600;
    if (v) v.textContent = cn.all.toLocaleString("en-US");
    if (h) h.textContent = hrs < 10 ? (Math.round(hrs * 10) / 10).toString() : Math.round(hrs).toLocaleString("en-US");
    if (s) s.textContent = String(streak());
    var fb = $("wh-filters");
    if (fb) [].forEach.call(fb.querySelectorAll("[data-whf]"), function (b) {
      var k = b.getAttribute("data-whf"), n = b.querySelector("span");
      if (n) n.textContent = String(cn[k]);
    });
    charts(cn);
    people();
    if (!grid) return;
    var list = listFor(), slice = list.slice(0, st.shown);
    var fk = doc.activeElement && grid.contains(doc.activeElement) ? [doc.activeElement.getAttribute("data-hplay") ? "data-hplay" : "data-hrm", doc.activeElement.getAttribute("data-hplay") || doc.activeElement.getAttribute("data-hrm")] : null;
    if (list.length) grid.innerHTML = slice.map(histCard).join("");
    else if (!cn.all && st.f !== "none") grid.innerHTML = '<div class="x-empty x-whempty"><p>Nothing here yet. Start any video in the Theater and it appears here, with how far you got.</p><a class="btn" href="#theater">Open the Theater</a></div>';
    else grid.innerHTML = '<p class="x-empty">No videos match. Try another filter or search.</p>';
    if (fk && fk[1]) { var f = grid.querySelector("[" + fk[0] + '="' + fk[1] + '"]'); if (f) f.focus({ preventScroll: true }); }
    var status = $("wh-status");
    if (status) status.textContent = list.length ? "Showing " + slice.length + " of " + list.length + " videos" : "";
    var more = $("wh-more");
    if (more) { var left = list.length - slice.length; more.hidden = left <= 0; more.textContent = "Load " + Math.min(PAGE, left) + " more"; }
    var ex = $("wh-export"), cl = $("wh-clear");
    if (ex) ex.disabled = !cn.all;
    if (cl) cl.disabled = !cn.all;
  }

  var rpend = 0;
  function renderAll() { renderRows(); renderHistory(); decorate(); }
  function schedule() { if (!rpend) rpend = requestAnimationFrame(function () { rpend = 0; renderAll(); }); }

  // ---------- History controls ----------
  if (sec) {
    var fb = $("wh-filters"), q = $("wh-q"), sortSel = $("wh-sort"), qt = 0;
    if (fb) fb.addEventListener("click", function (e) {
      var b = e.target.closest("[data-whf]");
      if (!b) return;
      st.f = b.getAttribute("data-whf");
      st.shown = PAGE;
      [].forEach.call(fb.querySelectorAll("[data-whf]"), function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      renderHistory();
    });
    if (q) q.addEventListener("input", function () { clearTimeout(qt); qt = setTimeout(function () { st.q = q.value.trim().toLowerCase(); st.shown = PAGE; renderHistory(); }, 120); });
    if (sortSel) sortSel.addEventListener("change", function () { st.sort = sortSel.value; st.shown = PAGE; renderHistory(); });
    var more = $("wh-more");
    if (more) more.addEventListener("click", function () { st.shown += PAGE; renderHistory(); });
    var pm = $("wh-people-more");
    if (pm) pm.addEventListener("click", function () { st.people = !st.people; people(); });
    var pbox = $("wh-people");
    if (pbox) pbox.addEventListener("click", function (e) {
      var b = e.target.closest("[data-hperson]");
      if (!b) return;
      var c = nextFor(b.getAttribute("data-hperson"));
      if (c) playItem(c.id, b);
    });
    if (grid) grid.addEventListener("click", function (e) {
      var rm = e.target.closest("[data-hrm]");
      if (rm) {
        var id = rm.getAttribute("data-hrm"), c = BY[id];
        var cards = [].slice.call(grid.querySelectorAll("[data-hrm]")), idx = cards.indexOf(rm);
        delete S.items[id];
        persist();
        renderAll();
        var left = grid.querySelectorAll("[data-hrm]");
        var f = left.length ? left[Math.min(idx, left.length - 1)] : $("wh-q");
        if (f) f.focus({ preventScroll: true });
        toast("Removed " + (c ? c.title : "video") + " from history");
        return;
      }
      var p = e.target.closest("[data-hplay]");
      if (p) playItem(p.getAttribute("data-hplay"), p);
    });

    var ex = $("wh-export");
    if (ex) ex.addEventListener("click", function () {
      var items = recs().sort(function (a, b) { return b.lastWatched - a.lastWatched; }).map(function (r) {
        var c = BY[r.id];
        return { id: r.id, title: r.title, person: r.person, person_name: pname(r.person), category: r.category, source: c && c.src === "orig" ? "hark-original" : "youtube",
          seconds_watched: Math.round(r.seconds || 0), duration: r.duration || null, percent: r.percent || 0, last_position: r.position || 0,
          last_watched: new Date(r.lastWatched).toISOString(), first_watched: r.firstWatched ? new Date(r.firstWatched).toISOString() : null, completed: !!r.completed };
      });
      var json = JSON.stringify({ exported_at: new Date().toISOString(), completed_threshold_percent: DONE, day_streak: streak(), videos: items, seconds_by_day: S.days }, null, 2);
      try {
        var url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
        var a = doc.createElement("a");
        a.href = url; a.download = "watch-history-" + dayKey(Date.now()) + ".json";
        a.style.display = "none";
        doc.body.appendChild(a); a.click(); doc.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        toast("Exported " + items.length + " video" + (items.length === 1 ? "" : "s") + " as JSON");
      } catch (e) {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json).then(function () { toast("History copied as JSON"); }, function () { toast("Export isn’t available here"); });
        else toast("Export isn’t available here");
      }
    });

    var cl = $("wh-clear"), cf = $("wh-confirm"), yes = $("wh-confirm-yes"), no = $("wh-confirm-no"), msg = $("wh-confirm-msg");
    function closeConfirm(focus) { if (cf) cf.hidden = true; if (focus && cl) cl.focus({ preventScroll: true }); }
    if (cl && cf) cl.addEventListener("click", function () {
      var n = recs().length;
      if (msg) msg.textContent = "Clear all " + n + " video" + (n === 1 ? "" : "s") + " from your watch history? This can’t be undone.";
      cf.hidden = false;
      if (no) no.focus({ preventScroll: true });
    });
    if (no) no.addEventListener("click", function () { closeConfirm(true); });
    if (cf) cf.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); closeConfirm(true); } });
    if (yes) yes.addEventListener("click", function () {
      S = blank();
      persist();
      closeConfirm(false);
      renderAll();
      var a = $("wh-q");
      if (a) a.focus({ preventScroll: true });
      toast("Watch history cleared");
    });
  }

  // Keep "2 h ago" fresh, and pick up changes from another tab.
  setInterval(function () { if (!doc.hidden) schedule(); }, 60000);
  win.addEventListener("storage", function (e) { if (e.key === KEY) { S = load(); schedule(); } });

  renderAll();
  win.HarkHistory = { get: function () { return JSON.parse(JSON.stringify(S)); }, play: playItem };
})();
