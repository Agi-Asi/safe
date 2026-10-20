/* Round 20: Trust avatars — photo avatars on Fact-check and Leaderboard rows, score rings, medals, growing bars, staggered rows. */
(function () {
  "use strict";
  var doc = document;
  var fcBody = doc.getElementById("fc-body"), lbBody = doc.getElementById("lb-body");
  if (!fcBody && !lbBody) return;
  var NS = "http://www.w3.org/2000/svg";
  var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  function motionOk() { return !mq.matches && !doc.documentElement.classList.contains("x-rm"); }

  // ---------- People lookup ----------
  var DATA = window.DATA || [], TRUST = window.TRUST || {}, BY = {}, BY_NAME = {}, PHOTO = {};
  [].forEach.call(doc.querySelectorAll("#photo-bank img"), function (im) { PHOTO[im.getAttribute("data-p")] = im.getAttribute("src"); });
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); }
  DATA.forEach(function (r) { BY[r.slug] = r; BY_NAME[norm(r.name)] = r; });
  function initials(name) {
    var p = String(name || "").replace(/\(.*?\)|["“”]/g, "").trim().split(/\s+/);
    return ((p[0] || "?")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }

  // Global top 3 by sourcing score (same order the leaderboard uses).
  var MEDAL = {};
  (function () {
    var tp = TRUST.people || {};
    var list = Object.keys(tp).filter(function (s) { return BY[s]; }).map(function (s) { return { s: s, sc: tp[s].score, n: BY[s].name }; });
    list.sort(function (a, b) { return b.sc - a.sc || a.n.localeCompare(b.n); });
    ["gold", "silver", "bronze"].forEach(function (m, i) { if (list[i]) MEDAL[list[i].s] = [m, i + 1]; });
  })();

  function rowPerson(th) {
    var a = th.querySelector("a[href^='#']");
    var slug = a ? decodeURIComponent(a.getAttribute("href").slice(1)) : "";
    var r = BY[slug] || (a && BY_NAME[norm(a.textContent)]);
    return { a: a, slug: r ? r.slug : slug, r: r, name: r ? r.name : (a ? a.textContent : "") };
  }

  function avatar(p, score) {
    var link = doc.createElement("a");
    link.className = "x-t20av" + (score != null ? " x-t20av--ring" : "");
    link.href = "#" + p.slug;
    link.tabIndex = -1;
    link.setAttribute("aria-hidden", "true");
    link.addEventListener("click", function (e) {
      // Open the profile the same way the name link does.
      if (p.a) { e.preventDefault(); p.a.click(); }
    });
    var face = doc.createElement("span");
    face.className = "x-t20av__face";
    var src = (p.r && p.r.photo && PHOTO[p.r.photo]) || (p.slug ? p.slug + ".jpg" : "");
    function fallback() {
      face.textContent = initials(p.name);
      face.classList.add("x-t20av__face--init");
    }
    if (src) {
      var img = doc.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.onerror = function () { img.remove(); fallback(); };
      img.src = src;
      face.appendChild(img);
    } else fallback();
    if (score != null) {
      var s = Math.max(0, Math.min(100, +score || 0));
      var svg = doc.createElementNS(NS, "svg");
      svg.setAttribute("class", "x-t20ring x-t20ring--" + (s >= 85 ? "good" : s >= 70 ? "mid" : "low"));
      svg.setAttribute("viewBox", "0 0 44 44");
      svg.setAttribute("aria-hidden", "true");
      ["track", "val"].forEach(function (k) {
        var c = doc.createElementNS(NS, "circle");
        c.setAttribute("class", "x-t20ring__" + k);
        c.setAttribute("cx", "22"); c.setAttribute("cy", "22"); c.setAttribute("r", "20");
        c.setAttribute("pathLength", "100");
        if (k === "val") { c.setAttribute("stroke-dasharray", s + " 100"); c.style.setProperty("--x20s", s); }
        svg.appendChild(c);
      });
      link.appendChild(svg);
    }
    link.appendChild(face);
    return link;
  }

  function medalChip(slug) {
    var m = MEDAL[slug];
    if (!m) return null;
    var c = doc.createElement("span");
    c.className = "x-t20medal x-t20medal--" + m[0];
    c.textContent = ["", "1st", "2nd", "3rd"][m[1]];
    c.title = "#" + m[1] + " by sourcing score";
    return c;
  }

  // ---------- Motion: bars grow when in view, rows stagger in ----------
  var seen = { fc: false, lb: false }, sig = { fc: "", lb: "" }, pending = { fc: null, lb: null };
  function play(kind, rows) {
    if (!motionOk()) return;
    rows.forEach(function (tr, i) {
      if (i > 14) return;
      tr.style.setProperty("--x20d", i * 40 + "ms");
      tr.classList.add("x-t20in");
      setTimeout(function () { tr.classList.remove("x-t20in"); tr.style.removeProperty("--x20d"); }, 700 + i * 40);
    });
    if (kind === "lb") {
      rows.forEach(function (tr) {
        tr.classList.add("x-t20grow");
        [].forEach.call(tr.querySelectorAll(".x-sbar i"), function (bar) {
          var w = bar.style.width;
          bar.style.transition = "none";
          bar.style.width = "0%";
          void bar.offsetWidth;
          bar.style.transition = "";
          requestAnimationFrame(function () { bar.style.width = w; });
        });
      });
    }
  }

  function enhance(kind, body) {
    var rows = [].slice.call(body.querySelectorAll("tr")), slugs = [], fresh = [];
    rows.forEach(function (tr) {
      var th = tr.querySelector("th[scope='row']");
      if (!th || th.querySelector(".x-t20av")) return;
      var p = rowPerson(th);
      if (!p.a) return;
      var tp = (TRUST.people || {})[p.slug];
      var wrap = doc.createElement("span");
      wrap.className = "x-t20who";
      th.insertBefore(wrap, p.a);
      wrap.appendChild(avatar(p, kind === "lb" && tp ? tp.score : null));
      var txt = doc.createElement("span");
      txt.className = "x-t20who__txt";
      wrap.appendChild(txt);
      var nameLine = doc.createElement("span");
      nameLine.className = "x-t20who__name";
      txt.appendChild(nameLine);
      nameLine.appendChild(p.a);
      if (kind === "lb") { var m = medalChip(p.slug); if (m) nameLine.appendChild(m); }
      var sm = th.querySelector(":scope > small");
      if (sm) txt.appendChild(sm);
      tr.classList.add("x-t20row");
      slugs.push(p.slug);
      fresh.push(tr);
    });
    if (!fresh.length) return;
    var s = slugs.join(",");
    var changed = s !== sig[kind];
    sig[kind] = s;
    if (!changed) return; // e.g. a radar pick re-rendered the same rows: no replay
    if (seen[kind]) play(kind, fresh);
    else { pending[kind] = fresh; if (kind === "lb") fresh.forEach(function (tr) { [].forEach.call(tr.querySelectorAll(".x-sbar i"), function (b) { if (motionOk()) { b.dataset.x20w = b.style.width; b.style.width = "0%"; } }); }); }
  }

  function watch(kind, body) {
    if (!body) return;
    var busy = false;
    var mo = new MutationObserver(function () {
      if (busy) return;
      busy = true;
      mo.disconnect();
      try { enhance(kind, body); } finally { mo.observe(body, { childList: true }); busy = false; }
    });
    enhance(kind, body);
    mo.observe(body, { childList: true });
    var target = body.closest("table") || body;
    if (!("IntersectionObserver" in window)) { seen[kind] = true; restore(kind); return; }
    var io = new IntersectionObserver(function (en) {
      if (!en.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      seen[kind] = true;
      var rows = pending[kind];
      pending[kind] = null;
      if (!rows) return;
      rows = rows.filter(function (tr) { return tr.isConnected; });
      rows.forEach(function (tr) { [].forEach.call(tr.querySelectorAll(".x-sbar i[data-x20w]"), function (b) { b.style.width = b.dataset.x20w; delete b.dataset.x20w; }); });
      play(kind, rows);
    }, { threshold: 0.15 });
    io.observe(target);
  }
  function restore(kind) {
    var rows = pending[kind] || [];
    pending[kind] = null;
    rows.forEach(function (tr) { [].forEach.call(tr.querySelectorAll(".x-sbar i[data-x20w]"), function (b) { b.style.width = b.dataset.x20w; delete b.dataset.x20w; }); });
  }

  watch("fc", fcBody);
  watch("lb", lbBody);
})();
