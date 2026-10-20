/* Step 3a: Compare mode — toggles on cards and in the profile bar, a bottom tray, and a side-by-side view. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var DATA = Array.isArray(window.DATA) ? window.DATA : [];
  var MAX = 4, KEY = "hark-compare";
  var CAT_LABEL = {
    "lab-safety": "Frontier Lab Safety",
    "academic-alignment": "Academic Alignment",
    "independent-org": "Independent Orgs",
    "interpretability": "Interpretability",
    "governance-policy": "Governance & Policy",
    "pioneer-public-voice": "Pioneers & Public Voices"
  };
  var BY = {};
  DATA.forEach(function (r) { BY[r.slug] = r; });

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
  function avatar(r, size, alt) {
    var src = r.photo && PHOTO[r.photo];
    var st = ' style="--av:' + size + 'px"';
    if (src) return '<img class="x-av"' + st + ' src="' + esc(src) + '" alt="' + esc(alt || "") + '" />';
    return '<span class="x-av x-av--init"' + st + ' aria-hidden="true">' + esc(initials(r.name)) + "</span>";
  }
  var PLUS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
  var COLS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/></svg>';

  // ---------- Selection ----------
  var sel = (function () {
    try { var s = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(s) ? s.filter(function (x) { return BY[x]; }).slice(0, MAX) : []; }
    catch (e) { return []; }
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(sel)); } catch (e) { /* ignore */ } }
  function has(slug) { return sel.indexOf(slug) > -1; }
  function toggle(slug) {
    if (!BY[slug]) return;
    var r = BY[slug];
    if (has(slug)) { sel.splice(sel.indexOf(slug), 1); say(r.name + " removed from compare"); }
    else if (sel.length >= MAX) { say("Compare holds up to " + MAX + " people. Remove one first."); flashTray(); return; }
    else { sel.push(slug); say(r.name + " added to compare (" + sel.length + " of " + MAX + ")"); }
    save(); sync();
  }

  // ---------- Toggle buttons ----------
  function btnHTML(slug, extra) {
    var on = has(slug), r = BY[slug];
    return '<button class="x-cmpbtn' + (extra ? " " + extra : "") + '" type="button" data-cmp="' + esc(slug) + '" aria-pressed="' + on + '" aria-label="' + (on ? "Remove " : "Add ") + esc(r.name) + (on ? " from compare" : " to compare") + '">' +
      (on ? CHECK + "<span>Comparing</span>" : PLUS + "<span>Compare</span>") + "</button>";
  }
  function paintBtn(b) {
    var slug = b.getAttribute("data-cmp"), r = BY[slug];
    if (!r) { b.hidden = true; return; }
    b.hidden = false;
    var on = has(slug);
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.setAttribute("aria-label", (on ? "Remove " : "Add ") + r.name + (on ? " from compare" : " to compare"));
    b.innerHTML = on ? CHECK + "<span>Comparing</span>" : PLUS + "<span>Compare</span>";
  }
  var grid = $("grid");
  function decorate() {
    if (!grid) return;
    [].forEach.call(grid.querySelectorAll(":scope > .x-card[data-slug]"), function (card) {
      var slug = card.getAttribute("data-slug");
      if (!BY[slug]) return;
      var wrap = doc.createElement("div");
      wrap.className = "x-cmpwrap";
      grid.insertBefore(wrap, card);
      wrap.appendChild(card);
      wrap.insertAdjacentHTML("beforeend", btnHTML(slug, "x-cmpbtn--card"));
    });
  }
  if (grid) {
    decorate();
    new MutationObserver(decorate).observe(grid, { childList: true });
  }
  doc.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cmp]");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    toggle(b.getAttribute("data-cmp"));
  });

  // Profile bar button
  var barBtn = null;
  var bar = doc.querySelector(".x-drawer__bar"), closeBtn = $("pro-close");
  if (bar && closeBtn) {
    var tmp = doc.createElement("div");
    tmp.innerHTML = '<button class="x-cmpbtn x-cmpbtn--bar" type="button" data-cmp="" hidden></button>';
    barBtn = tmp.firstChild;
    bar.insertBefore(barBtn, closeBtn);
  }
  function syncBar() {
    if (!barBtn) return;
    var slug = decodeURIComponent(location.hash.slice(1));
    barBtn.setAttribute("data-cmp", BY[slug] ? slug : "");
    paintBtn(barBtn);
  }
  window.addEventListener("hashchange", function () {
    syncBar();
    if (isOpen() && location.hash.length > 1) closeCompare(false);
  });

  // ---------- Tray ----------
  var tray = doc.createElement("div");
  tray.className = "x-tray";
  tray.setAttribute("role", "region");
  tray.setAttribute("aria-label", "Compare tray");
  tray.hidden = true;
  tray.innerHTML = '<ul class="x-tray__people" aria-label="Selected people"></ul>' +
    '<span class="x-tray__hint"></span>' +
    '<button class="btn x-tray__go" type="button"></button>' +
    '<button class="x-iconbtn x-tray__clear" type="button">Clear</button>';
  var live = doc.createElement("span");
  live.className = "x-sr"; live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
  doc.body.appendChild(tray);
  doc.body.appendChild(live);
  var trayList = tray.querySelector(".x-tray__people"), go = tray.querySelector(".x-tray__go"), hint = tray.querySelector(".x-tray__hint");
  function say(msg) { live.textContent = ""; setTimeout(function () { live.textContent = msg; }, 30); }
  function flashTray() {
    tray.classList.remove("is-flash"); void tray.offsetWidth; tray.classList.add("is-flash");
  }
  function syncTray() {
    var n = sel.length;
    tray.hidden = !n || isOpen();
    doc.body.classList.toggle("x-has-tray", !tray.hidden);
    trayList.innerHTML = sel.map(function (s) {
      var r = BY[s];
      return '<li><button class="x-tray__av" type="button" data-cmp="' + esc(s) + '" aria-label="Remove ' + esc(r.name) + ' from compare" title="Remove ' + esc(r.name) + '">' + avatar(r, 40, "") + '<span class="x-tray__x" aria-hidden="true">✕</span></button></li>';
    }).join("") + (n < MAX ? '<li class="x-tray__slot" aria-hidden="true"></li>' : "");
    go.textContent = "Compare (" + n + ")";
    go.disabled = n < 2;
    go.setAttribute("aria-disabled", n < 2 ? "true" : "false");
    hint.textContent = n < 2 ? "Pick one more" : n + " of " + MAX;
  }
  go.addEventListener("click", function () { if (sel.length >= 2) openCompare(); });
  tray.querySelector(".x-tray__clear").addEventListener("click", function () { sel = []; save(); sync(); say("Compare cleared"); });

  function sync() {
    [].forEach.call(doc.querySelectorAll(".x-cmpbtn[data-cmp]"), function (b) { if (b !== barBtn) paintBtn(b); });
    syncBar();
    syncTray();
    if (isOpen()) { if (sel.length) renderCompare(); else closeCompare(true); }
  }

  // ---------- Compare view ----------
  var view = doc.createElement("div");
  view.className = "x-cmpv"; view.hidden = true;
  view.setAttribute("role", "dialog"); view.setAttribute("aria-modal", "true"); view.setAttribute("aria-labelledby", "x-cmpv-title");
  view.innerHTML = '<div class="x-cmpv__bar"><h2 id="x-cmpv-title"></h2><button class="x-iconbtn" type="button" id="x-cmpv-close" aria-label="Close compare">Close ✕</button></div>' +
    '<div class="x-cmpv__scroll" tabindex="0" aria-label="Compared people, scroll sideways on small screens"><div class="x-cmpv__grid"></div></div>';
  doc.body.appendChild(view);
  var vGrid = view.querySelector(".x-cmpv__grid"), vTitle = $("x-cmpv-title"), lastFocus = null, prevOverflow = "";
  function isOpen() { return !view.hidden; }
  function row(label, html) { return '<div class="x-cmpv__row"><p class="x-cmpv__label">' + label + "</p>" + (html || '<p class="x-cmpv__none">—</p>') + "</div>"; }
  function colHTML(r) {
    var hon = arr(r.honours).length ? '<div class="x-cmpv__tags">' + arr(r.honours).map(function (h) { return '<span class="chip chip--solid">' + esc(h) + "</span>"; }).join("") + "</div>" : "";
    var ideas = arr(r.key_ideas).length ? '<div class="x-cmpv__tags">' + arr(r.key_ideas).map(function (k) { return '<span class="pill">' + esc(k) + "</span>"; }).join("") + "</div>" : "";
    var q = arr(r.quotes).filter(function (x) { return x && x.text; })[0];
    var quote = q ? '<blockquote class="x-cmpv__quote">“' + esc(String(q.text).trim()) + "”</blockquote>" + (q.context ? '<p class="x-cmpv__ctx">' + esc(q.context) + "</p>" : "") : "";
    var counts = '<dl class="x-cmpv__counts">' +
      [["Quotes", arr(r.quotes).length], ["Interviews", arr(r.interviews).length], ["Key works", arr(r.key_works).length]].map(function (c) {
        return "<div><dt>" + c[0] + "</dt><dd>" + c[1] + "</dd></div>";
      }).join("") + "</dl>";
    return '<article class="x-cmpv__col" aria-label="' + esc(r.name) + '">' +
      '<div class="x-cmpv__who">' + avatar(r, 112, "Portrait of " + r.name) + "<h3>" + esc(r.name) + "</h3>" +
      '<p class="x-cmpv__role">' + esc(r.current_role || "") + "</p></div>" +
      row("Category", '<p><span class="pill">' + esc(CAT_LABEL[r.category] || r.category || "") + "</span></p>") +
      row("Country", r.country ? "<p>" + esc(r.country) + "</p>" : "") +
      row("Honours", hon) +
      row("Key ideas", ideas) +
      row("Stance on AI risk", r.p_doom_or_stance ? '<p class="x-cmpv__stance">' + esc(r.p_doom_or_stance) + "</p>" : "") +
      row("In this guide", counts) +
      row("First quote", quote) +
      '<div class="x-cmpv__acts"><a class="btn" href="#' + esc(r.slug) + '" data-open="' + esc(r.slug) + '">Open profile</a>' +
      '<button class="x-iconbtn" type="button" data-cmp="' + esc(r.slug) + '" aria-label="Remove ' + esc(r.name) + ' from compare">Remove</button></div>' +
      "</article>";
  }
  function renderCompare() {
    var people = sel.map(function (s) { return BY[s]; }).filter(Boolean);
    vTitle.textContent = "Comparing " + people.length + " " + (people.length === 1 ? "person" : "people");
    vGrid.style.setProperty("--n", people.length);
    vGrid.innerHTML = people.map(colHTML).join("");
  }
  function closeDrawerIfOpen() {
    var ov = $("overlay");
    if (ov && !ov.hidden) {
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignore */ }
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  }
  function openCompare() {
    if (sel.length < 2) { say("Pick at least two people to compare"); return; }
    if (isOpen()) { renderCompare(); $("x-cmpv-close").focus(); return; }
    closeDrawerIfOpen();
    lastFocus = doc.activeElement;
    renderCompare();
    view.hidden = false;
    var page = doc.querySelector(".page");
    if (page) page.inert = true;
    prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    syncTray();
    view.querySelector(".x-cmpv__scroll").scrollLeft = 0;
    requestAnimationFrame(function () { view.classList.add("is-open"); });
    $("x-cmpv-close").focus();
  }
  function closeCompare(restore) {
    if (!isOpen()) return;
    view.classList.remove("is-open");
    view.hidden = true;
    var page = doc.querySelector(".page");
    if (page) page.inert = false;
    root.style.overflow = prevOverflow;
    syncTray();
    if (restore) {
      var t = lastFocus && doc.contains(lastFocus) && !lastFocus.closest(".x-cmpv") ? lastFocus : (tray.hidden ? null : go);
      if (t && t.focus) t.focus();
    }
    lastFocus = null;
  }
  $("x-cmpv-close").addEventListener("click", function () { closeCompare(true); });
  view.addEventListener("click", function (e) {
    var a = e.target.closest("[data-open]");
    if (!a) return;
    e.preventDefault();
    var slug = a.getAttribute("data-open");
    closeCompare(false);
    location.hash = slug;
  });
  window.addEventListener("keydown", function (e) {
    if (!isOpen()) return;
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) return;
    var pal = doc.querySelector(".x-cmd");
    if (pal && !pal.hidden) return;
    e.stopPropagation();
    if (e.key === "Escape") { e.preventDefault(); closeCompare(true); }
    else if (e.key === "Tab") {
      var f = view.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);

  // ---------- Command palette action ----------
  window.XCMP_ACTIONS = function () {
    return [{
      kind: "Action", icon: COLS, name: "Compare selected",
      sub: sel.length >= 2 ? "Open " + sel.length + " people side by side" : sel.length ? "1 picked · add one more with + Compare" : "Pick people with + Compare first",
      run: function () { if (sel.length >= 2) openCompare(); else { say("Pick at least two people to compare"); if (sel.length) flashTray(); } }
    }];
  };

  sync();
})();
