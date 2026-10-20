/* Step 4: Visual Atlas — network graph, stance spectrum, timeline, countries. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var DATA = Array.isArray(window.DATA) ? window.DATA : [];
  var XDIR = window.XDIR || null;
  var CAT_LABEL = (XDIR && XDIR.catLabel) || {};
  var CAT_KEYS = Object.keys(CAT_LABEL);
  if (!DATA.length || !doc.getElementById("atlas")) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(id) { return doc.getElementById(id); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  var PHOTO = {};
  [].forEach.call(doc.querySelectorAll("#photo-bank img"), function (im) { PHOTO[im.getAttribute("data-p")] = im.getAttribute("src"); });
  function initials(name) {
    var p = String(name).replace(/\(.*?\)/g, "").trim().split(/\s+/);
    return ((p[0] || "")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }
  function avatar(r, size) {
    var src = r.photo && PHOTO[r.photo];
    var st = size ? ' style="--av:' + size + 'px"' : "";
    if (src) return '<img class="x-av"' + st + ' src="' + esc(src) + '" alt="" />';
    return '<span class="x-av x-av--init"' + st + ' aria-hidden="true">' + esc(initials(r.name)) + "</span>";
  }
  function catIndex(c) { var i = CAT_KEYS.indexOf(c); return i < 0 ? 6 : i + 1; }
  function catVar(c) { return "var(--chart-" + catIndex(c) + ")"; }
  function catName(c) { return CAT_LABEL[c] || c; }
  function openProfile(slug) { location.hash = slug; }

  // Resolve theme colours (tokens use light-dark(), so read them through a probe).
  var probe = doc.createElement("span");
  probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden";
  doc.body.appendChild(probe);
  var COL = {};
  function col(v) { probe.style.color = "var(" + v + ")"; return getComputedStyle(probe).color; }
  function readColors() {
    COL = { text: col("--text-primary"), sub: col("--text-secondary"), line: col("--stroke-primary"), faint: col("--stroke-secondary"),
      bg: col("--fill-primary-on"), init: col("--hero-surface"), initText: col("--hero-text"), strong: col("--fill-primary"), cat: {} };
    CAT_KEYS.forEach(function (c) { COL.cat[c] = col("--chart-" + catIndex(c)); });
  }
  readColors();
  var themeHooks = [];
  function onTheme() { readColors(); themeHooks.forEach(function (f) { f(); }); }
  new MutationObserver(onTheme).observe(root, { attributes: true, attributeFilter: ["data-theme", "class"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onTheme);

  // ---------- Tabs ----------
  var tabs = [].slice.call(doc.querySelectorAll("#atlas [role=tab]"));
  var inits = {};
  function showTab(id, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("aria-controls") === id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !on;
      if (on && focus) t.focus();
    });
    if (inits[id]) inits[id]();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { showTab(t.getAttribute("aria-controls")); });
    t.addEventListener("keydown", function (e) {
      var n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (e.key === "Home") n = -i; else if (e.key === "End") n = tabs.length - 1 - i;
      if (!n && e.key !== "Home") return;
      e.preventDefault();
      showTab(tabs[(i + n + tabs.length) % tabs.length].getAttribute("aria-controls"), true);
    });
  });

  // =====================================================================
  // 1. Network
  // =====================================================================
  var ORGS = [
    ["Anthropic", /anthropic/i], ["OpenAI", /openai/i], ["Google DeepMind", /deepmind/i], ["Meta", /\bmeta\b|facebook/i],
    ["SSI", /\bssi\b|safe superintelligence/i], ["MIRI", /\bmiri\b|machine intelligence research/i], ["Redwood Research", /redwood/i],
    ["METR", /\bmetr\b/i], ["Apollo Research", /apollo research|\bapollo\b/i], ["ARC", /alignment research center|\barc\b(?! prize)/i],
    ["CAIS", /center for ai safety|\bcais\b/i], ["FAR.AI", /far\.?ai\b|\bfar ai\b/i], ["Goodfire", /goodfire/i], ["Transluce", /transluce/i],
    ["Palisade Research", /palisade/i], ["ControlAI", /control ?ai\b/i], ["Conjecture", /conjecture/i],
    ["UC Berkeley / CHAI", /berkeley|\bchai\b|human-compatible/i], ["Oxford", /oxford/i], ["FHI", /\bfhi\b|future of humanity/i],
    ["Cambridge", /cambridge/i], ["MIT", /\bmit\b|massachusetts institute/i], ["Harvard", /harvard/i], ["Stanford", /stanford/i],
    ["Mila", /\bmila\b|montr[eé]al/i], ["GovAI", /govai|governance of ai/i], ["CSET", /\bcset\b|security and emerging/i],
    ["UK AI Security Institute", /uk ai (security|safety) institute|\buk aisi\b|ai security institute/i],
    ["US CAISI / AISI", /\bcaisi\b|us ai safety institute|\bus aisi\b|center for ai standards/i],
    ["Open Philanthropy", /open philanthropy/i], ["Epoch AI", /\bepoch\b/i], ["Timaeus", /timaeus/i], ["LawZero", /lawzero/i]
  ];
  var members = {};
  DATA.forEach(function (r) {
    var hay = [r.current_role].concat(arr(r.orgs_history)).join(" | ");
    r._aorgs = ORGS.filter(function (o) { return o[1].test(hay); }).map(function (o) { return o[0]; });
    r._aorgs.forEach(function (o) { (members[o] = members[o] || []).push(r); });
  });
  var SHARED = Object.keys(members).filter(function (o) { return members[o].length > 1; })
    .sort(function (a, b) { return members[b].length - members[a].length || a.localeCompare(b); });

  var nodes = [], links = [], nodeOf = {};
  DATA.forEach(function (r) {
    var orgs = r._aorgs.filter(function (o) { return members[o].length > 1; });
    if (!orgs.length) return;
    var n = { r: r, orgs: orgs, x: 0, y: 0, vx: 0, vy: 0, rad: 14, deg: 0, img: null };
    var src = r.photo && PHOTO[r.photo];
    if (src) { n.img = new Image(); n.img.onload = function () { n.ready = true; draw(); }; n.img.src = src; }
    nodeOf[r.slug] = n; nodes.push(n);
  });
  var linkMap = {};
  SHARED.forEach(function (o) {
    var m = members[o];
    for (var i = 0; i < m.length; i++) for (var j = i + 1; j < m.length; j++) {
      var a = nodeOf[m[i].slug], b = nodeOf[m[j].slug], key = m[i].slug + "|" + m[j].slug;
      if (!linkMap[key]) { linkMap[key] = { s: a, t: b, orgs: [] }; links.push(linkMap[key]); a.deg++; b.deg++; }
      linkMap[key].orgs.push(o);
    }
  });
  links.forEach(function (l) { l.k = Math.min(1, 0.6 * l.orgs.length) / Math.min(l.s.deg, l.t.deg); l.bias = l.s.deg / (l.s.deg + l.t.deg); });
  nodes.forEach(function (n, i) { var a = i * 2.39996, d = 12 * Math.sqrt(i + 1); n.x = Math.cos(a) * d; n.y = Math.sin(a) * d; });

  var canvas = $("net"), wrap = $("net-wrap"), tip = $("net-tip"), ctx = canvas.getContext("2d");
  var orgSel = $("net-org"), people = $("net-people");
  var view = { k: 1, tx: 0, ty: 0 }, W = 0, H = 0, DPR = 1, fitted = false;
  var alpha = 1, running = false, hover = null, focusOrg = "";

  $("net-status").textContent = nodes.length + " people · " + links.length.toLocaleString() + " links · " + (DATA.length - nodes.length) + " with no shared organisation left out";
  canvas.setAttribute("aria-label", "Network of " + nodes.length + " people joined by " + links.length + " shared-organisation links. Largest: " +
    SHARED.slice(0, 3).map(function (o) { return o + " (" + members[o].length + ")"; }).join(", "));
  orgSel.innerHTML += SHARED.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + " (" + members[o].length + ")</option>"; }).join("");
  $("net-legend").innerHTML = CAT_KEYS.map(function (c) {
    var n = nodes.filter(function (x) { return x.r.category === c; }).length;
    return n ? '<li><i style="--c:' + catVar(c) + '"></i>' + esc(catName(c)) + " " + n + "</li>" : "";
  }).join("");

  function tick() {
    var i, j, a, b, dx, dy, d2, d, f, n = nodes.length;
    for (i = 0; i < n; i++) {
      a = nodes[i];
      for (j = i + 1; j < n; j++) {
        b = nodes[j]; dx = b.x - a.x; dy = b.y - a.y; d2 = dx * dx + dy * dy || 0.01;
        f = (-420 * alpha) / d2;
        a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
        d = Math.sqrt(d2); var min = a.rad + b.rad + 6;
        if (d < min) { f = ((min - d) / d) * 0.25; a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f; }
      }
    }
    for (i = 0; i < links.length; i++) {
      var l = links[i]; a = l.s; b = l.t;
      dx = b.x + b.vx - a.x - a.vx; dy = b.y + b.vy - a.y - a.vy; d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      f = ((d - 70) / d) * alpha * l.k;
      dx *= f; dy *= f;
      b.vx -= dx * l.bias; b.vy -= dy * l.bias; a.vx += dx * (1 - l.bias); a.vy += dy * (1 - l.bias);
    }
    for (i = 0; i < n; i++) {
      a = nodes[i];
      a.vx -= a.x * 0.012 * alpha; a.vy -= a.y * 0.012 * alpha;
      if (a.fx != null) { a.x = a.fx; a.y = a.fy; a.vx = a.vy = 0; continue; }
      a.vx *= 0.6; a.vy *= 0.6; a.x += a.vx; a.y += a.vy;
    }
    alpha += (0 - alpha) * 0.0228;
  }
  function loop() {
    if (alpha < 0.004) { running = false; draw(); return; }
    tick(); draw();
    requestAnimationFrame(loop);
  }
  function heat(a) {
    if (reduce) { alpha = Math.max(alpha, a); for (var i = 0; i < 40 && alpha > 0.004; i++) tick(); draw(); return; }
    alpha = Math.max(alpha, a);
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  function fit() {
    if (!W) return;
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    nodes.forEach(function (n) { x0 = Math.min(x0, n.x - n.rad); y0 = Math.min(y0, n.y - n.rad); x1 = Math.max(x1, n.x + n.rad); y1 = Math.max(y1, n.y + n.rad); });
    var k = Math.min((W - 32) / (x1 - x0 || 1), (H - 32) / (y1 - y0 || 1), 2.5);
    view.k = Math.max(0.2, k);
    view.tx = W / 2 - ((x0 + x1) / 2) * view.k; view.ty = H / 2 - ((y0 + y1) / 2) * view.k;
    draw();
  }
  function resize() {
    var b = wrap.getBoundingClientRect();
    if (!b.width) return;
    var first = !W;
    if (W && fitted) { view.tx += (b.width - W) / 2; view.ty += (b.height - H) / 2; }
    W = b.width; H = b.height; DPR = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    if (first) start(); else draw();
  }
  function start() {
    if (reduce) { for (var i = 0; i < 320; i++) tick(); alpha = 0; fit(); fitted = true; return; }
    for (var j = 0; j < 120; j++) tick(); // settle the worst of it before the first frame
    fit(); fitted = true; heat(alpha);
    setTimeout(fit, 1800);
  }

  function inFocus(n) { return !focusOrg || n.orgs.indexOf(focusOrg) > -1; }
  function draw() {
    if (!W) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.setTransform(DPR * view.k, 0, 0, DPR * view.k, DPR * view.tx, DPR * view.ty);
    ctx.lineWidth = 1 / view.k;
    var hl = hover ? hover : null;
    links.forEach(function (l) {
      var on = focusOrg ? l.orgs.indexOf(focusOrg) > -1 : hl ? l.s === hl || l.t === hl : true;
      ctx.globalAlpha = on ? (focusOrg || hl ? 0.85 : 0.4) : 0.08;
      ctx.strokeStyle = on && (focusOrg || hl) ? COL.text : COL.sub;
      ctx.beginPath(); ctx.moveTo(l.s.x, l.s.y); ctx.lineTo(l.t.x, l.t.y); ctx.stroke();
    });
    nodes.forEach(function (n) {
      var lit = inFocus(n) && (!hl || n === hl || linkMap[n.r.slug + "|" + hl.r.slug] || linkMap[hl.r.slug + "|" + n.r.slug]);
      ctx.globalAlpha = lit ? 1 : 0.22;
      var r = n.rad;
      ctx.save();
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.closePath();
      ctx.fillStyle = COL.init; ctx.fill();
      ctx.clip();
      if (n.img && n.ready) {
        var iw = n.img.naturalWidth, ih = n.img.naturalHeight, s = Math.min(iw, ih);
        ctx.drawImage(n.img, (iw - s) / 2, (ih - s) / 2, s, s, n.x - r, n.y - r, r * 2, r * 2);
      } else {
        ctx.fillStyle = COL.initText; ctx.font = "500 10px Geist, system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(initials(n.r.name), n.x, n.y + 0.5);
      }
      ctx.restore();
      ctx.beginPath(); ctx.arc(n.x, n.y, r + 1.5, 0, Math.PI * 2);
      ctx.lineWidth = n === hl ? 4 : 3; ctx.strokeStyle = COL.cat[n.r.category] || COL.line; ctx.stroke();
      if (n === hl) { ctx.beginPath(); ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2); ctx.lineWidth = 1.5 / view.k; ctx.strokeStyle = COL.text; ctx.stroke(); }
      ctx.lineWidth = 1 / view.k;
    });
    ctx.globalAlpha = 1;
  }

  function toWorld(px, py) { return { x: (px - view.tx) / view.k, y: (py - view.ty) / view.k }; }
  function local(e) { var b = canvas.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
  function hit(p) {
    var w = toWorld(p.x, p.y), best = null, bd = Infinity;
    nodes.forEach(function (n) { var d = Math.hypot(n.x - w.x, n.y - w.y); if (d < n.rad + 4 && d < bd) { bd = d; best = n; } });
    return best;
  }
  function showTip(n, p) {
    if (!n) { tip.hidden = true; return; }
    var orgs = n.orgs.slice();
    if (focusOrg && orgs.indexOf(focusOrg) > -1) orgs = [focusOrg].concat(orgs.filter(function (o) { return o !== focusOrg; }));
    tip.innerHTML = "<strong>" + esc(n.r.name) + "</strong>Shared orgs: " + esc(orgs.join(", ")) + "<br>" + n.deg + " connection" + (n.deg === 1 ? "" : "s") + " · click to open";
    tip.hidden = false;
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    var x = p.x + 14, y = p.y + 14;
    if (x + tw > W - 8) x = p.x - tw - 14;
    if (y + th > H - 8) y = p.y - th - 14;
    tip.style.left = Math.max(8, x) + "px"; tip.style.top = Math.max(8, y) + "px";
  }
  function zoomAt(p, f) {
    var k = Math.max(0.2, Math.min(5, view.k * f)); f = k / view.k;
    view.tx = p.x - (p.x - view.tx) * f; view.ty = p.y - (p.y - view.ty) * f; view.k = k;
    draw();
  }

  var ptrs = new Map(), drag = null, pinch = null;
  canvas.addEventListener("pointerdown", function (e) {
    canvas.setPointerCapture(e.pointerId);
    var p = local(e); ptrs.set(e.pointerId, p);
    if (ptrs.size === 2) {
      var ps = Array.from(ptrs.values());
      if (drag && drag.node) { drag.node.fx = drag.node.fy = null; }
      drag = null;
      pinch = { d: Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y), k: view.k, mid: { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 } };
      return;
    }
    var n = hit(p);
    drag = { node: n, start: p, last: p, moved: false };
    canvas.classList.add("is-grabbing");
    if (n) { n.fx = n.x; n.fy = n.y; }
  });
  canvas.addEventListener("pointermove", function (e) {
    var p = local(e);
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, p);
    if (pinch && ptrs.size === 2) {
      var ps = Array.from(ptrs.values()), d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
      var mid = { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 };
      view.tx += mid.x - pinch.mid.x; view.ty += mid.y - pinch.mid.y; pinch.mid = mid;
      zoomAt(mid, (pinch.k * d / (pinch.d || 1)) / view.k);
      return;
    }
    if (drag) {
      if (Math.hypot(p.x - drag.start.x, p.y - drag.start.y) > 5) drag.moved = true;
      if (drag.node) {
        var w = toWorld(p.x, p.y); drag.node.fx = w.x; drag.node.fy = w.y;
        if (reduce) { drag.node.x = w.x; drag.node.y = w.y; draw(); } else heat(0.25);
        showTip(drag.node, p);
      } else { view.tx += p.x - drag.last.x; view.ty += p.y - drag.last.y; draw(); }
      drag.last = p;
      return;
    }
    if (e.pointerType === "mouse") {
      var n = hit(p);
      if (n !== hover) { hover = n; draw(); }
      canvas.classList.toggle("is-pointing", !!n);
      showTip(n, p);
    }
  });
  function endPtr(e) {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (!drag) return;
    var d = drag; drag = null;
    canvas.classList.remove("is-grabbing");
    if (d.node) { d.node.fx = d.node.fy = null; if (!d.moved && e.type === "pointerup") { tip.hidden = true; openProfile(d.node.r.slug); return; } }
    if (e.pointerType !== "mouse") tip.hidden = true;
  }
  canvas.addEventListener("pointerup", endPtr);
  canvas.addEventListener("pointercancel", endPtr);
  canvas.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && !drag) { hover = null; tip.hidden = true; draw(); } });
  canvas.addEventListener("wheel", function (e) { e.preventDefault(); zoomAt(local(e), Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0015))); }, { passive: false });
  $("net-fit").addEventListener("click", fit);

  orgSel.addEventListener("change", function () {
    focusOrg = orgSel.value;
    if (focusOrg) {
      people.innerHTML = members[focusOrg].map(function (r) {
        return '<a class="x-filter" href="#' + esc(r.slug) + '">' + esc(r.name) + "</a>";
      }).join("");
      people.hidden = false;
      people.setAttribute("aria-label", "People linked to " + focusOrg);
    } else { people.hidden = true; people.innerHTML = ""; }
    draw();
  });

  if (window.ResizeObserver) new ResizeObserver(resize).observe(wrap); else window.addEventListener("resize", resize);
  inits["at-net"] = resize;
  themeHooks.push(draw);
  resize();

  // =====================================================================
  // 2. Stance spectrum
  // =====================================================================
  function stance(t) {
    var s = String(t), low = s.toLowerCase();
    var DOOM = /(die|dies|kill|extinct|takeover|take over|takes over|catastroph|existential|goes bad|doom|humanity|threat|harm|messes up)/;
    var best = null, m, re = /(\d+(?:\.\d+)?)\s*(?:[–-]\s*(\d+(?:\.\d+)?))?\s*%|(\d+)\s+in\s+(\d+)/g;
    while ((m = re.exec(s))) {
      var p = m[3] ? (100 * m[3]) / m[4] : m[2] ? (+m[1] + +m[2]) / 2 : +m[1];
      var win = low.slice(Math.max(0, m.index - 50), m.index + m[0].length + 70);
      if (!DOOM.test(win)) continue;
      if (/agi|automat|run an ai company|fraction/.test(win) && !/die|kill|extinct|takeover/.test(win)) continue;
      if (best === null || p > best) best = p;
    }
    if (best !== null) return { x: Math.max(0.02, Math.min(0.8, 0.82 * (1 - Math.log10(Math.max(best, 1)) / 2))), p: best };
    if (/science fiction|extremely unlikely|rejects|distraction|does not believe|rather than speculative|skeptic|sceptic|present-day|not alive/.test(low)) return { x: 0.92 };
    if (/optimis|muddle|unlikely by default|can be solved|can be managed|not a number/.test(low)) return { x: 0.68 };
    if (/everyone on earth will die|very likely cause human extinction|extremely high/.test(low)) return { x: 0.04 };
    if (/extinction|end of the human race|take control|takeover|prohibition|\bban\b/.test(low)) return { x: 0.2 };
    if (/existential|catastroph|loss[- ]of[- ]control|pressing|pause|slow/.test(low)) return { x: 0.38 };
    return { x: 0.55 };
  }
  var specPeople = DATA.filter(function (r) { return r.p_doom_or_stance; }).map(function (r) { var s = stance(r.p_doom_or_stance); return { r: r, x: s.x, p: s.p }; })
    .sort(function (a, b) { return a.x - b.x || a.r.name.localeCompare(b.r.name); });
  var specCard = $("spec-card");
  function emptyCard(el, msg) { el.className = "x-acard x-acard--empty"; el.innerHTML = msg; }
  emptyCard(specCard, "Hover or tap a face to read that person's stance.");
  var specBuilt = false;
  function buildSpec() {
    if (specBuilt) return; specBuilt = true;
    var inner = $("spec-inner"), width = Math.max(760, inner.clientWidth) - 56;
    var gap = 42 / width, lanes = [];
    specPeople.forEach(function (d) {
      var l = 0;
      while (lanes[l] != null && d.x - lanes[l] < gap) l++;
      lanes[l] = d.x; d.lane = l;
    });
    var LH = 42;
    inner.innerHTML = '<div class="x-spec__dots" style="height:' + (lanes.length * LH) + 'px">' + specPeople.map(function (d, i) {
      return '<button class="x-spec__dot" type="button" data-i="' + i + '" aria-pressed="false" style="--c:' + catVar(d.r.category) + ";left:" + (d.x * 100).toFixed(2) + "%;top:" + (d.lane * LH) + 'px" aria-label="' + esc(d.r.name) + ": " + esc(d.r.p_doom_or_stance) + '">' + avatar(d.r, 30) + "</button>";
    }).join("") + '</div><div class="x-spec__axis" aria-hidden="true"><span>&larr; <b>Most worried</b></span><span><b>Skeptical of x-risk</b> &rarr;</span></div>';
    var dots = inner.querySelector(".x-spec__dots"), pressed = null;
    function show(btn, press) {
      var d = specPeople[+btn.getAttribute("data-i")];
      if (press) { if (pressed) pressed.setAttribute("aria-pressed", "false"); btn.setAttribute("aria-pressed", "true"); pressed = btn; }
      specCard.className = "x-acard";
      specCard.innerHTML = avatar(d.r, 48) + '<div class="x-acard__body"><h3>' + esc(d.r.name) + (d.p != null ? ' <span class="pill">~' + (Math.round(d.p * 10) / 10) + "%</span>" : "") + ' <span class="pill">' + esc(catName(d.r.category)) + "</span></h3><p>" + esc(d.r.p_doom_or_stance) +
        '</p><div class="links"><a class="btn" href="#' + esc(d.r.slug) + '">Open profile</a></div></div>';
    }
    dots.addEventListener("mouseover", function (e) { var b = e.target.closest(".x-spec__dot"); if (b) show(b, false); });
    dots.addEventListener("focusin", function (e) { var b = e.target.closest(".x-spec__dot"); if (b) show(b, false); });
    dots.addEventListener("click", function (e) { var b = e.target.closest(".x-spec__dot"); if (b) show(b, true); });
    dots.addEventListener("mouseleave", function () { if (pressed) show(pressed, false); });
  }
  inits["at-spec"] = buildSpec;

  // =====================================================================
  // 3. Timeline
  // =====================================================================
  var EVENTS = [];
  DATA.forEach(function (r) {
    arr(r.key_works).forEach(function (w) {
      var y = parseInt(w.year, 10);
      if (y > 1800 && y < 2100) EVENTS.push({ r: r, y: y, kind: "Key work", text: w.title, url: w.url });
    });
    arr(r.orgs_history).forEach(function (o) {
      var m = String(o).match(/\((?:[^()]*?)\b(1[89]\d\d|20\d\d)\b/) || String(o).match(/\b(1[89]\d\d|20\d\d)\b/);
      if (m) EVENTS.push({ r: r, y: +m[1], kind: "Career", text: String(o).replace(/\s*\([^()]*\)\s*$/, "") });
    });
    if (r.category === "pioneer-public-voice") arr(r.quotes).forEach(function (q) {
      var m = String(q.context || "").match(/\b(1[89]\d\d|20\d\d)\b/);
      if (m) EVENTS.push({ r: r, y: +m[1], kind: "Quote", text: "“" + String(q.text).trim().slice(0, 160) + (String(q.text).trim().length > 160 ? "…" : "") + "”", ctx: q.context, url: q.source_url });
    });
  });
  EVENTS.sort(function (a, b) { return a.y - b.y || catIndex(a.r.category) - catIndex(b.r.category) || a.r.name.localeCompare(b.r.name); });
  var tlCat = "all", tlCats = $("tl-cats"), tlTrack = $("tl-track"), tlCard = $("tl-card"), tlScroll = $("tl-scroll");
  var tlCounts = {};
  EVENTS.forEach(function (e) { tlCounts[e.r.category] = (tlCounts[e.r.category] || 0) + 1; });
  tlCats.innerHTML = '<button class="x-filter" type="button" data-cat="all" aria-pressed="true">All <span>' + EVENTS.length + "</span></button>" +
    CAT_KEYS.filter(function (c) { return tlCounts[c]; }).map(function (c) {
      return '<button class="x-filter" type="button" data-cat="' + c + '" aria-pressed="false"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + catVar(c) + '" aria-hidden="true"></i>' + esc(catName(c)) + " <span>" + tlCounts[c] + "</span></button>";
    }).join("");
  var tlShown = [];
  function renderTL() {
    tlShown = EVENTS.filter(function (e) { return tlCat === "all" || e.r.category === tlCat; });
    var byYear = {}, years = [];
    tlShown.forEach(function (e, i) { if (!byYear[e.y]) { byYear[e.y] = []; years.push(e.y); } byYear[e.y].push(i); });
    var h = "";
    years.forEach(function (y, k) {
      if (k && y - years[k - 1] > 1) h += '<div class="x-tl__gap" aria-hidden="true"><span>' + (y - years[k - 1] > 4 ? "···" : "·") + "</span></div>";
      h += '<div class="x-tl__year" role="group" aria-label="' + y + ", " + byYear[y].length + ' items"><div class="x-tl__dots">' + byYear[y].map(function (i) {
        var e = tlShown[i];
        return '<button class="x-tl__dot" type="button" data-i="' + i + '" aria-pressed="false" style="--c:' + catVar(e.r.category) + '" aria-label="' + y + ": " + esc(e.r.name) + ", " + esc(e.kind) + ": " + esc(e.text) + '"></button>';
      }).join("") + '</div><span class="x-tl__label">' + y + "</span></div>";
    });
    tlTrack.innerHTML = h;
    $("tl-status").textContent = tlShown.length + " items from " + (years[0] || "—") + " to " + (years[years.length - 1] || "—") + (tlCat === "all" ? "" : " · " + catName(tlCat));
    emptyCard(tlCard, "Tap a dot to see the person, the item and the year.");
  }
  tlCats.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]"); if (!b) return;
    tlCat = b.getAttribute("data-cat");
    [].forEach.call(tlCats.children, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    renderTL();
  });
  var tlPressed = null;
  tlTrack.addEventListener("click", function (ev) {
    var b = ev.target.closest(".x-tl__dot"); if (!b) return;
    if (tlPressed) tlPressed.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-pressed", "true"); tlPressed = b;
    var e = tlShown[+b.getAttribute("data-i")];
    var src = e.url && /^https?:\/\//i.test(e.url) ? '<a class="btn" href="' + esc(e.url) + '" target="_blank" rel="noopener">' + (e.kind === "Quote" ? "Source" : "Read") + "</a>" : "";
    tlCard.className = "x-acard";
    tlCard.innerHTML = avatar(e.r, 48) + '<div class="x-acard__body"><h3>' + esc(e.r.name) + ' <span class="pill">' + e.y + '</span> <span class="pill">' + esc(e.kind) + "</span></h3><p>" + esc(e.text) + "</p>" +
      (e.ctx ? '<p class="fineprint">' + esc(e.ctx) + "</p>" : "") + '<div class="links"><a class="btn" href="#' + esc(e.r.slug) + '">Open profile</a>' + src + "</div></div>";
  });
  var tlBuilt = false;
  inits["at-tl"] = function () { if (!tlBuilt) { tlBuilt = true; renderTL(); } };

  // =====================================================================
  // 4. Countries
  // =====================================================================
  var ctryChart = null;
  function buildCountries() {
    if (ctryChart || typeof Chart === "undefined") return;
    var counts = {};
    DATA.forEach(function (r) {
      var list = Array.isArray(r._ctry) ? r._ctry : r.country ? [String(r.country).split(/[(/;]/)[0].trim()] : [];
      list.forEach(function (c) { if (c) counts[c] = (counts[c] || 0) + 1; });
    });
    var rows = Object.keys(counts).map(function (c) { return { c: c, n: counts[c] }; }).sort(function (a, b) { return b.n - a.n || a.c.localeCompare(b.c); });
    if (!rows.length) return;
    var box = $("ctry-box");
    box.style.height = Math.max(220, rows.length * 28 + 40) + "px";
    $("ctry-cap").innerHTML = esc(rows[0].c) + " leads with " + rows[0].n + " people" + (rows[1] ? ", then " + esc(rows[1].c) + " with " + rows[1].n : "") +
      "<small>People in the directory, " + rows.length + " countries; dual nationals count in each. Blank countries skipped. Click a bar to filter the directory.</small>";
    $("ctry-chart").setAttribute("aria-label", rows.map(function (d) { return d.c + " " + d.n; }).join(", "));
    ctryChart = new Chart($("ctry-chart"), {
      type: "bar",
      data: { labels: rows.map(function (d) { return d.c; }), datasets: [{ label: "People", data: rows.map(function (d) { return d.n; }) }] },
      options: {
        indexAxis: "y",
        scales: { x: { ticks: { stepSize: 5 } } },
        plugins: { legend: { display: false }, datalabels: window.Hark && Hark.labels ? Hark.labels.values : false,
          tooltip: { callbacks: { label: function (c) { return c.raw + (c.raw === 1 ? " person" : " people") + " · click to filter"; } } } },
        onHover: function (e, els) { if (e.native && e.native.target) e.native.target.style.cursor = els.length ? "pointer" : "default"; },
        onClick: function (e, els) {
          var hitEls = els.length ? els : ctryChart.getElementsAtEventForMode(e, "y", { intersect: false }, true);
          if (!hitEls.length) return;
          filterCountry(rows[hitEls[0].index].c);
        }
      }
    });
  }
  function filterCountry(c) {
    var sel = $("x-country");
    if (sel && [].some.call(sel.options, function (o) { return o.value === c; })) {
      sel.value = c;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      var q = $("q");
      if (q) { q.value = c; q.dispatchEvent(new Event("input", { bubbles: true })); }
    }
    var d = $("directory");
    if (d) d.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  inits["at-ctry"] = buildCountries;

  // ---------- Command palette actions ----------
  var prevActions = window.XCMP_ACTIONS;
  var GRAPH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="10" cy="18" r="2.5"/><path d="M8.3 7l7.4.6M7 8.3l2.2 7.3M16.6 10l-5 6"/></svg>';
  function goTab(id) {
    return function () {
      showTab(id);
      setTimeout(function () { $("atlas").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 0);
    };
  }
  window.XCMP_ACTIONS = function () {
    var base = typeof prevActions === "function" ? prevActions() : [];
    return base.concat([
      { kind: "Atlas", icon: GRAPH, name: "Visual Atlas: Network", sub: "Who shares an organisation", run: goTab("at-net") },
      { kind: "Atlas", icon: GRAPH, name: "Visual Atlas: Stance spectrum", sub: "From most worried to skeptical", run: goTab("at-spec") },
      { kind: "Atlas", icon: GRAPH, name: "Visual Atlas: Timeline", sub: "Works, careers and quotes by year", run: goTab("at-tl") },
      { kind: "Atlas", icon: GRAPH, name: "Visual Atlas: Countries", sub: "People by country", run: goTab("at-ctry") }
    ]);
  };
})();
