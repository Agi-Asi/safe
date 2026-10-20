/* Round E: brand mark in the sticky nav, labelled landmarks, theme-color that follows the theme toggle, alt-text safety net. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;

  // ---------- Brand mark: first item in the sticky nav ----------
  function placeBrand() {
    var brand = doc.getElementById("x-brand"), nav = doc.querySelector("header.nav");
    if (!brand || !nav) return;
    if (brand.parentNode !== nav) nav.insertBefore(brand, nav.firstChild);
    brand.title = "The Guardians of AI";
  }

  // ---------- Every section with a heading is labelled by it ----------
  function labelSections() {
    var n = 0;
    [].slice.call(doc.querySelectorAll(".main section")).forEach(function (s) {
      if (s.hasAttribute("aria-labelledby") || s.hasAttribute("aria-label")) return;
      var h = s.querySelector(":scope > .head h2, :scope > .hero__copy h1, :scope > h2");
      if (!h) return;
      if (!h.id) h.id = (s.id || "sec-" + (++n)) + "-title";
      s.setAttribute("aria-labelledby", h.id);
    });
  }

  // ---------- Browser chrome color follows the chosen theme ----------
  var LIGHT = "#ffffff", DARK = "#0B0F1A";
  var metas = [].slice.call(doc.querySelectorAll('meta[name="theme-color"]'));
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function syncThemeColor() {
    var t = root.getAttribute("data-theme");
    metas.forEach(function (m) {
      var media = m.getAttribute("media") || "";
      if (t === "dark" || t === "light") m.setAttribute("content", t === "dark" ? DARK : LIGHT);
      else m.setAttribute("content", /dark/.test(media) ? DARK : LIGHT);
    });
  }

  // ---------- Any image added without alt text is marked decorative ----------
  function altNet(scope) {
    [].slice.call((scope || doc).querySelectorAll("img:not([alt])")).forEach(function (img) { img.setAttribute("alt", ""); });
  }

  function start() {
    try { placeBrand(); } catch (e) { /* nav missing: brand stays hidden */ }
    try { labelSections(); } catch (e) { /* :scope unsupported: landmarks keep their headings */ }
    syncThemeColor();
    altNet();
    if ("MutationObserver" in window) {
      new MutationObserver(syncThemeColor).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
      var pending = 0;
      new MutationObserver(function () {
        if (pending) return;
        pending = requestAnimationFrame(function () { pending = 0; altNet(); });
      }).observe(doc.body, { childList: true, subtree: true });
    }
    if (mq && mq.addEventListener) mq.addEventListener("change", syncThemeColor);
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start);
  else start();
})();
