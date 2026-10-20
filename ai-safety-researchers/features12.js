/* Polish pass: back-to-top above the compare tray, reliable section anchors + scroll-spy, search clear button, scroll never locked by the search field. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, win = window;
  var reduce = function () { return win.matchMedia("(prefers-reduced-motion: reduce)").matches || root.classList.contains("x-rm"); };

  // ---------- 5. Back to top sits above the compare tray ----------
  var tray = doc.querySelector(".x-tray");
  if (tray) {
    var setTrayH = function () { if (!tray.hidden) root.style.setProperty("--x-tray-h", Math.ceil(tray.getBoundingClientRect().height) + "px"); };
    setTrayH();
    if ("ResizeObserver" in win) new ResizeObserver(setTrayH).observe(tray);
    new MutationObserver(setTrayH).observe(tray, { attributes: true, attributeFilter: ["hidden"], childList: true, subtree: true });
    win.addEventListener("resize", setTrayH, { passive: true });
  }

  // ---------- 6. Section anchors land on their section; scroll-spy marks the last one at the page end ----------
  var lock = null, lockTimer = 0;
  function release() { lock = null; clearTimeout(lockTimer); }
  function navLinks() { return [].slice.call(doc.querySelectorAll(".nav .seg a[href^='#']")); }
  function mark(id) {
    navLinks().forEach(function (a) {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }
  function goTo(el, smooth) {
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  }
  doc.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest(".nav a[href^='#'], .foot nav a[href^='#']");
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var el = id && doc.getElementById(id);
    if (!el || !el.classList.contains("section")) return;
    e.preventDefault();
    try { history.pushState(null, "", "#" + id); } catch (err) { /* ignore */ }
    lock = el;
    goTo(el, !reduce());
    mark(id);
    // Sections above may still grow (lazy charts, images); keep the target in place until things settle.
    clearTimeout(lockTimer);
    lockTimer = setTimeout(release, 2500);
  });
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (t) {
    win.addEventListener(t, function (e) { if (lock && !(t === "mousedown" && e.target.closest && e.target.closest(".nav, .foot nav"))) release(); }, { passive: true, capture: true });
  });
  var main = doc.querySelector(".main");
  if (main && "ResizeObserver" in win) {
    var lastH = main.offsetHeight;
    new ResizeObserver(function () {
      var h = main.offsetHeight;
      if (h === lastH) return;
      lastH = h;
      if (lock) goTo(lock, false);
    }).observe(main);
  }
  var spyTick = false;
  function spy() {
    spyTick = false;
    if (lock) { mark(lock.id); return; }
    var links = navLinks();
    if (!links.length) return;
    var line = win.innerHeight * 0.32, cur = null;
    links.forEach(function (a) {
      var t = doc.getElementById(a.getAttribute("href").slice(1));
      if (t && t.getBoundingClientRect().top <= line) cur = t;
    });
    // At the very end of the page the last section may never reach the line; it is still the one in view.
    var atEnd = win.innerHeight + (win.scrollY || root.scrollTop) >= root.scrollHeight - 4;
    var last = doc.getElementById(links[links.length - 1].getAttribute("href").slice(1));
    if (atEnd && last && last.getBoundingClientRect().top < win.innerHeight) cur = last;
    if (cur) mark(cur.id);
    else links.forEach(function (a) { a.removeAttribute("aria-current"); });
  }
  win.addEventListener("scroll", function () {
    if (spyTick) return;
    spyTick = true;
    // Queued after hark.js's own scroll-spy frame, so this has the last word.
    win.requestAnimationFrame(spy);
  }, { passive: true });
  win.addEventListener("scrollend", function () { if (lock) setTimeout(function () { if (lock) mark(lock.id); }, 0); });

  // ---------- 7. Search: clear button, and a focused field never blocks scrolling ----------
  var q = doc.getElementById("q"), clr = doc.getElementById("q-clear");
  if (q && clr) {
    var syncClear = function () { clr.hidden = !q.value; };
    q.addEventListener("input", syncClear);
    q.addEventListener("search", syncClear);
    clr.addEventListener("click", function () {
      q.value = "";
      q.dispatchEvent(new Event("input", { bubbles: true }));
      syncClear();
      q.focus({ preventScroll: true });
    });
    syncClear();
    // Other scripts set the field's value directly (Atlas, Insights): keep the button in step.
    var desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    if (desc && desc.set) {
      try {
        Object.defineProperty(q, "value", {
          configurable: true,
          get: function () { return desc.get.call(this); },
          set: function (v) { desc.set.call(this, v); syncClear(); }
        });
      } catch (err) { /* keep the input listener only */ }
    }
  }
  function anyLayerOpen() {
    var sel = "#overlay, .x-cmpv, .x-vmodal, .x-glb, .x-cmd";
    return [].some.call(doc.querySelectorAll(sel), function (el) { return !el.hidden && getComputedStyle(el).display !== "none"; });
  }
  function unlockIfStuck() {
    if (anyLayerOpen()) return;
    if (root.style.overflow === "hidden") root.style.overflow = "";
    root.classList.remove("x-vlock");
  }
  if (q) {
    q.addEventListener("focus", unlockIfStuck);
    // Page keys (Space, PageUp/Down, arrows) are the field's own while it has focus; never let a page handler cancel scrolling wheel input over it.
    q.addEventListener("wheel", function (e) { e.stopPropagation(); }, { passive: true });
  }
})();
