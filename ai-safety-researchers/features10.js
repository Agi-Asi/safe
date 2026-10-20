/* Round D1: Gallery photo wall + lightbox, and "You might also like" in the profile overlay. */
(function () {
  "use strict";
  var doc = document;
  function $(id) { return doc.getElementById(id); }
  var DATA = Array.isArray(window.DATA) ? window.DATA : [];
  if (!DATA.length) return;

  var CATS = [
    ["lab-safety", "Frontier Lab Safety"],
    ["academic-alignment", "Academic Alignment"],
    ["independent-org", "Independent Orgs"],
    ["interpretability", "Interpretability"],
    ["governance-policy", "Governance & Policy"],
    ["pioneer-public-voice", "Pioneers & Public Voices"]
  ];
  var CAT_LABEL = {}, CAT_IDX = {};
  CATS.forEach(function (c, i) { CAT_LABEL[c[0]] = c[1]; CAT_IDX[c[0]] = i; });
  function catColor(cat) { var i = CAT_IDX[cat]; return "var(--chart-" + (i == null ? 7 : i + 1) + ")"; }

  var BY = {};
  DATA.forEach(function (r) { BY[r.slug] = r; });
  var PHOTO = {};
  [].forEach.call(doc.querySelectorAll("#photo-bank img"), function (im) { PHOTO[im.getAttribute("data-p")] = im.getAttribute("src"); });
  function photoOf(r) { return (r && r.photo && PHOTO[r.photo]) || ""; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function safeUrl(u) { return /^https?:\/\//i.test(u || "") ? esc(u) : ""; }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function initials(name) {
    var parts = String(name).replace(/\(.*?\)/g, "").trim().split(/\s+/);
    return ((parts[0] || "")[0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }
  function avatar(r, size) {
    var src = photoOf(r), st = ' style="--av:' + size + 'px"';
    if (src) return '<img class="x-av"' + st + ' src="' + esc(src) + '" alt="" />';
    return '<span class="x-av x-av--init"' + st + ' aria-hidden="true">' + esc(initials(r.name)) + "</span>";
  }
  function sourceUrl(r) { return r.photo_source_page || (r.links && r.links.wikipedia) || ""; }
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var page = doc.querySelector(".page");

  // =================== Gallery ===================
  var wall = $("gl-wall"), restWrap = $("gl-rest-wrap"), rest = $("gl-rest"), chips = $("gl-filters"), statusEl = $("gl-status");
  var gal = { cat: "all", order: null, list: [] };

  if (wall && rest && chips) {
    var withPhoto = DATA.filter(function (r) { return photoOf(r); }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    var noPhoto = DATA.filter(function (r) { return !photoOf(r); }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    gal.order = withPhoto.slice();

    var counts = {};
    DATA.forEach(function (r) { counts[r.category] = (counts[r.category] || 0) + 1; });
    chips.innerHTML = '<button class="x-filter" type="button" data-gcat="all" aria-pressed="true">All <span>' + DATA.length + "</span></button>" +
      CATS.filter(function (c) { return counts[c[0]]; }).map(function (c) {
        return '<button class="x-filter" type="button" data-gcat="' + c[0] + '" aria-pressed="false">' + esc(c[1]) + " <span>" + counts[c[0]] + "</span></button>";
      }).join("");
    chips.addEventListener("click", function (e) {
      var b = e.target.closest("[data-gcat]");
      if (!b) return;
      gal.cat = b.getAttribute("data-gcat");
      [].forEach.call(chips.children, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      renderGallery();
    });
    var shuffleBtn = $("gl-shuffle");
    if (shuffleBtn) shuffleBtn.addEventListener("click", function () {
      var a = gal.order;
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      renderGallery();
    });

    function span(i) {
      if (i % 10 === 0) return " x-gal__tile--big";
      if (i % 7 === 3) return " x-gal__tile--tall";
      if (i % 11 === 6) return " x-gal__tile--wide";
      return "";
    }
    function renderGallery() {
      var inCat = function (r) { return gal.cat === "all" || r.category === gal.cat; };
      var pics = gal.order.filter(inCat), blanks = noPhoto.filter(inCat);
      gal.list = pics.concat(blanks);
      wall.innerHTML = pics.map(function (r, i) {
        return '<button class="x-gal__tile' + span(i) + '" type="button" data-gi="' + i + '" style="--cat:' + catColor(r.category) + '" aria-label="View photo: ' + esc(r.name) + '">' +
          '<img src="' + esc(photoOf(r)) + '" alt="Portrait of ' + esc(r.name) + '" loading="lazy" />' +
          '<span class="x-gal__cap"><strong>' + esc(r.name) + "</strong><span>" + esc(r.current_role) + "</span></span></button>";
      }).join("") || '<p class="x-empty">No photos in this category.</p>';
      rest.innerHTML = blanks.map(function (r, i) {
        return '<button class="x-galrest__tile" type="button" data-gi="' + (pics.length + i) + '" style="--cat:' + catColor(r.category) + '" aria-label="View: ' + esc(r.name) + ' (no photo)">' +
          '<span class="x-galrest__ini" aria-hidden="true">' + esc(initials(r.name)) + '</span><span class="x-galrest__name">' + esc(r.name) + "</span></button>";
      }).join("");
      if (restWrap) restWrap.hidden = !blanks.length;
      if (statusEl) statusEl.textContent = pics.length + " photo" + (pics.length === 1 ? "" : "s") + (blanks.length ? " · " + blanks.length + " without a photo" : "") +
        (gal.cat !== "all" ? " in " + CAT_LABEL[gal.cat] : "");
    }
    function onTile(e) {
      var t = e.target.closest("[data-gi]");
      if (t) openLB(+t.getAttribute("data-gi"), t);
    }
    wall.addEventListener("click", onTile);
    rest.addEventListener("click", onTile);
    renderGallery();
  }

  // =================== Lightbox ===================
  var lb = doc.createElement("div");
  lb.className = "x-glb";
  lb.hidden = true;
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-labelledby", "glb-name");
  lb.innerHTML = '<div class="x-glb__panel">' +
    '<figure class="x-glb__media" id="glb-media"></figure>' +
    '<div class="x-glb__info">' +
      '<div class="x-glb__bar"><span class="x-glb__pos" id="glb-pos"></span>' +
        '<button class="x-iconbtn" type="button" id="glb-prev" aria-label="Previous person">&larr; Prev</button>' +
        '<button class="x-iconbtn" type="button" id="glb-next" aria-label="Next person">Next &rarr;</button>' +
        '<button class="x-iconbtn" type="button" id="glb-close" aria-label="Close">✕</button></div>' +
      '<h2 id="glb-name"></h2><p class="x-glb__role" id="glb-role"></p>' +
      '<div class="x-tags" id="glb-tags"></div>' +
      '<div class="links" id="glb-links"></div>' +
    "</div></div>";
  doc.body.appendChild(lb);
  var lbIdx = 0, lbFrom = null, lbInertWas = false;

  function fillLB() {
    var r = gal.list[lbIdx];
    if (!r) return;
    var src = photoOf(r);
    $("glb-media").style.setProperty("--cat", catColor(r.category));
    $("glb-media").innerHTML = src ? '<img src="' + esc(src) + '" alt="Portrait of ' + esc(r.name) + '" />' :
      '<span class="x-glb__ini" aria-hidden="true">' + esc(initials(r.name)) + "</span>";
    $("glb-pos").textContent = (lbIdx + 1) + " of " + gal.list.length;
    $("glb-name").textContent = r.name;
    $("glb-role").textContent = r.current_role || "";
    $("glb-tags").innerHTML = '<span class="pill">' + esc(CAT_LABEL[r.category] || r.category) + "</span>" + (src ? "" : ' <span class="pill">No photo yet</span>');
    var su = src ? safeUrl(sourceUrl(r)) : "";
    $("glb-links").innerHTML = '<a class="btn" href="#' + esc(r.slug) + '" data-glb-profile>Open profile</a>' +
      (su ? '<a class="btn" href="' + su + '" target="_blank" rel="noopener">Photo source</a>' : "");
  }
  function openLB(i, from) {
    if (!gal.list.length) return;
    lbIdx = i; lbFrom = from || null;
    fillLB();
    if (lb.hidden) {
      lb.hidden = false;
      if (page) { lbInertWas = page.inert; page.inert = true; }
      doc.documentElement.style.overflow = "hidden";
      requestAnimationFrame(function () { lb.classList.add("is-open"); });
    }
    $("glb-close").focus();
  }
  function closeLB(restore) {
    if (lb.hidden) return;
    lb.classList.remove("is-open");
    lb.hidden = true;
    if (page) page.inert = lbInertWas;
    doc.documentElement.style.overflow = "";
    if (restore !== false) {
      var el = doc.querySelector('#gallery [data-gi="' + lbIdx + '"]') || lbFrom;
      if (el && el.focus) el.focus();
    }
    lbFrom = null;
  }
  function stepLB(d) { lbIdx = (lbIdx + d + gal.list.length) % gal.list.length; fillLB(); }
  $("glb-prev").onclick = function () { stepLB(-1); };
  $("glb-next").onclick = function () { stepLB(1); };
  $("glb-close").onclick = function () { closeLB(); };
  lb.addEventListener("click", function (e) {
    if (e.target === lb) { closeLB(); return; }
    var p = e.target.closest("[data-glb-profile]");
    if (p) {
      e.preventDefault();
      var slug = p.getAttribute("href").slice(1);
      closeLB(false);
      location.hash = slug;
    }
  });
  doc.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeLB(); }
    else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.altKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); stepLB(e.key === "ArrowLeft" ? -1 : 1); }
    else if (e.key === "Tab") {
      var f = lb.querySelectorAll("a[href], button:not([disabled])");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);
  window.addEventListener("hashchange", function () { if (!lb.hidden && BY[decodeURIComponent(location.hash.slice(1))]) closeLB(false); });

  // =================== You might also like ===================
  var STOP = {};
  ("the and for with from into that this than what when where which while about over under between their there these those your more most less much many very only also such each other being been have has had will would could should can may might must not are was were our its it's how why who all any one two new via per of to in on at by as an or is be a vs").split(" ").forEach(function (w) { STOP[w] = 1; });
  var ORGS = [
    /anthropic/i, /openai/i, /deepmind/i, /google brain/i, /safe superintelligence/i, /\bxai\b/i, /\bmetr\b/i, /\bmiri\b|machine intelligence research/i,
    /alignment research center/i, /redwood/i, /apollo research/i, /\bchai\b|human-compatible/i, /center for ai safety|\bcais\b/i, /future of life/i,
    /future of humanity/i, /lawzero/i, /far\.ai/i, /controlai/i, /palisade/i, /timaeus/i, /goodfire/i, /transluce/i, /ai futures project/i, /ai impacts/i,
    /forethought/i, /truthful ai/i, /ai security institute|\baisi\b/i, /caisi/i, /governance of ai|govai/i, /\bcset\b/i, /open philanthropy|coefficient giving/i,
    /institute for progress/i, /berkeley/i, /\bmit\b/i, /harvard/i, /stanford/i, /oxford/i, /cambridge/i, /montr[ée]al|\bmila\b/i, /toronto/i,
    /carnegie mellon/i, /new york university|\bnyu\b/i, /princeton/i, /tsinghua/i, /chinese academy/i, /microsoft/i, /meta\b|facebook/i, /humane technology/i,
    /\bdair\b/i, /algorithmic justice/i, /pauseai/i, /eleutherai/i, /conjecture/i, /baidu/i, /rand\b/i, /white house/i
  ];
  var FEAT = {};
  DATA.forEach(function (r) {
    var words = {};
    arr(r.key_ideas).join(" ").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/[\s\/-]+/).forEach(function (w) {
      if (w.length > 2 && !STOP[w]) words[w] = 1;
    });
    var orgText = [r.current_role].concat(arr(r.orgs_history)).join(" | ");
    var orgs = {};
    ORGS.forEach(function (re, i) { if (re.test(orgText)) orgs[i] = 1; });
    FEAT[r.slug] = { w: words, o: orgs };
  });
  function scoreOf(a, b) {
    var fa = FEAT[a.slug], fb = FEAT[b.slug], w = 0, o = 0, k;
    for (k in fa.w) if (fb.w[k]) w++;
    for (k in fa.o) if (fb.o[k]) o++;
    return { s: w * 2 + o * 3 + (a.category === b.category ? 1 : 0), w: w, o: o, c: a.category === b.category };
  }
  function recommend(r) {
    return DATA.filter(function (p) { return p !== r; }).map(function (p) { var x = scoreOf(r, p); x.r = p; return x; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s || a.r.name.localeCompare(b.r.name); })
      .slice(0, 4);
  }
  function why(x) {
    var bits = [];
    if (x.o) bits.push(x.o === 1 ? "Shared org" : x.o + " shared orgs");
    if (x.w) bits.push(x.w === 1 ? "1 shared idea word" : x.w + " shared idea words");
    if (!bits.length && x.c) bits.push("Same category");
    return bits.join(" · ");
  }
  function durTxt(d) {
    if (!d) return "";
    var h = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60), s = d % 60;
    return h ? h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s : m + ":" + (s < 10 ? "0" : "") + s;
  }
  function pickVideos(r, recs) {
    var V = Array.isArray(window.THEATER) ? window.THEATER : [];
    var out = [], seen = {};
    [r].concat(recs.map(function (x) { return x.r; })).forEach(function (p) {
      if (out.length >= 3) return;
      V.filter(function (v) { return v.s === p.slug && v.id && !seen[v.id]; })
        .sort(function (a, b) { return (b.y || 0) - (a.y || 0); })
        .forEach(function (v) { if (out.length < 3) { seen[v.id] = 1; out.push(v); } });
    });
    return out;
  }
  function ymalHTML(r) {
    var recs = recommend(r);
    var vids = pickVideos(r, recs);
    if (!recs.length && !vids.length) return "";
    var h = "<h3>You might also like</h3>";
    if (recs.length) {
      h += '<ul class="x-related__list">' + recs.map(function (x) {
        var w = why(x);
        return '<li><a class="x-related__item" href="#' + esc(x.r.slug) + '" aria-label="Open profile: ' + esc(x.r.name) + (w ? " (" + esc(w) + ")" : "") + '">' + avatar(x.r, 64) +
          '<span class="x-related__name">' + esc(x.r.name) + '</span><span class="x-related__why">' + esc(w) + "</span></a></li>";
      }).join("") + "</ul>";
    }
    if (vids.length) {
      var canPlay = typeof window.openTheater === "function";
      h += '<p class="x-ymal__sub">Videos</p><ul class="x-ymal__vids">' + vids.map(function (v) {
        var p = BY[v.s];
        var meta = [p && p.slug !== r.slug ? p.name : "", v.ch, v.y, durTxt(v.d)].filter(Boolean).map(esc).join(" · ");
        var inner = '<img src="https://i.ytimg.com/vi/' + esc(v.id) + '/hqdefault.jpg" alt="" loading="lazy" /><div><span>' + esc(v.t) + "</span><small>" + meta + "</small></div>";
        return "<li>" + (canPlay ? '<button class="x-tvm__item" type="button" data-ymal-vid="' + esc(v.id) + '">' + inner + "</button>" :
          '<a class="x-tvm__item" href="https://www.youtube.com/watch?v=' + esc(v.id) + '" target="_blank" rel="noopener">' + inner + "</a>") + "</li>";
      }).join("") + "</ul>";
    }
    return h;
  }

  var body = $("pro-body");
  function slugNow() { var s = ""; try { s = decodeURIComponent(location.hash.slice(1)); } catch (e) { s = location.hash.slice(1); } return s; }
  var pending = false;
  function placeYmal() {
    pending = false;
    if (!body) return;
    var r = BY[slugNow()];
    if (!r || !body.querySelector(".x-pro__head")) return;
    var sec = body.querySelector(":scope > .x-ymal");
    if (sec && sec.getAttribute("data-for") !== r.slug) { sec.remove(); sec = null; }
    if (!sec) {
      var html = ymalHTML(r);
      if (!html) return;
      sec = doc.createElement("section");
      sec.className = "x-block x-ymal";
      sec.setAttribute("data-for", r.slug);
      sec.innerHTML = html;
      body.appendChild(sec);
    } else if (body.lastElementChild !== sec) {
      body.appendChild(sec);
    }
  }
  function schedule() { if (!pending) { pending = true; setTimeout(placeYmal, 0); } }
  if (body) {
    new MutationObserver(schedule).observe(body, { childList: true });
    window.addEventListener("hashchange", schedule);
    schedule();
    body.addEventListener("click", function (e) {
      var b = e.target.closest("[data-ymal-vid]");
      if (!b || typeof window.openTheater !== "function") return;
      if (window.__xTheaterFromProfile) window.__xTheaterFromProfile();
      window.openTheater(b.getAttribute("data-ymal-vid"), b);
    });
  }
})();
