/* Round F1: persistent mini-player + custom controls on the YouTube IFrame Player API for the Theater. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, win = window;
  var modal = doc.querySelector(".x-tvm");
  if (!modal) return;
  var stage = modal.querySelector(".x-vmodal__stage");
  var panel = modal.querySelector(".x-vmodal__panel");
  if (!stage || !panel) return;
  var page = doc.querySelector(".page");
  var KEY = "x-player-last";
  var RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  var ORIGIN = location.origin;
  var BY_ID = {};
  (win.THEATER || []).forEach(function (v) { BY_ID[v.id] = v; });

  function motionOk() { return !root.classList.contains("x-rm") && !(win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function phone() { return win.matchMedia && win.matchMedia("(max-width: 599px)").matches; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h ? h + ":" + pad(m) + ":" + pad(x) : pad(m) + ":" + pad(x);
  }
  function store(obj) { try { if (obj) localStorage.setItem(KEY, JSON.stringify(obj)); else localStorage.removeItem(KEY); } catch (e) { /* storage blocked */ } }
  function loadSaved() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function toast(msg) {
    var el = doc.querySelector(".x-toast");
    if (!el) { el = doc.createElement("div"); el.className = "x-toast"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); doc.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("is-on"); }, 2400);
  }

  // ---------- Icons ----------
  function svg(d, stroke) {
    return '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"' + (stroke ? ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' : ' fill="currentColor"') + ">" + d + "</svg>";
  }
  var I = {
    play: svg('<path d="M8 5v14l11-7z"/>'),
    pause: svg('<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>'),
    vol: svg('<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" stroke="none"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>', true),
    muted: svg('<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" stroke="none"/><path d="M17 9l5 6M22 9l-5 6"/>', true),
    loop: svg('<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>', true),
    mini: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><rect x="12" y="12" width="7" height="6" rx="1" fill="currentColor"/>', true),
    wide: svg('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M14 12h4M8 10l-2 2 2 2M16 10l2 2-2 2"/>', true),
    full: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', true),
    share: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', true),
    expand: svg('<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>', true),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>', true)
  };

  // ---------- Control bar under the video ----------
  var pl = doc.createElement("div");
  pl.className = "x-pl";
  stage.parentNode.insertBefore(pl, stage);
  pl.appendChild(stage);
  var bar = doc.createElement("div");
  bar.className = "x-pc";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Player controls");
  bar.innerHTML =
    '<input class="x-range x-pc__seek" type="range" min="0" max="1000" step="1" value="0" aria-label="Seek" aria-valuetext="00:00" />' +
    '<div class="x-pc__row">' +
    '<button class="x-iconbtn" type="button" data-pc="play" aria-label="Play (K)" title="Play / pause (Space, K)">' + I.play + "</button>" +
    '<button class="x-iconbtn" type="button" data-pc="back" aria-label="Back 10 seconds (J)" title="Back 10s (J)">−10</button>' +
    '<button class="x-iconbtn" type="button" data-pc="fwd" aria-label="Forward 10 seconds (L)" title="Forward 10s (L)">+10</button>' +
    '<span class="x-pc__time" aria-live="off">--:-- / --:--</span>' +
    '<span class="x-pc__sp"></span>' +
    '<label class="x-pc__speed" title="Speed (Shift+&lt; / Shift+&gt;)"><span class="x-pc__sr">Speed</span><select data-pc="rate">' +
    RATES.map(function (r) { return '<option value="' + r + '"' + (r === 1 ? " selected" : "") + ">" + r + "×</option>"; }).join("") + "</select></label>" +
    '<span class="x-pc__vol"><button class="x-iconbtn" type="button" data-pc="mute" aria-label="Mute (M)" aria-pressed="false" title="Mute (M)">' + I.vol + "</button>" +
    '<input class="x-range x-pc__volr" type="range" min="0" max="100" step="1" value="100" aria-label="Volume" /></span>' +
    '<button class="x-iconbtn" type="button" data-pc="cc" aria-label="Captions (C)" aria-pressed="false" title="Captions (C)">CC</button>' +
    '<button class="x-iconbtn" type="button" data-pc="loop" aria-label="Loop" aria-pressed="false" title="Loop">' + I.loop + "</button>" +
    '<button class="x-iconbtn" type="button" data-pc="mini" aria-label="Mini-player (I)" title="Mini-player (I)">' + I.mini + "</button>" +
    '<button class="x-iconbtn" type="button" data-pc="wide" aria-label="Wide mode" aria-pressed="false" title="Wide mode">' + I.wide + "</button>" +
    '<button class="x-iconbtn" type="button" data-pc="full" aria-label="Fullscreen (F)" aria-pressed="false" title="Fullscreen (F)">' + I.full + "</button>" +
    '<button class="x-iconbtn" type="button" data-pc="share" aria-label="Copy link at this time" title="Share at this time">' + I.share + "</button>" +
    "</div>";
  pl.appendChild(bar);
  function q(sel) { return bar.querySelector(sel); }
  var seekEl = q(".x-pc__seek"), timeEl = q(".x-pc__time"), playBtn = q('[data-pc="play"]'), rateSel = q('[data-pc="rate"]');
  var muteBtn = q('[data-pc="mute"]'), volEl = q(".x-pc__volr"), ccBtn = q('[data-pc="cc"]'), loopBtn = q('[data-pc="loop"]');
  var wideBtn = q('[data-pc="wide"]'), fullBtn = q('[data-pc="full"]');
  var fsOk = !!(pl.requestFullscreen || pl.webkitRequestFullscreen);
  if (!fsOk) fullBtn.hidden = true;

  // ---------- Mini-player ----------
  var mini = doc.createElement("div");
  mini.className = "x-mini";
  mini.hidden = true;
  mini.setAttribute("role", "region");
  mini.setAttribute("aria-label", "Mini player");
  mini.innerHTML =
    '<div class="x-mini__video"></div>' +
    '<div class="x-mini__prog" aria-hidden="true"><span></span></div>' +
    '<div class="x-mini__bar"><span class="x-mini__grip" aria-hidden="true"></span><p class="x-mini__title"></p>' +
    '<button class="x-iconbtn" type="button" data-mini="play" aria-label="Pause">' + I.pause + "</button>" +
    '<button class="x-iconbtn" type="button" data-mini="expand" aria-label="Expand to full player">' + I.expand + "</button>" +
    '<button class="x-iconbtn" type="button" data-mini="close" aria-label="Close video" title="Close">' + I.close + "</button></div>";
  doc.body.appendChild(mini);
  var miniVideo = mini.querySelector(".x-mini__video"), miniTitle = mini.querySelector(".x-mini__title");
  var miniProg = mini.querySelector(".x-mini__prog span"), miniPlay = mini.querySelector('[data-mini="play"]');

  // ---------- State ----------
  var frame = null, player = null, ready = false, curId = "", curTitle = "", miniOn = false;
  var lastT = 0, lastD = 0, state = -1, scrubbing = false, pending = null, seq = 0, lastSave = 0;
  var prefs = { rate: 1, vol: 100, muted: false, cc: false, loop: false };
  var ticks = [];

  function embed(id, start, auto) {
    return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=" + (auto ? 1 : 0) +
      "&rel=0&playsinline=1&enablejsapi=1&origin=" + encodeURIComponent(ORIGIN) + (start > 0 ? "&start=" + Math.floor(start) : "");
  }
  function idOf(src) { var m = /\/embed\/([\w-]+)/.exec(src || ""); return m ? m[1] : ""; }

  // ---------- YouTube IFrame API, loaded once ----------
  var apiWait = [], apiState = win.YT && win.YT.Player ? 2 : 0;
  function whenAPI(fn) {
    if (apiState === 2 || (win.YT && win.YT.Player)) { apiState = 2; fn(); return; }
    if (apiState === 3) return;
    apiWait.push(fn);
    if (apiState === 1) return;
    apiState = 1;
    var prev = win.onYouTubeIframeAPIReady;
    win.onYouTubeIframeAPIReady = function () {
      apiState = 2;
      if (typeof prev === "function") { try { prev(); } catch (e) { /* other handler */ } }
      var w = apiWait; apiWait = [];
      w.forEach(function (f) { try { f(); } catch (e) { /* skip */ } });
    };
    if (!doc.querySelector('script[src*="youtube.com/iframe_api"]')) {
      var s = doc.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.onerror = function () { apiState = 3; apiWait = []; bar.classList.add("is-noapi"); };
      doc.head.appendChild(s);
    }
  }
  function call(name) {
    if (!player || !ready || typeof player[name] !== "function") return undefined;
    try { return player[name].apply(player, [].slice.call(arguments, 1)); } catch (e) { return undefined; }
  }
  function bind(el) {
    ready = false; player = null;
    var my = ++seq;
    setEnabled(false);
    whenAPI(function () {
      if (my !== seq || el !== frame) return;
      try {
        player = new win.YT.Player(el, {
          events: {
            onReady: function () {
              if (my !== seq) return;
              ready = true;
              setEnabled(true);
              if (prefs.rate !== 1) call("setPlaybackRate", prefs.rate);
              call("setVolume", prefs.vol);
              if (prefs.muted) call("mute");
              if (prefs.cc) call("loadModule", "captions");
              syncUI();
            },
            onStateChange: function (e) {
              if (my !== seq) return;
              state = e.data;
              if (state === 0) {
                if (prefs.loop) { call("seekTo", 0, true); call("playVideo"); }
                else store(null);
              }
              if (state === 1) hideResume();
              syncUI();
            },
            onPlaybackRateChange: function (e) { prefs.rate = e.data; rateSel.value = String(e.data); }
          }
        });
      } catch (e) { player = null; }
    });
  }
  function setEnabled(on) {
    [].forEach.call(bar.querySelectorAll("button, input, select"), function (c) {
      var k = c.getAttribute("data-pc");
      if (k === "mini" || k === "wide" || k === "full" || k === "share") return;
      c.disabled = !on;
    });
    miniPlay.disabled = !on;
  }

  // ---------- Adopt the iframe the Theater inserts ----------
  function adopt(foreign) {
    var id = idOf(foreign.getAttribute("src"));
    var v = typeof win.theaterCurrent === "function" ? win.theaterCurrent() : null;
    if (miniOn && frame) {
      if (id === curId) { foreign.parentNode.removeChild(foreign); moveFrame(stage); hideMini(); return; }
      killMini();
    }
    var start = 0;
    if (pending && pending.id === id) { start = pending.t; pending = null; }
    var f = doc.createElement("iframe");
    f.setAttribute("data-xpl", "");
    f.id = "x-yt-" + (++seq);
    f.title = foreign.title || (v && v.t) || "YouTube video";
    f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    f.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen");
    f.setAttribute("allowfullscreen", "");
    f.src = embed(id, start, true);
    foreign.parentNode.replaceChild(f, foreign);
    frame = f; curId = id; curTitle = (v && v.id === id ? v.t : f.title);
    lastT = start; lastD = (BY_ID[id] && BY_ID[id].d) || 0; state = -1;
    pl.classList.add("has-player");
    hideResume();
    bind(f);
    syncUI();
  }
  function scan() {
    var foreign = stage.querySelector("iframe:not([data-xpl])");
    if (foreign) return adopt(foreign);
    if (!stage.querySelector("iframe") && !miniOn) {
      if (frame) { saveNow(); frame = null; player = null; ready = false; seq++; curId = ""; }
      pl.classList.remove("has-player");
    }
  }
  new MutationObserver(scan).observe(stage, { childList: true });
  scan();

  // Move the same iframe element; moveBefore keeps it playing where supported, else it resumes at the same second.
  function moveFrame(target) {
    if (!frame) return;
    var t = getTime(), playing = state === 1 || state === 3 || state === -1;
    if (typeof target.moveBefore === "function" && frame.isConnected) {
      try { target.moveBefore(frame, null); return; } catch (e) { /* fall through */ }
    }
    target.appendChild(frame);
    frame.src = embed(curId, t, playing);
    lastT = t;
    bind(frame);
  }

  function overlayOpen() { var o = doc.getElementById("overlay"); return !!(o && !o.hidden); }
  function exitFs() {
    var fe = doc.fullscreenElement || doc.webkitFullscreenElement;
    if (fe) { try { (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc); } catch (e) { /* ignore */ } }
  }
  function minimise() {
    if (!frame || modal.hidden || miniOn) return false;
    exitFs();
    miniOn = true;
    miniTitle.textContent = curTitle;
    miniTitle.title = curTitle;
    mini.hidden = false;
    mini.classList.remove("is-in");
    void mini.offsetWidth;
    if (motionOk()) mini.classList.add("is-in");
    moveFrame(miniVideo);
    modal.classList.remove("is-open");
    modal.hidden = true;
    root.classList.remove("x-vlock");
    root.classList.add("x-mini-on");
    if (page) page.inert = overlayOpen();
    clampMini();
    syncUI();
    miniPlay.focus({ preventScroll: true });
    return true;
  }
  function hideMini() {
    miniOn = false;
    mini.hidden = true;
    mini.classList.remove("is-in");
    root.classList.remove("x-mini-on");
  }
  function killMini() {
    if (frame && frame.parentNode === miniVideo) miniVideo.removeChild(frame);
    saveNow();
    frame = null; player = null; ready = false; seq++; curId = "";
    hideMini();
    pl.classList.remove("has-player");
  }
  function expand() {
    if (!miniOn || !frame) return;
    modal.hidden = false;
    root.classList.add("x-vlock");
    if (page) page.inert = true;
    requestAnimationFrame(function () { modal.classList.add("is-open"); });
    moveFrame(stage);
    hideMini();
    syncUI();
    var c = modal.querySelector("[data-tvclose]");
    if (c) c.focus({ preventScroll: true });
  }

  mini.addEventListener("click", function (e) {
    var b = e.target.closest("[data-mini]");
    if (!b) return;
    var k = b.getAttribute("data-mini");
    if (k === "play") togglePlay();
    else if (k === "expand") expand();
    else if (k === "close") killMini();
  });

  // ---------- Drag the mini-player ----------
  var drag = null;
  var mbar = mini.querySelector(".x-mini__bar");
  mbar.addEventListener("pointerdown", function (e) {
    if (phone() || e.button > 0 || e.target.closest("button")) return;
    var r = mini.getBoundingClientRect();
    drag = { x: e.clientX, y: e.clientY, l: r.left, t: r.top, id: e.pointerId };
    try { mbar.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    mini.classList.add("is-drag");
    e.preventDefault();
  });
  mbar.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    place(drag.l + e.clientX - drag.x, drag.t + e.clientY - drag.y);
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    drag = null;
    mini.classList.remove("is-drag");
  }
  mbar.addEventListener("pointerup", endDrag);
  mbar.addEventListener("pointercancel", endDrag);
  function place(l, t) {
    var w = mini.offsetWidth, h = mini.offsetHeight, vw = root.clientWidth, vh = win.innerHeight;
    l = Math.min(Math.max(8, l), Math.max(8, vw - w - 8));
    t = Math.min(Math.max(8, t), Math.max(8, vh - h - 8));
    mini.style.left = l + "px"; mini.style.top = t + "px";
    mini.style.right = "auto"; mini.style.bottom = "auto";
  }
  function clampMini() {
    if (mini.hidden || !mini.style.left || phone()) return;
    place(parseFloat(mini.style.left), parseFloat(mini.style.top));
  }
  win.addEventListener("resize", clampMini);

  // ---------- Commands ----------
  function getTime() { var t = call("getCurrentTime"); if (typeof t === "number" && !isNaN(t)) lastT = t; return lastT; }
  function getDur() { var d = call("getDuration"); if (typeof d === "number" && d > 0) lastD = d; return lastD; }
  function seek(t) {
    var d = getDur();
    t = Math.max(0, d ? Math.min(t, d - 0.5) : t);
    lastT = t;
    call("seekTo", t, true);
    syncUI();
  }
  function togglePlay() {
    if (!ready) return;
    if (state === 1 || state === 3) call("pauseVideo"); else call("playVideo");
  }
  function setRate(r) { prefs.rate = r; rateSel.value = String(r); call("setPlaybackRate", r); toast("Speed " + r + "×"); }
  function stepRate(dir) {
    var i = RATES.indexOf(prefs.rate);
    if (i < 0) i = 2;
    i = Math.min(RATES.length - 1, Math.max(0, i + dir));
    setRate(RATES[i]);
  }
  function setVol(v) {
    prefs.vol = Math.max(0, Math.min(100, Math.round(v)));
    call("setVolume", prefs.vol);
    if (prefs.vol > 0 && prefs.muted) { prefs.muted = false; call("unMute"); }
    syncUI();
  }
  function toggleMute() {
    prefs.muted = !prefs.muted;
    call(prefs.muted ? "mute" : "unMute");
    if (!prefs.muted && prefs.vol === 0) setVol(50);
    syncUI();
  }
  function toggleCC() {
    prefs.cc = !prefs.cc;
    if (prefs.cc) { call("loadModule", "captions"); } else { call("unloadModule", "captions"); }
    toast(prefs.cc ? "Captions on" : "Captions off");
    syncUI();
  }
  function toggleLoop() { prefs.loop = !prefs.loop; toast(prefs.loop ? "Loop on" : "Loop off"); syncUI(); }
  function toggleWide() { modal.classList.toggle("x-tvm--wide"); syncUI(); }
  function toggleFull() {
    var fe = doc.fullscreenElement || doc.webkitFullscreenElement;
    try {
      if (fe) (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
      else { var p = (pl.requestFullscreen || pl.webkitRequestFullscreen).call(pl); if (p && p.catch) p.catch(function () { /* denied */ }); }
    } catch (e) { /* unsupported */ }
  }
  doc.addEventListener("fullscreenchange", syncUI);
  doc.addEventListener("webkitfullscreenchange", syncUI);
  function share() {
    if (!curId) return;
    var url = "https://youtu.be/" + curId + "?t=" + Math.floor(getTime());
    function fallback() {
      var ta = doc.createElement("textarea");
      ta.value = url; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      (modal.hidden ? doc.body : panel).appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = doc.execCommand("copy"); } catch (e) { ok = false; }
      ta.parentNode.removeChild(ta);
      toast(ok ? "Link copied: " + url : url);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { toast("Link copied: " + url); }, fallback);
    } else fallback();
  }

  bar.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-pc]");
    if (!b || b.disabled) return;
    var k = b.getAttribute("data-pc");
    if (k === "play") togglePlay();
    else if (k === "back") seek(getTime() - 10);
    else if (k === "fwd") seek(getTime() + 10);
    else if (k === "mute") toggleMute();
    else if (k === "cc") toggleCC();
    else if (k === "loop") toggleLoop();
    else if (k === "mini") minimise();
    else if (k === "wide") toggleWide();
    else if (k === "full") toggleFull();
    else if (k === "share") share();
  });
  rateSel.addEventListener("change", function () { setRate(parseFloat(rateSel.value) || 1); });
  volEl.addEventListener("input", function () { setVol(+volEl.value); });
  seekEl.addEventListener("input", function () {
    scrubbing = true;
    var d = getDur(), t = d * seekEl.value / 1000;
    seekEl.style.setProperty("--p", seekEl.value / 10 + "%");
    timeEl.textContent = timeText(t, d);
    seekEl.setAttribute("aria-valuetext", fmt(t));
  });
  seekEl.addEventListener("change", function () {
    scrubbing = false;
    seek(getDur() * seekEl.value / 1000);
  });
  seekEl.addEventListener("blur", function () { scrubbing = false; });

  // ---------- UI sync and tick ----------
  function timeText(t, d) {
    if (!d) return fmt(t) + " / --:--";
    return fmt(t) + " / " + fmt(d) + " · −" + fmt(d - t) + " left";
  }
  function syncUI() {
    var t = getTime(), d = getDur(), playing = state === 1 || state === 3;
    var p = d ? Math.min(1, t / d) : 0;
    if (!scrubbing) {
      seekEl.value = String(Math.round(p * 1000));
      seekEl.style.setProperty("--p", p * 100 + "%");
      timeEl.textContent = timeText(t, d);
      seekEl.setAttribute("aria-valuetext", fmt(t) + " of " + (d ? fmt(d) : "unknown"));
    }
    miniProg.style.transform = "scaleX(" + p + ")";
    playBtn.innerHTML = playing ? I.pause : I.play;
    playBtn.setAttribute("aria-label", playing ? "Pause (K)" : "Play (K)");
    miniPlay.innerHTML = playing ? I.pause : I.play;
    miniPlay.setAttribute("aria-label", playing ? "Pause" : "Play");
    var muted = prefs.muted || prefs.vol === 0;
    muteBtn.innerHTML = muted ? I.muted : I.vol;
    muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
    muteBtn.setAttribute("aria-label", muted ? "Unmute (M)" : "Mute (M)");
    volEl.value = String(prefs.muted ? 0 : prefs.vol);
    volEl.style.setProperty("--p", (prefs.muted ? 0 : prefs.vol) + "%");
    ccBtn.setAttribute("aria-pressed", prefs.cc ? "true" : "false");
    loopBtn.setAttribute("aria-pressed", prefs.loop ? "true" : "false");
    wideBtn.setAttribute("aria-pressed", modal.classList.contains("x-tvm--wide") ? "true" : "false");
    var fe = doc.fullscreenElement || doc.webkitFullscreenElement;
    fullBtn.setAttribute("aria-pressed", fe === pl ? "true" : "false");
  }
  function saveNow() {
    if (!curId || lastT < 1) return;
    store({ id: curId, t: Math.floor(lastT), title: curTitle, at: Date.now() });
  }
  setInterval(function () {
    if (!frame || !ready) return;
    if (modal.hidden && !miniOn) return;
    var st = call("getPlayerState");
    if (typeof st === "number") state = st;
    syncUI();
    var now = Date.now();
    if (state === 1 && now - lastSave > 2000) { lastSave = now; saveNow(); }
    for (var i = 0; i < ticks.length; i++) { try { ticks[i](lastT, lastD, curId); } catch (e) { /* listener error */ } }
  }, 250);
  win.addEventListener("pagehide", saveNow);

  // ---------- Minimise instead of closing: backdrop, profile and in-player links ----------
  doc.addEventListener("click", function (e) {
    if (modal.hidden || !frame) return;
    if (e.target === modal) { e.stopPropagation(); e.preventDefault(); minimise(); return; }
    var pr = e.target.closest && e.target.closest("[data-tvprofile]");
    if (pr && modal.contains(pr)) {
      e.stopPropagation(); e.preventDefault();
      var slug = pr.getAttribute("data-tvprofile");
      minimise();
      location.hash = slug;
      return;
    }
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a && modal.contains(a) && !/^#theater/.test(a.getAttribute("href"))) minimise();
  }, true);

  // ---------- Keyboard ----------
  var lightsBtn = modal.querySelector(".x-lightsbtn");
  if (lightsBtn) { lightsBtn.title = "Lights · Next (N)"; lightsBtn.removeAttribute("aria-keyshortcuts"); }
  win.addEventListener("keydown", function (e) {
    if (modal.hidden) return;
    var pal = doc.querySelector(".x-cmd");
    if (pal && !pal.hidden) return;
    if (e.key === "Escape") {
      if (!frame) return;
      if (doc.fullscreenElement || doc.webkitFullscreenElement) { e.stopPropagation(); return; }
      e.preventDefault(); e.stopPropagation();
      minimise();
      return;
    }
    if (!frame || e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target, tag = tg && tg.tagName;
    if (tag === "TEXTAREA" || tag === "SELECT" || (tg && tg.isContentEditable)) return;
    if (tag === "INPUT" && tg.type !== "range") return;
    var isRange = tag === "INPUT";
    var k = e.key, lk = k.length === 1 ? k.toLowerCase() : k;
    var done = true;
    if (k === " " || k === "Spacebar") {
      if (tg && tg.closest && tg.closest("button, a, summary")) return;
      togglePlay();
    }
    else if (lk === "k") togglePlay();
    else if (lk === "j") seek(getTime() - 10);
    else if (lk === "l") {
      seek(getTime() + 10);
      if (e.defaultPrevented && lightsBtn) lightsBtn.click();
    }
    else if (k === "ArrowLeft" && !isRange) seek(getTime() - 5);
    else if (k === "ArrowRight" && !isRange) seek(getTime() + 5);
    else if (k === "ArrowUp" && !isRange) { setVol((prefs.muted ? 0 : prefs.vol) + 5); toast("Volume " + prefs.vol + "%"); }
    else if (k === "ArrowDown" && !isRange) { setVol((prefs.muted ? 0 : prefs.vol) - 5); toast("Volume " + prefs.vol + "%"); }
    else if (lk === "m") toggleMute();
    else if (lk === "f" && fsOk) toggleFull();
    else if (lk === "c") toggleCC();
    else if (k === "<" || (k === "," && e.shiftKey)) stepRate(-1);
    else if (k === ">" || (k === "." && e.shiftKey)) stepRate(1);
    else if (/^[0-9]$/.test(k) && !e.shiftKey) { var d = getDur(); if (d) seek(d * (+k) / 10); }
    else if (lk === "i") minimise();
    else done = false;
    if (done) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  // ---------- Resume chip ----------
  var chip = null;
  function hideResume() { if (chip) { chip.parentNode && chip.parentNode.removeChild(chip); chip = null; } }
  (function () {
    var s = loadSaved();
    if (!s || !s.id || !(s.t >= 5) || !BY_ID[s.id] || typeof win.openTheater !== "function") return;
    if (location.origin === "null") return;
    if (!modal.hidden) return;
    var title = BY_ID[s.id].t || s.title || "last video";
    chip = doc.createElement("div");
    chip.className = "x-resume";
    chip.setAttribute("role", "region");
    chip.setAttribute("aria-label", "Resume watching");
    chip.innerHTML = '<button class="x-resume__go" type="button">' + I.play + '<span class="x-resume__txt"></span></button>' +
      '<button class="x-iconbtn x-resume__x" type="button" aria-label="Dismiss">' + I.close + "</button>";
    chip.querySelector(".x-resume__txt").textContent = "Resume: " + title + " at " + fmt(s.t);
    doc.body.appendChild(chip);
    chip.querySelector(".x-resume__go").addEventListener("click", function () {
      pending = { id: s.id, t: s.t };
      var b = this;
      hideResume();
      win.openTheater(s.id, b);
    });
    chip.querySelector(".x-resume__x").addEventListener("click", function () { hideResume(); store(null); });
  })();

  // ---------- Public API for later rounds ----------
  win.HarkPlayer = {
    seek: function (t) { seek(+t || 0); },
    getTime: function () { return getTime(); },
    getDuration: function () { return getDur(); },
    get currentId() { return curId || null; },
    onTick: function (fn) {
      if (typeof fn !== "function") return function () {};
      ticks.push(fn);
      return function () { var i = ticks.indexOf(fn); if (i >= 0) ticks.splice(i, 1); };
    },
    minimise: minimise,
    expand: expand
  };
})();
