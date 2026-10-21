/* Round 22: Theater upgrades — readable Lights button, Focus mode (immersive, auto-hiding controls, ends-at clock),
   Ambient glow, Sleep timer, timestamped Notes per video, shortcuts sheet, Surprise me, "start in Focus" preference.
   Add-only: nothing existing is removed or replaced. */
(function () {
  "use strict";
  var doc = document, win = window;
  var modal = doc.querySelector(".x-tvm");
  if (!modal) return;
  var panel = modal.querySelector(".x-vmodal__panel");
  var bar = modal.querySelector(".x-vmodal__bar");
  if (!panel || !bar) return;
  var VIDEOS = Array.isArray(win.THEATER) ? win.THEATER : [];
  var PEOPLE = Array.isArray(win.DATA) ? win.DATA : [];
  var META = win.VMETA || {};
  var BY_ID = {}, BY_SLUG = {};
  VIDEOS.forEach(function (v) { BY_ID[v.id] = v; });
  PEOPLE.forEach(function (p) { BY_SLUG[p.slug] = p; });
  var reduce = win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fmt(t) { t = Math.max(0, Math.floor(+t || 0)); var h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return (h ? h + ":" + pad(m) : m) + ":" + pad(s); }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function HP() { return win.HarkPlayer || {}; }
  function frame() { return modal.querySelector(".x-vmodal__stage iframe"); }
  function idFromSrc(src) { var m = /\/embed\/([A-Za-z0-9_-]{11})/.exec(src || ""); return m ? m[1] : ""; }
  function curId() { var f = frame(); return HP().currentId || (f && idFromSrc(f.getAttribute("src"))) || ""; }
  function now() { var hp = HP(); return typeof hp.getTime === "function" ? (+hp.getTime() || 0) : 0; }
  function dur() { var hp = HP(); var d = typeof hp.getDuration === "function" ? (+hp.getDuration() || 0) : 0; if (!d) { var m = META[curId()]; d = m && m.length_sec || 0; } return d; }
  function seek(t) { var hp = HP(); if (typeof hp.seek === "function") hp.seek(t); }
  function cmd(func, args) { var f = frame(); if (f && f.contentWindow) { try { f.contentWindow.postMessage(JSON.stringify({ event: "command", func: func, args: args || [] }), "*"); } catch (e) {} } }

  // ---------- Toast ----------
  var toastEl = doc.createElement("div");
  toastEl.className = "x22-toast"; toastEl.setAttribute("role", "status"); toastEl.setAttribute("aria-live", "polite");
  panel.appendChild(toastEl);
  var toastT = 0;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, 1900); }

  // ---------- Lights button: always readable ----------
  var lightsBtn = bar.querySelector(".x-lightsbtn");
  function syncLights() {
    if (!lightsBtn) return;
    var on = lightsBtn.getAttribute("aria-pressed") === "true";
    lightsBtn.setAttribute("aria-label", on ? "Lights are dimmed. Turn the lights back on" : "Dim the lights");
    lightsBtn.innerHTML = '<span class="x22-bulb" aria-hidden="true"></span><span class="x22-lbl">' + (on ? "Lights on" : "Lights off") + "</span>";
  }
  if (lightsBtn) {
    syncLights();
    new MutationObserver(function (m) { if (m.some(function (r) { return r.attributeName === "aria-pressed"; })) syncLights(); })
      .observe(lightsBtn, { attributes: true, attributeFilter: ["aria-pressed"] });
    // features8 sets textContent on toggle; re-decorate after it runs
    lightsBtn.addEventListener("click", function () { setTimeout(syncLights, 0); });
  }

  // ---------- Toolbar ----------
  var tools = doc.createElement("div");
  tools.className = "x22-tools";
  tools.setAttribute("role", "group");
  tools.setAttribute("aria-label", "Viewing modes");
  tools.innerHTML =
    '<button class="x-iconbtn x22-btn" type="button" data-x22="focus" aria-pressed="false" aria-keyshortcuts="Z" title="Focus mode (Z)">Focus</button>' +
    '<button class="x-iconbtn x22-btn" type="button" data-x22="amb" aria-pressed="false" aria-keyshortcuts="G" title="Ambient glow (G)">Ambient</button>' +
    '<span class="x22-wrap"><button class="x-iconbtn x22-btn" type="button" data-x22="sleep" aria-haspopup="true" aria-expanded="false" aria-controls="x22-sleep" title="Sleep timer">Sleep</button>' +
    '<div class="x22-pop x22-menu" id="x22-sleep" role="menu" hidden>' +
    '<button type="button" role="menuitem" data-sleep="0">Off</button><button type="button" role="menuitem" data-sleep="900">15 minutes</button>' +
    '<button type="button" role="menuitem" data-sleep="1800">30 minutes</button><button type="button" role="menuitem" data-sleep="2700">45 minutes</button>' +
    '<button type="button" role="menuitem" data-sleep="3600">60 minutes</button><button type="button" role="menuitem" data-sleep="end">End of this video</button></div></span>' +
    '<button class="x-iconbtn x22-btn" type="button" data-x22="notes" aria-pressed="false" aria-controls="x22-notes" aria-keyshortcuts="B" title="Timestamped notes (B)">Notes <b class="x22-nn"></b></button>' +
    '<button class="x-iconbtn x22-btn" type="button" data-x22="keys" aria-controls="x22-keys" aria-keyshortcuts="Shift+?" title="Keyboard shortcuts (?)">?</button>';
  bar.insertBefore(tools, lightsBtn || bar.children[1] || null);
  function tb(k) { return tools.querySelector('[data-x22="' + k + '"]'); }

  // ---------- Focus HUD (title, person, ends-at clock) ----------
  var pl = modal.querySelector(".x-pl") || panel;
  var hud = doc.createElement("div");
  hud.className = "x22-hud"; hud.setAttribute("aria-hidden", "true");
  hud.innerHTML = '<div class="x22-hud__t"></div><div class="x22-hud__m"></div><div class="x22-hud__bar"><span></span></div>';
  pl.insertBefore(hud, pl.firstChild);
  var hudT = hud.querySelector(".x22-hud__t"), hudM = hud.querySelector(".x22-hud__m"), hudBar = hud.querySelector(".x22-hud__bar span");

  // ---------- Ambient glow ----------
  var amb = doc.createElement("div");
  amb.className = "x22-amb"; amb.setAttribute("aria-hidden", "true");
  pl.insertBefore(amb, pl.firstChild);
  var lastAmbId = "";
  function syncVideo() {
    var id = curId();
    if (!id || id === lastAmbId) return;
    lastAmbId = id;
    amb.style.backgroundImage = 'url("https://i.ytimg.com/vi/' + id + '/hqdefault.jpg")';
    var v = BY_ID[id] || {}, p = BY_SLUG[v.s] || {};
    hudT.textContent = v.t || "";
    hudM.textContent = [p.name, v.ch].filter(Boolean).join(" · ");
    renderNotes();
  }

  var prefs = load("x22-prefs", { amb: false, autoFocus: false });
  function setAmb(on) {
    prefs.amb = !!on; save("x22-prefs", prefs);
    modal.classList.toggle("x22-ambient", prefs.amb);
    tb("amb").setAttribute("aria-pressed", prefs.amb ? "true" : "false");
    syncVideo();
  }

  // ---------- Focus mode ----------
  var focusOn = false, idleT = 0;
  function poke() {
    modal.classList.remove("x22-idle");
    clearTimeout(idleT);
    if (focusOn) idleT = setTimeout(function () {
      if (modal.querySelector(".x22-pop:not([hidden])") || modal.querySelector(".x22-notes:not([hidden])")) return;
      if (panel.contains(doc.activeElement) && /INPUT|TEXTAREA|SELECT/.test(doc.activeElement.tagName)) return;
      modal.classList.add("x22-idle");
    }, 2600);
  }
  function setFocus(on) {
    focusOn = !!on;
    modal.classList.toggle("x22-focus", focusOn);
    tb("focus").setAttribute("aria-pressed", focusOn ? "true" : "false");
    tb("focus").textContent = focusOn ? "Exit focus" : "Focus";
    doc.documentElement.classList.toggle("x22-noscroll", focusOn);
    if (focusOn) { syncVideo(); updateHud(); toast("Focus mode on. Press Z or Esc to leave"); }
    else modal.classList.remove("x22-idle");
    poke();
    setTimeout(function () { try { win.dispatchEvent(new Event("resize")); } catch (e) {} }, 60);
  }
  ["mousemove", "pointerdown", "keydown", "touchstart", "focusin"].forEach(function (ev) { modal.addEventListener(ev, poke, { passive: true }); });

  function updateHud() {
    if (!focusOn) return;
    var t = now(), d = dur();
    if (d) {
      var left = Math.max(0, d - t);
      var end = new Date(Date.now() + left * 1000);
      hudM.setAttribute("data-time", fmt(t) + " / " + fmt(d) + " · " + fmt(left) + " left · ends at " + pad(end.getHours()) + ":" + pad(end.getMinutes()));
      hudBar.style.width = Math.min(100, t / d * 100).toFixed(2) + "%";
    } else { hudM.removeAttribute("data-time"); hudBar.style.width = "0%"; }
  }

  // ---------- Sleep timer ----------
  var sleepMenu = doc.getElementById("x22-sleep");
  var sleepAt = 0, sleepEnd = false, sleepIv = 0;
  function sleepLabel() {
    var b = tb("sleep");
    if (sleepEnd) { b.textContent = "Sleep: end"; b.classList.add("is-on"); }
    else if (sleepAt) { b.textContent = "Sleep " + fmt((sleepAt - Date.now()) / 1000); b.classList.add("is-on"); }
    else { b.textContent = "Sleep"; b.classList.remove("is-on"); }
  }
  function setSleep(v) {
    clearInterval(sleepIv); sleepAt = 0; sleepEnd = false;
    if (v === "end") { sleepEnd = true; toast("Will pause at the end of this video"); }
    else if (+v > 0) { sleepAt = Date.now() + (+v) * 1000; toast("Sleep timer: " + Math.round(+v / 60) + " minutes"); }
    else toast("Sleep timer off");
    if (sleepAt || sleepEnd) sleepIv = setInterval(sleepTick, 1000);
    sleepLabel();
  }
  function sleepFire(msg) {
    clearInterval(sleepIv); sleepAt = 0; sleepEnd = false; sleepLabel();
    cmd("pauseVideo");
    var c = modal.querySelector('[data-upn="cancel"]'); if (c && !c.hidden) c.click();
    toast(msg);
  }
  function sleepTick() {
    if (modal.hidden || !frame()) { return sleepLabel(); }
    if (sleepAt && Date.now() >= sleepAt) return sleepFire("Sleep timer: paused. Good night");
    if (sleepEnd) { var d = dur(), t = now(); if (d && t >= d - 1.5) return sleepFire("Paused at the end, as asked"); }
    sleepLabel();
  }

  // ---------- Notes ----------
  var NK = "x22-notes-v1";
  var notesBox = doc.createElement("aside");
  notesBox.className = "x22-notes"; notesBox.id = "x22-notes"; notesBox.hidden = true;
  notesBox.setAttribute("aria-label", "Notes for this video");
  notesBox.innerHTML =
    '<div class="x22-notes__head"><h4>Notes</h4><button class="x-iconbtn" type="button" data-n="close" aria-label="Close notes">✕</button></div>' +
    '<p class="x22-notes__hint">Saved on this device. Each note is stamped with the video time; tap a time to jump back.</p>' +
    '<label class="x22-sr" for="x22-ntext">Note</label>' +
    '<textarea id="x22-ntext" class="x-field x22-ntext" rows="3" placeholder="Write a note… (Ctrl+Enter to save)"></textarea>' +
    '<div class="x22-notes__row"><button class="x-iconbtn x22-btn" type="button" data-n="add">Add at <span class="x22-nt">0:00</span></button>' +
    '<button class="x-iconbtn" type="button" data-n="copy">Copy all</button><button class="x-iconbtn" type="button" data-n="dl">Download .txt</button></div>' +
    '<ol class="x22-nlist"></ol>';
  panel.appendChild(notesBox);
  var nText = notesBox.querySelector(".x22-ntext"), nList = notesBox.querySelector(".x22-nlist"), nT = notesBox.querySelector(".x22-nt");
  function allNotes() { return load(NK, {}); }
  function notesFor(id) { return (allNotes()[id] || []).slice().sort(function (a, b) { return a.t - b.t; }); }
  function renderNotes() {
    var id = curId(), list = id ? notesFor(id) : [];
    var nn = tools.querySelector(".x22-nn"); nn.textContent = list.length ? list.length : "";
    nList.innerHTML = list.length ? list.map(function (n, i) {
      return '<li><button class="x22-ntime" type="button" data-t="' + n.t + '" aria-label="Jump to ' + fmt(n.t) + '">' + fmt(n.t) + '</button>' +
        '<span class="x22-ntxt">' + esc(n.x) + '</span><button class="x-iconbtn x22-ndel" type="button" data-del="' + n.k + '" aria-label="Delete note at ' + fmt(n.t) + '">✕</button></li>';
    }).join("") : '<li class="x22-nempty">No notes yet for this video.</li>';
  }
  function addNote() {
    var id = curId(), x = nText.value.trim();
    if (!id || !x) { nText.focus(); return; }
    var all = allNotes(); (all[id] = all[id] || []).push({ k: Date.now().toString(36), t: Math.floor(now()), x: x.slice(0, 2000) });
    save(NK, all); nText.value = ""; renderNotes(); toast("Note saved at " + fmt(now()));
  }
  function notesText() {
    var id = curId(), v = BY_ID[id] || {};
    return (v.t || id) + "\nhttps://www.youtube.com/watch?v=" + id + "\n\n" +
      notesFor(id).map(function (n) { return "[" + fmt(n.t) + "] " + n.x + "\n  https://www.youtube.com/watch?v=" + id + "&t=" + n.t + "s"; }).join("\n");
  }
  notesBox.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var k = b.getAttribute("data-n");
    if (k === "close") return setNotes(false);
    if (k === "add") return addNote();
    if (k === "copy") { var t = notesText(); if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { toast("Notes copied"); }, function () { toast("Copy blocked by the browser"); }); return; }
    if (k === "dl") { var a = doc.createElement("a"); a.href = URL.createObjectURL(new Blob([notesText()], { type: "text/plain" })); a.download = "notes-" + curId() + ".txt"; doc.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); return; }
    if (b.hasAttribute("data-t")) { seek(+b.getAttribute("data-t")); toast("Jumped to " + fmt(+b.getAttribute("data-t"))); return; }
    if (b.hasAttribute("data-del")) { var all = allNotes(), id = curId(), key = b.getAttribute("data-del"); all[id] = (all[id] || []).filter(function (n) { return n.k !== key; }); if (!all[id].length) delete all[id]; save(NK, all); renderNotes(); }
  });
  nText.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addNote(); } e.stopPropagation(); });
  function setNotes(on) {
    notesBox.hidden = !on; tb("notes").setAttribute("aria-pressed", on ? "true" : "false");
    modal.classList.toggle("x22-hasnotes", !!on);
    if (on) { renderNotes(); nT.textContent = fmt(now()); setTimeout(function () { nText.focus({ preventScroll: true }); }, 30); }
  }

  // ---------- Shortcuts sheet ----------
  var keys = doc.createElement("div");
  keys.className = "x22-pop x22-keys"; keys.id = "x22-keys"; keys.hidden = true;
  keys.setAttribute("role", "dialog"); keys.setAttribute("aria-label", "Keyboard shortcuts");
  var K = [["Space / K", "Play or pause"], ["J / L", "Back / forward 10 s"], ["← / →", "Back / forward 5 s"], ["↑ / ↓", "Volume"], ["M", "Mute"], ["C", "Captions"],
    ["F", "Fullscreen"], ["I", "Mini-player"], ["0–9", "Jump to 0–90%"], ["Shift + < / >", "Slower / faster"], ["N", "Next video"],
    ["Z", "Focus mode"], ["G", "Ambient glow"], ["B", "Notes"], ["?", "This sheet"], ["Esc", "Leave focus / close"]];
  keys.innerHTML = '<div class="x22-notes__head"><h4>Keyboard shortcuts</h4><button class="x-iconbtn" type="button" data-k="close" aria-label="Close shortcuts">✕</button></div>' +
    '<dl>' + K.map(function (r) { return "<div><dt><kbd>" + esc(r[0]) + "</kbd></dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>";
  panel.appendChild(keys);
  keys.addEventListener("click", function (e) { if (e.target.closest('[data-k="close"]')) closePops(); });

  function closePops() {
    sleepMenu.hidden = true; tb("sleep").setAttribute("aria-expanded", "false");
    keys.hidden = true;
  }

  tools.addEventListener("click", function (e) {
    var b = e.target.closest("[data-x22], [data-sleep]"); if (!b) return;
    if (b.hasAttribute("data-sleep")) { setSleep(b.getAttribute("data-sleep")); closePops(); tb("sleep").focus({ preventScroll: true }); return; }
    var k = b.getAttribute("data-x22");
    if (k === "focus") setFocus(!focusOn);
    else if (k === "amb") { setAmb(!prefs.amb); toast(prefs.amb ? "Ambient glow on" : "Ambient glow off"); }
    else if (k === "sleep") { var open = sleepMenu.hidden; closePops(); sleepMenu.hidden = !open; b.setAttribute("aria-expanded", open ? "true" : "false"); if (open) { var f = sleepMenu.querySelector("button"); if (f) f.focus({ preventScroll: true }); } }
    else if (k === "notes") setNotes(notesBox.hidden);
    else if (k === "keys") { var o = keys.hidden; closePops(); keys.hidden = !o; }
  });
  sleepMenu.addEventListener("keydown", function (e) {
    var items = [].slice.call(sleepMenu.querySelectorAll("button")), i = items.indexOf(doc.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); items[(i + 1) % items.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); items[(i - 1 + items.length) % items.length].focus(); }
  });
  doc.addEventListener("click", function (e) {
    if (!sleepMenu.hidden && !e.target.closest(".x22-wrap")) { sleepMenu.hidden = true; tb("sleep").setAttribute("aria-expanded", "false"); }
    if (!keys.hidden && !e.target.closest(".x22-keys, [data-x22='keys']")) keys.hidden = true;
  });

  // ---------- Keys (run after the player's own handler; skip anything it already handled) ----------
  win.addEventListener("keydown", function (e) {
    if (modal.hidden || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    var pal = doc.querySelector(".x-cmd"); if (pal && !pal.hidden) return;
    var tg = e.target, tag = tg && tg.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (tg && tg.isContentEditable)) return;
    var k = e.key, lk = k.length === 1 ? k.toLowerCase() : k, done = true;
    if (lk === "z") setFocus(!focusOn);
    else if (lk === "g") { setAmb(!prefs.amb); toast(prefs.amb ? "Ambient glow on" : "Ambient glow off"); }
    else if (lk === "b") setNotes(notesBox.hidden);
    else if (k === "?") { var o = keys.hidden; closePops(); keys.hidden = !o; }
    else done = false;
    if (done) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  // ---------- Keep in sync with the player ----------
  if (typeof HP().onTick === "function") HP().onTick(function () { syncVideo(); updateHud(); if (!notesBox.hidden) nT.textContent = fmt(now()); });
  setInterval(function () { if (!modal.hidden) { syncVideo(); updateHud(); if (!notesBox.hidden) nT.textContent = fmt(now()); } }, 1000);
  new MutationObserver(function () {
    var open = !modal.hidden && modal.classList.contains("is-open");
    if (!open) {
      if (focusOn) setFocus(false);
      closePops();
    } else {
      syncVideo();
      if (prefs.autoFocus && !focusOn && frame()) setFocus(true);
    }
  }).observe(modal, { attributes: true, attributeFilter: ["hidden", "class"] });
  setAmb(prefs.amb);

  // ---------- Theater section: Surprise me + Start in focus ----------
  var browse = doc.getElementById("tv-rows") || doc.getElementById("tv-browse");
  if (browse && typeof win.openTheater === "function") {
    var strip = doc.createElement("div");
    strip.className = "x22-strip";
    strip.innerHTML =
      '<button class="btn x22-surprise" type="button" data-x22s="any">Surprise me</button>' +
      '<button class="btn" type="button" data-x22s="filtered" title="Random pick from the videos your current filters show">Random from my filters</button>' +
      '<button class="btn" type="button" data-x22s="unwatched" title="Random pick you have not watched yet">Random unwatched</button>' +
      '<label class="x22-check"><input type="checkbox" id="x22-autofocus"' + (prefs.autoFocus ? " checked" : "") + '> Always open videos in Focus mode</label>' +
      '<button class="btn x22-keysbtn" type="button" data-x22s="keys">Keyboard shortcuts</button>';
    browse.parentNode.insertBefore(strip, browse);
    var watched = function () { var h = load("x-watch-history-v1", null), out = {}; if (h && typeof h === "object") { (Array.isArray(h) ? h : Object.keys(h).map(function (k) { var o = h[k]; return o && typeof o === "object" ? Object.assign({ id: k }, o) : { id: k }; })).forEach(function (r) { if (r && r.id) out[r.id] = 1; }); } return out; };
    strip.addEventListener("click", function (e) {
      var b = e.target.closest("[data-x22s]"); if (!b) return;
      var k = b.getAttribute("data-x22s"), pool = VIDEOS;
      if (k === "keys") { win.X22.showKeys(b); return; }
      if (k === "filtered") {
        var ids = [].map.call(doc.querySelectorAll("#tv-grid [data-tv], #tv-grid [data-id], #tv-grid [data-vid]"), function (el) { return el.getAttribute("data-tv") || el.getAttribute("data-id") || el.getAttribute("data-vid"); }).filter(function (id) { return BY_ID[id]; });
        if (ids.length) pool = ids.map(function (id) { return BY_ID[id]; });
      } else if (k === "unwatched") {
        var w = watched(), un = VIDEOS.filter(function (v) { return !w[v.id]; }); if (un.length) pool = un;
      }
      if (!pool.length) return;
      var v = pool[Math.floor(Math.random() * pool.length)];
      win.openTheater(v.id, b);
    });
    strip.querySelector("#x22-autofocus").addEventListener("change", function () { prefs.autoFocus = this.checked; save("x22-prefs", prefs); });
  }

  win.X22 = {
    setFocus: setFocus, closePops: closePops, setAmbient: setAmb, setSleep: setSleep,
    showKeys: function (from) {
      if (modal.hidden || !modal.classList.contains("is-open")) {
        // show the sheet as a small standalone dialog on the page
        var d = doc.getElementById("x22-pagekeys");
        if (!d) { d = keys.cloneNode(true); d.id = "x22-pagekeys"; d.classList.add("x22-pagekeys"); d.hidden = true; doc.body.appendChild(d);
          d.addEventListener("click", function (e) { if (e.target.closest('[data-k="close"]')) { d.hidden = true; if (from) from.focus(); } });
          d.addEventListener("keydown", function (e) { if (e.key === "Escape") { d.hidden = true; if (from) from.focus(); } }); }
        d.hidden = !d.hidden; if (!d.hidden) { var c = d.querySelector("button"); if (c) c.focus(); }
      } else { closePops(); keys.hidden = false; }
    }
  };
})();
