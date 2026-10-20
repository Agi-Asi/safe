
(function () {
  "use strict";
  var D = window.DATA || { people: [], clips: [] };
  function arr(v) { return Array.isArray(v) ? v : v == null || v === "" ? [] : [v]; }
  function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : null; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var P = arr(D.people).filter(function (p) { return p && p.id; }).slice().sort(function (a, b) { return (a.rank || 99) - (b.rank || 99); });
  var byId = {};
  P.forEach(function (p) { byId[p.id] = p; });
  function vid(p) { return obj(p.video); }
  function labsOf(p) { return arr(vid(p).labs); }
  function nowOf(p) { return vid(p).now || p.current_role || ""; }
  function ytOf(p) { return vid(p).youtube || obj(p.interview).youtube_id || ""; }
  function durOf(p) { return num(vid(p).duration) || num(obj(p.interview).duration_s); }
  function prox(p) { return num(obj(p.proximity_to_frontier_ai).score_0_10); }
  function cred(p) { return num(obj(p.credibility).score_0_10); }
  function fcs(p) { return arr(p.fact_checks).filter(function (f) { return f && typeof f === "object"; }); }
  function talks(p) { return arr(p.talks_podcasts).filter(function (t) { return t && typeof t === "object"; }); }
  function initials(n) { var w = String(n || "?").split(/\s+/).filter(Boolean); return ((w[0] || "?")[0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); }
  function first(n) { return String(n || "").split(" ")[0]; }
  function face(p, cls) {
    return '<span class="x-face ' + (cls || "") + '" aria-hidden="true"><b>' + esc(initials(p.name)) + "</b>" +
      (p.face ? '<img src="' + esc(p.face) + '" alt="" loading="lazy" onerror="this.remove()">' : "") + "</span>";
  }
  function fmtTime(s) {
    s = Math.max(0, Math.floor(num(s) || 0));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0");
  }
  function fmtDur(s) { s = num(s); if (!s) return ""; var m = Math.round(s / 60); return m >= 60 ? Math.floor(m / 60) + " h " + (m % 60) + " min" : m + " min"; }
  function linkify(s) {
    var out = "", last = 0, re = /https?:\/\/[^\s;,)"']+/g, m;
    s = String(s == null ? "" : s);
    while ((m = re.exec(s))) {
      var u = m[0].replace(/[.]+$/, "");
      out += esc(s.slice(last, m.index)) + '<a class="link" href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(short(u)) + "</a>";
      last = m.index + u.length;
    }
    return out + esc(s.slice(last));
  }
  function short(u) { var t = String(u).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""); return t.length > 56 ? t.slice(0, 54) + "…" : t; }
  function host(u) { return String(u).replace(/^https?:\/\/(www\.)?/, "").split("/")[0]; }

  /* verdicts */
  var VK = ["acc", "mostly", "disp", "mis", "unv", "op"];
  var VL = { acc: "Accurate", mostly: "Mostly accurate", disp: "Disputed", mis: "Misleading", unv: "Unverifiable", op: "Opinion" };
  function vkey(v) {
    v = String(v || "").toLowerCase();
    if (v.indexOf("mostly") === 0) return "mostly";
    if (v.indexOf("accurate") === 0 || v === "true" || v === "verified") return "acc";
    if (v.indexOf("disput") === 0 || v.indexOf("partly") === 0 || v.indexOf("mixed") === 0) return "disp";
    if (v.indexOf("mislead") === 0 || v.indexOf("false") === 0 || v.indexOf("inaccurate") === 0 || v.indexOf("wrong") === 0) return "mis";
    if (v.indexOf("opinion") === 0) return "op";
    return "unv";
  }
  function vbadge(v) { var k = vkey(v); return '<span class="x-vb x-vb--' + k + '" title="' + esc(v) + '">' + VL[k] + "</span>"; }
  function tallyOf(list) { var t = {}; VK.forEach(function (k) { t[k] = 0; }); list.forEach(function (f) { t[vkey(f.verdict)]++; }); return t; }
  function tallyChips(list) {
    var t = tallyOf(list);
    return '<span class="x-tally">' + VK.filter(function (k) { return t[k]; }).map(function (k) {
      return '<span class="x-vb x-vb--' + k + '" title="' + VL[k] + '"><b>' + t[k] + "</b> " + VL[k].replace("Mostly accurate", "Mostly") + "</span>";
    }).join("") + "</span>";
  }
  function meter(v, label) {
    var w = v == null ? 0 : Math.max(0, Math.min(10, v)) * 10;
    return '<div class="x-meter" role="meter" aria-valuemin="0" aria-valuemax="10" aria-valuenow="' + (v == null ? 0 : v) + '" aria-label="' + esc(label) + '"><div class="x-meter__track"><div class="x-meter__fill" style="width:' + w + '%"></div></div><span class="x-meter__num">' + (v == null ? "–" : v) + "</span></div>";
  }

  /* ---------- YouTube ---------- */
  function isSandboxed() {
    try {
      if (/github\.io$/.test(location.hostname)) return false;
      if (location.origin === "null") return true;
      if (/(^|\.)hark\.site$/.test(location.hostname)) return true;
      void document.cookie;
      return false;
    } catch (e) { return true; }
  }
  window.isSandboxed = isSandboxed;
  function directURL(id, t) { return location.href.split("#")[0] + "#v=" + encodeURIComponent(id) + "&t=" + Math.floor(t || 0); }
  function watchURL(id, t) { return "https://www.youtube.com/watch?v=" + encodeURIComponent(id) + (t ? "&t=" + Math.floor(t) + "s" : ""); }
  function embedURL(id, t, end) {
    var u = "https://www.youtube.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0&playsinline=1&enablejsapi=1&start=" + Math.floor(t || 0);
    if (end) u += "&end=" + Math.ceil(end);
    if (/^https?:/.test(location.origin)) u += "&origin=" + encodeURIComponent(location.origin);
    return u;
  }
  function thumb(id) { return "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/hqdefault.jpg"; }
  function lite(id, t, label, opts) {
    opts = opts || {};
    if (!id) return "";
    var sb = isSandboxed();
    var inner = '<img src="' + thumb(id) + '" alt="" loading="lazy" onerror="this.style.opacity=0"><span class="x-yt__btn" aria-hidden="true"></span>' +
      (opts.caption ? '<span class="x-yt__label">' + esc(opts.caption) + "</span>" : "");
    var hit = sb
      ? '<a class="x-yt__hit" href="' + esc(directURL(id, t)) + '" target="_blank" rel="noopener" aria-label="Play ' + esc(label) + ' in a new tab">' + inner + "</a>"
      : '<button class="x-yt__hit" type="button" aria-label="Play ' + esc(label) + '">' + inner + "</button>";
    return '<div class="x-yt"' + (opts.id ? ' id="' + opts.id + '"' : "") + ' data-yt="' + esc(id) + '" data-t="' + Math.floor(t || 0) + '"' + (opts.end ? ' data-end="' + opts.end + '"' : "") + ">" + hit +
      '<a class="x-yt__ext" href="' + esc(watchURL(id, t)) + '" target="_blank" rel="noopener">YouTube ↗</a></div>';
  }
  function activate(box, t) {
    if (t != null) box.setAttribute("data-t", Math.floor(t));
    var id = box.getAttribute("data-yt"), s = +box.getAttribute("data-t") || 0, end = +box.getAttribute("data-end") || 0;
    if (isSandboxed()) { window.open(directURL(id, s), "_blank", "noopener"); return; }
    if (!box._poster) box._poster = box.innerHTML;
    var f = document.createElement("iframe");
    f.src = embedURL(id, s, end);
    f.title = "YouTube video player";
    f.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    f.setAttribute("allowfullscreen", "");
    f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    var ok = false;
    f.addEventListener("load", function () { ok = true; ytListen(f); });
    box.innerHTML = "";
    box.appendChild(f);
    box.classList.add("is-on");
    box._frame = f;
    clearTimeout(box._to);
    box._to = setTimeout(function () {
      if (ok) return;
      box.innerHTML = box._poster;
      box.classList.remove("is-on");
      box._frame = null;
      var h = box.querySelector(".x-yt__hit");
      if (h) {
        var a = document.createElement("a");
        a.className = "x-yt__hit"; a.href = watchURL(id, s); a.target = "_blank"; a.rel = "noopener";
        a.setAttribute("aria-label", "Open on YouTube");
        a.innerHTML = h.innerHTML;
        h.replaceWith(a);
      }
      box.insertAdjacentHTML("beforeend", '<span class="x-yt__note">Couldn’t load here. Tap to open on YouTube.</span>');
    }, 6000);
  }
  function ytCmd(f, func, args) {
    try { f.contentWindow.postMessage(JSON.stringify({ event: "command", func: func, args: args || [] }), "*"); } catch (e) { /* frame gone */ }
  }
  function ytListen(f) {
    try {
      f.contentWindow.postMessage(JSON.stringify({ event: "listening", id: "x", channel: "widget" }), "*");
      ytCmd(f, "addEventListener", ["onStateChange"]);
    } catch (e) { /* frame gone */ }
  }
  function seek(box, s) {
    if (!box) return;
    if (isSandboxed()) { window.open(directURL(box.getAttribute("data-yt"), s), "_blank", "noopener"); return; }
    if (box._frame && box.classList.contains("is-on")) {
      ytCmd(box._frame, "seekTo", [Math.floor(s), true]);
      ytCmd(box._frame, "playVideo");
      box.setAttribute("data-t", Math.floor(s));
    } else activate(box, s);
    box.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "center" });
  }

  /* ---------- video library ---------- */
  var LIB = (function () {
    var seen = {}, out = [];
    P.forEach(function (p) {
      var id = ytOf(p);
      if (id && !seen[id]) { seen[id] = 1; out.push({ id: id, t: 0, who: p.id, kind: "interview", title: p.name + " · frominside.ai interview", sub: "From Inside AI · " + fmtDur(durOf(p)), dur: durOf(p) }); }
    });
    P.forEach(function (p) {
      talks(p).forEach(function (t) {
        var id = t.youtube_id_if_any;
        if (!id || seen[id]) return;
        seen[id] = 1;
        out.push({ id: id, t: 0, who: p.id, kind: "talk", title: t.title || "Talk", sub: [t.show, t.date].filter(Boolean).join(" · "), durText: t.duration_if_known || "" });
      });
    });
    return out;
  })();

  /* ---------- theater ---------- */
  var TH = { q: [], i: 0, auto: true, timer: null };
  var thEl = $("#x-theater");
  function openTheater(queue, i) {
    if (!queue || !queue.length) return;
    TH.q = queue; TH.i = Math.max(0, Math.min(i || 0, queue.length - 1));
    thEl.hidden = false;
    document.body.style.overflow = "hidden";
    renderTheater();
  }
  function closeTheater() {
    clearInterval(TH.timer);
    thEl.hidden = true;
    thEl.innerHTML = "";
    document.body.style.overflow = "";
    if (/^#v=/.test(location.hash)) history.replaceState(null, "", "#/");
  }
  function renderTheater() {
    clearInterval(TH.timer);
    var it = TH.q[TH.i], p = byId[it.who] || { name: "" };
    thEl.innerHTML = '<div class="x-theater" role="dialog" aria-modal="true" aria-label="Theater">' +
      '<div class="x-theater__top"><div><h2>' + esc(it.title) + "</h2><small>" + esc(it.sub || "") + (it.t ? " · from " + fmtTime(it.t) : "") + "</small></div>" +
      '<button class="x-close" type="button" data-close-theater aria-label="Close theater">×</button></div>' +
      '<div><div id="th-box">' + lite(it.id, it.t, it.title, { id: "th-player", end: it.end }) + '</div><div id="th-count"></div>' +
      (it.quote ? '<p class="x-quote" style="margin-top:14px">“' + esc(it.quote) + '”</p>' : "") +
      (p.id ? '<div class="links" style="margin-top:14px"><a class="btn" href="#/p/' + p.id + '" data-close-theater>' + esc(first(p.name)) + "’s dossier</a></div>" : "") + "</div>" +
      '<div class="x-upnext"><div class="x-upnext__head"><span>Up next · ' + (TH.i + 1) + " / " + TH.q.length + '</span><label><input type="checkbox" id="th-auto"' + (TH.auto ? " checked" : "") + "> Autoplay</label></div>" +
      TH.q.map(function (q, j) {
        return '<button class="x-up" type="button" data-th="' + j + '"' + (j === TH.i ? ' aria-current="true"' : "") + '><img src="' + thumb(q.id) + '" alt="" loading="lazy"><span><b>' + esc(q.title) + "</b><small>" + esc(q.sub || "") + (q.t ? " · " + fmtTime(q.t) : "") + "</small></span></button>";
      }).join("") + "</div></div>";
    var box = $("#th-player");
    if (!isSandboxed()) activate(box);
    var cur = $(".x-up[aria-current]", thEl);
    if (cur) cur.scrollIntoView({ block: "nearest" });
    $("#th-auto").addEventListener("change", function (e) { TH.auto = e.target.checked; });
  }
  function theaterNext() {
    if (TH.i < TH.q.length - 1) { TH.i++; renderTheater(); }
  }
  function onEnded() {
    if (thEl.hidden || !TH.auto || TH.i >= TH.q.length - 1) return;
    var n = 5, nx = TH.q[TH.i + 1], c = $("#th-count");
    function draw() { c.innerHTML = '<div class="x-countdown"><span>Up next in ' + n + "s: <b>" + esc(nx.title) + '</b></span><span><button type="button" data-th="' + (TH.i + 1) + '">Play now</button> <button type="button" id="th-cancel">Cancel</button></span></div>'; }
    draw();
    clearInterval(TH.timer);
    TH.timer = setInterval(function () { n--; if (n <= 0) { clearInterval(TH.timer); theaterNext(); } else draw(); }, 1000);
    $("#th-cancel").onclick = function () { clearInterval(TH.timer); c.innerHTML = ""; };
  }
  window.addEventListener("message", function (e) {
    if (!/youtube(-nocookie)?\.com$/.test(String(e.origin).replace(/^https?:\/\//, "").split(":")[0])) return;
    var d; try { d = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch (x) { return; }
    if (!d) return;
    var ended = (d.event === "onStateChange" && d.info === 0) || (d.event === "infoDelivery" && d.info && d.info.playerState === 0);
    var box = $("#th-player");
    if (ended && box && box._frame && e.source === box._frame.contentWindow) onEnded();
  });
  function openVideo(id, t) {
    var i = -1;
    LIB.forEach(function (x, j) { if (x.id === id && i < 0) i = j; });
    var q;
    if (i >= 0) { q = LIB.slice(i).concat(LIB.slice(0, i)).map(function (x) { return Object.assign({}, x); }); q[0].t = t || 0; }
    else q = [{ id: id, t: t || 0, title: "Video", sub: "" }].concat(LIB);
    openTheater(q, 0);
  }
  function interviewItem(p, t, extra) {
    return Object.assign({ id: ytOf(p), t: t || 0, who: p.id, kind: "interview", title: p.name + " · frominside.ai interview", sub: labsOf(p).join(", ") }, extra || {});
  }

  /* ---------- motion (HLS) ---------- */
  var MBASE = "https://agi-asi.github.io/safe/frominside/motion/";
  var MOTION = ["overview", "geoffrey", "neel", "victoria", "juan", "alex", "andreas", "mary", "daniel", "jeffrey", "rosie", "vishal", "jeremy"];
  var hlsP = null, live = [];
  function loadHls() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (!hlsP) hlsP = new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/hls.js@1";
      s.onload = function () { window.Hls ? res(window.Hls) : rej(); };
      s.onerror = function () { hlsP = null; rej(); };
      document.head.appendChild(s);
    });
    return hlsP;
  }
  function motionTitle(id) { return id === "overview" ? "Overview: the 12 insiders" : byId[id] ? byId[id].name : id; }
  function motionCard(id) {
    return '<div class="x-motion" data-motion="' + id + '"><img class="x-motion__poster" src="' + MBASE + id + '.jpg" alt="" loading="lazy" onerror="this.style.display=\'none\'">' +
      '<span class="x-motion__name">' + esc(motionTitle(id)) + "</span>" +
      '<button class="x-motion__play" type="button" aria-label="Play motion explainer: ' + esc(motionTitle(id)) + '"><span class="x-yt__btn" aria-hidden="true"></span></button>' +
      '<p class="x-motion__msg">Motion video loading soon</p></div>';
  }
  function startMotion(box) {
    var id = box.getAttribute("data-motion"), url = MBASE + id + "/index.m3u8";
    var v = document.createElement("video");
    v.controls = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.poster = MBASE + id + ".jpg";
    var done = false, hls = null;
    function fail() {
      if (done) return; done = true;
      clearTimeout(to);
      if (hls) { try { hls.destroy(); } catch (e) { /* ignore */ } }
      v.remove(); box.classList.remove("is-on"); box.classList.add("is-failed");
    }
    function ok() { done = true; clearTimeout(to); var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
    var to = setTimeout(fail, 12000);
    v.addEventListener("loadedmetadata", ok, { once: true });
    v.addEventListener("error", fail);
    box.classList.add("is-on");
    box.appendChild(v);
    if (v.canPlayType("application/vnd.apple.mpegurl")) { v.src = url; }
    else {
      loadHls().then(function (Hls) {
        if (!Hls.isSupported()) return fail();
        hls = new Hls();
        live.push(hls);
        hls.on(Hls.Events.ERROR, function (e, d) { if (d && d.fatal) fail(); });
        hls.loadSource(url);
        hls.attachMedia(v);
      }).catch(fail);
    }
  }

  /* ---------- command palette ---------- */
  var palEl = $("#x-palette"), palSel = 0;
  var VIEWS = [["#/", "Home", "Trust leaderboard and map", "H"], ["#/facts", "Fact-check explorer", "All fact-checks, filtered", "F"], ["#/answers", "Five questions", "What each insider answered", "A"], ["#/watch", "Video library", "Interviews and talks", "W"], ["#/motion", "Motion explainers", "13 short films", "M"], ["#/compare", "Compare", "Two or three side by side", "C"]];
  function palItems(q) {
    q = q.trim().toLowerCase();
    var items = P.map(function (p) { return { href: "#/p/" + p.id, icon: face(p, "x-face--sm"), title: p.name, sub: "#" + p.rank + " · " + labsOf(p).join(", ") + (nowOf(p) ? " · " + nowOf(p) : ""), key: (p.name + " " + labsOf(p).join(" ") + " " + nowOf(p)).toLowerCase() }; })
      .concat(VIEWS.map(function (v) { return { href: v[0], icon: '<span class="x-pal__icon">' + v[3] + "</span>", title: v[1], sub: v[2], key: (v[1] + " " + v[2]).toLowerCase() }; }));
    return q ? items.filter(function (i) { return q.split(/\s+/).every(function (w) { return i.key.indexOf(w) >= 0; }); }) : items;
  }
  function openPalette() {
    palEl.hidden = false;
    palEl.innerHTML = '<div class="x-pal" role="dialog" aria-modal="true" aria-label="Jump to"><input id="pal-q" type="text" placeholder="Jump to a person or view…" autocomplete="off" aria-label="Search people and views"><ul id="pal-list" role="listbox"></ul>' +
      '<div class="x-pal__help"><span><kbd>⌘K</kbd> palette</span><span><kbd>H</kbd> home</span><span><kbd>F</kbd> facts</span><span><kbd>A</kbd> answers</span><span><kbd>W</kbd> watch</span><span><kbd>M</kbd> motion</span><span><kbd>C</kbd> compare</span><span><kbd>←</kbd><kbd>→</kbd> prev / next person</span><span><kbd>Esc</kbd> close</span></div></div>';
    var inp = $("#pal-q");
    palSel = 0;
    drawPal("");
    inp.addEventListener("input", function () { palSel = 0; drawPal(inp.value); });
    inp.addEventListener("keydown", function (e) {
      var n = $$("#pal-list a").length;
      if (e.key === "ArrowDown") { e.preventDefault(); palSel = (palSel + 1) % Math.max(n, 1); drawPal(inp.value); }
      else if (e.key === "ArrowUp") { e.preventDefault(); palSel = (palSel - 1 + n) % Math.max(n, 1); drawPal(inp.value); }
      else if (e.key === "Enter") { var a = $$("#pal-list a")[palSel]; if (a) { location.hash = a.getAttribute("href"); closePalette(); } }
    });
    setTimeout(function () { inp.focus(); }, 20);
  }
  function drawPal(q) {
    var items = palItems(q);
    $("#pal-list").innerHTML = items.length ? items.map(function (i, j) {
      return '<li><a href="' + i.href + '" role="option" data-pal' + (j === palSel ? ' aria-selected="true"' : "") + ">" + i.icon + "<span><b>" + esc(i.title) + "</b><small>" + esc(i.sub) + "</small></span></a></li>";
    }).join("") : '<li class="x-empty">No match</li>';
    var s = $('#pal-list [aria-selected="true"]');
    if (s) s.scrollIntoView({ block: "nearest" });
  }
  function closePalette() { palEl.hidden = true; palEl.innerHTML = ""; }

  /* ---------- shared bits ---------- */
  var ALLFC = [];
  P.forEach(function (p) { fcs(p).forEach(function (f, i) { ALLFC.push({ p: p, f: f, i: i }); }); });
  var LABS = {};
  P.forEach(function (p) { labsOf(p).forEach(function (l) { LABS[l] = 1; }); });
  var NTALKS = P.reduce(function (s, p) { return s + talks(p).length; }, 0);
  function head(title, sub, eyebrow) {
    return '<div class="head">' + (eyebrow ? '<p class="head__eyebrow">' + esc(eyebrow) + "</p>" : "") + "<h2>" + title + "</h2>" + (sub ? '<p class="head__sub">' + sub + "</p>" : "") + "</div>";
  }
  function ul(items) { items = arr(items); return items.length ? "<ul>" + items.map(function (x) { return "<li>" + linkify(x) + "</li>"; }).join("") + "</ul>" : '<p class="fineprint">None listed.</p>'; }
  function tsBtn(t, target, extra) {
    if (num(t) == null) return '<span class="x-sub">No time</span>';
    return '<button class="x-ts" type="button" data-seek="' + Math.floor(t) + '"' + (target ? ' data-target="' + target + '"' : "") + (extra || "") + ' aria-label="Play from ' + fmtTime(t) + '">' + fmtTime(t) + "</button>";
  }
  function srcLinks(list) {
    list = arr(list);
    if (!list.length) return "";
    return '<span class="x-srcs">' + list.map(function (s) {
      var m = String(s).match(/https?:\/\/[^\s;,)"']+/);
      return m ? '<a href="' + esc(m[0]) + '" target="_blank" rel="noopener">' + esc(host(m[0])) + "</a>" : "<span>" + esc(s) + "</span>";
    }).join("") + "</span>";
  }

  /* ---------- Home ---------- */
  function viewHome() {
    var labs = Object.keys(LABS);
    var html = '<section class="hero"><div class="hero__copy"><p class="hero__eyebrow">frominside.ai · Palisade Research · Oct 2026</p><h1>Ask who’s asking.</h1>' +
      '<p class="hero__sub">Twelve current and former staff of ' + esc(labs.join(", ").replace(/, ([^,]*)$/, " and $1")) + ' spoke on camera. Here is who each person is, how close they sit to frontier AI, and whether their claims hold up.</p>' +
      '<p class="hero__meta">Press <b>⌘K</b> to jump to anyone</p></div></section>' +
      '<section class="stats">' +
      '<div class="stat"><span class="stat__fig">' + P.length + '</span><span class="stat__label">Insiders</span></div>' +
      '<div class="stat"><span class="stat__fig">' + ALLFC.length + '</span><span class="stat__label">Fact-checks</span></div>' +
      '<div class="stat"><span class="stat__fig">' + NTALKS + '</span><span class="stat__label">Talks and podcasts catalogued</span></div>' +
      '<div class="stat"><span class="stat__fig">' + labs.length + '</span><span class="stat__label">Labs</span></div></section>';
    html += '<section class="section" id="board">' + head("The trust leaderboard, ranked.", "Proximity is how close each person worked to frontier models; credibility weighs track record, conflicts and how their claims checked out. Both 0 to 10.") +
      '<div><div class="x-boardhead"><span>#</span><span></span><span>Insider</span><span>Proximity</span><span>Credibility</span><span>Fact-check verdicts</span></div><div class="x-board">' +
      P.map(function (p) {
        return '<a class="x-row" href="#/p/' + p.id + '"><span class="x-row__rank">' + (p.rank || "") + "</span>" + face(p) +
          '<span class="x-row__name">' + esc(p.name) + "<small>" + esc(labsOf(p).join(", ")) + (vid(p).formerly ? " (former)" : "") + (nowOf(p) ? " · " + esc(nowOf(p)) : "") + "</small></span>" +
          '<span class="x-cell"><span class="x-lbl">Proximity</span>' + meter(prox(p), "Proximity") + "</span>" +
          '<span class="x-cell"><span class="x-lbl">Credibility</span>' + meter(cred(p), "Credibility") + "</span>" +
          '<span class="x-cell">' + tallyChips(fcs(p)) + "</span></a>";
      }).join("") + "</div></div></section>";
    var t = tallyOf(ALLFC.map(function (x) { return x.f; }));
    var solid = t.acc + t.mostly;
    html += '<section class="section" id="map">' + head("Closer to the frontier, mostly more credible.", "Hover or tap a face for the name; click to open the dossier.") +
      '<div class="pair"><div class="x-panel"><p class="x-panel__cap">Proximity against credibility<small>Editorial scores, 0 to 10</small></p>' + scatter() + "</div>" +
      '<figure class="chart" style="margin:0"><figcaption class="chart__cap">' + solid + " of " + ALLFC.length + " checked claims were accurate or mostly accurate<small>Verdicts across all " + ALLFC.length + ' fact-checks</small></figcaption><div class="x-donut"><canvas id="donut" role="img" aria-label="' + VK.map(function (k) { return t[k] + " " + VL[k]; }).join(", ") + '"></canvas></div></figure></div></section>';
    var jl = byId.jeffrey, js = byId.jeremy;
    html += '<aside class="callout" aria-label="Caveat"><p class="callout__head">Read with care</p><p class="callout__lead"><strong>This sample is not representative.</strong> frominside’s own FAQ says so: these twelve chose to speak.</p>' +
      '<p class="fineprint">Palisade Research produced the series. ' + (jl ? '<a class="link" href="#/p/jeffrey">Jeffrey Ladish</a>' : "Jeffrey Ladish") + " is Palisade’s Executive Director and " + (js ? '<a class="link" href="#/p/jeremy">Jeremy Schlatter</a>' : "Jeremy Schlatter") + " works there, so two of the twelve speak for the producer.</p>" +
      '<div class="links"><a class="btn" href="#/facts">Explore the fact-checks</a><a class="btn" href="https://frominside.ai" target="_blank" rel="noopener">frominside.ai</a></div></aside>';
    return { html: html, after: function () { drawDonut(t); } };
  }
  function scatter() {
    var W = 420, H = 320, L = 40, R = 16, T = 16, B = 40, x0 = 2, x1 = 10, y0 = 4, y1 = 10;
    function X(v) { return L + ((v - x0) / (x1 - x0)) * (W - L - R); }
    function Y(v) { return H - B - ((v - y0) / (y1 - y0)) * (H - T - B); }
    var g = "";
    for (var v = x0; v <= x1; v += 2) g += '<line class="gr" x1="' + X(v) + '" x2="' + X(v) + '" y1="' + T + '" y2="' + (H - B) + '"/><text x="' + X(v) + '" y="' + (H - B + 18) + '" text-anchor="middle">' + v + "</text>";
    for (var u = y0; u <= y1; u += 2) g += '<line class="gr" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(u) + '" y2="' + Y(u) + '"/><text x="' + (L - 10) + '" y="' + (Y(u) + 4) + '" text-anchor="end">' + u + "</text>";
    g += '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/><line class="ax" x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + (H - B) + '"/>';
    g += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 4) + '" text-anchor="middle">Proximity to frontier AI →</text><text transform="translate(12 ' + ((T + H - B) / 2) + ') rotate(-90)" text-anchor="middle">Credibility →</text>';
    var groups = {};
    P.forEach(function (p) { if (prox(p) == null || cred(p) == null) return; var k = prox(p) + "|" + cred(p); (groups[k] = groups[k] || []).push(p); });
    var pts = "", r = 15;
    Object.keys(groups).forEach(function (k) {
      var list = groups[k], n = list.length;
      list.forEach(function (p, i) {
        var cx = X(prox(p)), cy = Y(cred(p));
        if (n > 1) { var a = (i / n) * Math.PI * 2 - Math.PI / 2, d = n === 2 ? 11 : 15; cx += Math.cos(a) * d; cy += Math.sin(a) * d; }
        var cid = "c-" + p.id;
        pts += '<a class="pt" href="#/p/' + p.id + '" tabindex="0" aria-label="' + esc(p.name) + ": proximity " + prox(p) + ", credibility " + cred(p) + '"><title>' + esc(p.name) + " · " + prox(p) + " / " + cred(p) + "</title>" +
          '<clipPath id="' + cid + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/></clipPath>' +
          '<circle class="hit" cx="' + cx + '" cy="' + cy + '" r="30"/><circle class="ring" cx="' + cx + '" cy="' + cy + '" r="' + (r + 1) + '"/><text class="ini" x="' + cx + '" y="' + cy + '">' + esc(initials(p.name)) + "</text>" +
          (p.face ? '<image href="' + esc(p.face) + '" x="' + (cx - r) + '" y="' + (cy - r) + '" width="' + 2 * r + '" height="' + 2 * r + '" clip-path="url(#' + cid + ')" preserveAspectRatio="xMidYMid slice" onerror="this.remove()"/>' : "") +
          '<text class="nm" x="' + cx + '" y="' + (cy - r - 8) + '">' + esc(p.name) + "</text></a>";
      });
    });
    return '<svg class="x-scatter" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Scatter of proximity against credibility for the twelve insiders">' + g + pts + "</svg>";
  }
  var charts = [];
  function drawDonut(t) {
    var cv = $("#donut");
    if (!cv || !window.Chart) return;
    var keys = VK.filter(function (k) { return t[k]; });
    charts.push(new Chart(cv, {
      type: "doughnut",
      data: { labels: keys.map(function (k) { return VL[k]; }), datasets: [{ data: keys.map(function (k) { return t[k]; }), backgroundColor: keys.map(function (k) { return "var(--x-v-" + k + ")"; }) }] },
      options: { cutout: "60%", plugins: { legend: { position: "bottom" }, datalabels: window.Hark && Hark.labels ? Hark.labels.percent : undefined } },
    }));
  }

  /* ---------- Dossier ---------- */
  function gauge(label, v, rationale) {
    var c = 2 * Math.PI * 50;
    return '<div class="x-panel x-gauge"><div class="x-gauge__dial"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="bg" cx="60" cy="60" r="50"/><circle class="fg" cx="60" cy="60" r="50" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" data-off="' + (c * (1 - (v || 0) / 10)) + '"/></svg>' +
      '<span class="x-gauge__num"><span><span data-count="' + (v || 0) + '">0</span><small>/10</small></span></span></div><div><h3>' + esc(label) + "</h3><p>" + esc(rationale || "") + "</p></div></div>";
  }
  function animateGauges() {
    $$(".x-gauge .fg").forEach(function (c) { requestAnimationFrame(function () { requestAnimationFrame(function () { c.style.strokeDashoffset = c.getAttribute("data-off"); }); }); });
    $$("[data-count]").forEach(function (el) {
      var to = +el.getAttribute("data-count"), dec = to % 1 ? 1 : 0;
      if (REDUCE) { el.textContent = to.toFixed(dec); return; }
      var t0 = performance.now();
      (function step(now) { var k = Math.min(1, (now - t0) / 1200), e = 1 - Math.pow(1 - k, 3); el.textContent = (to * e).toFixed(dec); if (k < 1) requestAnimationFrame(step); })(t0);
    });
  }
  function matchClaim(text, list) {
    var words = String(text).toLowerCase().match(/[a-z0-9%~.]{4,}|\d+/g) || [], best = null, bs = 0;
    list.forEach(function (f) {
      if (num(f.timestamp_s) == null) return;
      var c = String(f.claim || "").toLowerCase(), s = 0;
      words.forEach(function (w) { if (c.indexOf(w.replace(/[.]+$/, "")) >= 0) s += /\d/.test(w) ? 2 : 1; });
      if (s > bs) { bs = s; best = f; }
    });
    return bs >= 2 ? best : null;
  }
  function viewPerson(id) {
    var p = byId[id];
    if (!p) return { html: '<div class="x-empty">No one with that id. <a class="link" href="#/">Back home</a></div>' };
    var i = P.indexOf(p), prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
    var cr = obj(p.credibility), px = obj(p.proximity_to_frontier_ai), iv = obj(p.interview), list = fcs(p), rm = obj(p.research_metrics);
    var html = '<section class="hero">' + (p.still ? '<img class="hero__img" src="' + esc(p.still) + '" alt="' + esc(p.name) + ' in the frominside.ai interview" onerror="this.remove()">' : "") +
      '<div class="hero__copy"><div class="x-hero-face">' + face(p, "x-face--lg") + '</div><p class="hero__eyebrow">Rank ' + p.rank + " of " + P.length + " · " + esc(labsOf(p).join(", ")) + (vid(p).formerly ? " (former)" : "") + "</p>" +
      "<h1>" + esc(p.name) + '</h1><p class="hero__sub">' + esc(nowOf(p) || p.headline || "") + "</p>" + (p.location_if_public ? '<p class="hero__meta">' + esc(p.location_if_public) + "</p>" : "") + "</div>" +
      '<aside class="callout" aria-label="Watch"><p class="callout__head">The interview</p><p class="callout__lead"><strong>' + fmtDur(durOf(p) || iv.duration_s) + " on camera.</strong> " + list.length + " claims fact-checked.</p><a class=\"btn\" href=\"#interview\" data-jump=\"interview\">Watch and check</a></aside></section>";
    html += '<div class="x-gauges">' + gauge("Proximity to frontier AI", prox(p), px.rationale) + gauge("Credibility", cred(p), "") + "</div>";
    html += '<section class="section" id="trust">' + head("Should I trust them?") +
      '<aside class="callout" aria-label="Verdict"><p class="callout__head">Verdict</p><p class="callout__lead">' + linkify(cr.verdict || "No verdict recorded.") + "</p></aside>" +
      '<div class="cards x-trustcards"><div style="--x-c:var(--x-v-acc)"><h3>Strengths</h3>' + ul(cr.strengths) + '</div><div style="--x-c:var(--x-v-disp)"><h3>Conflicts of interest</h3>' + ul(cr.conflicts_of_interest) + '</div><div style="--x-c:var(--x-v-unv)"><h3>Caveats</h3>' + ul(cr.caveats) + "</div></div></section>";
    html += '<section class="section" id="stance">' + head("Where they stand") + '<div class="prose"><p>' + linkify(p.stance_summary || "") + "</p></div>" +
      (arr(p.expertise).length ? '<div class="x-pills">' + arr(p.expertise).map(function (e) { return '<span class="pill">' + esc(e) + "</span>"; }).join("") + "</div>" : "") +
      (p.expertise_detail ? '<div class="prose"><p>' + linkify(p.expertise_detail) + "</p></div>" : "") + "</section>";
    var claims = arr(iv.key_claims);
    html += '<section class="section" id="interview">' + head("The frominside interview", "Tap a claim or a timestamp to jump the player there.") +
      lite(ytOf(p), 0, p.name + " interview", { id: "dossier-player", caption: p.name + " · " + fmtDur(durOf(p)) }) +
      (claims.length ? '<div><p class="x-lbl">Key claims</p>' + claims.map(function (c) {
        var m = matchClaim(c, list);
        return m ? '<button class="x-claim" type="button" data-seek="' + Math.floor(m.timestamp_s) + '" data-target="dossier-player"><span class="x-ts" aria-hidden="true">' + fmtTime(m.timestamp_s) + "</span><span>" + esc(c) + "</span></button>"
          : '<div class="x-claim x-claim--plain"><span>' + esc(c) + "</span></div>";
      }).join("") + "</div>" : "") +
      (arr(iv.topics).length ? '<div class="x-pills">' + arr(iv.topics).map(function (t) { return '<span class="pill">' + esc(t) + "</span>"; }).join("") + "</div>" : "") + "</section>";
    if (MOTION.indexOf(p.id) >= 0) html += '<section class="section" id="motion">' + head("Motion explainer", "A short animated summary of " + esc(first(p.name)) + "’s interview.") + motionCard(p.id) + "</section>";
    html += '<section class="section" id="facts">' + head(list.length + " claims, checked", tallyChips(list)) + (list.length ? factTable(list.map(function (f) { return { p: p, f: f }; }), "dossier-player") : '<p class="fineprint">No fact-checks recorded.</p>') + "</section>";
    var career = arr(p.career).filter(function (c) { return c && typeof c === "object"; });
    var edu = arr(p.education).filter(function (e) { return e; });
    html += '<section class="section" id="career">' + head("Career and education") + '<div class="pair">' +
      (career.length ? '<ol class="timeline">' + career.slice().reverse().map(function (c) {
        var cur = !c.end || /present|now|current/i.test(c.end);
        return "<li" + (cur ? ' class="is-current"' : "") + '><p class="timeline__when">' + esc(c.start || "?") + " – " + esc(c.end || "now") + '</p><div class="timeline__what"><strong>' + esc(c.role || "") + "</strong>" + (c.org ? ", " + esc(c.org) : "") + (c.what_they_did ? '<br><span class="x-sub">' + esc(c.what_they_did) + "</span>" : "") + "</div></li>";
      }).join("") + "</ol>" : "<div></div>") +
      (edu.length ? '<div class="breakdown"><dl>' + edu.map(function (e) {
        if (typeof e === "string") return '<div class="row"><dt>' + esc(e) + "</dt><dd></dd></div>";
        return '<div class="row"><dt>' + esc(e.school || e.institution || "") + "<small>" + esc(e.degree || "") + "</small></dt><dd>" + esc(e.years || e.year || "") + "</dd></div>";
      }).join("") + "</dl></div>" : "") + "</div></section>";
    var nw = arr(p.notable_work).filter(function (w) { return w && typeof w === "object"; });
    if (nw.length) html += '<section class="section" id="work">' + head("Notable work") + '<div class="cards">' + nw.map(function (w) {
      return '<div><p class="x-pills">' + (w.type ? '<span class="pill">' + esc(w.type) + "</span>" : "") + (w.year ? '<span class="pill">' + esc(w.year) + "</span>" : "") + "</p><h3>" + (w.url ? '<a class="link" href="' + esc(w.url) + '" target="_blank" rel="noopener">' + esc(w.title) + "</a>" : esc(w.title)) + "</h3><p>" + esc(w.why_it_matters || "") + "</p></div>";
    }).join("") + "</div></section>";
    if (rm.citations_approx != null || rm.h_index_approx != null) {
      var cit = num(rm.citations_approx) != null && /^\d+$/.test(String(rm.citations_approx)) ? (+rm.citations_approx).toLocaleString() : rm.citations_approx;
      var long = cit && String(cit).length > 10;
      html += '<section class="section" id="metrics">' + head("Research footprint", rm.as_of ? "Approximate, as of " + esc(rm.as_of) : "") +
        '<section class="stats"><div class="stat"><span class="stat__fig">' + esc(long ? String(cit).match(/[~\d,–-]+/) ? String(cit).match(/[~\d,–-]+/)[0] : "–" : cit != null ? cit : "–") + '</span><span class="stat__label">Citations</span></div><div class="stat"><span class="stat__fig">' + esc(rm.h_index_approx != null ? rm.h_index_approx : "–") + '</span><span class="stat__label">h-index</span></div></section>' +
        (long ? '<p class="fineprint">' + esc(cit) + "</p>" : "") +
        (rm.google_scholar_url ? '<div class="links"><a class="btn" href="' + esc(rm.google_scholar_url) + '" target="_blank" rel="noopener">Google Scholar</a></div>' : "") + "</section>";
    }
    var tk = talks(p);
    if (tk.length) html += '<section class="section" id="talks">' + head("Talks and podcasts", tk.length + " catalogued") + '<div class="x-list">' + tk.map(function (t, j) {
      var y = t.youtube_id_if_any;
      return '<div class="x-item"><div class="x-item__body"><p class="x-item__title">' + esc(t.title || "") + '</p><p class="x-sub">' + esc([t.show, t.date, t.duration_if_known].filter(Boolean).join(" · ")) + '</p><div id="talk-' + j + '"></div></div><div class="x-item__acts">' +
        (y ? '<button class="btn" type="button" data-talk="' + j + '" data-yt-id="' + esc(y) + '">Play</button>' : "") + (t.url ? '<a class="btn" href="' + esc(t.url) + '" target="_blank" rel="noopener">' + (y ? "Link" : "Open") + " ↗</a>" : "") + "</div></div>";
    }).join("") + "</div></section>";
    var wc = arr(p.writing_channels).filter(function (w) { return w && w.url; });
    if (wc.length) html += '<section class="section" id="writing">' + head("Where they write") + '<div class="links">' + wc.map(function (w) { return '<a class="btn" href="' + esc(w.url) + '" target="_blank" rel="noopener">' + esc(w.name || host(w.url)) + "</a>"; }).join("") + "</div></section>";
    if (p.controversies_or_public_departures) html += '<div class="aside"><h3>Controversies and departures</h3><p class="fineprint">' + linkify(arr(p.controversies_or_public_departures).join(" ")) + "</p></div>";
    if (arr(p.sources).length) html += '<section class="section" id="sources">' + head("Sources") + '<ol class="x-src">' + arr(p.sources).map(function (s) { return "<li>" + linkify(s) + "</li>"; }).join("") + "</ol>" + (p.notes ? '<p class="fineprint">' + esc(p.notes) + "</p>" : "") + "</section>";
    html += '<nav class="x-pn" aria-label="Other insiders"><a href="#/p/' + prev.id + '">' + face(prev, "x-face--sm") + "<span><span class=\"x-sub\">← Previous</span><b>" + esc(prev.name) + "</b></span></a>" +
      '<a href="#/p/' + next.id + '"><span><span class="x-sub">Next →</span><b>' + esc(next.name) + "</b></span>" + face(next, "x-face--sm") + "</a></nav>";
    return { html: html, title: p.name, after: animateGauges };
  }
  function factTable(rows, target) {
    return '<div class="table-wrap"><table><thead><tr><th scope="col">Claim</th><th scope="col">Time</th><th scope="col">Verdict</th><th scope="col">Evidence</th><th scope="col">Sources</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var f = r.f;
        var ts = target ? tsBtn(f.timestamp_s, target) : tsBtn(f.timestamp_s, "", ' data-who="' + r.p.id + '"');
        return "<tr><th scope=\"row\">" + (target ? "" : '<span class="x-sub" style="display:flex;gap:8px;align-items:center;margin:0 0 6px">' + face(r.p, "x-face--sm") + '<a class="link" href="#/p/' + r.p.id + '">' + esc(r.p.name) + "</a></span>") +
          "“" + esc(f.claim || "") + "”<small>" + esc(f.type || "") + "</small></th>" +
          '<td data-label="Time">' + ts + '</td><td data-label="Verdict">' + vbadge(f.verdict) + '</td><td data-label="Evidence" class="x-ev">' + linkify(f.evidence || "") + '</td><td data-label="Sources">' + srcLinks(f.sources) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  /* ---------- Fact-check explorer ---------- */
  var FX = { v: "", p: "", t: "", q: "", sort: "rank" };
  function viewFacts() {
    var types = {};
    ALLFC.forEach(function (x) { if (x.f.type) types[x.f.type] = 1; });
    var tt = tallyOf(ALLFC.map(function (x) { return x.f; }));
    var html = '<section class="section">' + head("Every claim, checked.", ALLFC.length + " fact-checks across " + P.length + " interviews. Filter, search, then tap a timestamp to hear it said.", "Fact-check explorer") +
      '<div class="x-vfilter" role="group" aria-label="Verdict"><button class="pill" type="button" data-fv=""' + (FX.v ? "" : ' aria-pressed="true"') + ">All " + ALLFC.length + "</button>" +
      VK.filter(function (k) { return tt[k]; }).map(function (k) { return '<button class="x-vb x-vb--' + k + '" type="button" data-fv="' + k + '" aria-pressed="' + (FX.v === k) + '">' + VL[k] + " " + tt[k] + "</button>"; }).join("") + "</div>" +
      '<div class="x-filters"><input class="x-field" type="search" id="fx-q" placeholder="Search claims and evidence…" value="' + esc(FX.q) + '" aria-label="Search">' +
      '<select class="x-field" id="fx-p" aria-label="Person"><option value="">Everyone</option>' + P.map(function (p) { return '<option value="' + p.id + '"' + (FX.p === p.id ? " selected" : "") + ">" + esc(p.name) + "</option>"; }).join("") + "</select>" +
      '<select class="x-field" id="fx-t" aria-label="Type"><option value="">All types</option>' + Object.keys(types).map(function (t) { return '<option value="' + esc(t) + '"' + (FX.t === t ? " selected" : "") + ">" + esc(t) + "</option>"; }).join("") + "</select>" +
      '<select class="x-field" id="fx-s" aria-label="Sort"><option value="rank">Sort: rank</option><option value="verdict">Sort: verdict</option><option value="person">Sort: name</option><option value="time">Sort: time in interview</option></select></div>' +
      '<p class="x-count" id="fx-n" aria-live="polite"></p><div id="fx-out"></div></section>';
    return { html: html, title: "Fact-checks", after: function () {
      $("#fx-s").value = FX.sort;
      $("#fx-q").addEventListener("input", function (e) { FX.q = e.target.value; drawFacts(); });
      ["p", "t", "s"].forEach(function (k) { $("#fx-" + k).addEventListener("change", function (e) { FX[k === "s" ? "sort" : k] = e.target.value; drawFacts(); }); });
      drawFacts();
    } };
  }
  function drawFacts() {
    var q = FX.q.trim().toLowerCase();
    var rows = ALLFC.filter(function (x) {
      if (FX.v && vkey(x.f.verdict) !== FX.v) return false;
      if (FX.p && x.p.id !== FX.p) return false;
      if (FX.t && x.f.type !== FX.t) return false;
      if (q && (String(x.f.claim) + " " + String(x.f.evidence) + " " + x.p.name).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var s = FX.sort;
    rows.sort(function (a, b) {
      if (s === "verdict") return VK.indexOf(vkey(a.f.verdict)) - VK.indexOf(vkey(b.f.verdict)) || a.p.rank - b.p.rank;
      if (s === "person") return a.p.name.localeCompare(b.p.name) || a.i - b.i;
      if (s === "time") return (num(a.f.timestamp_s) || 0) - (num(b.f.timestamp_s) || 0);
      return a.p.rank - b.p.rank || a.i - b.i;
    });
    $("#fx-n").textContent = rows.length + " of " + ALLFC.length + " fact-checks";
    $("#fx-out").innerHTML = rows.length ? factTable(rows) : '<div class="x-empty">No fact-checks match. Try clearing a filter.</div>';
    $$("[data-fv]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-fv") === FX.v)); });
  }

  /* ---------- Answers ---------- */
  function clipQueue(qi) {
    var c = arr(D.clips)[qi];
    return arr(c && c.clips).filter(function (x) { return byId[x.who]; }).map(function (x) {
      var p = byId[x.who];
      return interviewItem(p, x.at, { title: p.name, sub: c.question, end: num(x.len) ? Math.ceil(num(x.at) + num(x.len)) : null, quote: x.quote });
    });
  }
  function viewAnswers() {
    var C = arr(D.clips);
    var html = '<section class="hero"><div class="hero__copy"><p class="hero__eyebrow">Five questions</p><h1>What they said, in their words.</h1><p class="hero__sub">Each quote plays from the moment it was said. In theater, the next answer to the same question follows.</p></div></section>';
    html += C.map(function (c, qi) {
      var q = clipQueue(qi);
      return '<section class="section" id="q' + qi + '">' + head(esc(c.question), q.length + " answers", "Question " + (qi + 1)) + '<div class="x-list">' +
        q.map(function (it, j) {
          var p = byId[it.who];
          return '<div class="x-item">' + face(p) + '<div class="x-item__body"><p class="x-quote">“' + esc(it.quote || "") + '”</p><p class="x-sub"><a class="link" href="#/p/' + p.id + '">' + esc(p.name) + "</a> · " + esc(labsOf(p).join(", ")) + "</p></div>" +
            '<div class="x-item__acts"><button class="btn" type="button" data-clip="' + qi + ":" + j + '">▶ Play from ' + Math.floor(it.t) + "s</button></div></div>";
        }).join("") + '</div><div class="links"><button class="btn" type="button" data-clip="' + qi + ':0">Play all ' + q.length + " answers</button></div></section>";
    }).join("");
    return { html: html, title: "Five questions" };
  }

  /* ---------- Watch ---------- */
  var WF = { p: "", k: "" };
  function viewWatch() {
    var html = '<section class="section">' + head("Every interview and talk with a video.", P.length + " frominside interviews and " + (LIB.length - P.length) + " more talks on YouTube. Pick one to open theater mode; the next video plays when it ends.", "Video library") +
      '<div class="x-filters"><select class="x-field" id="w-p" aria-label="Person"><option value="">Everyone</option>' + P.map(function (p) { return '<option value="' + p.id + '"' + (WF.p === p.id ? " selected" : "") + ">" + esc(p.name) + "</option>"; }).join("") + "</select>" +
      '<select class="x-field" id="w-k" aria-label="Kind"><option value="">Interviews and talks</option><option value="interview">frominside interviews</option><option value="talk">Other talks</option></select>' +
      '<button class="btn" type="button" id="w-all">▶ Play all in theater</button><span class="x-count" id="w-n"></span></div><div class="x-grid" id="w-out"></div></section>';
    return { html: html, title: "Watch", after: function () {
      $("#w-k").value = WF.k;
      $("#w-p").addEventListener("change", function (e) { WF.p = e.target.value; drawWatch(); });
      $("#w-k").addEventListener("change", function (e) { WF.k = e.target.value; drawWatch(); });
      $("#w-all").addEventListener("click", function () { openTheater(watchList(), 0); });
      drawWatch();
    } };
  }
  function watchList() { return LIB.filter(function (x) { return (!WF.p || x.who === WF.p) && (!WF.k || x.kind === WF.k); }); }
  function drawWatch() {
    var L = watchList();
    $("#w-n").textContent = L.length + " videos";
    $("#w-out").innerHTML = L.length ? L.map(function (x, j) {
      var p = byId[x.who];
      return '<button class="x-vcard" type="button" data-w="' + j + '"><span class="x-vcard__thumb"><img src="' + thumb(x.id) + '" alt="" loading="lazy" onerror="this.style.opacity=0">' + ((x.dur || x.durText) ? '<span class="x-vcard__dur">' + esc(x.dur ? fmtTime(x.dur) : String(x.durText).slice(0, 18)) + "</span>" : "") + "</span>" +
        '<span class="x-vcard__meta">' + face(p, "x-face--sm") + "<span><b>" + esc(x.title) + '</b><span class="x-sub">' + esc(x.sub) + "</span></span></span></button>";
    }).join("") : '<div class="x-empty">No videos for this filter.</div>';
  }

  /* ---------- Motion ---------- */
  function viewMotion() {
    var html = '<section class="section">' + head("Thirteen short motion explainers.", "One overview, then one per insider. They stream when you press play.", "Motion") +
      motionCard("overview") + '<div class="x-grid">' + MOTION.slice(1).map(function (id) {
        var p = byId[id];
        return '<div class="x-vcard" style="cursor:default">' + motionCard(id) + (p ? '<span class="x-vcard__meta">' + face(p, "x-face--sm") + '<span><b><a class="link" href="#/p/' + id + '">' + esc(p.name) + '</a></b><span class="x-sub">' + esc(labsOf(p).join(", ")) + "</span></span></span>" : "") + "</div>";
      }).join("") + "</div></section>";
    return { html: html, title: "Motion explainers" };
  }

  /* ---------- Compare ---------- */
  var CMP = [P[0] && P[0].id, P[1] && P[1].id, ""];
  function viewCompare() {
    function sel(i) {
      return '<select class="x-field" data-cmp="' + i + '" aria-label="Person ' + (i + 1) + '">' + (i === 2 ? '<option value="">+ Add a third</option>' : "") +
        P.map(function (p) { return '<option value="' + p.id + '"' + (CMP[i] === p.id ? " selected" : "") + ">" + esc(p.name) + "</option>"; }).join("") + "</select>";
    }
    var html = '<section class="section">' + head("Side by side.", "Pick two or three insiders.", "Compare") + '<div class="x-pickers">' + sel(0) + sel(1) + sel(2) + '</div><div id="cmp-out"></div></section>';
    return { html: html, title: "Compare", after: function () {
      $$("[data-cmp]").forEach(function (s) { s.addEventListener("change", function () { CMP[+s.getAttribute("data-cmp")] = s.value; drawCompare(); }); });
      drawCompare();
    } };
  }
  function drawCompare() {
    var seen = {}, ps = CMP.filter(function (id) { if (!id || seen[id] || !byId[id]) return false; seen[id] = 1; return true; }).map(function (id) { return byId[id]; });
    if (ps.length < 2) { $("#cmp-out").innerHTML = '<div class="x-empty">Pick at least two different people.</div>'; return; }
    function row(label, fn, cls) { return '<tr><th scope="row">' + label + "</th>" + ps.map(function (p) { return "<td" + (cls ? ' class="' + cls + '"' : "") + (label ? ' data-label="' + label + '"' : "") + ">" + fn(p) + "</td>"; }).join("") + "</tr>"; }
    function cut(s, n) { s = String(s || ""); return s.length > n ? esc(s.slice(0, n).replace(/\s+\S*$/, "")) + "…" : esc(s); }
    var topP = Math.max.apply(null, ps.map(function (p) { return cred(p) || 0; }));
    $("#cmp-out").innerHTML = '<div class="compare" style="--compare-cols:' + ps.length + '"><table><thead><tr><td></td>' + ps.map(function (p) {
      return '<th scope="col"><figure class="compare__media">' + face(p, "x-face--lg") + "</figure>" + esc(p.name) + "<small>" + esc(nowOf(p)) + "</small>" + (cred(p) === topP ? '<span class="chip chip--solid">Most credible here</span>' : "") + "</th>";
    }).join("") + "</tr></thead><tbody>" +
      row("Rank", function (p) { return "#" + p.rank; }, "num") +
      row("Labs", function (p) { return esc(labsOf(p).join(", ")) + (vid(p).formerly ? " (former)" : ""); }) +
      row("Proximity", function (p) { return meter(prox(p), "Proximity"); }) +
      row("Credibility", function (p) { return meter(cred(p), "Credibility"); }) +
      row("Fact-checks", function (p) { return tallyChips(fcs(p)); }) +
      row("Citations", function (p) { var c = obj(p.research_metrics).citations_approx; return c == null ? "–" : /^\d+$/.test(String(c)) ? (+c).toLocaleString() : esc((String(c).match(/[~\d,–-]+/) || ["–"])[0]); }, "num") +
      row("h-index", function (p) { var h = obj(p.research_metrics).h_index_approx; return h == null ? "–" : esc(h); }, "num") +
      row("Talks", function (p) { return talks(p).length + " catalogued"; }) +
      row("Expertise", function (p) { return esc(arr(p.expertise).slice(0, 3).join(" · ")); }, "muted") +
      row("Stance", function (p) { return cut(p.stance_summary, 240); }) +
      row("Verdict", function (p) { return cut(obj(p.credibility).verdict, 240); }) +
      row("Conflicts", function (p) { return esc(arr(obj(p.credibility).conflicts_of_interest).slice(0, 2).join(" · ") || "None listed"); }, "muted") +
      row("", function (p) { return '<a class="btn" href="#/p/' + p.id + '">Dossier</a>'; }) + "</tbody></table></div>";
  }

  /* ---------- router ---------- */
  var app = $("#app");
  var NAV = [["#/", "Home"], ["#/facts", "Facts"], ["#/answers", "Answers"], ["#/watch", "Watch"], ["#/motion", "Motion"], ["#/compare", "Compare"]];
  function buildNav() {
    var hdr = $("#x-nav");
    hdr.insertAdjacentHTML("afterbegin", '<div class="x-navwrap"><nav class="seg" aria-label="Views">' + NAV.map(function (n) { return '<a href="' + n[0] + '">' + n[1] + "</a>"; }).join("") + '</nav><button class="x-kbtn" type="button" id="x-k" aria-label="Open command palette">⌕ <span><kbd>⌘K</kbd></span></button></div>');
    $("#x-k").addEventListener("click", openPalette);
  }
  function current() { var h = location.hash || "#/"; return h === "#" ? "#/" : h; }
  function route() {
    var h = current();
    charts.forEach(function (c) { try { c.destroy(); } catch (e) { /* ignore */ } });
    charts = [];
    live.forEach(function (x) { try { x.destroy(); } catch (e) { /* ignore */ } });
    live = [];
    var vm = h.match(/^#v=([^&]+)(?:&t=(\d+))?/);
    var r;
    if (vm) r = viewHome();
    else if (/^#\/p\//.test(h)) r = viewPerson(decodeURIComponent(h.slice(4)));
    else if (h === "#/facts") r = viewFacts();
    else if (h === "#/answers") r = viewAnswers();
    else if (h === "#/watch") r = viewWatch();
    else if (h === "#/motion") r = viewMotion();
    else if (h === "#/compare") r = viewCompare();
    else if (/^#\//.test(h) || h === "#/") r = viewHome();
    else return; // plain in-page anchor
    app.innerHTML = '<div class="x-view">' + r.html + "</div>";
    document.title = (r.title ? r.title + " · " : "") + "Inside the Insiders";
    var base = /^#\/p\//.test(h) ? "#/" : h;
    $$("#x-nav .seg a").forEach(function (a) { if (a.getAttribute("href") === base && !/^#\/p\//.test(h)) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    var act = $('#x-nav .seg a[aria-current]');
    if (act) act.scrollIntoView({ block: "nearest", inline: "nearest" });
    window.scrollTo({ top: 0, behavior: "auto" });
    if (r.after) r.after();
    if (vm) openVideo(decodeURIComponent(vm[1]), +vm[2] || 0);
  }
  window.addEventListener("hashchange", function () {
    if (!thEl.hidden && !/^#v=/.test(location.hash)) closeTheater();
    if (!palEl.hidden) closePalette();
    route();
  });

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target;
    var jump = t.closest("[data-jump]");
    if (jump) { e.preventDefault(); var el = document.getElementById(jump.getAttribute("data-jump")); if (el) el.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth" }); return; }
    var hit = t.closest("button.x-yt__hit");
    if (hit) { activate(hit.closest(".x-yt")); return; }
    var sk = t.closest("[data-seek]");
    if (sk) {
      var s = +sk.getAttribute("data-seek"), tg = sk.getAttribute("data-target"), who = sk.getAttribute("data-who");
      if (tg) seek(document.getElementById(tg), s);
      else if (who && byId[who]) openTheater([interviewItem(byId[who], s)].concat(LIB.filter(function (x) { return x.who === who && x.kind !== "interview"; })), 0);
      return;
    }
    var fv = t.closest("[data-fv]");
    if (fv) { FX.v = fv.getAttribute("data-fv"); drawFacts(); return; }
    var cl = t.closest("[data-clip]");
    if (cl) { var a = cl.getAttribute("data-clip").split(":"); openTheater(clipQueue(+a[0]), +a[1]); return; }
    var w = t.closest("[data-w]");
    if (w) { openTheater(watchList(), +w.getAttribute("data-w")); return; }
    var tk = t.closest("[data-talk]");
    if (tk) {
      var slot = document.getElementById("talk-" + tk.getAttribute("data-talk"));
      if (slot.firstChild) { slot.innerHTML = ""; tk.textContent = "Play"; return; }
      slot.innerHTML = lite(tk.getAttribute("data-yt-id"), 0, "talk");
      tk.textContent = "Close";
      if (!isSandboxed()) activate(slot.firstChild);
      return;
    }
    var mp = t.closest(".x-motion__play");
    if (mp) { var box = mp.closest(".x-motion"); mp.remove(); startMotion(box); return; }
    var th = t.closest("[data-th]");
    if (th) { TH.i = +th.getAttribute("data-th"); renderTheater(); return; }
    if (t.closest("[data-close-theater]") || t === thEl) { closeTheater(); return; }
    if (t.closest("[data-pal]")) { closePalette(); return; }
    if (t === palEl) closePalette();
  });
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palEl.hidden ? openPalette() : closePalette(); return; }
    if (e.key === "Escape") { if (!palEl.hidden) closePalette(); else if (!thEl.hidden) closeTheater(); return; }
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "select" || tag === "textarea" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!palEl.hidden) return;
    if (!thEl.hidden) { if (e.key === "n" || e.key === "N") theaterNext(); return; }
    var k = e.key.toLowerCase();
    var map = { h: "#/", f: "#/facts", a: "#/answers", w: "#/watch", m: "#/motion", c: "#/compare" };
    if (e.key === "/" || e.key === "?") { e.preventDefault(); openPalette(); return; }
    if (map[k]) { location.hash = map[k]; return; }
    var pm = current().match(/^#\/p\/(.+)$/);
    if (pm && (e.key === "ArrowLeft" || e.key === "ArrowRight" || k === "j" || k === "k")) {
      var i = P.indexOf(byId[decodeURIComponent(pm[1])]);
      if (i < 0) return;
      var d = e.key === "ArrowRight" || k === "j" ? 1 : -1;
      location.hash = "#/p/" + P[(i + d + P.length) % P.length].id;
    }
  });

  function start() { buildNav(); route(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
    