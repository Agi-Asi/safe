/* X Focus Digest live layer: live clock + relative time, live stats, lightbox, report, insights, shortcuts, motion. */
(function () {
  var D = window.DIGEST || { news: [], foryou: [], following: [] };
  var CAP = window.DIGEST_NOW || Math.floor(Date.now() / 1000);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) { n = +n || 0; if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M"; if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, "") + "K"; return String(n); }
  function rel(ts) { var s = Math.max(0, Date.now() / 1000 - ts); if (s < 45) return "just now"; if (s < 3600) return Math.round(s / 60) + "m"; if (s < 86400) return Math.floor(s / 3600) + "h"; if (s < 86400 * 30) return Math.floor(s / 86400) + "d"; return new Date(ts * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }); }
  function ago(ts) { var s = Math.max(0, Date.now() / 1000 - ts); if (s < 60) return "just now"; if (s < 3600) return Math.round(s / 60) + " min ago"; if (s < 86400) return (s / 3600).toFixed(1).replace(/\.0$/, "") + " h ago"; return Math.floor(s / 86400) + " d ago"; }
  var byId = {};
  D.foryou.concat(D.following).forEach(function (p) { if (!byId[p.id]) byId[p.id] = p; });
  (D.news || []).forEach(function (n) { (n.posts || []).forEach(function (p) { if (!byId[p.id]) byId[p.id] = p; }); });

  /* ---------- top bar: live clock, captured ago, LIVE dot ---------- */
  var row = $(".x-bar__row");
  var live = document.createElement("div");
  live.className = "lv-live";
  live.innerHTML = '<span class="lv-dot" aria-hidden="true"></span><b class="lv-clock">--:--:--</b><span class="lv-cap"></span>';
  if (row) { var sp = $(".x-spacer", row); row.insertBefore(live, sp ? sp.nextSibling : null); }
  function tickClock() {
    $(".lv-clock", live).textContent = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false }) + " IST";
    $(".lv-cap", live).textContent = "Captured " + ago(CAP);
  }
  tickClock(); setInterval(tickClock, 1000);

  /* ---------- live relative times ---------- */
  function tickTimes() {
    $$("time[datetime]").forEach(function (t) { var ts = Date.parse(t.getAttribute("datetime")) / 1000; if (ts) t.textContent = rel(ts); });
  }
  setInterval(tickTimes, 30000);

  /* ---------- live stats from api.fxtwitter.com ---------- */
  var inflight = 0, queue = [], last = {};
  function tween(el, from, to) {
    if (from === to) return;
    var t0 = performance.now(), d = 900;
    (function step(t) { var k = Math.min(1, (t - t0) / d); k = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(from + (to - from) * k)); if (k < 1) requestAnimationFrame(step); })(t0);
    if (to > from) { var f = document.createElement("i"); f.className = "lv-delta"; f.textContent = "+" + fmt(to - from); el.parentNode.appendChild(f); setTimeout(function () { f.remove(); }, 2400); }
  }
  function applyStats(id, t) {
    var p = byId[id] || {};
    var vals = [t.likes, t.retweets, t.replies, t.views];
    var keys = ["likes", "rts", "replies", "views"];
    $$('.x-post[data-pid="' + id + '"] > .x-stats b, .x-post[data-pid="' + id + '"] .x-stats:not(.x-quote .x-stats) b').slice(0, 4).forEach(function (b, i) {
      if (vals[i] == null) return;
      var old = b.dataset.v != null ? +b.dataset.v : (+p[keys[i]] || 0);
      b.dataset.v = vals[i]; tween(b, old, +vals[i]);
    });
    keys.forEach(function (k, i) { if (vals[i] != null) p[k] = +vals[i]; });
    live.classList.add("is-on");
  }
  function pump() {
    while (inflight < 4 && queue.length) {
      (function (id) {
        inflight++;
        fetch("https://api.fxtwitter.com/i/status/" + id).then(function (r) { return r.json(); }).then(function (j) { if (j && j.tweet) applyStats(id, j.tweet); })
          .catch(function () {}).then(function () { inflight--; last[id] = Date.now(); pump(); });
      })(queue.shift());
    }
  }
  var visible = {};
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var id = e.target.getAttribute("data-pid");
      if (e.isIntersecting) { visible[id] = true; e.target.classList.add("lv-in"); if (!last[id] || Date.now() - last[id] > 180000) if (queue.indexOf(id) < 0) queue.push(id); pump(); }
      else delete visible[id];
    });
  }, { rootMargin: "100px" }) : null;
  setInterval(function () { Object.keys(visible).forEach(function (id) { if (!last[id] || Date.now() - last[id] > 180000) if (queue.indexOf(id) < 0) queue.push(id); }); pump(); }, 30000);

  /* ---------- reveal motion + hooking new cards ---------- */
  function hook(root) {
    $$(".x-post[data-pid]:not([data-lv]), .x-story:not([data-lv]), .stat:not([data-lv]), .lv-card:not([data-lv])", root || document).forEach(function (el, i) {
      el.setAttribute("data-lv", "1"); el.style.setProperty("--lv-i", i % 8);
      if (io && el.matches(".x-post")) io.observe(el); else el.classList.add("lv-in");
    });
    $$(".x-media__frame img:not([data-lv])", root || document).forEach(function (img) {
      img.setAttribute("data-lv", "1"); var fr = img.closest(".x-media__frame"); fr.classList.add("lv-skel");
      if (img.complete) fr.classList.remove("lv-skel"); else img.addEventListener("load", function () { fr.classList.remove("lv-skel"); });
    });
    $$(".x-media__frame video:not([data-lv])", root || document).forEach(function (v) {
      v.setAttribute("data-lv", "1");
      var b = document.createElement("button"); b.type = "button"; b.className = "lv-expand"; b.setAttribute("aria-label", "Open video full screen"); b.innerHTML = "&#x26F6;";
      v.parentNode.appendChild(b);
    });
  }
  new MutationObserver(function (m) { var go = false; m.forEach(function (x) { if (x.addedNodes.length) go = true; }); if (go) { hook(); tickTimes(); } })
    .observe(document.body, { childList: true, subtree: true });

  /* ---------- lightbox ---------- */
  var lb = document.createElement("div");
  lb.className = "lv-lb"; lb.hidden = true; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Media preview");
  lb.innerHTML = '<div class="lv-lb__stage"></div><button class="lv-lb__x" type="button" aria-label="Close">&times;</button>' +
    '<button class="lv-lb__nav lv-prev" type="button" aria-label="Previous">&#8249;</button><button class="lv-lb__nav lv-next" type="button" aria-label="Next">&#8250;</button>' +
    '<div class="lv-lb__cap"><p class="lv-lb__txt"></p><span class="lv-lb__n"></span><a class="btn lv-dl" target="_blank" rel="noopener" download>Download</a><a class="btn lv-ox" target="_blank" rel="noopener">Open on X</a></div>';
  document.body.appendChild(lb);
  var items = [], cur = 0;
  function collect(fromEl) {
    var view = fromEl.closest(".x-view") || document;
    items = [];
    $$(".x-media__frame", view).forEach(function (fr) {
      var img = $("img", fr), v = $("video", fr), post = fr.closest("[data-pid]");
      var p = post ? byId[post.getAttribute("data-pid")] : null;
      var m = null;
      if (p) (p.media || []).concat(p.quote ? p.quote.media || [] : []).forEach(function (x) { if ((img && x.url === img.getAttribute("src")) || (v && x.url === v.getAttribute("src"))) m = x; });
      items.push({ fr: fr, type: img ? "photo" : "video", src: img ? img.getAttribute("src") : v.getAttribute("src"), poster: v ? v.getAttribute("poster") : "", hd: m && m.hd || "", loop: v && v.loop, p: p });
    });
    return items.findIndex(function (it) { return it.fr === fromEl; });
  }
  function showItem(i) {
    if (!items.length) return;
    cur = (i + items.length) % items.length;
    var it = items[cur], st = $(".lv-lb__stage", lb);
    $$("video", st).forEach(function (v) { v.pause(); });
    st.innerHTML = it.type === "photo"
      ? '<img src="' + esc(it.src.replace(/\?name=\w+$/, "") + (it.src.indexOf("pbs.twimg.com/media") > -1 && it.src.indexOf("?") < 0 ? "?name=orig" : "")) + '" referrerpolicy="no-referrer" alt="">'
      : '<video src="' + esc(it.hd || it.src) + '" poster="' + esc(it.poster) + '" controls autoplay playsinline referrerpolicy="no-referrer"' + (it.loop ? " loop muted" : "") + "></video>";
    var im = $("img", st); if (im) { im.onerror = function () { if (im.src !== it.src) im.src = it.src; }; im.addEventListener("click", function () { st.classList.toggle("is-zoom"); }); }
    st.classList.remove("is-zoom");
    var p = it.p || {};
    $(".lv-lb__txt", lb).innerHTML = p.name ? "<b>" + esc(p.name) + "</b> @" + esc(p.handle) + " · " + esc(String(p.text || "").replace(/\s+/g, " ").slice(0, 160)) : "";
    $(".lv-lb__n", lb).textContent = (cur + 1) + " / " + items.length;
    $(".lv-dl", lb).href = it.hd || it.src; var ox = $(".lv-ox", lb); ox.href = p.url || "#"; ox.hidden = !p.url;
  }
  function openLb(fr) { var i = collect(fr); if (i < 0) return; lb.hidden = false; document.documentElement.classList.add("lv-lock"); $$(".x-media__frame video").forEach(function (v) { v.pause(); }); showItem(i); }
  function closeLb() { lb.hidden = true; document.documentElement.classList.remove("lv-lock"); $(".lv-lb__stage", lb).innerHTML = ""; }
  document.addEventListener("click", function (e) {
    var a = e.target.closest(".x-media__frame");
    if (a && (e.target.tagName === "IMG" || e.target.closest(".lv-expand"))) { e.preventDefault(); openLb(a); }
  }, true);
  $(".lv-lb__x", lb).onclick = closeLb;
  $(".lv-prev", lb).onclick = function () { showItem(cur - 1); };
  $(".lv-next", lb).onclick = function () { showItem(cur + 1); };
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lv-lb__stage")) closeLb(); });
  var tx = null;
  lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) { if (tx == null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) showItem(cur + (dx < 0 ? 1 : -1)); tx = null; });

  /* ---------- insights on Brief ---------- */
  var B = D.brief || {};
  if (B.insights && B.insights.length && $("#sixty")) {
    var sec = document.createElement("section"); sec.className = "section"; sec.id = "insights";
    sec.innerHTML = '<div class="section__head"><p class="eyebrow">What it means for you</p><h2>Takeaways for an AI builder and filmmaker</h2></div><div class="lv-grid">' +
      B.insights.map(function (x, i) { return '<article class="lv-card"><span class="lv-card__n">' + String(i + 1).padStart(2, "0") + "</span><h3>" + esc(x.title) + "</h3><p>" + esc(x.body) + "</p></article>"; }).join("") + "</div>";
    $("#sixty").after(sec);
  }

  /* ---------- count-up stats ---------- */
  function countUp(el) { var to = parseInt(el.textContent, 10); if (!to) return; var t0 = performance.now(); (function s(t) { var k = Math.min(1, (t - t0) / 1100); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(s); })(t0); }
  setTimeout(function () { $$(".stat__fig").forEach(countUp); }, 250);

  /* ---------- Report tab ---------- */
  var tabsEl = $(".x-tabs"), main = $(".main");
  if (tabsEl && main) {
    var tb = document.createElement("button");
    tb.setAttribute("role", "tab"); tb.id = "tab-report"; tb.setAttribute("aria-controls", "view-report"); tb.setAttribute("aria-selected", "false"); tb.dataset.tab = "report"; tb.textContent = "Report";
    tabsEl.appendChild(tb);
    var view = document.createElement("div"); view.className = "x-view"; view.id = "view-report"; view.setAttribute("role", "tabpanel"); view.hidden = true;
    main.appendChild(view);
    var built = false;
    tb.addEventListener("click", function (e) {
      e.stopImmediatePropagation();
      $$(".x-tabs [role=tab]").forEach(function (b) { b.setAttribute("aria-selected", String(b === tb)); });
      $$(".x-view").forEach(function (v) { v.hidden = v !== view; });
      if (!built) { buildReport(view); built = true; }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, true);
    $$(".x-tabs [role=tab]").forEach(function (b) { if (b !== tb) b.addEventListener("click", function () { view.hidden = true; tb.setAttribute("aria-selected", "false"); }); });
  }
  var PAL = ["#7aa2ff", "#5ad1b3", "#f6c26b", "#ef7d8f", "#b38cff", "#62c3f0", "#a6d36b", "#9a978f"];
  function donut(list) {
    var c = {}; list.forEach(function (p) { c[p.cat || "Other"] = (c[p.cat || "Other"] || 0) + 1; });
    var arr = Object.keys(c).map(function (k) { return [k, c[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    var tot = list.length || 1, a0 = 0, R = 60, C = 2 * Math.PI * R;
    var segs = arr.map(function (x, i) { var len = C * x[1] / tot; var s = '<circle r="' + R + '" cx="80" cy="80" fill="none" stroke="' + PAL[i % 8] + '" stroke-width="26" stroke-dasharray="' + len + " " + (C - len) + '" stroke-dashoffset="' + (-a0) + '" class="lv-seg" style="--d:' + i * 90 + 'ms"/>'; a0 += len; return s; }).join("");
    return '<div class="lv-donut"><svg viewBox="0 0 160 160">' + segs + '</svg><div class="lv-donut__mid"><b>' + list.length + "</b><span>posts</span></div></div><ul class=\"lv-legend\">" +
      arr.map(function (x, i) { return '<li><i style="background:' + PAL[i % 8] + '"></i>' + esc(x[0]) + "<b>" + x[1] + " · " + Math.round(100 * x[1] / tot) + "%</b></li>"; }).join("") + "</ul>";
  }
  function bars(rows, unit) {
    var mx = Math.max.apply(null, rows.map(function (r) { return r[1]; }).concat([1]));
    return '<div class="lv-bars">' + rows.map(function (r, i) { return '<div class="lv-bar"><span class="lv-bar__k">' + r[0] + '</span><span class="lv-bar__t"><i style="--w:' + (100 * r[1] / mx) + "%;--d:" + i * 40 + 'ms"></i></span><b>' + fmt(r[1]) + (unit || "") + "</b></div>"; }).join("") + "</div>";
  }
  function hours(list) {
    var h = new Array(24).fill(0);
    list.forEach(function (p) { if (p.ts) h[+new Date(p.ts * 1000).toLocaleString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }) % 24]++; });
    var mx = Math.max.apply(null, h.concat([1]));
    return '<div class="lv-hours">' + h.map(function (v, i) { return '<div class="lv-hcol" title="' + i + ":00 IST · " + v + ' posts"><i style="--h:' + (100 * v / mx) + "%;--d:" + i * 25 + 'ms"></i><span>' + (i % 3 ? "" : i) + "</span></div>"; }).join("") + "</div>";
  }
  function buildReport(v) {
    var all = []; var seen = {};
    D.foryou.concat(D.following).forEach(function (p) { if (!seen[p.id]) { seen[p.id] = 1; all.push(p); } });
    var au = {}; all.forEach(function (p) { var k = "@" + p.handle; au[k] = (au[k] || 0) + 1; });
    var topAu = Object.keys(au).map(function (k) { return [esc(k), au[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 10);
    var mix = { Video: 0, Photo: 0, "Text only": 0 };
    all.forEach(function (p) { var m = p.media || []; if (m.some(function (x) { return x.type !== "photo"; })) mix.Video++; else if (m.length) mix.Photo++; else mix["Text only"]++; });
    var likes = all.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); }).slice(0, 10);
    var viral = {}; all.forEach(function (p) { var c = p.cat || "Other"; if (!viral[c] || (p.likes || 0) > (viral[c].likes || 0)) viral[c] = p; });
    var totL = all.reduce(function (s, p) { return s + (p.likes || 0); }, 0), totV = all.reduce(function (s, p) { return s + (p.views || 0); }, 0);
    v.innerHTML =
      '<section class="section"><div class="section__head"><p class="eyebrow">Daily data report</p><h2>What your X looked like today</h2></div>' +
      '<div class="lv-kpis">' + [["Unique posts", all.length], ["News stories", (D.news || []).length], ["Total likes", fmt(totL)], ["Total views", fmt(totV)], ["Authors", Object.keys(au).length]].map(function (k) { return '<div class="lv-kpi lv-card"><b>' + k[1] + "</b><span>" + k[0] + "</span></div>"; }).join("") + "</div></section>" +
      '<section class="section lv-2"><div class="lv-panel lv-card"><h3>For You by topic</h3>' + donut(D.foryou) + '</div><div class="lv-panel lv-card"><h3>Following by topic</h3>' + donut(D.following) + "</div></section>" +
      '<section class="section"><div class="lv-panel lv-card"><h3>When the posts were made (IST hour)</h3>' + hours(all) + "</div></section>" +
      '<section class="section lv-2"><div class="lv-panel lv-card"><h3>Top 10 authors in your feeds</h3>' + bars(topAu) + '</div><div class="lv-panel lv-card"><h3>Media mix</h3>' + bars(Object.keys(mix).map(function (k) { return [k, mix[k]]; })) + "</div></section>" +
      '<section class="section"><div class="lv-panel lv-card"><h3>Most liked today</h3><ol class="lv-board">' + likes.map(function (p) { return '<li><a href="' + esc(p.url) + '" target="_blank" rel="noopener"><b>@' + esc(p.handle) + "</b><span>" + esc(String(p.text || "").replace(/\s+/g, " ").slice(0, 110)) + "</span><em>" + fmt(p.likes) + " likes</em></a></li>"; }).join("") + "</ol></div></section>" +
      '<section class="section"><div class="lv-panel lv-card"><h3>Most viral post per topic</h3><div class="lv-viral">' + Object.keys(viral).map(function (c) { var p = viral[c]; return '<a class="lv-vcard" href="' + esc(p.url) + '" target="_blank" rel="noopener"><span class="chip">' + esc(c) + "</span><p>" + esc(String(p.text || "").replace(/\s+/g, " ").slice(0, 140)) + "</p><small>@" + esc(p.handle) + " · " + fmt(p.likes) + " likes</small></a>"; }).join("") + "</div></div></section>";
    var ro = "IntersectionObserver" in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("lv-go"); ro.unobserve(e.target); } }); }, { threshold: 0.2 }) : null;
    $$(".lv-panel, .lv-kpi", v).forEach(function (el) { if (ro) ro.observe(el); else el.classList.add("lv-go"); });
  }

  /* ---------- keyboard shortcuts ---------- */
  var help = document.createElement("div"); help.className = "lv-help"; help.hidden = true;
  help.innerHTML = '<div class="lv-help__box"><h3>Keyboard shortcuts</h3><dl><dt>1–5</dt><dd>Brief, News, For You, Following, Report</dd><dt>j / k</dt><dd>Next / previous post</dd><dt>d</dt><dd>Mark current post done</dd><dt>o</dt><dd>Open current post on X</dd><dt>m</dt><dd>Preview current post\'s media</dd><dt>f</dt><dd>Focus mode</dd><dt>/</dt><dd>Search</dd><dt>← →</dt><dd>Lightbox previous / next</dd><dt>Esc</dt><dd>Close</dd></dl><p>Press ? to toggle</p></div>';
  document.body.appendChild(help);
  help.addEventListener("click", function () { help.hidden = true; });
  var curPost = null;
  function posts() { var v = $$(".x-view").filter(function (x) { return !x.hidden; })[0] || document; return $$(".x-post[data-pid]", v); }
  function focusPost(d) {
    var ps = posts(); if (!ps.length) return;
    var i = ps.indexOf(curPost);
    if (i < 0) { i = ps.findIndex(function (p) { return p.getBoundingClientRect().top > 80; }); i = i < 0 ? 0 : (d > 0 ? i : Math.max(0, i - 1)); }
    else i = Math.max(0, Math.min(ps.length - 1, i + d));
    if (curPost) curPost.classList.remove("lv-cur");
    curPost = ps[i]; curPost.classList.add("lv-cur");
    curPost.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  document.addEventListener("keydown", function (e) {
    if (e.target.matches("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey) { if (e.key === "Escape") e.target.blur(); return; }
    if (!lb.hidden) { if (e.key === "Escape") closeLb(); else if (e.key === "ArrowRight") showItem(cur + 1); else if (e.key === "ArrowLeft") showItem(cur - 1); return; }
    if (e.key === "Escape") { help.hidden = true; return; }
    var k = e.key;
    if (k >= "1" && k <= "5") { var t = $$(".x-tabs [role=tab]")[+k - 1]; if (t) t.click(); }
    else if (k === "j") { e.preventDefault(); focusPost(1); }
    else if (k === "k") { e.preventDefault(); focusPost(-1); }
    else if (k === "d" && curPost) { var b = $('[data-act="done"]', curPost); var n = posts()[posts().indexOf(curPost) + 1]; if (b) b.click(); curPost = null; if (n) { curPost = n; n.classList.add("lv-cur"); } }
    else if (k === "o" && curPost) { var p = byId[curPost.getAttribute("data-pid")]; if (p && p.url) window.open(p.url, "_blank", "noopener"); }
    else if (k === "m" && curPost) { var fr = $(".x-media__frame", curPost); if (fr) openLb(fr); }
    else if (k === "f") { var f = $("#focus"); if (f) f.click(); }
    else if (k === "/") { var s = $$(".x-view").filter(function (x) { return !x.hidden; }).map(function (v) { return $("input[type=search], .x-input", v); })[0]; if (s) { e.preventDefault(); s.focus(); } }
    else if (k === "?") help.hidden = !help.hidden;
  });
  var hb = document.createElement("button"); hb.type = "button"; hb.className = "lv-hbtn"; hb.textContent = "?"; hb.setAttribute("aria-label", "Keyboard shortcuts");
  hb.onclick = function () { help.hidden = !help.hidden; }; document.body.appendChild(hb);

  hook(); tickTimes();
})();
