/* Round B1: Theater — browse every verified YouTube video, filter, sort, and play them in a lights-off modal. */
(function () {
  "use strict";
  var doc = document;
  function $(id) { return doc.getElementById(id); }
  var grid = $("tv-grid");
  if (!grid) return;

  var VIDEOS = [];
  try { VIDEOS = Hark.data("theater-data") || []; } catch (e) { VIDEOS = []; }
  window.THEATER = VIDEOS;
  var PEOPLE = window.DATA || [];
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FULL_SITE = "https://agi-asi.github.io/safe/ai-safety-researchers/";
  var SANDBOX = location.origin === "null";

  var CATS = [
    ["lab-safety", "Frontier Lab Safety"],
    ["academic-alignment", "Academic Alignment"],
    ["independent-org", "Independent Orgs"],
    ["interpretability", "Interpretability"],
    ["governance-policy", "Governance & Policy"],
    ["pioneer-public-voice", "Pioneers & Public Voices"]
  ];
  var CAT_LABEL = {};
  CATS.forEach(function (c) { CAT_LABEL[c[0]] = c[1]; });

  var BY_SLUG = {}, BY_ID = {};
  PEOPLE.forEach(function (p) { BY_SLUG[p.slug] = p; });
  VIDEOS.forEach(function (v, i) { v._i = i; BY_ID[v.id] = v; });

  var PHOTO = {};
  [].forEach.call(doc.querySelectorAll("#photo-bank img"), function (im) { PHOTO[im.getAttribute("data-p")] = im.getAttribute("src"); });

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
  function initials(n) { return String(n).split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join("").toUpperCase(); }
  function avatar(p) {
    var src = p && p.photo && PHOTO[p.photo];
    return src ? '<img class="x-av" src="' + esc(src) + '" alt="" />' : '<span class="x-av x-av--init" aria-hidden="true">' + esc(initials(p ? p.name : "?")) + "</span>";
  }
  var PLAY = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';

  VIDEOS.forEach(function (v) { v._hay = (v.t + " " + person(v) + " " + v.ch + " " + (v.tg || []).join(" ")).toLowerCase(); });

  // ---------- Kind chart ----------
  (function () {
    var cv = $("tv-kind-chart");
    if (!cv || typeof Chart === "undefined" || !VIDEOS.length) return;
    var counts = {};
    VIDEOS.forEach(function (v) { counts[v.k] = (counts[v.k] || 0) + 1; });
    var kinds = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    cv.setAttribute("aria-label", kinds.map(function (k) { return cap(k) + " " + counts[k]; }).join(", "));
    try {
      new Chart(cv, {
        type: "bar",
        data: { labels: kinds.map(cap), datasets: [{ label: "Videos", data: kinds.map(function (k) { return counts[k]; }) }] },
        options: { indexAxis: "y", plugins: { legend: { display: false }, datalabels: Hark.labels.values } }
      });
    } catch (e) { /* chart is decoration; the grid still works */ }
  })();

  // ---------- Filters ----------
  var state = { q: "", person: "", kind: "all", cat: "all", decade: "all", len: "all", sort: "new", shown: 24 };
  var DURS = [
    ["short", "Under 20 min", function (d) { return d != null && d < 1200; }],
    ["mid", "20–60 min", function (d) { return d != null && d >= 1200 && d < 3600; }],
    ["long", "Over an hour", function (d) { return d != null && d >= 3600; }]
  ];

  function chips(box, key, items) {
    if (!box) return;
    box.innerHTML = '<button class="x-filter" type="button" data-v="all" aria-pressed="true">All <span>' + VIDEOS.length + "</span></button>" +
      items.filter(function (it) { return it[2] > 0; }).map(function (it) {
        return '<button class="x-filter" type="button" data-v="' + esc(it[0]) + '" aria-pressed="false">' + esc(it[1]) + " <span>" + it[2] + "</span></button>";
      }).join("");
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".x-filter");
      if (!b) return;
      state[key] = b.getAttribute("data-v");
      [].forEach.call(box.children, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      state.shown = 24;
      render();
    });
  }
  function count(fn) { return VIDEOS.filter(fn).length; }

  var kindCounts = {};
  VIDEOS.forEach(function (v) { kindCounts[v.k] = (kindCounts[v.k] || 0) + 1; });
  chips($("tv-kinds"), "kind", Object.keys(kindCounts).sort(function (a, b) { return kindCounts[b] - kindCounts[a]; }).map(function (k) { return [k, cap(k), kindCounts[k]]; }));
  chips($("tv-cats"), "cat", CATS.map(function (c) { return [c[0], c[1], count(function (v) { return v.c === c[0]; })]; }));
  var decades = {};
  VIDEOS.forEach(function (v) { if (v.y) decades[Math.floor(v.y / 10) * 10] = 1; });
  chips($("tv-decades"), "decade", Object.keys(decades).sort().reverse().map(function (d) { return [d, d + "s", count(function (v) { return v.y && Math.floor(v.y / 10) * 10 === +d; })]; }));
  chips($("tv-durs"), "len", DURS.map(function (d) { return [d[0], d[1], count(function (v) { return d[2](v.d); })]; }));

  var personSel = $("tv-person");
  if (personSel) {
    var slugs = {};
    VIDEOS.forEach(function (v) { slugs[v.s] = (slugs[v.s] || 0) + 1; });
    personSel.insertAdjacentHTML("beforeend", Object.keys(slugs).sort(function (a, b) { return person({ s: a }).localeCompare(person({ s: b })); }).map(function (s) {
      return '<option value="' + esc(s) + '">' + esc(person({ s: s })) + " (" + slugs[s] + ")</option>";
    }).join(""));
    personSel.addEventListener("change", function () { state.person = personSel.value; state.shown = 24; render(); });
  }
  var q = $("tv-q"), sortSel = $("tv-sort"), more = $("tv-more"), status = $("tv-status");
  var qt;
  if (q) q.addEventListener("input", function () { clearTimeout(qt); qt = setTimeout(function () { state.q = q.value.trim().toLowerCase(); state.shown = 24; render(); }, 120); });
  if (sortSel) sortSel.addEventListener("change", function () { state.sort = sortSel.value; state.shown = 24; render(); });
  if (more) more.addEventListener("click", function () { state.shown += 24; render(true); });

  var SORTS = {
    new: function (a, b) { return (b.y || 0) - (a.y || 0) || a._i - b._i; },
    old: function (a, b) { return (a.y || 9999) - (b.y || 9999) || a._i - b._i; },
    long: function (a, b) { return (b.d || -1) - (a.d || -1) || a._i - b._i; },
    short: function (a, b) { return (a.d == null ? 1e9 : a.d) - (b.d == null ? 1e9 : b.d) || a._i - b._i; },
    az: function (a, b) { return a.t.localeCompare(b.t); }
  };
  var results = [];
  // Hooks for later rounds: extra sorts and filters, and a re-render.
  var EXT = window.TV_EXT = window.TV_EXT || { sorts: {}, filters: [] };
  EXT.rerender = function () { state.shown = 24; render(); };
  function filtered() {
    var terms = state.q ? state.q.split(/\s+/) : [];
    var lenFn = null;
    DURS.forEach(function (d) { if (d[0] === state.len) lenFn = d[2]; });
    return VIDEOS.filter(function (v) {
      if (state.kind !== "all" && v.k !== state.kind) return false;
      if (state.cat !== "all" && v.c !== state.cat) return false;
      if (state.person && v.s !== state.person) return false;
      if (state.decade !== "all" && !(v.y && Math.floor(v.y / 10) * 10 === +state.decade)) return false;
      if (lenFn && !lenFn(v.d)) return false;
      for (var i = 0; i < terms.length; i++) if (v._hay.indexOf(terms[i]) < 0) return false;
      for (var j = 0; j < EXT.filters.length; j++) if (!EXT.filters[j](v)) return false;
      return true;
    }).sort(SORTS[state.sort] || EXT.sorts[state.sort] || SORTS.new);
  }
  function card(v) {
    var d = dur(v.d), who = person(v);
    return '<button class="x-vcard" type="button" data-tv="' + esc(v.id) + '" aria-label="Play ' + esc(v.t) + (d ? ", " + d : "") + '">' +
      '<span class="x-vcard__media"><img src="' + thumb(v.id) + '" alt="" loading="lazy" decoding="async" />' +
      '<span class="x-vcard__play" aria-hidden="true">' + PLAY + "</span>" + (d ? '<span class="x-vcard__dur">' + d + "</span>" : "") + "</span>" +
      '<span class="x-vcard__body"><span class="x-vcard__title">' + esc(v.t) + "</span>" +
      '<span class="x-vcard__sub">' + esc(who) + "</span>" +
      '<span class="x-vcard__sub">' + esc(v.ch) + (v.y ? " · " + v.y : "") + "</span></span></button>";
  }
  function render(append) {
    results = filtered();
    var from = append ? grid.children.length : 0;
    var slice = results.slice(from, state.shown);
    if (append) grid.insertAdjacentHTML("beforeend", slice.map(card).join(""));
    else grid.innerHTML = results.length ? slice.map(card).join("") : '<p class="x-empty">No videos match. Try fewer filters.</p>';
    var n = Math.min(state.shown, results.length);
    if (status) status.textContent = results.length ? "Showing " + n + " of " + results.length + " videos" + (results.length < VIDEOS.length ? " (" + VIDEOS.length + " in total)" : "") : "0 videos";
    if (more) {
      var left = results.length - n;
      more.hidden = left <= 0;
      more.textContent = "Load " + Math.min(24, left) + " more";
    }
  }
  grid.addEventListener("click", function (e) {
    var b = e.target.closest("[data-tv]");
    if (b) open(BY_ID[b.getAttribute("data-tv")], b);
  });
  render();

  // ---------- Player modal ----------
  var modal = doc.createElement("div");
  modal.className = "x-vmodal x-tvm";
  modal.hidden = true;
  modal.innerHTML = '<div class="x-vmodal__panel" role="dialog" aria-modal="true" aria-labelledby="x-tvm-title">' +
    '<div class="x-vmodal__bar"><p class="x-vmodal__title">Theater</p>' +
    '<button class="x-iconbtn" type="button" data-tvnext aria-label="Play next video">Next ›</button>' +
    '<button class="x-iconbtn" type="button" data-tvclose aria-label="Close video">Close ✕</button></div>' +
    '<div class="x-vmodal__stage"></div>' +
    '<div class="x-tvm__body"><div class="x-tvm__info"></div><div class="x-tvm__next"><h4>Up next</h4><ol class="x-tvm__list"></ol></div></div></div>';
  doc.body.appendChild(modal);
  var stage = modal.querySelector(".x-vmodal__stage"), info = modal.querySelector(".x-tvm__info"), list = modal.querySelector(".x-tvm__list");
  var cur = null, upNext = [], lastFocus = null, page = doc.querySelector(".page");

  function nextFor(v) {
    var out = [], seen = {};
    seen[v.id] = 1;
    function add(x) { if (out.length < 8 && !seen[x.id]) { seen[x.id] = 1; out.push(x); } }
    var pool = results.length ? results.concat(VIDEOS) : VIDEOS;
    pool.forEach(function (x) { if (x.s === v.s) add(x); });
    pool.forEach(function (x) { if (x.c === v.c) add(x); });
    pool.forEach(add);
    return out;
  }
  function setHash(id) {
    try { history.replaceState(null, "", location.pathname + location.search + (id ? "#theater=" + encodeURIComponent(id) : "#theater")); } catch (e) { /* sandboxed history: skip */ }
  }
  function open(v, from) {
    if (!v) return;
    var wasOpen = !modal.hidden;
    cur = v;
    var p = BY_SLUG[v.s], yt = "https://www.youtube.com/watch?v=" + encodeURIComponent(v.id);
    if (SANDBOX) {
      stage.innerHTML = '<div class="x-vfall"><img src="' + thumb(v.id) + '" alt="" /><div class="x-vfall__box"><p>Videos can\u2019t play inside this preview.</p>' +
        '<a class="btn" href="' + FULL_SITE + "#theater=" + encodeURIComponent(v.id) + '" target="_blank" rel="noopener">Play on the full site</a></div></div>';
    } else {
      stage.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.id) + '?autoplay=1&rel=0&playsinline=1" title="' + esc(v.t) + '" ' +
        'referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    }
    info.innerHTML = '<h3 id="x-tvm-title">' + esc(v.t) + "</h3>" +
      '<p class="x-tvm__meta">' + esc(v.ch) + (v.y ? " · " + v.y : "") + (v.d ? " · " + dur(v.d) : "") + " · " + esc(cap(v.k)) + (CAT_LABEL[v.c] ? " · " + esc(CAT_LABEL[v.c]) : "") + "</p>" +
      '<div class="x-tvm__who">' + avatar(p) + "<strong>" + esc(person(v)) + "</strong>" +
      (p ? '<button class="btn" type="button" data-tvprofile="' + esc(v.s) + '">Open profile</button>' : "") + "</div>" +
      '<div class="links"><a class="btn" href="' + yt + '" target="_blank" rel="noopener">Watch on YouTube</a></div>';
    upNext = nextFor(v);
    list.innerHTML = upNext.map(function (x) {
      return '<li><button class="x-tvm__item" type="button" data-tvup="' + esc(x.id) + '"><img src="' + thumb(x.id) + '" alt="" loading="lazy" />' +
        "<div><span>" + esc(x.t) + "</span><small>" + esc(person(x)) + (x.d ? " · " + dur(x.d) : "") + "</small></div></button></li>";
    }).join("");
    modal.querySelector(".x-vmodal__panel").scrollTop = 0;
    setHash(v.id);
    if (!wasOpen) {
      lastFocus = from || doc.activeElement;
      modal.hidden = false;
      doc.documentElement.classList.add("x-vlock");
      if (page) page.inert = true;
      requestAnimationFrame(function () { modal.classList.add("is-open"); });
      modal.querySelector("[data-tvclose]").focus();
    }
  }
  function close(keepHash) {
    if (modal.hidden) return;
    modal.classList.remove("is-open");
    modal.hidden = true;
    stage.innerHTML = "";
    doc.documentElement.classList.remove("x-vlock");
    if (page) page.inert = false;
    if (!keepHash) setHash(null);
    var t = cur && grid.querySelector('[data-tv="' + cur.id + '"]');
    cur = null;
    var f = lastFocus && doc.contains(lastFocus) && lastFocus.getClientRects().length ? lastFocus : t || lastFocus;
    lastFocus = null;
    if (f && f.focus) f.focus({ preventScroll: true });
  }
  modal.addEventListener("click", function (e) {
    if (e.target === modal || e.target.closest("[data-tvclose]")) return close();
    if (e.target.closest("[data-tvnext]")) { if (upNext[0]) open(upNext[0]); return; }
    var up = e.target.closest("[data-tvup]");
    if (up) return open(BY_ID[up.getAttribute("data-tvup")]);
    var pr = e.target.closest("[data-tvprofile]");
    if (pr) { var slug = pr.getAttribute("data-tvprofile"); close(true); location.hash = slug; }
  });
  doc.addEventListener("keydown", function (e) {
    if (modal.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === "Tab") {
      var f = modal.querySelectorAll("a[href], button:not([disabled]), iframe");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);

  function fromHash() {
    var m = /^#theater=([\w-]+)/.exec(location.hash);
    if (m && BY_ID[m[1]]) {
      var s = $("theater");
      if (s) s.scrollIntoView({ behavior: "auto", block: "start" });
      open(BY_ID[m[1]]);
    }
  }
  window.addEventListener("hashchange", fromHash);
  fromHash();
  window.openTheater = function (id, from) { open(BY_ID[id], from); };
  window.theaterCurrent = function () { return cur; };

  // ---------- Command palette ----------
  var prevActions = window.XCMP_ACTIONS;
  var FILM = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/></svg>';
  window.XCMP_ACTIONS = function () {
    var base = typeof prevActions === "function" ? prevActions() : [];
    return base.concat([{
      kind: "Action", icon: FILM, name: "Open Theater", sub: VIDEOS.length + " verified talks, interviews and podcasts",
      run: function () {
        setTimeout(function () {
          var s = $("theater");
          if (s) s.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
          if (q) q.focus({ preventScroll: true });
        }, 0);
      }
    }]);
  };
})();
