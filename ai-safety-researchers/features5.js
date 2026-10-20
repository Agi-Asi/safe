/* Step 5: "Who said it?" quiz and motion videos. */
(function () {
  "use strict";
  var doc = document;
  var DATA = Array.isArray(window.DATA) ? window.DATA : [];
  var CAT_LABEL = (window.XDIR && window.XDIR.catLabel) || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(id) { return doc.getElementById(id); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function safeUrl(u) { return /^https?:\/\//i.test(u || "") ? esc(u) : ""; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  var PHOTO = {};
  [].forEach.call(doc.querySelectorAll("#photo-bank img"), function (im) { PHOTO[im.getAttribute("data-p")] = im.getAttribute("src"); });
  function initials(name) {
    var p = String(name).replace(/\(.*?\)/g, "").trim().split(/\s+/);
    return ((p[0] || "")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }
  function avatar(r, size) {
    var src = r.photo && PHOTO[r.photo];
    var st = ' style="--av:' + size + 'px"';
    if (src) return '<img class="x-av"' + st + ' src="' + esc(src) + '" alt="" />';
    return '<span class="x-av x-av--init"' + st + ' aria-hidden="true">' + esc(initials(r.name)) + "</span>";
  }
  function isTyping(t) { return t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable); }
  function overlayOpen() { var o = $("overlay"); return o && !o.hidden; }
  function paletteOpen() { var c = doc.querySelector(".x-cmd"); return c && !c.hidden; }
  function closeProfileIfOpen() {
    if (!overlayOpen()) return;
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignore */ }
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  // =====================================================================
  // 1. Who said it?
  // =====================================================================
  var box = $("quiz-box");
  var POOL = [];
  DATA.forEach(function (r) {
    arr(r.quotes).forEach(function (q) {
      var t = String(q.text || "").trim();
      if (t && t.length < 220 && !q.unverified) POOL.push({ r: r, q: q, text: t });
    });
  });
  var ROUND = 10;
  var quiz = { items: [], i: 0, score: 0, streak: 0, best: 0, results: [], answered: false, choices: [], started: false };

  function pickRound() {
    var used = {}, out = [], rest = [];
    shuffle(POOL).forEach(function (p) {
      if (!used[p.r.slug] && out.length < ROUND) { used[p.r.slug] = true; out.push(p); } else rest.push(p);
    });
    while (out.length < ROUND && rest.length) out.push(rest.shift());
    return out;
  }
  function choicesFor(r) {
    var same = shuffle(DATA.filter(function (p) { return p !== r && p.category === r.category; }));
    var others = shuffle(DATA.filter(function (p) { return p !== r && p.category !== r.category; }));
    return shuffle([r].concat(same.concat(others).slice(0, 3)));
  }
  function dotsHTML() {
    var h = "";
    for (var k = 0; k < ROUND; k++) {
      var res = quiz.results[k], cls = res === true ? "is-right" : res === false ? "is-wrong" : k === quiz.i ? "is-now" : "";
      var lab = "Question " + (k + 1) + (res === true ? ": correct" : res === false ? ": wrong" : k === quiz.i ? ": current" : "");
      h += '<li class="' + cls + '" aria-label="' + lab + '"></li>';
    }
    return '<ol class="x-quiz__dots" aria-label="Progress">' + h + "</ol>";
  }
  function topHTML() {
    return '<div class="x-quiz__top">' + dotsHTML() +
      '<p class="x-quiz__stats"><span class="pill">Question ' + Math.min(quiz.i + 1, ROUND) + " / " + ROUND + '</span> <span class="pill">Score ' + quiz.score +
      '</span> <span class="pill' + (quiz.streak > 1 ? " x-quiz__hot" : "") + '">Streak ' + quiz.streak + (quiz.streak > 2 ? " 🔥" : "") + "</span></p></div>";
  }
  function startRound() {
    if (POOL.length < 4) { box.innerHTML = '<p class="x-empty">Not enough verified quotes for a quiz.</p>'; return; }
    quiz.items = pickRound(); quiz.i = 0; quiz.score = 0; quiz.streak = 0; quiz.best = 0; quiz.results = []; quiz.started = true;
    showQuestion();
  }
  function showQuestion() {
    var it = quiz.items[quiz.i];
    quiz.answered = false;
    quiz.choices = choicesFor(it.r);
    box.innerHTML = topHTML() +
      '<div class="x-quiz__card x-quiz__in"><blockquote class="x-quiz__quote">' + esc(it.text) + "</blockquote>" +
      '<div class="x-quiz__choices" role="group" aria-label="Who said it?">' + quiz.choices.map(function (r, k) {
        return '<button class="x-quiz__choice" type="button" data-k="' + k + '"><kbd>' + (k + 1) + "</kbd>" + avatar(r, 40) +
          '<span class="x-quiz__name">' + esc(r.name) + '<small>' + esc(CAT_LABEL[r.category] || "") + "</small></span></button>";
      }).join("") + '</div><div class="x-quiz__reveal" hidden></div></div>';
  }
  function answer(k) {
    if (quiz.answered || !quiz.started || quiz.i >= quiz.items.length) return;
    quiz.answered = true;
    var it = quiz.items[quiz.i], picked = quiz.choices[k], right = picked === it.r;
    quiz.results[quiz.i] = right;
    if (right) { quiz.score++; quiz.streak++; quiz.best = Math.max(quiz.best, quiz.streak); } else quiz.streak = 0;
    var top = box.querySelector(".x-quiz__top");
    if (top) top.outerHTML = topHTML();
    [].forEach.call(box.querySelectorAll(".x-quiz__choice"), function (b) {
      var c = quiz.choices[+b.getAttribute("data-k")];
      b.disabled = true;
      b.setAttribute("aria-disabled", "true");
      if (c === it.r) b.classList.add("is-right");
      else if (c === picked) b.classList.add("is-wrong");
      else b.classList.add("is-dim");
    });
    var src = safeUrl(it.q.source_url);
    var last = quiz.i === ROUND - 1 || quiz.i === quiz.items.length - 1;
    var rv = box.querySelector(".x-quiz__reveal");
    rv.innerHTML = '<p class="x-quiz__verdict ' + (right ? "is-right" : "is-wrong") + '">' + (right ? "Correct — " : "Not quite — it was ") + "<strong>" + esc(it.r.name) + "</strong></p>" +
      (it.q.context ? '<p class="x-quiz__ctx">' + esc(it.q.context) + "</p>" : "") +
      '<div class="links">' + (src ? '<a class="btn" href="' + src + '" target="_blank" rel="noopener">Source</a>' : "") +
      '<a class="btn" href="#' + esc(it.r.slug) + '">Open profile</a>' +
      '<button class="btn x-quiz__next" type="button" data-next>' + (last ? "See your score" : "Next question") + " &rarr;</button></div>";
    rv.hidden = false;
    var nx = rv.querySelector("[data-next]");
    if (nx) nx.focus({ preventScroll: true });
  }
  function next() {
    quiz.i++;
    if (quiz.i >= quiz.items.length) showEnd(); else showQuestion();
    var c = box.querySelector(".x-quiz__choice, [data-restart]");
    if (c) c.focus({ preventScroll: true });
    var b = box.getBoundingClientRect();
    if (b.top < 0) box.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  function rating(s) {
    if (s >= 10) return ["Alignment oracle", "A perfect round. You know this field by voice alone."];
    if (s >= 8) return ["Senior researcher", "You could pick most of these people out of a crowd."];
    if (s >= 6) return ["Promising fellow", "A solid grasp of who stands where."];
    if (s >= 4) return ["Curious reader", "A good start. The directory will fill in the rest."];
    return ["Fresh recruit", "Everyone starts somewhere. Browse a few profiles and try again."];
  }
  function showEnd() {
    quiz.started = false;
    var rt = rating(quiz.score);
    box.innerHTML = '<div class="x-quiz__top">' + dotsHTML() + "</div>" +
      '<div class="x-quiz__end x-quiz__in"><p class="x-quiz__final">' + quiz.score + "<span> / " + quiz.items.length + "</span></p>" +
      '<h3>' + esc(rt[0]) + "</h3><p>" + esc(rt[1]) + '</p><p class="fineprint">Best streak: ' + quiz.best + "</p>" +
      '<div class="links"><button class="btn" type="button" data-restart>Restart</button></div></div>';
  }
  if (box) {
    box.addEventListener("click", function (e) {
      var c = e.target.closest(".x-quiz__choice");
      if (c && !c.disabled) { answer(+c.getAttribute("data-k")); return; }
      if (e.target.closest("[data-next]")) { next(); return; }
      if (e.target.closest("[data-restart]")) { startRound(); var f = box.querySelector(".x-quiz__choice"); if (f) f.focus({ preventScroll: true }); }
    });
    var inView = false;
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }).observe(box);
    window.addEventListener("keydown", function (e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (!/^[1-4]$/.test(e.key) || !inView || overlayOpen() || paletteOpen() || modalOpen()) return;
      if (quiz.answered || !quiz.started) return;
      e.preventDefault();
      answer(+e.key - 1);
    });
    startRound();
  }

  // =====================================================================
  // 2. Motion videos
  // =====================================================================
  var BASE = "https://agi-asi.github.io/safe/ai-safety-researchers/videos/";
  var FULL = "https://agi-asi.github.io/safe/ai-safety-researchers/#watch";
  var VIDEOS = {};
  [].forEach.call(doc.querySelectorAll("#vgrid [data-video]"), function (b) {
    var img = b.querySelector("img");
    VIDEOS[b.getAttribute("data-video")] = { name: b.getAttribute("data-video"), title: b.getAttribute("data-title"), slug: b.getAttribute("data-slug") || "",
      dur: (b.querySelector(".x-vcard__dur") || {}).textContent || "", card: b, img: img };
  });
  function posterOf(v) { return v.img && v.img.isConnected ? v.img.getAttribute("src") : ""; }

  var modal = doc.createElement("div");
  modal.className = "x-vmodal";
  modal.hidden = true;
  modal.innerHTML = '<div class="x-vmodal__panel" role="dialog" aria-modal="true" aria-labelledby="x-vmodal-title">' +
    '<div class="x-vmodal__bar"><p class="x-vmodal__title" id="x-vmodal-title"></p><button class="x-iconbtn" type="button" data-vclose aria-label="Close video">Close ✕</button></div>' +
    '<div class="x-vmodal__stage"></div></div>';
  doc.body.appendChild(modal);
  var stage = modal.querySelector(".x-vmodal__stage"), titleEl = $("x-vmodal-title");
  var cur = null, hls = null, timer = null, token = 0, opener = null, inertSaved = [];
  function modalOpen() { return !modal.hidden; }

  var hlsLoading = null;
  function loadHls() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (hlsLoading) return hlsLoading;
    hlsLoading = new Promise(function (res, rej) {
      var s = doc.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/hls.js@1";
      s.async = true;
      s.onload = function () { window.Hls ? res(window.Hls) : rej(new Error("Hls missing")); };
      s.onerror = function () { hlsLoading = null; s.remove(); rej(new Error("Hls blocked")); };
      doc.head.appendChild(s);
    });
    return hlsLoading;
  }
  function teardown() {
    clearTimeout(timer); timer = null;
    if (hls) { try { hls.destroy(); } catch (e) { /* ignore */ } hls = null; }
    var v = stage.querySelector("video");
    if (v) { try { v.pause(); } catch (e) { /* ignore */ } v.removeAttribute("src"); try { v.load(); } catch (e) { /* ignore */ } }
  }
  function fallback(my) {
    if (my !== token || !cur) return;
    token++;
    teardown();
    var p = posterOf(cur);
    stage.innerHTML = '<div class="x-vfall">' + (p ? '<img src="' + esc(p) + '" alt="" />' : "") +
      '<div class="x-vfall__box"><p>Video playback isn\'t available in this preview</p>' +
      '<a class="btn" href="' + FULL + '" target="_blank" rel="noopener">Watch on the full site</a></div></div>';
  }
  function openVideo(name, from) {
    var v = VIDEOS[name];
    if (!v) return;
    if (modalOpen()) teardown();
    cur = v; var my = ++token;
    opener = from || doc.activeElement;
    titleEl.textContent = v.title + (v.dur ? " · " + v.dur : "");
    var p = posterOf(v);
    stage.innerHTML = '<video controls playsinline autoplay preload="auto"' + (p ? ' poster="' + esc(p) + '"' : "") + "></video>";
    var video = stage.querySelector("video"), ok = false, url = BASE + name + "/index.m3u8";
    function good() { ok = true; clearTimeout(timer); }
    video.addEventListener("playing", good);
    video.addEventListener("canplay", function () {
      good();
      var pr = video.play && video.play();
      if (pr && pr.catch) pr.catch(function () { /* autoplay refused; controls stay */ });
    });
    video.addEventListener("error", function () { if (!ok || video.error) fallback(my); });
    timer = setTimeout(function () { if (!ok) fallback(my); }, 8000);

    if (!modalOpen()) {
      inertSaved = [];
      [doc.querySelector(".page"), $("overlay")].forEach(function (el) { if (el) { inertSaved.push([el, el.inert]); el.inert = true; } });
      modal.hidden = false;
      doc.documentElement.classList.add("x-vlock");
      requestAnimationFrame(function () { modal.classList.add("is-open"); });
    }
    modal.querySelector("[data-vclose]").focus();

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    } else {
      loadHls().then(function (Hls) {
        if (my !== token) return;
        if (!Hls.isSupported()) { fallback(my); return; }
        hls = new Hls({ debug: false });
        hls.on(Hls.Events.ERROR, function (ev, data) { if (data && data.fatal) fallback(my); });
        hls.loadSource(url);
        hls.attachMedia(video);
      }).catch(function () { fallback(my); });
    }
  }
  function closeVideo() {
    if (!modalOpen()) return;
    token++;
    teardown();
    stage.innerHTML = "";
    modal.classList.remove("is-open");
    modal.hidden = true;
    doc.documentElement.classList.remove("x-vlock");
    inertSaved.forEach(function (p) { p[0].inert = p[1]; });
    inertSaved = [];
    cur = null;
    if (opener && opener.focus && doc.contains(opener)) opener.focus({ preventScroll: true });
    opener = null;
  }
  modal.addEventListener("click", function (e) {
    if (e.target === modal || e.target.closest("[data-vclose]")) closeVideo();
  });
  window.addEventListener("keydown", function (e) {
    if (!modalOpen() || paletteOpen()) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeVideo(); return; }
    if (e.key === "Tab") {
      var f = [].filter.call(modal.querySelectorAll("a[href], button, video"), function (x) { return x.offsetParent !== null || x.tagName === "VIDEO"; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (!modal.contains(doc.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      e.stopPropagation();
    }
  }, true);
  var grid = $("vgrid");
  if (grid) grid.addEventListener("click", function (e) {
    var b = e.target.closest("[data-video]");
    if (b) openVideo(b.getAttribute("data-video"), b);
  });

  // Profile overlay: "Watch profile video"
  var BY_SLUG = {};
  Object.keys(VIDEOS).forEach(function (k) { if (VIDEOS[k].slug) BY_SLUG[VIDEOS[k].slug] = VIDEOS[k]; });
  var proBody = $("pro-body");
  function addWatchBtn() {
    if (!proBody) return;
    var slug = decodeURIComponent(location.hash.slice(1)), v = BY_SLUG[slug];
    if (!v || proBody.querySelector(".x-watchbtn")) return;
    var meta = proBody.querySelector(".x-pro__acts") || proBody.querySelector(".x-pro__meta");
    if (!meta) return;
    var b = doc.createElement("button");
    b.type = "button"; b.className = "btn x-watchbtn"; b.setAttribute("data-watch", v.name);
    b.textContent = "▶ Watch profile video";
    b.setAttribute("aria-label", "Watch " + v.title + " profile video, " + v.dur);
    meta.appendChild(b);
  }
  if (proBody) {
    new MutationObserver(addWatchBtn).observe(proBody, { childList: true, subtree: true });
    window.addEventListener("hashchange", function () { setTimeout(addWatchBtn, 0); });
    addWatchBtn();
    proBody.addEventListener("click", function (e) {
      var b = e.target.closest("[data-watch]");
      if (b) openVideo(b.getAttribute("data-watch"), b);
    });
  }

  // Deep link to #watch
  function toWatch() { var w = $("watch"); if (w && location.hash === "#watch") w.scrollIntoView({ behavior: "auto", block: "start" }); }
  if (doc.readyState === "complete") setTimeout(toWatch, 0); else window.addEventListener("load", function () { setTimeout(toWatch, 0); });

  // ---------- Command palette ----------
  var prevActions = window.XCMP_ACTIONS;
  var Q = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14"/><circle cx="12" cy="17.5" r=".6" fill="currentColor"/></svg>';
  window.XCMP_ACTIONS = function () {
    var base = typeof prevActions === "function" ? prevActions() : [];
    return base.concat([{
      kind: "Action", icon: Q, name: "Start quiz", sub: "Who said it? Ten verified quotes",
      run: function () {
        closeProfileIfOpen();
        if (!quiz.started || quiz.answered || quiz.i > 0) startRound();
        setTimeout(function () {
          $("quiz").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
          var f = box && box.querySelector(".x-quiz__choice");
          if (f) f.focus({ preventScroll: true });
        }, 0);
      }
    }]);
  };
})();
