/* Round G: the restored "Coverage by person" table, and video trust scores & timeframes
   (Trust chips on Theater cards and in the player Overview, a Theater trust filter, and three charts). */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, win = window;
  var META = win.VMETA || {};
  var VIDEOS = Array.isArray(win.THEATER) ? win.THEATER : [];
  var PEOPLE = Array.isArray(win.DATA) ? win.DATA : [];
  var BY_ID = {}, BY_SLUG = {};
  VIDEOS.forEach(function (v) { BY_ID[v.id] = v; });
  PEOPLE.forEach(function (p) { BY_SLUG[p.slug] = p; });
  function $(id) { return doc.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pname(s) { var p = BY_SLUG[s]; return p ? p.name : (s || ""); }
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function date(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? +m[3] + " " + MON[+m[2] - 1] + " " + m[1] : "—"; }
  function compact(n) {
    n = +n || 0;
    var u = [[1e9, "B"], [1e6, "M"], [1e3, "K"]];
    for (var i = 0; i < u.length; i++) if (n >= u[i][0]) { var v = n / u[i][0]; v = v < 100 ? Math.round(v * 10) / 10 : Math.round(v); return String(v).replace(/\.0$/, "") + u[i][1]; }
    return String(Math.round(n));
  }
  function mins(s) {
    var m = Math.round((s || 0) / 60);
    if (m < 60) return m + " min";
    var h = Math.floor(m / 60), r = m % 60;
    return h + " h" + (r ? " " + r + " min" : "");
  }
  var CATS = [
    ["lab-safety", "Frontier Lab Safety"],
    ["academic-alignment", "Academic Alignment"],
    ["independent-org", "Independent Orgs"],
    ["interpretability", "Interpretability"],
    ["governance-policy", "Governance & Policy"],
    ["pioneer-public-voice", "Pioneers & Public Voices"]
  ];
  var CAT_LABEL = {}, CAT_COLOR = {};
  CATS.forEach(function (c, i) { CAT_LABEL[c[0]] = c[1]; CAT_COLOR[c[0]] = "var(--chart-" + (i + 1) + ")"; });

  // =====================================================================
  // 1. Coverage by person (restored), under "What you've covered"
  // =====================================================================
  (function () {
    var box = $("wh-cov"), body = $("wh-cov-body");
    if (!box || !body) return;
    var KEY = "x-watch-history-v1";
    var rows = {};
    function row(slug) {
      return rows[slug] || (rows[slug] = { slug: slug, name: pname(slug), cat: (BY_SLUG[slug] || {}).category || "", vids: [], ch: {}, y0: 0, y1: 0 });
    }
    [].forEach.call(doc.querySelectorAll("#vgrid [data-video][data-slug]"), function (b) {
      var slug = b.getAttribute("data-slug");
      var m = /^(?:(\d+):)?(\d+):(\d{2})$/.exec(((b.querySelector(".x-vcard__dur") || {}).textContent || "").trim());
      var r = row(slug);
      r.vids.push({ id: b.getAttribute("data-video"), dur: m ? (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) : 0 });
      r.ch["Hark original"] = 1;
    });
    VIDEOS.forEach(function (v) {
      if (!v.s) return;
      var m = META[v.id], r = row(v.s);
      r.vids.push({ id: v.id, dur: (m && m.length_sec) || v.d || 0 });
      r.ch[(m && m.channel) || v.ch || "—"] = 1;
      var y = +(((m && m.published) || "").slice(0, 4)) || v.y || 0;
      if (y) { r.y0 = r.y0 ? Math.min(r.y0, y) : y; r.y1 = Math.max(r.y1, y); }
    });
    var list = Object.keys(rows).map(function (k) { return rows[k]; }).sort(function (a, b) { return b.vids.length - a.vids.length || a.name.localeCompare(b.name); });
    function history() {
      try { var o = JSON.parse(localStorage.getItem(KEY) || "null"); return (o && o.items) || {}; } catch (e) { return {}; }
    }
    function render() {
      var H = history(), tot = { n: 0, secs: 0, done: 0 };
      body.innerHTML = list.map(function (r) {
        var secs = 0, done = 0, started = 0, left = 0;
        r.vids.forEach(function (x) {
          var h = H[x.id], d = (h && h.duration) || x.dur;
          secs += x.dur;
          if (h) { started++; if (h.completed) done++; }
          if (d && !(h && h.completed)) left += Math.max(0, d - (h ? h.position || 0 : 0));
        });
        tot.n += r.vids.length; tot.secs += secs; tot.done += done;
        var hrs = secs / 3600, nch = Object.keys(r.ch).length;
        var span = r.y0 ? (r.y0 === r.y1 ? String(r.y0) : r.y0 + "–" + r.y1) : "—";
        var watched = done === r.vids.length ? '<span class="dot">All watched</span>'
          : started ? done + " of " + r.vids.length + (started > done ? "<small>" + (started - done) + " in progress</small>" : "")
          : '<span class="muted">0 of ' + r.vids.length + "</span>";
        return "<tr" + (done === r.vids.length ? ' class="is-highlight"' : "") + ">" +
          '<th scope="row" data-label="Person"><a class="link" href="#' + esc(r.slug) + '">' + esc(r.name) + "</a><small>" + esc(CAT_LABEL[r.cat] || "") + "</small></th>" +
          '<td class="num" data-label="Videos">' + r.vids.length + "</td>" +
          '<td class="num" data-label="Hours">' + (secs ? (hrs < 10 ? hrs.toFixed(1) : Math.round(hrs)) : "—") + "</td>" +
          '<td data-label="Channels">' + nch + "</td>" +
          '<td data-label="Uploads">' + span + "</td>" +
          '<td data-label="Watched">' + watched + "</td>" +
          '<td class="muted" data-label="Time left">' + (left ? mins(left) : done === r.vids.length ? "—" : "Unknown") + "</td></tr>";
      }).join("");
    }
    var pend = 0;
    function schedule() { if (box.open && !pend) pend = requestAnimationFrame(function () { pend = 0; render(); }); }
    box.addEventListener("toggle", schedule);
    var chips = $("wh-people");
    if (chips) new MutationObserver(schedule).observe(chips, { childList: true });
    win.addEventListener("storage", function (e) { if (e.key === KEY) schedule(); });
  })();

  // =====================================================================
  // 2. Video trust score
  // =====================================================================
  var FACTORS = [
    ["official", "Official channel", 35],
    ["date", "Exact upload date known", 15],
    ["summary", "Summary backed by transcript", 25],
    ["chapters", "Chapters from publisher description", 10],
    ["stats", "Stats snapshot present", 15]
  ];
  var SCORE = {};
  function trust(id) {
    if (SCORE[id]) return SCORE[id];
    var m = META[id] || {}, parts = {}, note = {};
    parts.official = m.official ? 35 : 0;
    parts.date = /^\d{4}-\d{2}-\d{2}$/.test(m.published || "") ? 15 : 0;
    var src = m.chapters_source;
    parts.summary = src === "transcript" || src === "description" ? 25 : src === "transcript_estimated" ? 15 : 0;
    note.summary = src === "transcript" ? "transcript" : src === "description" ? "publisher description" : src === "transcript_estimated" ? "estimated from transcript" : "no source";
    parts.chapters = src === "description" && (m.chapters || []).length ? 10 : 0;
    parts.stats = m.views != null && m.stats_as_of ? 15 : 0;
    note.stats = parts.stats ? "as of " + date(m.stats_as_of) : "none";
    var s = 0;
    for (var k in parts) s += parts[k];
    var tier = s >= 85 ? "High" : s >= 60 ? "Good" : "Check";
    return (SCORE[id] = { score: s, tier: tier, parts: parts, note: note, known: !!META[id] });
  }
  win.videoTrust = trust;
  var TIERS = [["High", "85 and up"], ["Good", "60 to 84"], ["Check", "below 60"]];
  var TIER_COLOR = { High: "var(--chart-good)", Good: "var(--chart-3)", Check: "var(--chart-bad)" };

  function chipHTML(id, tag) {
    var t = trust(id), cls = "x-tchip x-tchip--" + t.tier.toLowerCase();
    var label = "Trust " + t.score + " · " + t.tier;
    if (tag === "button") return '<button class="' + cls + '" type="button" data-trust="' + esc(id) + '" aria-expanded="false" aria-label="' + esc(label + ". Show the breakdown") + '"><i aria-hidden="true"></i>' + esc(label) + "</button>";
    return '<span class="' + cls + '" data-trust="' + esc(id) + '"><i aria-hidden="true"></i>' + esc(label) + "</span>";
  }

  // ---------- Breakdown tooltip ----------
  var tip = doc.createElement("div");
  tip.className = "x-trtip";
  tip.id = "x-trtip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  doc.body.appendChild(tip);
  var owner = null, pinned = false;
  function breakdown(id) {
    var t = trust(id);
    return '<p class="x-trtip__head"><b>' + t.score + '</b><span>/100</span><span class="x-tchip x-tchip--' + t.tier.toLowerCase() + '"><i aria-hidden="true"></i>' + t.tier + "</span></p>" +
      '<ul class="x-trtip__list">' + FACTORS.map(function (f) {
        var got = t.parts[f[0]], note = t.note[f[0]];
        return '<li class="' + (got ? "is-on" : "is-off") + '"><span>' + esc(f[1]) + (note ? "<small>" + esc(note) + "</small>" : "") + "</span><b>" + (got ? "+" + got : "0") + '<small>/' + f[2] + "</small></b></li>";
      }).join("") + "</ul>";
  }
  function place(el) {
    var r = el.getBoundingClientRect(), vw = root.clientWidth, vh = win.innerHeight, g = 8;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(Math.max(g, r.left + r.width / 2 - w / 2), vw - w - g);
    var top = r.top - h - g;
    if (top < g) top = Math.min(vh - h - g, r.bottom + g);
    tip.style.left = Math.max(g, left) + "px";
    tip.style.top = Math.max(g, top) + "px";
  }
  function showTip(el, html) {
    owner = el;
    tip.innerHTML = html;
    tip.hidden = false;
    el.setAttribute("aria-describedby", "x-trtip");
    place(el);
  }
  function hideTip() {
    if (owner) { owner.removeAttribute("aria-describedby"); if (owner.hasAttribute("aria-expanded")) owner.setAttribute("aria-expanded", "false"); }
    owner = null; pinned = false;
    tip.hidden = true;
  }
  win.addEventListener("scroll", function () { if (owner && !pinned) hideTip(); else if (owner) place(owner); }, { passive: true, capture: true });
  win.addEventListener("resize", hideTip);
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && owner) { var o = owner; hideTip(); if (o.focus && o.tagName === "BUTTON") o.focus(); } }, true);

  // Hover and focus on Trust chips
  doc.addEventListener("mouseover", function (e) {
    var el = e.target.closest && e.target.closest("[data-trust]");
    if (!el || el === owner || pinned) return;
    showTip(el, breakdown(el.getAttribute("data-trust")));
  });
  doc.addEventListener("mouseout", function (e) {
    var el = e.target.closest && e.target.closest("[data-trust]");
    if (!el || el !== owner || pinned) return;
    if (e.relatedTarget && el.contains(e.relatedTarget)) return;
    hideTip();
  });
  doc.addEventListener("focusin", function (e) {
    var el = e.target.closest && e.target.closest("button[data-trust]");
    if (el && !pinned) showTip(el, breakdown(el.getAttribute("data-trust")));
  });
  doc.addEventListener("focusout", function (e) {
    var el = e.target.closest && e.target.closest("button[data-trust]");
    if (el && el === owner && !pinned) hideTip();
  });
  doc.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("button[data-trust]");
    if (el) {
      e.stopPropagation();
      if (owner === el && pinned) { hideTip(); return; }
      showTip(el, breakdown(el.getAttribute("data-trust")));
      pinned = true;
      el.setAttribute("aria-expanded", "true");
      return;
    }
    if (pinned && !tip.contains(e.target)) hideTip();
  }, true);

  // ---------- Chips on Theater cards ----------
  function decorate() {
    [].forEach.call(doc.querySelectorAll("#theater .x-vcard[data-tv], #theater .x-vcard[data-play]"), function (el) {
      if (el.hasAttribute("data-t17")) return;
      el.setAttribute("data-t17", "");
      var id = el.getAttribute("data-tv") || el.getAttribute("data-play");
      if (!META[id]) return;
      var b = el.querySelector(".x-vcard__body");
      if (b) b.insertAdjacentHTML("beforeend", chipHTML(id, "span"));
    });
  }
  var dpend = 0;
  function dschedule() { if (!dpend) dpend = requestAnimationFrame(function () { dpend = 0; decorate(); }); }
  var th = $("theater");
  if (th) new MutationObserver(dschedule).observe(th, { childList: true, subtree: true });
  decorate();

  // ---------- Chip in the player Overview ----------
  var ov = $("x-sp-ov");
  function ensureOv() {
    if (!ov) return;
    var v = typeof win.theaterCurrent === "function" ? win.theaterCurrent() : null;
    var ex = ov.querySelector(".x-trov");
    if (!v || !META[v.id]) { if (ex) ex.parentNode.removeChild(ex); return; }
    if (ex && ex.getAttribute("data-id") === v.id) return;
    if (ex) ex.parentNode.removeChild(ex);
    var t = trust(v.id), el = doc.createElement("div");
    el.className = "x-trov";
    el.setAttribute("data-id", v.id);
    el.innerHTML = chipHTML(v.id, "button") + '<span class="x-trov__txt">' + (t.tier === "High" ? "Well verified" : t.tier === "Good" ? "Mostly verified" : "Check before citing") + " · tap for the breakdown</span>";
    var anchor = ov.querySelector(".x-sp__stats") || ov.querySelector(".x-sp__ch");
    if (anchor) anchor.insertAdjacentElement("afterend", el); else ov.appendChild(el);
  }
  if (ov) { new MutationObserver(ensureOv).observe(ov, { childList: true }); ensureOv(); }

  // ---------- Theater filter by trust tier ----------
  var EXT = win.TV_EXT, tierBox = $("tv-trust"), tierSel = "all";
  function setTier(t) {
    tierSel = t;
    if (tierBox) [].forEach.call(tierBox.children, function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-v") === t ? "true" : "false"); });
    if (EXT && EXT.rerender) EXT.rerender();
  }
  if (tierBox && EXT && EXT.filters) {
    var tc = { High: 0, Good: 0, Check: 0 };
    VIDEOS.forEach(function (v) { tc[trust(v.id).tier]++; });
    tierBox.innerHTML = '<button class="x-filter" type="button" data-v="all" aria-pressed="true">All trust <span>' + VIDEOS.length + "</span></button>" +
      TIERS.filter(function (t) { return tc[t[0]]; }).map(function (t) {
        return '<button class="x-filter" type="button" data-v="' + t[0] + '" aria-pressed="false" title="Trust ' + t[1] + '">Trust: ' + t[0] + " <span>" + tc[t[0]] + "</span></button>";
      }).join("");
    EXT.filters.push(function (v) { return tierSel === "all" || trust(v.id).tier === tierSel; });
    tierBox.addEventListener("click", function (e) { var b = e.target.closest(".x-filter"); if (b) setTier(b.getAttribute("data-v")); });
  } else if (tierBox) tierBox.hidden = true;

  // =====================================================================
  // 3. Trust & Fact-check: KPIs, charts and the timeline strip
  // =====================================================================
  var block = $("video-trust");
  if (!block || !VIDEOS.length) return;
  var N = VIDEOS.length, sum = 0, off = 0, backed = 0, dated = 0, tiers = { High: 0, Good: 0, Check: 0 };
  VIDEOS.forEach(function (v) {
    var t = trust(v.id);
    sum += t.score; tiers[t.tier]++;
    if (t.parts.official) off++;
    if (t.parts.summary === 25) backed++;
    if (t.parts.date) dated++;
  });
  function kpi(k, v) { var el = block.querySelector('[data-vt="' + k + '"]'); if (el) el.textContent = v; }
  function pct(n) { return Math.round(n / N * 100) + "%"; }
  kpi("avg", String(Math.round(sum / N)));
  kpi("official", pct(off));
  kpi("backed", pct(backed));
  kpi("dated", pct(dated));

  var Y0 = 2012, Y1 = 2026, years = [], vids = [], views = [];
  for (var y = Y0; y <= Y1; y++) { years.push(String(y)); vids.push(0); views.push(0); }
  VIDEOS.forEach(function (v) {
    var m = META[v.id], yy = +(((m && m.published) || "").slice(0, 4));
    if (!yy || yy < Y0 || yy > Y1) return;
    vids[yy - Y0]++;
    views[yy - Y0] += +(m.views || 0);
  });

  if (typeof Chart !== "undefined") {
    var yc = $("vt-year");
    if (yc) {
      var peak = 0;
      vids.forEach(function (n, i) { if (n > vids[peak]) peak = i; });
      var vpeak = 0;
      views.forEach(function (n, i) { if (n > views[vpeak]) vpeak = i; });
      var cap = $("vt-year-cap");
      if (cap) cap.firstChild.textContent = "Videos by upload year: most from " + years[peak] + " (" + vids[peak] + "), most views from " + years[vpeak] + " ";
      yc.setAttribute("aria-label", years.map(function (yy, i) { return yy + ": " + vids[i] + " videos, " + compact(views[i]) + " views"; }).join("; "));
      try {
        new Chart(yc, {
          type: "bar",
          data: {
            labels: years,
            datasets: [
              { type: "bar", label: "Videos", data: vids, backgroundColor: "var(--chart-ink)", yAxisID: "y", order: 2 },
              { type: "line", label: "Total views", data: views, borderColor: "var(--chart-2)", backgroundColor: "var(--chart-2)", pointRadius: 3, yAxisID: "y1", order: 1 }
            ]
          },
          options: {
            scales: {
              y: { beginAtZero: true, ticks: { precision: 0 } },
              y1: { position: "right", beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { callback: function (v) { return compact(v); } } }
            },
            plugins: { tooltip: { callbacks: { label: function (ctx) { return ctx.dataset.yAxisID === "y1" ? compact(ctx.raw) + " views" : ctx.raw + " video" + (ctx.raw === 1 ? "" : "s"); } } } }
          }
        });
      } catch (e) { /* caption and label still carry it */ }
    }
    var tcv = $("vt-tier");
    if (tcv) {
      var tl = TIERS.map(function (t) { return t[0]; });
      tcv.setAttribute("aria-label", tl.map(function (t) { return t + ": " + tiers[t] + " videos"; }).join(", "));
      var tcap = $("vt-tier-cap");
      if (tcap) tcap.firstChild.textContent = tiers.High + " of " + N + " videos earn a High trust score ";
      var tplug = { legend: { position: "bottom" } };
      if (win.Hark && win.Hark.labels) tplug.datalabels = win.Hark.labels.percent;
      try {
        new Chart(tcv, {
          type: "doughnut",
          data: { labels: tl.map(function (t, i) { return t + " (" + TIERS[i][1] + ")"; }), datasets: [{ data: tl.map(function (t) { return tiers[t]; }), backgroundColor: tl.map(function (t) { return TIER_COLOR[t]; }), borderWidth: 0 }] },
          options: {
            cutout: "62%",
            plugins: tplug,
            onHover: function (e, els) { var t = e.native && e.native.target; if (t) t.style.cursor = els.length ? "pointer" : "default"; },
            onClick: function (e, els) {
              if (!els.length || !tierBox || tierBox.hidden) return;
              setTier(tl[els[0].index]);
              var br = $("tv-browse");
              if (br) br.scrollIntoView({ behavior: motionOk() ? "smooth" : "auto", block: "start" });
            }
          }
        });
      } catch (e) { /* the filter chips still work */ }
    }
  }
  function motionOk() { return !root.classList.contains("x-rm") && !(win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches); }

  // ---------- Timeline strip ----------
  var track = $("vt-timeline"), legend = $("vt-legend");
  if (track) {
    var T0 = Date.UTC(Y0, 0, 1), T1 = Date.UTC(Y1 + 1, 0, 1), BINS = 180;
    var pts = [], stack = {}, maxRow = 0, undated = 0;
    VIDEOS.forEach(function (v) {
      var m = META[v.id], d = /^(\d{4})-(\d{2})-(\d{2})$/.exec((m && m.published) || "");
      if (!d) { undated++; return; }
      var ts = Date.UTC(+d[1], +d[2] - 1, +d[3]);
      if (ts < T0 || ts >= T1) { undated++; return; }
      pts.push({ v: v, ts: ts, iso: m.published, x: (ts - T0) / (T1 - T0) });
    });
    pts.sort(function (a, b) { return a.ts - b.ts; });
    pts.forEach(function (p) {
      var bin = Math.floor(p.x * BINS);
      p.row = stack[bin] = (stack[bin] || 0) + 1;
      maxRow = Math.max(maxRow, p.row);
    });
    track.style.setProperty("--rows", maxRow);
    var ticks = "";
    for (var yy = Y0; yy <= Y1 + 1; yy++) {
      var x = (Date.UTC(yy, 0, 1) - T0) / (T1 - T0);
      ticks += '<span class="x-vtl__tick" style="--x:' + x.toFixed(4) + '">' + (yy <= Y1 ? "<b>" + yy + "</b>" : "") + "</span>";
    }
    track.innerHTML = ticks + pts.map(function (p, i) {
      var t = trust(p.v.id);
      return '<span class="x-vtl__dot" role="option" aria-selected="false" id="vtl-d-' + i + '" data-vtl="' + i + '" style="--x:' + p.x.toFixed(5) + ";--r:" + (p.row - 1) + ";--c:" + (CAT_COLOR[p.v.c] || "var(--chart-muted)") + '" aria-label="' +
        esc(p.v.t + ", " + pname(p.v.s) + ", uploaded " + date(p.iso) + ", trust " + t.score + ". Press Enter to play") + '"></span>';
    }).join("");
    track.setAttribute("role", "listbox");
    track.setAttribute("tabindex", "0");
    var active = -1;
    function dotEl(i) { return $("vtl-d-" + i); }
    function setActive(i) {
      var old = dotEl(active);
      if (old) { old.classList.remove("is-active"); old.setAttribute("aria-selected", "false"); }
      active = i;
      var el = dotEl(i);
      if (!el) { track.removeAttribute("aria-activedescendant"); return null; }
      el.classList.add("is-active");
      el.setAttribute("aria-selected", "true");
      track.setAttribute("aria-activedescendant", el.id);
      return el;
    }
    function nearest(e) {
      var best = null, bd = 400; // within 20px
      [].forEach.call(track.querySelectorAll(".x-vtl__dot"), function (el) {
        var r = el.getBoundingClientRect(), dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = el; }
      });
      return best;
    }
    if (legend) {
      var used = {};
      pts.forEach(function (p) { used[p.v.c] = (used[p.v.c] || 0) + 1; });
      legend.innerHTML = CATS.filter(function (c) { return used[c[0]]; }).map(function (c) {
        return '<li><i style="--c:' + CAT_COLOR[c[0]] + '" aria-hidden="true"></i>' + esc(c[1]) + " <span>" + used[c[0]] + "</span></li>";
      }).join("") + (undated ? '<li class="x-vtl__undated">' + undated + " without an exact date not shown</li>" : "");
    }
    function dotTip(el) {
      var p = pts[+el.getAttribute("data-vtl")];
      if (!p) return;
      var t = trust(p.v.id);
      showTip(el, '<p class="x-trtip__title">' + esc(p.v.t) + "</p>" +
        '<p class="x-trtip__meta">' + esc(pname(p.v.s)) + " · " + esc(date(p.iso)) + "</p>" +
        '<p class="x-trtip__meta"><span class="x-vtl__sw" style="--c:' + (CAT_COLOR[p.v.c] || "var(--chart-muted)") + '" aria-hidden="true"></span>' + esc(CAT_LABEL[p.v.c] || "") + ' · <span class="x-tchip x-tchip--' + t.tier.toLowerCase() + '"><i aria-hidden="true"></i>Trust ' + t.score + "</span></p>");
    }
    function play(el) {
      var p = el && pts[+el.getAttribute("data-vtl")];
      hideTip();
      if (p && typeof win.openTheater === "function") win.openTheater(p.v.id, track);
    }
    var mpend = 0, lastEv = null;
    track.addEventListener("mousemove", function (e) {
      lastEv = { clientX: e.clientX, clientY: e.clientY };
      if (mpend) return;
      mpend = requestAnimationFrame(function () {
        mpend = 0;
        var el = nearest(lastEv);
        track.style.cursor = el ? "pointer" : "default";
        if (el && el !== owner) { pinned = false; setActive(+el.getAttribute("data-vtl")); dotTip(el); }
        else if (!el && owner && track.contains(owner)) { hideTip(); setActive(-1); }
      });
    });
    track.addEventListener("mouseleave", function () { if (owner && track.contains(owner)) hideTip(); setActive(-1); });
    track.addEventListener("focus", function () { var el = setActive(active >= 0 ? active : 0); if (el) dotTip(el); });
    track.addEventListener("blur", function () { if (owner && track.contains(owner)) hideTip(); });
    track.addEventListener("click", function (e) { var el = nearest(e); if (el) play(el); });
    track.addEventListener("keydown", function (e) {
      var n = pts.length, i = active < 0 ? 0 : active, j = i;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(dotEl(i)); return; }
      if (e.key === "ArrowRight" || e.key === "ArrowUp") j = Math.min(n - 1, i + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") j = Math.max(0, i - 1);
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = n - 1;
      else return;
      e.preventDefault();
      var nx = setActive(j);
      if (!nx) return;
      var sc = track.parentNode;
      if (sc && sc.scrollWidth > sc.clientWidth) {
        var r = nx.getBoundingClientRect(), s = sc.getBoundingClientRect();
        if (r.left < s.left + 20 || r.right > s.right - 20) sc.scrollLeft += r.left - s.left - s.width / 2;
      }
      dotTip(nx);
    });
  }
})();
