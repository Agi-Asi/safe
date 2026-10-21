/* Round 22 (pre): lets Escape leave Focus mode / close Round 22 overlays before the player's own Escape (mini-player) runs.
   Loaded before player14.js so this capture listener fires first. Adds behaviour only; removes nothing. */
(function () {
  "use strict";
  window.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var modal = document.querySelector(".x-tvm");
    if (!modal || modal.hidden) return;
    var open = modal.querySelector(".x22-pop:not([hidden])");
    if (open) { e.preventDefault(); e.stopImmediatePropagation(); if (window.X22 && window.X22.closePops) window.X22.closePops(); return; }
    var notes = modal.querySelector(".x22-notes:not([hidden])");
    if (notes) { e.preventDefault(); e.stopImmediatePropagation(); var c = notes.querySelector('[data-n="close"]'); if (c) c.click(); return; }
    if (modal.classList.contains("x22-focus") && !(document.fullscreenElement || document.webkitFullscreenElement)) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (window.X22 && window.X22.setFocus) window.X22.setFocus(false);
    }
  }, true);
})();
