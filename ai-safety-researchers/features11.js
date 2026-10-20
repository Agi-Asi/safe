/* Round D2: Insights (interactive SVG charts) and Advanced filters for the Directory. */
(function () {
  "use strict";
  var doc = document;
  function $(id) { return doc.getElementById(id); }
  var DATA = Array.isArray(window.DATA) ? window.DATA : [];
  if (!DATA.length) return;
  var SVGNS = "http://www.w3.org/2000/svg";

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
  var BY = {};
  DATA.forEach(function (r) { BY[r.slug] = r; });
  var PHOTO = {};
  [].forEach.call(doc.querySelectorAll("#photo-bank img"), function (im) { PHOTO[im.getAttribute("data-p")] = 1; });

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function clip(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var THEATER = Array.isArray(window.THEATER) ? window.THEATER : [];
  var VIDS = {};
  THEATER.forEach(function (v) { if (v && v.s) VIDS[v.s] = (VIDS[v.s] || 0) + 1; });
  var TRUST = (window.TRUST && window.TRUST.people) || {};
  function score(slug) { var t = TRUST[slug]; return t && typeof t.score === "number" ? t.score : 0; }
  function stanceOf(r) { var s = String(r.p_doom_or_stance || "").trim(); return s && s !== "None" ? s : ""; }

  // ---------- Shared tooltip ----------
  var tip = doc.createElement("div");
  tip.className = "x-in-tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  doc.body.appendChild(tip);
  function showTip(html, x, y) {
    tip.innerHTML = html;
    tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(Math.max(8, x - w / 2), window.innerWidth - w - 8);
    var top = y - h - 12;
    if (top < 8) top = y + 16;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  function hideTip() { tip.hidden = true; }
  function tipAtEl(el, html) { var b = el.getBoundingClientRect(); showTip(html, b.left + b.width / 2, b.top); }
  window.addEventListener("scroll", hideTip, { passive: true });

  function svgEl(tag, attrs, parent) {
    var e = doc.createElementNS(SVGNS, tag);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function makeSvg(box, w, h, label) {
    box.innerHTML = "";
    var s = svgEl("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, role: "img", "aria-label": label, class: "x-in__chart" }, box);
    // Pin the drawn size so no global svg rule scales marks below tap size.
    s.style.setProperty("width", w + "px", "important");
    s.style.setProperty("height", h + "px", "important");
    s.style.setProperty("max-width", "none", "important");
    s.style.setProperty("flex", "none");
    return s;
  }
  // Interactive mark: hover, focus and tap show its tooltip; Enter or click runs it.
  function bindMark(el, html, run, label) {
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", run ? "button" : "img");
    if (label) el.setAttribute("aria-label", label);
    el.classList.add("x-in__mark");
    el.addEventListener("mousemove", function (e) { showTip(html, e.clientX, e.clientY); });
    el.addEventListener("mouseleave", hideTip);
    el.addEventListener("focus", function () { tipAtEl(el, html); });
    el.addEventListener("blur", hideTip);
    if (run) {
      el.addEventListener("click", function () { hideTip(); run(); });
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hideTip(); run(); } });
    } else {
      el.addEventListener("click", function () { tipAtEl(el, html); });
    }
  }
  function widthOf(box, fallback) { var w = box.clientWidth; return w > 0 ? Math.round(w) : fallback; }
  function onResize(box, draw) {
    var last = box.clientWidth, t = null;
    if (!("ResizeObserver" in window)) return;
    new ResizeObserver(function () {
      if (Math.abs(box.clientWidth - last) < 8) return;
      last = box.clientWidth;
      clearTimeout(t);
      t = setTimeout(draw, 120);
    }).observe(box);
  }

  // ---------- Directory hooks ----------
  function goDirectory() {
    var d = $("directory");
    if (d) d.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  function searchDirectory(word, cat) {
    var q = $("q");
    if (!q) return;
    var b = doc.querySelector('#filters [data-cat="' + (cat || "all") + '"]');
    if (b && b.getAttribute("aria-pressed") !== "true") b.click();
    q.value = word;
    q.dispatchEvent(new Event("input", { bubbles: true }));
    goDirectory();
  }

  // ---------- Word frequencies ----------
  var STOP = {};
  ("ai a an and of for the as to on in not vs us be from about via with is are by at or its it into than how what that this over can will who more less their they them our we".split(" ")).forEach(function (w) { STOP[w] = 1; });
  var FREQ = {};
  DATA.forEach(function (r) {
    arr(r.key_ideas).forEach(function (k) {
      (norm(k).match(/[a-z][a-z'\-]+/g) || []).forEach(function (w) {
        w = w.replace(/^[-']+|[-']+$/g, "");
        if (w.length < 3 || STOP[w]) return;
        FREQ[w] = (FREQ[w] || 0) + 1;
      });
    });
  });
  var WORDS = Object.keys(FREQ).map(function (w) { return { w: w, n: FREQ[w] }; })
    .sort(function (a, b) { return b.n - a.n || a.w.localeCompare(b.w); });

  // ---------- Word cloud ----------
  function drawCloud() {
    var box = $("in-wc");
    if (!box) return;
    var W = widthOf(box, 800), k = Math.max(0.55, Math.min(1, W / 800));
    var H = Math.round(Math.max(300, Math.min(400, W * 0.48)));
    var list = WORDS.slice(0, W < 520 ? 40 : 60);
    if (!list.length) return;
    var max = list[0].n, min = list[list.length - 1].n;
    if (W < 600) {
      // Phones: the cloud as wrapped word buttons, each a full tap target.
      box.innerHTML = '<div class="x-in__cloud" role="group" aria-label="Most common words in key ideas"></div>';
      var wrap = box.firstChild;
      list.slice(0, 30).forEach(function (d) {
        var t = max === min ? 1 : Math.pow((d.n - min) / (max - min), 0.6);
        var b = doc.createElement("button");
        b.type = "button";
        b.className = "x-in__wbtn" + (t > 0.45 ? " is-big" : "");
        b.style.fontSize = Math.round(13 + t * 13) + "px";
        b.textContent = d.w;
        wrap.appendChild(b);
        bindMark(b, "<strong>" + esc(d.w) + "</strong>" + d.n + " mention" + (d.n === 1 ? "" : "s") + " · tap to search the directory",
          function () { searchDirectory(d.w); }, "Search the directory for " + d.w + ", " + d.n + " mentions");
      });
      return;
    }
    var svg = makeSvg(box, W, H, "Word cloud of the most common words in key ideas. Top: " + list.slice(0, 5).map(function (d) { return d.w + " " + d.n; }).join(", "));
    var placed = [], cx = W / 2, cy = H / 2;
    function hits(r) {
      if (r.x < 4 || r.y < 4 || r.x + r.w > W - 4 || r.y + r.h > H - 4) return true;
      for (var i = 0; i < placed.length; i++) {
        var p = placed[i];
        if (r.x < p.x + p.w + 4 && r.x + r.w + 4 > p.x && r.y < p.y + p.h + 2 && r.y + r.h + 2 > p.y) return true;
      }
      return false;
    }
    list.forEach(function (d, i) {
      var t = max === min ? 1 : Math.pow((d.n - min) / (max - min), 0.6);
      var size = Math.max(12, Math.round((13 + t * 36) * k));
      var w = d.w.length * size * 0.56 + 4, h = size * 1.05;
      var spot = null;
      for (var s = 0; s < 2400 && !spot; s++) {
        var a = s * 0.21 + i, rad = s * 0.9;
        var r = { x: cx + Math.cos(a) * rad * 1.5 - w / 2, y: cy + Math.sin(a) * rad * 0.8 - h / 2, w: w, h: h };
        if (!hits(r)) spot = r;
      }
      if (!spot) return;
      placed.push(spot);
      var g = svgEl("g", { class: "x-in__word" + (t > 0.45 ? " is-big" : "") }, svg);
      var txt = svgEl("text", { x: spot.x + w / 2, y: spot.y + h / 2, "text-anchor": "middle", "dominant-baseline": "central", "font-size": size }, g);
      txt.textContent = d.w;
      bindMark(g, "<strong>" + esc(d.w) + "</strong>" + d.n + " mention" + (d.n === 1 ? "" : "s") + " · click to search the directory",
        function () { searchDirectory(d.w); }, "Search the directory for " + d.w + ", " + d.n + " mentions");
    });
  }

  // ---------- Heatmap ----------
  function drawHeat() {
    var box = $("in-heat");
    if (!box) return;
    var top = WORDS.slice(0, 15);
    var res = top.map(function (d) { return new RegExp("(^|[^a-z])" + d.w.replace(/[-]/g, "\\-") + "([^a-z]|$)"); });
    var grid = CATS.map(function (c) {
      var people = DATA.filter(function (r) { return r.category === c[0]; });
      return top.map(function (d, j) {
        return people.filter(function (r) { return res[j].test(norm(arr(r.key_ideas).join(" | "))); }).length;
      });
    });
    var max = 1;
    grid.forEach(function (row) { row.forEach(function (v) { if (v > max) max = v; }); });
    var L = 170, T = 96, cw = 48, ch = 48;
    var W = L + top.length * cw + 8, H = T + CATS.length * ch + 8;
    var svg = makeSvg(box, W, H, "Heatmap of the top 15 key-idea words by category; the busiest cell has " + max + " people");
    top.forEach(function (d, j) {
      var x = L + j * cw + cw / 2;
      var t = svgEl("text", { x: x, y: T - 8, transform: "rotate(-45 " + x + " " + (T - 8) + ")", class: "x-in__axis" }, svg);
      t.textContent = d.w;
    });
    CATS.forEach(function (c, i) {
      var t = svgEl("text", { x: L - 10, y: T + i * ch + ch / 2, "text-anchor": "end", "dominant-baseline": "central", class: "x-in__axis x-in__axis--strong" }, svg);
      t.textContent = c[1];
      grid[i].forEach(function (v, j) {
        var share = v / max;
        var g = svgEl("rect", { x: L + j * cw + 1, y: T + i * ch + 1, width: cw - 2, height: ch - 2, rx: 6, class: v ? "x-in__cell" : "x-in__cell is-zero", "fill-opacity": v ? (0.12 + 0.88 * share).toFixed(2) : null }, svg);
        if (v) {
          var n = svgEl("text", { x: L + j * cw + cw / 2, y: T + i * ch + ch / 2, "text-anchor": "middle", "dominant-baseline": "central", class: "x-in__cellnum" + (share > 0.5 ? " is-on" : ""), "aria-hidden": "true" }, svg);
          n.textContent = v;
        }
        bindMark(g, "<strong>" + esc(c[1]) + " · " + esc(top[j].w) + "</strong>" + v + " " + (v === 1 ? "person" : "people") + (v ? " · click to list them" : ""),
          v ? function () { searchDirectory(top[j].w, c[0]); } : null, c[1] + ", " + top[j].w + ": " + v);
      });
    });
  }

  // ---------- Horizontal bars ----------
  function hbars(box, items, opts) {
    var W = widthOf(box, 800), narrow = W < 520;
    var L = Math.min(opts.left || 190, Math.round(W * 0.42)), R = 40, rowH = W < 600 ? 44 : 26, T = 4;
    var H = T + items.length * rowH + 4;
    var svg = makeSvg(box, W, H, opts.label);
    var max = 1;
    items.forEach(function (d) { if (d.value > max) max = d.value; });
    var span = W - L - R;
    var chars = Math.max(10, Math.floor((L - 12) / 6.6));
    items.forEach(function (d, i) {
      var y = T + i * rowH;
      var g = svgEl("g", { class: "x-in__bar" }, svg);
      svgEl("rect", { x: 0, y: y, width: W, height: rowH, class: "x-in__hit" }, g);
      var lab = svgEl("text", { x: L - 10, y: y + rowH / 2, "text-anchor": "end", "dominant-baseline": "central", class: "x-in__axis x-in__axis--strong" }, g);
      lab.textContent = clip(d.label, narrow ? Math.min(chars, 18) : chars);
      var bw = Math.max(2, span * d.value / max);
      var bar = svgEl("rect", { x: L, y: y + 5, width: bw, height: rowH - 10, rx: 3, class: "x-in__fill" }, g);
      if (!reduce) { bar.style.transformOrigin = L + "px 0"; bar.style.animation = "x-in-grow 420ms var(--ease-out) both"; bar.style.animationDelay = i * 14 + "ms"; }
      var v = svgEl("text", { x: L + bw + 6, y: y + rowH / 2, "dominant-baseline": "central", class: "x-in__val" }, g);
      v.textContent = d.value;
      bindMark(g, d.tip, d.run || null, d.label + ": " + d.value);
    });
  }

  var METRIC = {
    quotes: { name: "quotes", get: function (r) { return arr(r.quotes).length; } },
    interviews: { name: "interviews", get: function (r) { return arr(r.interviews).length; } },
    videos: { name: "Theater videos", get: function (r) { return VIDS[r.slug] || 0; } },
    works: { name: "key works", get: function (r) { return arr(r.key_works).length; } }
  };
  var metric = "quotes";
  function drawPeople() {
    var box = $("in-ppl");
    if (!box) return;
    var m = METRIC[metric];
    var list = DATA.map(function (r) { return { r: r, v: m.get(r) }; }).filter(function (d) { return d.v > 0; })
      .sort(function (a, b) { return b.v - a.v || a.r.name.localeCompare(b.r.name); }).slice(0, 25);
    var cap = $("in-ppl-cap");
    if (cap && list.length) cap.innerHTML = esc(list[0].r.name) + " leads on " + esc(m.name) + ", with " + list[0].v + "<small>Top " + list.length + " people by " + esc(m.name) + "; click a bar to open the profile</small>";
    if (!list.length) { box.innerHTML = '<p class="x-empty">No data for this measure yet.</p>'; return; }
    hbars(box, list.map(function (d) {
      return {
        label: d.r.name, value: d.v,
        tip: "<strong>" + esc(d.r.name) + "</strong>" + d.v + " " + esc(m.name) + " · " + esc(CAT_LABEL[d.r.category] || ""),
        run: function () { location.hash = d.r.slug; }
      };
    }), { left: 190, label: "Top " + list.length + " people by " + m.name + ": " + list.slice(0, 5).map(function (d) { return d.r.name + " " + d.v; }).join(", ") });
  }
  var seg = $("in-metric");
  if (seg) seg.addEventListener("click", function (e) {
    var b = e.target.closest("[data-metric]");
    if (!b) return;
    metric = b.getAttribute("data-metric");
    [].forEach.call(seg.querySelectorAll("[data-metric]"), function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    drawPeople();
  });

  function drawChannels() {
    var box = $("in-ch");
    if (!box) return;
    var c = {};
    THEATER.forEach(function (v) { var n = String((v && v.ch) || "").trim(); if (n) c[n] = (c[n] || 0) + 1; });
    var list = Object.keys(c).map(function (n) { return { n: n, v: c[n] }; }).sort(function (a, b) { return b.v - a.v || a.n.localeCompare(b.n); }).slice(0, 12);
    if (!list.length) { box.innerHTML = '<p class="x-empty">No Theater videos loaded.</p>'; return; }
    var cap = $("in-ch-cap");
    if (cap) cap.innerHTML = esc(list[0].n) + " carries the most Theater videos, with " + list[0].v + "<small>Top " + list.length + " channels of " + Object.keys(c).length + "; " + THEATER.length + " videos in all</small>";
    hbars(box, list.map(function (d) {
      return { label: d.n, value: d.v, tip: "<strong>" + esc(d.n) + "</strong>" + d.v + " video" + (d.v === 1 ? "" : "s") + " in the Theater" };
    }), { left: 170, label: "Theater videos per channel: " + list.slice(0, 5).map(function (d) { return d.n + " " + d.v; }).join(", ") });
  }

  // ---------- Key works per year ----------
  function drawYears() {
    var box = $("in-year");
    if (!box) return;
    var c = {};
    DATA.forEach(function (r) { arr(r.key_works).forEach(function (w) { var y = parseInt(w && w.year, 10); if (y > 1800 && y < 2100) c[y] = (c[y] || 0) + 1; }); });
    var ys = Object.keys(c).map(Number).sort(function (a, b) { return a - b; });
    if (!ys.length) return;
    var y0 = ys[0], y1 = ys[ys.length - 1], pts = [], max = 1, total = 0, peak = y0;
    for (var y = y0; y <= y1; y++) { var v = c[y] || 0; pts.push({ y: y, v: v }); total += v; if (v > max) { max = v; peak = y; } }
    var cap = $("in-year-cap");
    if (cap) cap.innerHTML = "Key works peak in " + peak + ", with " + max + "<small>" + total + " works listed in profiles, " + y0 + "–" + y1 + ", by year published</small>";
    var W = widthOf(box, 520), H = 300, L = 34, R = 14, T = 14, B = 28;
    var svg = makeSvg(box, W, H, "Key works per year from " + y0 + " to " + y1 + "; peak " + max + " in " + peak);
    var step = max > 40 ? 20 : max > 20 ? 10 : 5, top = Math.ceil(max / step) * step;
    function X(yr) { return L + (W - L - R) * (yr - y0) / Math.max(1, y1 - y0); }
    function Y(v) { return T + (H - T - B) * (1 - v / top); }
    for (var g = 0; g <= top; g += step) {
      svgEl("line", { x1: L, x2: W - R, y1: Y(g), y2: Y(g), class: g ? "x-in__grid" : "x-in__base" }, svg);
      var tl = svgEl("text", { x: L - 6, y: Y(g), "text-anchor": "end", "dominant-baseline": "central", class: "x-in__num" }, svg);
      tl.textContent = g;
    }
    var dstep = (y1 - y0) > 60 ? 20 : 10;
    for (var d = Math.ceil(y0 / dstep) * dstep; d <= y1; d += dstep) {
      var xl = svgEl("text", { x: X(d), y: H - 8, "text-anchor": "middle", class: "x-in__num" }, svg);
      xl.textContent = d;
    }
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + X(p.y).toFixed(1) + " " + Y(p.v).toFixed(1); }).join(" ");
    svgEl("path", { d: line + " L" + X(y1) + " " + Y(0) + " L" + X(y0) + " " + Y(0) + " Z", class: "x-in__area" }, svg);
    svgEl("path", { d: line, class: "x-in__line" }, svg);
    var guide = svgEl("line", { y1: T, y2: H - B, class: "x-in__guide", visibility: "hidden" }, svg);
    var dot = svgEl("circle", { r: 4, class: "x-in__dot", visibility: "hidden" }, svg);
    var hit = svgEl("rect", { x: L, y: T, width: W - L - R, height: H - T - B, class: "x-in__hit", tabindex: "0", role: "slider", "aria-label": "Key works per year; use the arrow keys to step through years", "aria-valuemin": y0, "aria-valuemax": y1 }, svg);
    var cur = pts.length - 1;
    function show(i, cx, cy) {
      cur = Math.max(0, Math.min(pts.length - 1, i));
      var p = pts[cur], x = X(p.y), yv = Y(p.v);
      guide.setAttribute("x1", x); guide.setAttribute("x2", x); guide.setAttribute("visibility", "visible");
      dot.setAttribute("cx", x); dot.setAttribute("cy", yv); dot.setAttribute("visibility", "visible");
      hit.setAttribute("aria-valuenow", p.y);
      hit.setAttribute("aria-valuetext", p.y + ": " + p.v + " key works");
      var html = "<strong>" + p.y + "</strong>" + p.v + " key work" + (p.v === 1 ? "" : "s");
      if (cx == null) { var b = dot.getBoundingClientRect(); showTip(html, b.left + b.width / 2, b.top); } else showTip(html, cx, cy);
    }
    function hide() { guide.setAttribute("visibility", "hidden"); dot.setAttribute("visibility", "hidden"); hideTip(); }
    function fromEvent(e) {
      var b = svg.getBoundingClientRect();
      var sx = (e.clientX - b.left) * (W / b.width);
      return Math.round((sx - L) / (W - L - R) * (y1 - y0));
    }
    hit.addEventListener("mousemove", function (e) { show(fromEvent(e), e.clientX, e.clientY); });
    hit.addEventListener("click", function (e) { show(fromEvent(e), e.clientX, e.clientY); });
    hit.addEventListener("mouseleave", hide);
    hit.addEventListener("focus", function () { show(cur); });
    hit.addEventListener("blur", hide);
    hit.addEventListener("keydown", function (e) {
      var k = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
      if (k) { e.preventDefault(); show(cur + k); }
      else if (e.key === "Home") { e.preventDefault(); show(0); }
      else if (e.key === "End") { e.preventDefault(); show(pts.length - 1); }
    });
  }

  try { drawCloud(); onResize($("in-wc") || doc.body, drawCloud); } catch (e) { if (window.console) console.warn("Insights cloud", e); }
  try { drawHeat(); } catch (e) { if (window.console) console.warn("Insights heatmap", e); }
  try { drawPeople(); onResize($("in-ppl") || doc.body, drawPeople); } catch (e) { if (window.console) console.warn("Insights people", e); }
  try { drawYears(); onResize($("in-year") || doc.body, drawYears); } catch (e) { if (window.console) console.warn("Insights years", e); }
  try { drawChannels(); onResize($("in-ch") || doc.body, drawChannels); } catch (e) { if (window.console) console.warn("Insights channels", e); }

  // ==================== Advanced filters ====================
  var grid = $("grid");
  var tools = grid && grid.parentNode.querySelector(".x-tools");
  if (!grid || !tools) return;

  var COUNTRY = {};
  DATA.forEach(function (r) {
    var list = Array.isArray(r._ctry) && r._ctry.length ? r._ctry : (r.country ? [String(r.country).trim()] : []);
    r._advCtry = list;
    list.forEach(function (c) { if (c) COUNTRY[c] = (COUNTRY[c] || 0) + 1; });
  });
  var COUNTRIES = Object.keys(COUNTRY).sort(function (a, b) { return a.localeCompare(b); });
  var catCount = {};
  DATA.forEach(function (r) { catCount[r.category] = (catCount[r.category] || 0) + 1; });

  var adv = { cats: [], country: "", photo: false, video: false, stance: false, score: 0, idea: "", org: "" };
  function activeCount() {
    return adv.cats.length + (adv.country ? 1 : 0) + (adv.photo ? 1 : 0) + (adv.video ? 1 : 0) + (adv.stance ? 1 : 0) + (adv.score > 0 ? 1 : 0) + (adv.idea.trim() ? 1 : 0) + (adv.org.trim() ? 1 : 0);
  }
  function match(r) {
    if (!r) return true;
    if (adv.cats.length && adv.cats.indexOf(r.category) < 0) return false;
    if (adv.country && r._advCtry.indexOf(adv.country) < 0) return false;
    if (adv.photo && !(r.photo && PHOTO[r.photo])) return false;
    if (adv.video && !VIDS[r.slug]) return false;
    if (adv.stance && !stanceOf(r)) return false;
    if (adv.score > 0 && score(r.slug) < adv.score) return false;
    var idea = norm(adv.idea).trim();
    if (idea && norm(arr(r.key_ideas).join(" | ")).indexOf(idea) < 0) return false;
    var org = norm(adv.org).trim();
    if (org && norm([r.current_role].concat(arr(r.orgs_history)).join(" | ")).indexOf(org) < 0) return false;
    return true;
  }

  var FILTER_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 6h16M7 12h10M10 18h4"/></svg>';
  var openBtn = doc.createElement("button");
  openBtn.type = "button";
  openBtn.className = "x-iconbtn x-dirbar__btn x-advbtn";
  openBtn.id = "adv-open";
  openBtn.setAttribute("aria-expanded", "false");
  openBtn.setAttribute("aria-controls", "adv");
  openBtn.innerHTML = FILTER_ICON + '<span>Advanced filters</span><b class="x-advbtn__n" id="adv-n" hidden>0</b>';
  var end = tools.querySelector(".x-dirbar__end");
  if (end) end.insertBefore(openBtn, end.firstChild);
  else (tools.querySelector(".x-tools__row") || tools).appendChild(openBtn);

  var pillsRow = doc.createElement("div");
  pillsRow.className = "x-advpills";
  pillsRow.id = "adv-pills";
  pillsRow.hidden = true;
  pillsRow.setAttribute("aria-label", "Active advanced filters");
  var statusEl = $("status");
  if (statusEl && statusEl.parentNode === tools) tools.insertBefore(pillsRow, statusEl.nextSibling); else tools.appendChild(pillsRow);

  var emptyMsg = doc.createElement("p");
  emptyMsg.className = "x-empty x-adv-empty";
  emptyMsg.hidden = true;
  emptyMsg.textContent = "No one matches the advanced filters on top of your search. Remove a filter or reset them all.";
  grid.parentNode.insertBefore(emptyMsg, grid.nextSibling);

  var panel = doc.createElement("div");
  panel.className = "x-adv";
  panel.id = "adv";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-labelledby", "adv-title");
  panel.innerHTML =
    '<div class="x-adv__head"><h2 id="adv-title">Advanced filters</h2><button class="x-iconbtn" type="button" id="adv-close" aria-label="Close advanced filters">✕</button></div>' +
    '<div class="x-adv__body">' +
    '<fieldset class="x-adv__group"><legend>Categories</legend><div class="x-filters" id="adv-cats">' +
    CATS.map(function (c) { return '<button class="x-filter" type="button" data-cat="' + c[0] + '" aria-pressed="false">' + esc(c[1]) + " <span>" + (catCount[c[0]] || 0) + "</span></button>"; }).join("") +
    "</div></fieldset>" +
    '<label class="x-adv__group"><span class="x-adv__label">Country</span><select class="x-field" id="adv-country"><option value="">Any country</option>' +
    COUNTRIES.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + " (" + COUNTRY[c] + ")</option>"; }).join("") + "</select></label>" +
    '<fieldset class="x-adv__group"><legend>Must have</legend>' +
    '<label class="x-adv__toggle"><input type="checkbox" id="adv-photo" /><span>A photo</span></label>' +
    '<label class="x-adv__toggle"><input type="checkbox" id="adv-video" /><span>A Theater video</span></label>' +
    '<label class="x-adv__toggle"><input type="checkbox" id="adv-stance" /><span>A stated stance on AI risk</span></label>' +
    "</fieldset>" +
    '<label class="x-adv__group"><span class="x-adv__label">Minimum sourcing score <output id="adv-score-out" for="adv-score">Any</output></span>' +
    '<input class="x-adv__range" type="range" id="adv-score" min="0" max="100" step="5" value="0" /></label>' +
    '<label class="x-adv__group"><span class="x-adv__label">Key idea contains</span><input class="x-field" type="search" id="adv-idea" placeholder="e.g. interpretability" autocomplete="off" /></label>' +
    '<label class="x-adv__group"><span class="x-adv__label">Organisation contains</span><input class="x-field" type="search" id="adv-org" placeholder="e.g. Anthropic" autocomplete="off" /></label>' +
    "</div>" +
    '<div class="x-adv__foot"><p class="x-status" id="adv-live" aria-live="polite"></p><div class="links"><button class="btn" type="button" id="adv-reset">Reset all</button><button class="btn x-adv__done" type="button" id="adv-done">Show results</button></div></div>';
  doc.body.appendChild(panel);

  var ui = {
    cats: $("adv-cats"), country: $("adv-country"), photo: $("adv-photo"), video: $("adv-video"), stance: $("adv-stance"),
    score: $("adv-score"), scoreOut: $("adv-score-out"), idea: $("adv-idea"), org: $("adv-org"), live: $("adv-live"), n: $("adv-n")
  };

  function syncUI() {
    [].forEach.call(ui.cats.children, function (b) { b.setAttribute("aria-pressed", adv.cats.indexOf(b.getAttribute("data-cat")) > -1 ? "true" : "false"); });
    ui.country.value = adv.country;
    ui.photo.checked = adv.photo; ui.video.checked = adv.video; ui.stance.checked = adv.stance;
    ui.score.value = adv.score; ui.scoreOut.textContent = adv.score > 0 ? adv.score + "+" : "Any";
    if (ui.idea.value !== adv.idea) ui.idea.value = adv.idea;
    if (ui.org.value !== adv.org) ui.org.value = adv.org;
  }
  function pill(label, key, val) {
    return '<button class="x-filter x-advpill" type="button" aria-pressed="true" data-key="' + key + '"' + (val != null ? ' data-val="' + esc(val) + '"' : "") + ' aria-label="Remove filter: ' + esc(label) + '">' + esc(label) + ' <span aria-hidden="true">✕</span></button>';
  }
  function renderPills() {
    var h = "";
    adv.cats.forEach(function (c) { h += pill(CAT_LABEL[c] || c, "cat", c); });
    if (adv.country) h += pill("Country: " + adv.country, "country");
    if (adv.photo) h += pill("Has photo", "photo");
    if (adv.video) h += pill("Has Theater video", "video");
    if (adv.stance) h += pill("Has stance", "stance");
    if (adv.score > 0) h += pill("Sourcing " + adv.score + "+", "score");
    if (adv.idea.trim()) h += pill("Idea: " + adv.idea.trim(), "idea");
    if (adv.org.trim()) h += pill("Org: " + adv.org.trim(), "org");
    pillsRow.innerHTML = h ? h + '<button class="x-iconbtn x-advpills__reset" type="button" data-key="all">Reset all</button>' : "";
    pillsRow.hidden = !h;
  }
  pillsRow.addEventListener("click", function (e) {
    var b = e.target.closest("[data-key]");
    if (!b) return;
    var k = b.getAttribute("data-key");
    if (k === "all") return resetAll();
    if (k === "cat") adv.cats = adv.cats.filter(function (c) { return c !== b.getAttribute("data-val"); });
    else if (k === "score") adv.score = 0;
    else if (k === "country" || k === "idea" || k === "org") adv[k] = "";
    else adv[k] = false;
    changed();
    var next = pillsRow.querySelector("[data-key]");
    (next || openBtn).focus();
  });

  var applying = false;
  function apply() {
    if (applying) return;
    applying = true;
    var on = activeCount() > 0, cards = grid.querySelectorAll(".x-card[data-slug]"), n = 0;
    [].forEach.call(cards, function (card) {
      var ok = !on || match(BY[card.getAttribute("data-slug")]);
      var host = card.closest(".x-cmpwrap") || card;
      if (host.parentNode !== grid && card.parentNode === grid) host = card;
      if (host.classList.contains("x-adv-hide") === ok) host.classList.toggle("x-adv-hide", !ok);
      if (ok) n++;
    });
    var total = cards.length;
    var msg = on ? n + " of " + total + " shown match the advanced filters" : "";
    ui.live.textContent = on ? n + " of " + total + " people match" : total + " people in the current view";
    var cnt = activeCount();
    ui.n.textContent = cnt; ui.n.hidden = !cnt;
    openBtn.setAttribute("aria-label", "Advanced filters" + (cnt ? ", " + cnt + " active" : ""));
    emptyMsg.hidden = !(on && total > 0 && n === 0);
    var lc = $("adv-count");
    if (!lc) {
      lc = doc.createElement("p");
      lc.className = "x-status x-advcount";
      lc.id = "adv-count";
      lc.setAttribute("aria-live", "polite");
      pillsRow.parentNode.insertBefore(lc, pillsRow.nextSibling);
    }
    lc.textContent = msg; lc.hidden = !msg;
    applying = false;
  }
  function changed() { syncUI(); renderPills(); apply(); }
  function resetAll() {
    adv = { cats: [], country: "", photo: false, video: false, stance: false, score: 0, idea: "", org: "" };
    changed();
    openBtn.focus();
  }

  ui.cats.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]");
    if (!b) return;
    var c = b.getAttribute("data-cat"), i = adv.cats.indexOf(c);
    if (i > -1) adv.cats.splice(i, 1); else adv.cats.push(c);
    changed();
  });
  ui.country.addEventListener("change", function () { adv.country = ui.country.value; changed(); });
  ["photo", "video", "stance"].forEach(function (k) { ui[k].addEventListener("change", function () { adv[k] = ui[k].checked; changed(); }); });
  ui.score.addEventListener("input", function () { adv.score = +ui.score.value || 0; changed(); });
  ui.idea.addEventListener("input", function () { adv.idea = ui.idea.value; changed(); });
  ui.org.addEventListener("input", function () { adv.org = ui.org.value; changed(); });
  $("adv-reset").addEventListener("click", function () { resetAll(); ui.cats.querySelector("button").focus(); });

  function openPanel() {
    panel.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    requestAnimationFrame(function () { panel.classList.add("is-open"); });
    apply();
    var f = ui.cats.querySelector("button");
    if (f) f.focus();
  }
  function closePanel(refocus) {
    if (panel.hidden) return;
    panel.classList.remove("is-open");
    panel.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    if (refocus) openBtn.focus();
  }
  openBtn.addEventListener("click", function () { panel.hidden ? openPanel() : closePanel(true); });
  $("adv-close").addEventListener("click", function () { closePanel(true); });
  $("adv-done").addEventListener("click", function () { closePanel(false); goDirectory(); openBtn.focus({ preventScroll: true }); });
  doc.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || panel.hidden) return;
    var ov = $("overlay");
    if (ov && !ov.hidden) return;
    if (panel.contains(doc.activeElement) || doc.activeElement === openBtn || doc.activeElement === doc.body) { e.preventDefault(); closePanel(true); }
  });

  new MutationObserver(function () { apply(); }).observe(grid, { childList: true });
  changed();
})();
