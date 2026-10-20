/* Step 3b: profile tabs, copy link, related people, swipe; directory grid/list view, country filter, favourites, CSV export, print. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var DATA = Array.isArray(window.DATA) ? window.DATA : [];
  var XDIR = window.XDIR || null;
  var CAT_LABEL = (XDIR && XDIR.catLabel) || {};
  var BY = {};
  DATA.forEach(function (r) { BY[r.slug] = r; });

  function $(id) { return doc.getElementById(id); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
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
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ }
    return null;
  }
  function currentSlug() {
    var s = "";
    try { s = decodeURIComponent(location.hash.slice(1)); } catch (e) { s = location.hash.slice(1); }
    return BY[s] ? s : "";
  }

  var HEART = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 4 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.3 0 5.7 3.1 4.5 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/></svg>';
  var LINK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L11.8 5.8"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.4-1.4"/></svg>';
  var GRID = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>';
  var LIST = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>';
  var DL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>';
  var PRINT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="6"/></svg>';

  // ---------- Toast (shares the page's toast style) ----------
  var toastT = null;
  function toast(msg) {
    var el = doc.querySelector(".x-toast");
    if (!el) {
      el = doc.createElement("div");
      el.className = "x-toast"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite");
      doc.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.remove("is-on"); }, 1800);
  }
  function copyText(text, okMsg) {
    function fallback() {
      var ok = false, ta = doc.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.className = "x-sr";
      (($("overlay") && !$("overlay").hidden) ? $("drawer") : doc.body).appendChild(ta);
      ta.select();
      try { ta.setSelectionRange(0, text.length); ok = doc.execCommand("copy"); } catch (e) { ok = false; }
      ta.parentNode.removeChild(ta);
      toast(ok ? okMsg : "Couldn’t copy. The link is in the address bar.");
    }
    if (navigator.clipboard && window.isSecureContext) {
      toast(okMsg); navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, fallback);
    } else fallback();
  }

  // ---------- Favourites ----------
  var FKEY = "hark-favourites";
  var favs = (function () {
    var s = [];
    try { s = JSON.parse(store(FKEY) || "[]"); } catch (e) { s = []; }
    return Array.isArray(s) ? s.filter(function (x) { return BY[x]; }) : [];
  })();
  function isFav(slug) { return favs.indexOf(slug) > -1; }
  function favLabel(slug, on) { return (on ? "Remove " : "Add ") + BY[slug].name + (on ? " from favourites" : " to favourites"); }
  function favBtnHTML(slug, cls, withText) {
    var on = isFav(slug);
    return '<button class="x-favbtn ' + cls + '" type="button" data-fav="' + esc(slug) + '" aria-pressed="' + on + '" aria-label="' + esc(favLabel(slug, on)) + '" title="Favourite">' +
      HEART + (withText ? '<span class="x-favbtn__txt">Favourite</span>' : "") + "</button>";
  }
  function paintFavs() {
    [].forEach.call(doc.querySelectorAll("[data-fav]"), function (b) {
      var slug = b.getAttribute("data-fav");
      if (!BY[slug]) return;
      var on = isFav(slug);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-label", favLabel(slug, on));
    });
    var c = $("x-favonly-n");
    if (c) c.textContent = favs.length;
  }
  function toggleFav(slug) {
    if (!BY[slug]) return;
    var on = isFav(slug);
    if (on) favs.splice(favs.indexOf(slug), 1); else favs.push(slug);
    store(FKEY, JSON.stringify(favs));
    paintFavs();
    toast(on ? "Removed from favourites" : "Added to favourites");
    if (dir.favOnly && XDIR) XDIR.render();
  }
  doc.addEventListener("click", function (e) {
    var b = e.target.closest("[data-fav]");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    toggleFav(b.getAttribute("data-fav"));
  });

  // ---------- Countries ----------
  function countryTokens(raw) {
    var s = String(raw || "").replace(/\([^()]*\)/g, " ").trim();
    if (!s) return { main: [], based: [] };
    var main = [], based = [];
    s.split(/[;\/]/).forEach(function (t) {
      t = t.replace(/\s+/g, " ").trim();
      if (!t) return;
      var m = t.match(/^(?:based|works|living|lives)\s+in\s+(?:the\s+)?(.+)$/i);
      if (m) based.push(m[1].trim()); else main.push(t.replace(/^the\s+/i, ""));
    });
    return { main: main, based: based };
  }
  var COUNTRY_SET = {};
  DATA.forEach(function (r) { countryTokens(r.country).main.forEach(function (c) { COUNTRY_SET[c] = 1; }); });
  DATA.forEach(function (r) {
    var t = countryTokens(r.country), list = [];
    t.main.concat(t.based.filter(function (c) { return COUNTRY_SET[c]; })).forEach(function (c) { if (list.indexOf(c) < 0) list.push(c); });
    r._ctry = list;
  });
  var COUNTRIES = Object.keys(COUNTRY_SET).map(function (c) {
    return { name: c, n: DATA.filter(function (r) { return r._ctry.indexOf(c) > -1; }).length };
  }).sort(function (a, b) { return a.name.localeCompare(b.name); });

  // ---------- Directory upgrades ----------
  var dir = { country: "", favOnly: false, view: store("hark-dir-view") === "list" ? "list" : "grid" };
  window.XDIR_FILTER = function (r) {
    if (dir.country && arr(r._ctry).indexOf(dir.country) < 0) return false;
    if (dir.favOnly && !isFav(r.slug)) return false;
    return true;
  };
  var grid = $("grid"), statusEl = $("status");
  var tools = grid && grid.parentNode.querySelector(".x-tools");
  if (grid && tools && XDIR) {
    var row = doc.createElement("div");
    row.className = "x-tools__row x-dirbar";
    row.innerHTML =
      '<select class="x-field x-sort" id="x-country" aria-label="Filter by country"><option value="">All countries</option>' +
      COUNTRIES.map(function (c) { return '<option value="' + esc(c.name) + '">' + esc(c.name) + " (" + c.n + ")</option>"; }).join("") + "</select>" +
      '<button class="x-filter x-favonly" type="button" id="x-favonly" aria-pressed="false">' + HEART + ' Favourites only <span id="x-favonly-n">' + favs.length + "</span></button>" +
      '<div class="x-seg" role="group" aria-label="Directory view">' +
      '<button class="x-seg__btn" type="button" data-view="grid" aria-pressed="true" aria-label="Grid view" title="Grid view">' + GRID + '<span>Grid</span></button>' +
      '<button class="x-seg__btn" type="button" data-view="list" aria-pressed="false" aria-label="List view" title="List view">' + LIST + '<span>List</span></button>' +
      "</div>" +
      '<span class="x-dirbar__end">' +
      '<button class="x-iconbtn x-dirbar__btn" type="button" id="x-csv">' + DL + "<span>Export CSV</span></button>" +
      '<button class="x-iconbtn x-dirbar__btn" type="button" id="x-print">' + PRINT + "<span>Print</span></button>" +
      "</span>";
    var firstRow = tools.querySelector(".x-tools__row");
    if (firstRow && firstRow.nextSibling) tools.insertBefore(row, firstRow.nextSibling); else tools.appendChild(row);

    var countrySel = $("x-country"), favOnlyBtn = $("x-favonly");
    countrySel.addEventListener("change", function () { dir.country = countrySel.value; XDIR.render(); });
    favOnlyBtn.addEventListener("click", function () {
      dir.favOnly = !dir.favOnly;
      favOnlyBtn.setAttribute("aria-pressed", dir.favOnly ? "true" : "false");
      XDIR.render();
    });
    function setView(v, save) {
      dir.view = v === "list" ? "list" : "grid";
      grid.classList.toggle("x-grid--list", dir.view === "list");
      [].forEach.call(row.querySelectorAll("[data-view]"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-view") === dir.view ? "true" : "false"); });
      if (save) store("hark-dir-view", dir.view);
    }
    row.querySelector(".x-seg").addEventListener("click", function (e) {
      var b = e.target.closest("[data-view]");
      if (b) setView(b.getAttribute("data-view"), true);
    });
    setView(dir.view, false);

    // Card hearts, status note and empty message after every render.
    function decorate() {
      [].forEach.call(grid.querySelectorAll(".x-card[data-slug]"), function (card) {
        var host = card.parentNode && card.parentNode.classList.contains("x-cmpwrap") ? card.parentNode : null;
        if (!host) {
          host = doc.createElement("div");
          host.className = "x-cmpwrap";
          grid.insertBefore(host, card);
          host.appendChild(card);
        }
        if (!host.querySelector(".x-favbtn")) host.insertAdjacentHTML("beforeend", favBtnHTML(card.getAttribute("data-slug"), "x-favbtn--card", false));
      });
      var empty = grid.querySelector(".x-empty");
      if (empty && dir.favOnly && !favs.length) empty.textContent = "No favourites yet. Tap the heart on any card to save someone here.";
      else if (empty && (dir.country || dir.favOnly)) empty.textContent = "No one matches these filters. Try another country, or turn off Favourites only.";
      if (statusEl && (dir.country || dir.favOnly) && statusEl.textContent.indexOf(" · Filters:") < 0) {
        statusEl.textContent += " · Filters: " + [dir.country, dir.favOnly ? "favourites" : ""].filter(Boolean).join(", ");
      }
    }
    new MutationObserver(decorate).observe(grid, { childList: true });
    decorate();

    // CSV export
    function cell(v) {
      var s = String(v == null ? "" : v);
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    $("x-csv").addEventListener("click", function () {
      var list = XDIR.visible();
      if (!list.length) { toast("Nothing to export"); return; }
      var lines = [["name", "category", "role", "country", "known_for"].join(",")].concat(list.map(function (r) {
        return [r.name, CAT_LABEL[r.category] || r.category, r.current_role, r.country, r.known_for].map(cell).join(",");
      }));
      try {
        var blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
        var url = URL.createObjectURL(blob), a = doc.createElement("a");
        a.href = url; a.download = "guardians-of-ai-directory.csv"; a.className = "x-sr";
        doc.body.appendChild(a); a.click(); doc.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        toast("Exported " + list.length + (list.length === 1 ? " person" : " people"));
      } catch (e) { toast("Export isn’t available in this browser"); }
    });

    // Print a clean list of the current results
    function endPrint() { root.classList.remove("x-print-dir"); }
    window.addEventListener("afterprint", endPrint);
    $("x-print").addEventListener("click", function () {
      root.classList.add("x-print-dir");
      setTimeout(function () {
        try { window.print(); } catch (e) { /* ignore */ }
        setTimeout(endPrint, 500);
      }, 30);
    });
  }

  // ---------- Related people ----------
  var ORG_TERMS = null;
  var ROLEWORD = /^(co-?founder|founder|founded|founding|chair|co-?author|phd|dphil|postdoc|postdoctoral|assistant|associate|intern|internships?|senior|research|researcher|professor|member|director|co-?director|president|early|global|distinguished|affiliate|visiting|inaugural|lead|co-?lead|adjunct|independent|head|alignment|governance|mathematics|mentor|mats mentor|chief|advisor|adviser|board|former|lecturer|author|student|engineer|manager|staff|the)\b/i;
  function orgTerms() {
    if (ORG_TERMS) return ORG_TERMS;
    var cand = {};
    DATA.forEach(function (r) {
      r._orgText = [r.current_role].concat(arr(r.orgs_history)).join(" ; ");
      arr(r.orgs_history).forEach(function (o) {
        var s = String(o).replace(/\([^()]*\)/g, " ").split(/[,;:]/)[0].replace(/\s+/g, " ").trim();
        s = s.replace(/\s+(co-?founder|founder|ceo|cto|president|director|chair|researcher|research|member|fellow|professor|head|lead|team|phd|postdoc|intern)\b.*$/i, "").trim();
        if (ROLEWORD.test(s)) return;
        if (s.length >= 3 && s.split(" ").length <= 6 && /^[A-Z0-9]/.test(s)) cand[s] = 1;
      });
    });
    ORG_TERMS = [];
    Object.keys(cand).forEach(function (t) {
      var re = new RegExp("(^|[^A-Za-z0-9])" + reEsc(t) + "($|[^A-Za-z0-9])", "i");
      var who = DATA.filter(function (r) { return re.test(r._orgText); });
      if (who.length >= 2 && who.length <= 40) ORG_TERMS.push({ t: t, who: who.map(function (r) { return r.slug; }) });
    });
    return ORG_TERMS;
  }
  function related(r) {
    var score = {};
    orgTerms().forEach(function (o) {
      if (o.who.indexOf(r.slug) < 0) return;
      o.who.forEach(function (s) { if (s !== r.slug) score[s] = (score[s] || 0) + 1; });
    });
    var shared = Object.keys(score).map(function (s) { return BY[s]; }).sort(function (a, b) {
      return score[b.slug] - score[a.slug] || (b.category === r.category) - (a.category === r.category) || a.name.localeCompare(b.name);
    });
    var out = shared.slice(0, 6);
    if (out.length < 6) {
      DATA.filter(function (p) { return p !== r && p.category === r.category && out.indexOf(p) < 0; })
        .sort(function (a, b) { return a.name.localeCompare(b.name); })
        .slice(0, 6 - out.length).forEach(function (p) { out.push(p); });
    }
    return out.map(function (p) { return { r: p, org: score[p.slug] > 0 }; });
  }

  // ---------- Profile overlay upgrades ----------
  var overlay = $("overlay"), drawer = $("drawer"), body = $("pro-body");
  var TABS = [["overview", "Overview"], ["quotes", "Quotes"], ["interviews", "Interviews"], ["works", "Works"], ["links", "Links"]];
  var curTab = "overview";
  function tabOf(el) {
    var h = el.classList && el.classList.contains("x-block") ? el.querySelector(":scope > h3") : null;
    var t = h ? h.textContent.trim().toLowerCase() : "";
    if (t === "quotes") return "quotes";
    if (t.indexOf("interviews") === 0) return "interviews";
    if (t === "key works") return "works";
    if (t === "links") return "links";
    return "overview";
  }
  function selectTab(id, focus) {
    var bar = body.querySelector(".x-tabs");
    if (!bar) return;
    if (!body.querySelector('[data-panel="' + id + '"]')) id = "overview";
    curTab = id;
    [].forEach.call(bar.querySelectorAll("[data-tab]"), function (b) {
      var on = b.getAttribute("data-tab") === id;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    [].forEach.call(body.querySelectorAll("[data-panel]"), function (p) { p.hidden = p.getAttribute("data-panel") !== id; });
  }
  function enhance() {
    if (!body || body.querySelector(".x-tabs")) return;
    var head = body.querySelector(".x-pro__head");
    var slug = currentSlug();
    if (!head || !slug) return;
    var r = BY[slug];

    // Header actions: favourite + copy link
    var meta = head.querySelector(".x-pro__meta");
    if (meta) {
      meta.insertAdjacentHTML("beforeend", '<div class="x-pro__acts">' + favBtnHTML(slug, "x-favbtn--pro", true) +
        '<button class="x-favbtn x-copylink" type="button" data-copylink="' + esc(slug) + '">' + LINK + "<span>Copy link</span></button></div>");
    }

    // Group blocks into panels
    var groups = {};
    [].slice.call(body.children).forEach(function (el) {
      if (el === head) return;
      var t = tabOf(el);
      (groups[t] = groups[t] || []).push(el);
    });
    var rel = related(r);
    if (rel.length) {
      var sec = doc.createElement("section");
      sec.className = "x-block x-related";
      sec.innerHTML = "<h3>Related people</h3><ul class=\"x-related__list\">" + rel.map(function (p) {
        var why = p.org ? "Shared organisation" : CAT_LABEL[p.r.category] || "Same category";
        return '<li><a class="x-related__item" href="#' + esc(p.r.slug) + '" aria-label="Open profile: ' + esc(p.r.name) + " (" + esc(why) + ')">' + avatar(p.r, 64) +
          '<span class="x-related__name">' + esc(p.r.name) + '</span><span class="x-related__why">' + esc(why) + "</span></a></li>";
      }).join("") + "</ul>";
      (groups.overview = groups.overview || []).push(sec);
    }
    var bar = doc.createElement("div");
    bar.className = "x-tabs";
    bar.setAttribute("role", "tablist");
    bar.setAttribute("aria-label", "Profile sections");
    var html = "";
    TABS.forEach(function (t) {
      if (t[0] !== "overview" && !groups[t[0]]) return;
      html += '<button class="x-tab" type="button" role="tab" id="x-tab-' + t[0] + '" data-tab="' + t[0] + '" aria-controls="x-tp-' + t[0] + '" aria-selected="false" tabindex="-1">' + t[1] + "</button>";
    });
    bar.innerHTML = html;
    var frag = doc.createDocumentFragment();
    frag.appendChild(bar);
    TABS.forEach(function (t) {
      if (t[0] !== "overview" && !groups[t[0]]) return;
      var p = doc.createElement("div");
      p.className = "x-tabpanel";
      p.id = "x-tp-" + t[0];
      p.setAttribute("role", "tabpanel");
      p.setAttribute("aria-labelledby", "x-tab-" + t[0]);
      p.setAttribute("data-panel", t[0]);
      (groups[t[0]] || []).forEach(function (el) { p.appendChild(el); });
      frag.appendChild(p);
    });
    body.appendChild(frag);
    selectTab(curTab, false);
  }
  if (body && overlay) {
    new MutationObserver(enhance).observe(body, { childList: true });
    enhance();
    window.addEventListener("hashchange", function () {
      if (overlay.hidden) curTab = "overview";
      enhance();
    });
    body.addEventListener("click", function (e) {
      var t = e.target.closest("[data-tab]");
      if (t) {
        selectTab(t.getAttribute("data-tab"), false);
        var bar = body.querySelector(".x-tabs"), top = drawer.querySelector(".x-drawer__bar");
        var limit = (top ? top.getBoundingClientRect().bottom : 0) + 4;
        if (bar && bar.getBoundingClientRect().top < limit) drawer.scrollTop -= limit - bar.getBoundingClientRect().top + 8;
        return;
      }
      var c = e.target.closest("[data-copylink]");
      if (c) {
        var url = location.href.split("#")[0] + "#" + encodeURIComponent(c.getAttribute("data-copylink"));
        copyText(url, "Link copied");
        var lbl = c.querySelector("span");
        if (lbl) {
          lbl.textContent = "Link copied ✓";
          clearTimeout(c._t);
          c._t = setTimeout(function () { lbl.textContent = "Copy link"; }, 3000);
        }
      }
    });
    body.addEventListener("keydown", function (e) {
      var t = e.target.closest && e.target.closest("[data-tab]");
      if (!t) return;
      if (["ArrowLeft", "ArrowRight", "Home", "End"].indexOf(e.key) < 0) return;
      e.preventDefault(); e.stopPropagation();
      var tabs = [].slice.call(body.querySelectorAll(".x-tabs [data-tab]")), i = tabs.indexOf(t);
      var n = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === "ArrowLeft" ? -1 : 1) + tabs.length) % tabs.length;
      selectTab(tabs[n].getAttribute("data-tab"), true);
    });

    // Keep the focus trap to visible controls now that some panels are hidden
    drawer.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || overlay.hidden) return;
      var f = [].filter.call(drawer.querySelectorAll('a[href], button:not([disabled])'), function (el) { return el.getClientRects().length > 0; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      e.stopPropagation();
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // Swipe left / right for next / previous
    var sx = 0, sy = 0, st = 0, tracking = false;
    drawer.addEventListener("touchstart", function (e) {
      tracking = false;
      if (e.touches.length !== 1 || overlay.hidden) return;
      if (e.target.closest(".x-tabs, input, select, textarea, .table-wrap")) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); tracking = true;
    }, { passive: true });
    drawer.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Date.now() - st > 800 || Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      var btn = $(dx < 0 ? "pro-next" : "pro-prev");
      if (btn) btn.click();
    }, { passive: true });
    drawer.addEventListener("touchcancel", function () { tracking = false; }, { passive: true });
  }

  paintFavs();
})();
