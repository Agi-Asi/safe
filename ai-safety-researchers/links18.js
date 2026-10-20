/* Round H: play every YouTube link on-site in the Theater player, an animated "Up next" end screen,
   and "New" markers (directory filter chip, directory cards, Theater cards). */
(function () {
  "use strict";
  var doc = document, win = window, root = doc.documentElement;
  var VIDEOS = Array.isArray(win.THEATER) ? win.THEATER : [];
  var PEOPLE = Array.isArray(win.DATA) ? win.DATA : [];
  var META = win.VMETA || {};
  var NEW_DATE = "2026-10-20";
  var FULL_SITE = "https://agi-asi.github.io/safe/ai-safety-researchers/";
  var SANDBOX = location.origin === "null";
  var COUNTDOWN = 8000;
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var CAT_LABEL = {
    "lab-safety": "Frontier Lab Safety", "academic-alignment": "Academic Alignment", "independent-org": "Independent Orgs",
    "interpretability": "Interpretability", "governance-policy": "Governance & Policy", "pioneer-public-voice": "Pioneers & Public Voices"
  };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dur(d) {
    if (!d) return "";
    var h = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60), s = Math.floor(d % 60);
    return h ? h + ":" + pad(m) + ":" + pad(s) : m + ":" + pad(s);
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
  function niceDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? +m[3] + " " + MON[+m[2] - 1] + " " + m[1] : iso; }
  function motionOk() { return !root.classList.contains("x-rm") && !(win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches); }

  // ---------- YouTube URL parsing ----------
  function parseT(s) {
    s = String(s == null ? "" : s).trim();
    if (!s) return 0;
    if (/^\d+(\.\d+)?s?$/.test(s)) return Math.floor(parseFloat(s));
    var m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i.exec(s);
    if (!m || !(m[1] || m[2] || m[3])) return 0;
    return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
  }
  function parseYT(href) {
    if (!href || !/youtu/i.test(href)) return null;
    var u;
    try { u = new URL(href, location.href); } catch (e) { return null; }
    if (!/^https?:$/.test(u.protocol)) return null;
    var host = u.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
    var id = "";
    if (host === "youtu.be") id = u.pathname.split("/")[1] || "";
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (/^\/watch\/?$/.test(u.pathname)) id = u.searchParams.get("v") || "";
      else { var m = /^\/(?:shorts|live|embed|v|e)\/([^/?#]+)/.exec(u.pathname); if (m) id = m[1]; }
    } else return null;
    if (!/^[\w-]{11}$/.test(id)) return null;
    var t = u.searchParams.get("t") || u.searchParams.get("start") || u.searchParams.get("time_continue") || "";
    if (!t) { var h = /[#&]t=([\dhms.]+)/i.exec(u.hash || ""); if (h) t = h[1]; }
    return { id: id, t: parseT(t) };
  }
  win.parseYouTube = parseYT;

  // ---------- Lookups ----------
  var BY_ID = {}, BY_SLUG = {}, CTX = {}, PHOTO = {};
  VIDEOS.forEach(function (v) { BY_ID[v.id] = v; });
  [].forEach.call(doc.querySelectorAll("#photo-bank img"), function (im) { PHOTO[im.getAttribute("data-p")] = im.getAttribute("src"); });
  PEOPLE.forEach(function (p) {
    BY_SLUG[p.slug] = p;
    (Array.isArray(p.interviews) ? p.interviews : []).forEach(function (iv) {
      var y = iv.youtube_id && /^[\w-]{11}$/.test(iv.youtube_id) ? { id: iv.youtube_id } : parseYT(iv.url);
      if (y && !CTX[y.id]) CTX[y.id] = { t: iv.title, ch: iv.outlet, y: iv.year, s: p.slug };
    });
    (Array.isArray(p.quotes) ? p.quotes : []).forEach(function (q) {
      var y = parseYT(q.source_url);
      if (y && !CTX[y.id]) CTX[y.id] = { t: q.context || "", s: p.slug };
    });
  });
  function initials(n) { return String(n || "?").replace(/\(.*?\)|".*?"/g, "").trim().split(/\s+/).map(function (w) { return w.charAt(0); }).filter(Boolean).slice(0, 2).join("").toUpperCase(); }
  function avatar(p) {
    var src = p && p.photo && PHOTO[p.photo];
    return src ? '<img class="x-av" src="' + esc(src) + '" alt="" />' : '<span class="x-av x-av--init" aria-hidden="true">' + esc(initials(p ? p.name : "?")) + "</span>";
  }
  function personName(s) { var p = BY_SLUG[s]; return p ? p.name : ""; }

  // ---------- Watch state, for "unwatched first" ----------
  var seen = {};
  function watched() {
    var out = {};
    try {
      var h = win.HarkHistory && typeof win.HarkHistory.get === "function" ? win.HarkHistory.get() : null;
      if (h && h.items) Object.keys(h.items).forEach(function (k) { out[k] = 1; });
    } catch (e) { /* history unavailable */ }
    Object.keys(seen).forEach(function (k) { out[k] = 1; });
    return out;
  }
  function related(cur, n) {
    var w = watched(), s = cur.s || "", c = cur.c || (BY_SLUG[s] ? BY_SLUG[s].category : "");
    var tiers = [[], [], []];
    VIDEOS.forEach(function (v) {
      if (v.id === cur.id) return;
      tiers[s && v.s === s ? 0 : c && v.c === c ? 1 : 2].push(v);
    });
    var out = [];
    tiers.forEach(function (list) {
      var un = [], done = [];
      list.forEach(function (v) { (w[v.id] ? done : un).push(v); });
      un.concat(done).forEach(function (v) { if (out.length < n) out.push(v); });
    });
    return out;
  }

  // ---------- The Theater modal, and off-catalogue ("synthetic") videos ----------
  var modal = doc.querySelector(".x-tvm");
  var stage = modal && modal.querySelector(".x-vmodal__stage");
  var info = modal && modal.querySelector(".x-tvm__info");
  var list = modal && modal.querySelector(".x-tvm__list");
  var page = doc.querySelector(".page");
  var synth = null, synthNext = [], synthFocus = null, pendingSeek = null;

  function idFromSrc(src) { var m = /\/embed\/([\w-]{11})/.exec(src || ""); return m ? m[1] : ""; }
  function playerFrame() {
    return doc.querySelector("iframe[data-xpl]") || (stage && stage.querySelector("iframe")) || null;
  }
  function liveId() {
    var f = playerFrame();
    if (f) return idFromSrc(f.getAttribute("src"));
    var fb = stage && stage.querySelector("[data-x18-id]");
    return fb ? fb.getAttribute("data-x18-id") : "";
  }
  var origCurrent = win.theaterCurrent;
  win.theaterCurrent = function () {
    if (synth && liveId() === synth.id) return synth;
    return typeof origCurrent === "function" ? origCurrent() : null;
  };
  function synthActive() { return !!(synth && liveId() === synth.id); }

  function labelOf(a) {
    if (!a) return "";
    var s = (a.getAttribute("aria-label") || a.textContent || "").replace(/\s+/g, " ").trim();
    s = s.replace(/^(watch on youtube|watch|play)\s*:\s*/i, "").replace(/\s*\(opens in a new tab\)$/i, "");
    if (!s || /^(youtube|source|watch|video|open|page|link|play here|watch on youtube)$/i.test(s) || /^https?:\/\//i.test(s)) return "";
    return s;
  }
  function setHash(id) {
    try { history.replaceState(null, "", location.pathname + location.search + "#theater=" + encodeURIComponent(id)); } catch (e) { /* sandboxed history */ }
  }
  function openSynth(id, from) {
    var c = CTX[id] || {}, m = META[id] || {}, p = BY_SLUG[c.s];
    var yr = c.y || (m.published ? +String(m.published).slice(0, 4) : "");
    synth = {
      id: id, t: c.t || labelOf(from) || m.title || "YouTube video", ch: c.ch || m.channel || "YouTube", y: yr || "",
      s: c.s || "", c: p ? p.category : "", k: "video", d: m.length_sec || 0, tg: [], x18: true
    };
    var yt = "https://www.youtube.com/watch?v=" + encodeURIComponent(id);
    var wasOpen = !modal.hidden;
    if (SANDBOX) {
      stage.innerHTML = '<div class="x-vfall" data-x18-id="' + esc(id) + '"><img src="https://i.ytimg.com/vi/' + esc(id) + '/hqdefault.jpg" alt="" /><div class="x-vfall__box"><p>Videos can\u2019t play inside this preview.</p>' +
        '<a class="btn" href="' + FULL_SITE + "#theater=" + encodeURIComponent(id) + '" target="_blank" rel="noopener">Play on the full site</a></div></div>';
    } else {
      stage.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&playsinline=1" title="' + esc(synth.t) + '" ' +
        'referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    }
    info.innerHTML = '<h3 id="x-tvm-title">' + esc(synth.t) + "</h3>" +
      '<p class="x-tvm__meta">' + esc(synth.ch) + (synth.y ? " · " + esc(synth.y) : "") + (synth.d ? " · " + dur(synth.d) : "") + (CAT_LABEL[synth.c] ? " · " + esc(CAT_LABEL[synth.c]) : "") + "</p>" +
      (p ? '<div class="x-tvm__who">' + avatar(p) + "<strong>" + esc(p.name) + '</strong><button class="btn" type="button" data-tvprofile="' + esc(p.slug) + '">Open profile</button></div>' : "") +
      '<div class="links"><a class="btn" href="' + yt + '" target="_blank" rel="noopener">Watch on YouTube</a></div>';
    synthNext = related(synth, 8);
    if (list) list.innerHTML = synthNext.map(function (x) {
      return '<li><button class="x-tvm__item" type="button" data-tvup="' + esc(x.id) + '"><img src="https://i.ytimg.com/vi/' + esc(x.id) + '/hqdefault.jpg" alt="" loading="lazy" />' +
        "<div><span>" + esc(x.t) + "</span><small>" + esc(personName(x.s) || x.s) + (x.d ? " · " + dur(x.d) : "") + "</small></div></button></li>";
    }).join("");
    var panel = modal.querySelector(".x-vmodal__panel");
    if (panel) panel.scrollTop = 0;
    setHash(id);
    if (!wasOpen) {
      synthFocus = from || doc.activeElement;
      modal.hidden = false;
      root.classList.add("x-vlock");
      if (page) page.inert = true;
      requestAnimationFrame(function () { modal.classList.add("is-open"); });
      var cl = modal.querySelector("[data-tvclose]");
      if (cl) cl.focus();
    }
  }

  function play(id, t, from) {
    if (!/^[\w-]{11}$/.test(id || "")) return false;
    t = t > 0 ? Math.floor(t) : 0;
    hideUpNext();
    pendingSeek = t > 0 ? { id: id, t: t } : null;
    seen[id] = 1;
    if (BY_ID[id] && typeof win.openTheater === "function") { win.openTheater(id, from); return true; }
    if (modal && stage && info) { openSynth(id, from); return true; }
    win.open("https://www.youtube.com/watch?v=" + id + (t ? "&t=" + t + "s" : ""), "_blank", "noopener");
    return true;
  }

  // Public API: HarkPlayer.open(id, startSeconds)
  var HP = win.HarkPlayer || (win.HarkPlayer = {});
  HP.open = function (id, t, from) { return play(id, t, from); };
  if (typeof HP.onTick === "function") {
    HP.onTick(function (t, d, id) {
      if (!pendingSeek || id !== pendingSeek.id) return;
      var to = pendingSeek.t;
      pendingSeek = null;
      try { HP.seek(to); } catch (e) { /* not ready */ }
    });
  }

  if (modal) {
    // "Next ›" for an off-catalogue video plays its own related list.
    modal.addEventListener("click", function (e) {
      if (!e.target.closest("[data-tvnext]") || !synthActive() || !synthNext[0]) return;
      e.preventDefault(); e.stopPropagation();
      play(synthNext[0].id);
    }, true);
    new MutationObserver(function () {
      if (!modal.hidden) return;
      hideUpNext();
      if (synth && !doc.querySelector(".x-mini:not([hidden]) iframe")) synth = null;
      var f = synthFocus;
      synthFocus = null;
      if (f && doc.contains(f) && f.focus && f.getClientRects().length) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (x) { /* skip */ } }, 0);
    }).observe(modal, { attributes: true, attributeFilter: ["hidden"] });
  }

  // #theater=ID for a video outside the catalogue (the Theater handles its own IDs).
  function fromHash() {
    var m = /^#theater=([\w-]{11})(?:&t=([\dhms]+))?/.exec(location.hash);
    if (m && !BY_ID[m[1]] && liveId() !== m[1]) play(m[1], parseT(m[2]));
  }
  win.addEventListener("hashchange", fromHash);
  fromHash();

  // ---------- Intercept every YouTube link ----------
  function skipLink(a, y) {
    if (a.hasAttribute("download") || a.hasAttribute("data-x18-out")) return true;
    if (a.closest(".x-tvm__info, .x-vfall")) return true;
    if (a.closest(".x-tvm, .x-mini") && y.id === liveId()) return true;
    return false;
  }
  doc.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    var pill = t.closest(".x-playhere");
    if (pill) {
      e.preventDefault(); e.stopPropagation();
      win.HarkPlayer.open(pill.getAttribute("data-x18-id"), +pill.getAttribute("data-x18-t") || 0, pill);
      return;
    }
    var a = t.closest("a[href]");
    if (!a) return;
    var y = parseYT(a.href);
    if (!y || skipLink(a, y)) return;
    e.preventDefault(); e.stopPropagation();
    win.HarkPlayer.open(y.id, y.t, a);
  }, true);

  // ---------- "▶ Play here" pills, "New" badges: decorate whatever renders ----------
  var NEW_SLUG = {}, nNew = 0;
  PEOPLE.forEach(function (p) { if (p.added === NEW_DATE) { NEW_SLUG[p.slug] = 1; nNew++; } });
  function all(el, sel) {
    var out = el.matches && el.matches(sel) ? [el] : [];
    return el.querySelectorAll ? out.concat([].slice.call(el.querySelectorAll(sel))) : out;
  }
  function decorate(el) {
    all(el, 'a[href*="youtu"]').forEach(function (a) {
      if (a.hasAttribute("data-x18")) return;
      a.setAttribute("data-x18", "");
      var y = parseYT(a.href);
      if (!y || skipLink(a, y)) return;
      if (a.closest(".x-tvm, .x-mini, .x-cmd") || a.querySelector("img") || a.classList.contains("x-tvm__item")) return;
      var nx = a.nextElementSibling;
      if (nx && nx.classList.contains("x-playhere")) return;
      var b = doc.createElement("button");
      b.type = "button";
      b.className = "x-playhere";
      b.setAttribute("data-x18-id", y.id);
      if (y.t) b.setAttribute("data-x18-t", String(y.t));
      var lab = labelOf(a) || (CTX[y.id] && CTX[y.id].t) || (BY_ID[y.id] && BY_ID[y.id].t) || "";
      b.setAttribute("aria-label", "Play here" + (lab ? ": " + lab : ""));
      b.innerHTML = '<span aria-hidden="true">\u25B6</span> Play here';
      if (a.closest("#quote-track")) b.tabIndex = -1;
      a.insertAdjacentElement("afterend", b);
    });
    all(el, ".x-card[data-slug]").forEach(function (c) {
      if (c.hasAttribute("data-x18n")) return;
      c.setAttribute("data-x18n", "");
      if (!NEW_SLUG[c.getAttribute("data-slug")] || c.querySelector(".x-newb")) return;
      var h = c.querySelector("h3"), s = '<span class="x-newb">New</span>';
      if (h) h.insertAdjacentHTML("afterend", s); else c.insertAdjacentHTML("beforeend", s);
      var al = c.getAttribute("aria-label");
      if (al) c.setAttribute("aria-label", al + " (new)");
    });
    all(el, ".x-vcard[data-tv]").forEach(function (c) {
      if (c.hasAttribute("data-x18n")) return;
      c.setAttribute("data-x18n", "");
      var v = BY_ID[c.getAttribute("data-tv")];
      if (!v || v.new !== true || c.querySelector(".x-newb")) return;
      var m = c.querySelector(".x-vcard__media");
      (m || c).insertAdjacentHTML("beforeend", '<span class="x-newb x-newb--media">New</span>');
      var al = c.getAttribute("aria-label");
      if (al) c.setAttribute("aria-label", al + " (new)");
    });
  }
  var queue = [], qPend = 0;
  function flushQueue() {
    qPend = 0;
    var q = queue; queue = [];
    q.forEach(function (n) { if (n.isConnected) decorate(n); });
  }
  new MutationObserver(function (recs) {
    for (var i = 0; i < recs.length; i++) {
      var add = recs[i].addedNodes;
      for (var j = 0; j < add.length; j++) {
        var n = add[j];
        if (n.nodeType !== 1 || n.classList.contains("x-playhere") || n.classList.contains("x-newb") || n.classList.contains("x-upn")) continue;
        queue.push(n);
      }
    }
    if (queue.length && !qPend) qPend = requestAnimationFrame(flushQueue);
  }).observe(doc.body, { childList: true, subtree: true });
  decorate(doc.body);

  // ---------- Directory: "New · 63 added 20 Oct 2026" ----------
  (function () {
    var filters = doc.getElementById("filters");
    if (!filters || !nNew || !win.XDIR || typeof win.XDIR.render !== "function") return;
    var on = false;
    var prev = win.XDIR_FILTER;
    win.XDIR_FILTER = function (r) {
      if (on && r.added !== NEW_DATE) return false;
      return typeof prev === "function" ? prev(r) : true;
    };
    var b = doc.createElement("button");
    b.type = "button";
    b.className = "x-filter x-newf";
    b.id = "x-newf";
    b.setAttribute("aria-pressed", "false");
    b.textContent = "New · " + nNew + " added " + niceDate(NEW_DATE);
    filters.appendChild(b);
    b.addEventListener("click", function () {
      on = !on;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      win.XDIR.render();
    });
    // Category and org buttons reset every chip's pressed state; keep this one true to its filter.
    new MutationObserver(function () {
      var want = on ? "true" : "false";
      if (b.getAttribute("aria-pressed") !== want) b.setAttribute("aria-pressed", want);
    }).observe(b, { attributes: true, attributeFilter: ["aria-pressed"] });
  })();

  // ---------- "Up next" end screen ----------
  var upn = null, upnTimer = 0, upnKey = "";
  function hideUpNext() {
    if (upnTimer) { cancelAnimationFrame(upnTimer); upnTimer = 0; }
    if (upn && upn.parentNode) upn.parentNode.removeChild(upn);
    upn = null;
  }
  function loopOn() {
    var l = doc.querySelector('.x-pc [data-pc="loop"]');
    return !!(l && l.getAttribute("aria-pressed") === "true");
  }
  function currentFor(id) {
    if (BY_ID[id]) return BY_ID[id];
    if (synth && synth.id === id) return synth;
    var c = CTX[id] || {};
    return { id: id, s: c.s || "", c: BY_SLUG[c.s] ? BY_SLUG[c.s].category : "" };
  }
  function showUpNext(frame) {
    var id = idFromSrc(frame.getAttribute("src"));
    if (!id || loopOn()) return;
    var key = id + "|" + (frame.id || "");
    if (upn && upnKey === key) return;
    var host = frame.parentNode;
    if (!host) return;
    var items = related(currentFor(id), 6);
    if (!items.length) return;
    hideUpNext();
    upnKey = key;
    seen[id] = 1;
    var first = items[0];
    upn = doc.createElement("div");
    upn.className = "x-upn";
    upn.setAttribute("role", "region");
    upn.setAttribute("aria-label", "Up next");
    upn.innerHTML =
      '<div class="x-upn__top">' +
      '<div class="x-upn__ring" aria-hidden="true"><svg viewBox="0 0 48 48"><circle class="x-upn__track" cx="24" cy="24" r="21" /><circle class="x-upn__prog" cx="24" cy="24" r="21" pathLength="100" /></svg><span class="x-upn__n">' + COUNTDOWN / 1000 + "</span></div>" +
      '<div class="x-upn__head"><p class="x-upn__eyebrow">Up next</p><p class="x-upn__title">' + esc(first.t) + "</p></div>" +
      '<div class="x-upn__acts"><button class="x-upn__btn" type="button" data-upn="cancel">Cancel</button><button class="x-upn__btn" type="button" data-upn="replay">Replay</button></div>' +
      '<p class="x-upn__sr" aria-live="polite">Video ended. ' + esc(first.t) + " plays in " + COUNTDOWN / 1000 + " seconds.</p></div>" +
      '<ol class="x-upn__grid">' + items.map(function (v, i) {
        var who = personName(v.s);
        return '<li><button class="x-upn__card' + (i === 0 ? " is-first" : "") + '" type="button" data-upn-id="' + esc(v.id) + '" style="--i:' + i + '">' +
          '<span class="x-upn__media"><img src="https://i.ytimg.com/vi/' + esc(v.id) + '/mqdefault.jpg" alt="" loading="lazy" />' +
          (i === 0 ? '<span class="x-upn__tag">Next</span>' : "") + (v.d ? '<span class="x-upn__dur">' + dur(v.d) + "</span>" : "") + "</span>" +
          '<span class="x-upn__t">' + esc(v.t) + '</span><span class="x-upn__s">' + esc([who, v.ch].filter(Boolean).join(" · ")) + "</span></button></li>";
      }).join("") + "</ol>";
    host.appendChild(upn);
    var el = upn;
    var prog = el.querySelector(".x-upn__prog"), num = el.querySelector(".x-upn__n");
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-upn], [data-upn-id]");
      if (!b) return;
      var k = b.getAttribute("data-upn");
      if (k === "cancel") {
        if (upnTimer) { cancelAnimationFrame(upnTimer); upnTimer = 0; }
        el.classList.add("is-cancelled");
        el.querySelector(".x-upn__eyebrow").textContent = "Pick something to watch";
        el.querySelector(".x-upn__sr").textContent = "Autoplay cancelled.";
        b.hidden = true;
        var c0 = el.querySelector(".x-upn__card");
        if (c0) c0.focus({ preventScroll: true });
      } else if (k === "replay") {
        var src = frame.getAttribute("src");
        play(idFromSrc(src) || id, 0);
      } else play(b.getAttribute("data-upn-id"), 0, b);
    });
    if (modal && modal.contains(doc.activeElement)) {
      var cb = el.querySelector('[data-upn="cancel"]');
      if (cb) cb.focus({ preventScroll: true });
    }
    var smooth = motionOk(), elapsed = 0, last = performance.now();
    function step(now) {
      if (upn !== el) return;
      if (!host.contains(frame) || (modal && modal.hidden && !el.closest(".x-mini"))) { hideUpNext(); return; }
      elapsed += Math.min(100, Math.max(0, now - last));
      last = now;
      var p = Math.min(1, elapsed / COUNTDOWN);
      var shown = smooth ? p : Math.floor(elapsed / 1000) / (COUNTDOWN / 1000);
      prog.style.strokeDashoffset = String(100 - shown * 100);
      num.textContent = String(Math.max(0, Math.ceil((COUNTDOWN - elapsed) / 1000)));
      if (p >= 1) { upnTimer = 0; play(first.id, 0); return; }
      upnTimer = requestAnimationFrame(step);
    }
    upnTimer = requestAnimationFrame(step);
  }
  // YouTube IFrame API state messages: 0 ended, 1 playing, 3 buffering.
  win.addEventListener("message", function (e) {
    if (!/^https:\/\/(www\.)?youtube(-nocookie)?\.com$/.test(e.origin || "")) return;
    var f = playerFrame();
    if (!f || e.source !== f.contentWindow) return;
    var d = e.data;
    if (typeof d === "string") { try { d = JSON.parse(d); } catch (x) { return; } }
    if (!d || typeof d !== "object") return;
    var st = null;
    if (d.event === "onStateChange" && typeof d.info === "number") st = d.info;
    else if (d.event === "infoDelivery" && d.info && typeof d.info.playerState === "number") st = d.info.playerState;
    if (st === 0) showUpNext(f);
    else if ((st === 1 || st === 3) && upn) hideUpNext();
  });
})();
