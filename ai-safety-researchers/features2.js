/* Step 2 additions: Quote Explorer, Interview Library (with top-outlets chart), Reading List, copy toast. */
(function () {
  "use strict";
  var doc = document;
  var DATA = Array.isArray(window.DATA) ? window.DATA : [];
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CATS = [
    ["lab-safety", "Frontier Lab Safety"],
    ["academic-alignment", "Academic Alignment"],
    ["independent-org", "Independent Orgs"],
    ["interpretability", "Interpretability"],
    ["governance-policy", "Governance & Policy"],
    ["pioneer-public-voice", "Pioneers & Public Voices"]
  ];
  var CAT_LABEL = {};
  CATS.forEach(function (c) { CAT_LABEL[c[0]] = c[1]; });

  function $(id) { return doc.getElementById(id); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function safeUrl(u) { return /^https?:\/\//i.test(u || "") ? esc(u) : ""; }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function terms(q) { return norm(q).split(/\s+/).filter(Boolean); }
  function matches(hay, t) { return t.every(function (w) { return hay.indexOf(w) > -1; }); }
  var PHOTO = {};
  [].forEach.call(doc.querySelectorAll("#photo-bank img"), function (im) { PHOTO[im.getAttribute("data-p")] = im.getAttribute("src"); });
  function initials(name) {
    var p = String(name).replace(/\(.*?\)/g, "").trim().split(/\s+/);
    return ((p[0] || "")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }
  function avatar(r, size) {
    var src = r.photo && PHOTO[r.photo];
    var st = ' style="--av:' + size + 'px"';
    if (src) return '<img class="x-av"' + st + ' src="' + esc(src) + '" alt="" loading="lazy" />';
    return '<span class="x-av x-av--init"' + st + ' aria-hidden="true">' + esc(initials(r.name)) + "</span>";
  }
  function chipsHTML(list, counts, total, attr) {
    return '<button class="x-filter" type="button" ' + attr + '="" aria-pressed="true">All <span>' + total + "</span></button>" +
      list.filter(function (c) { return counts[c[0]]; }).map(function (c) {
        return '<button class="x-filter" type="button" ' + attr + '="' + esc(c[0]) + '" aria-pressed="false">' + esc(c[1]) + " <span>" + counts[c[0]] + "</span></button>";
      }).join("");
  }
  function bindChips(box, attr, onPick) {
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[" + attr + "]");
      if (!b) return;
      [].forEach.call(box.children, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      onPick(b.getAttribute(attr));
    });
  }
  function pressChip(box, attr, val) {
    [].forEach.call(box.children, function (x) { x.setAttribute("aria-pressed", x.getAttribute(attr) === val ? "true" : "false"); });
  }
  function peopleOptions(sel, key) {
    var ppl = DATA.filter(function (r) { return arr(r[key]).length; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    sel.insertAdjacentHTML("beforeend", ppl.map(function (r) { return '<option value="' + esc(r.slug) + '">' + esc(r.name) + " (" + arr(r[key]).length + ")</option>"; }).join(""));
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  // ---------- Toast ----------
  var toastEl = null, toastT = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = doc.createElement("div");
      toastEl.className = "x-toast"; toastEl.setAttribute("role", "status"); toastEl.setAttribute("aria-live", "polite");
      doc.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, 1800);
  }
  function fallbackCopy(text) {
    var ta = doc.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.top = "-1000px"; ta.style.opacity = "0";
    doc.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = doc.execCommand("copy"); } catch (e) { ok = false; }
    doc.body.removeChild(ta);
    return ok;
  }
  function copyText(text) {
    function done(ok) { toast(ok ? "Copied" : "Couldn’t copy — select the text instead"); }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
    } else done(fallbackCopy(text));
  }
  var COPY_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
  var PLAY = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';

  // ---------- Quote Explorer ----------
  function setupQuotes() {
    var grid = $("qx-grid");
    if (!grid) return;
    var Q = [];
    DATA.forEach(function (r) {
      arr(r.quotes).forEach(function (q) {
        if (!q || !q.text) return;
        var text = String(q.text).trim();
        Q.push({ i: Q.length, r: r, q: q, text: text, hay: norm([text, r.name, q.context].join(" | ")) });
      });
    });
    var PAGE = 30, st = { q: "", person: "", cat: "", sort: "az" }, list = [], shown = 0;
    var status = $("qx-status"), more = $("qx-more"), cats = $("qx-cats");
    var counts = {};
    Q.forEach(function (x) { counts[x.r.category] = (counts[x.r.category] || 0) + 1; });
    cats.innerHTML = chipsHTML(CATS, counts, Q.length, "data-qcat");
    bindChips(cats, "data-qcat", function (v) { st.cat = v; apply(); });
    peopleOptions($("qx-person"), "quotes");

    function card(x) {
      var r = x.r, q = x.q, src = safeUrl(q.source_url);
      return '<article class="x-qc" id="qx-' + x.i + '" tabindex="-1">' +
        '<blockquote class="x-qc__text">“' + esc(x.text) + "”</blockquote>" +
        '<a class="x-qc__who" href="#' + esc(r.slug) + '">' + avatar(r, 40) +
        '<span><strong>' + esc(r.name) + "</strong>" + (q.context ? "<small>" + esc(q.context) + "</small>" : "") + "</span></a>" +
        '<div class="x-qc__acts">' +
        (src ? '<a class="btn" href="' + src + '" target="_blank" rel="noopener">Source</a>' : "") +
        (q.unverified ? '<span class="chip">unverified</span>' : "") +
        '<button class="x-iconbtn x-qc__copy" type="button" data-copy="' + x.i + '" aria-label="Copy quote by ' + esc(r.name) + '" title="Copy quote">' + COPY_ICON + "</button>" +
        "</div></article>";
    }
    function paint(reset) {
      if (reset) grid.innerHTML = "";
      var from = grid.children.length && !reset ? grid.querySelectorAll(".x-qc").length : 0;
      if (!list.length) {
        grid.innerHTML = '<p class="x-empty">No quotes match. Try a shorter word, another person or category.</p>';
      } else {
        grid.insertAdjacentHTML("beforeend", list.slice(from, shown).map(card).join(""));
      }
      more.hidden = shown >= list.length;
      var left = list.length - shown;
      more.textContent = "Load " + Math.min(PAGE, left) + " more";
      status.textContent = list.length
        ? "Showing " + Math.min(shown, list.length) + " of " + plural(list.length, "quote", "quotes") + (list.length < Q.length ? " (" + Q.length + " in total)" : "")
        : "0 of " + Q.length + " quotes match";
    }
    function apply() {
      var t = terms(st.q);
      list = Q.filter(function (x) {
        if (st.person && x.r.slug !== st.person) return false;
        if (st.cat && x.r.category !== st.cat) return false;
        return !t.length || matches(x.hay, t);
      });
      var allSpan = cats.querySelector('[data-qcat=""] span');
      if (allSpan) allSpan.textContent = Q.filter(function (x) {
        if (st.person && x.r.slug !== st.person) return false;
        return !t.length || matches(x.hay, t);
      }).length;
      list.sort(st.sort === "short"
        ? function (a, b) { return a.text.length - b.text.length || a.i - b.i; }
        : function (a, b) { return a.r.name.localeCompare(b.r.name) || a.i - b.i; });
      shown = Math.min(PAGE, list.length);
      paint(true);
    }
    var qIn = $("qx-q");
    qIn.addEventListener("input", function () { st.q = qIn.value; apply(); });
    $("qx-person").addEventListener("change", function (e) { st.person = e.target.value; apply(); });
    $("qx-sort").addEventListener("change", function (e) { st.sort = e.target.value; apply(); });
    more.addEventListener("click", function () {
      var first = grid.querySelectorAll(".x-qc").length;
      shown = Math.min(list.length, shown + PAGE);
      paint(false);
      var el = grid.querySelectorAll(".x-qc")[first];
      if (el) el.focus({ preventScroll: true });
    });
    grid.addEventListener("click", function (e) {
      var b = e.target.closest("[data-copy]");
      if (!b) return;
      var x = Q[+b.getAttribute("data-copy")];
      if (!x) return;
      copyText("“" + x.text + "” — " + x.r.name + (x.q.context ? ", " + x.q.context : "") + (safeUrl(x.q.source_url) ? "\n" + x.q.source_url : ""));
    });
    $("qx-random").addEventListener("click", function () {
      if (!list.length) {
        st = { q: "", person: "", cat: "", sort: st.sort };
        qIn.value = ""; $("qx-person").value = ""; pressChip(cats, "data-qcat", "");
        apply();
      }
      if (!list.length) return;
      var idx = Math.floor(Math.random() * list.length);
      if (idx >= shown) { shown = Math.min(list.length, Math.ceil((idx + 1) / PAGE) * PAGE); paint(false); }
      var el = $("qx-" + list[idx].i);
      if (!el) return;
      [].forEach.call(grid.querySelectorAll(".is-flash"), function (n) { n.classList.remove("is-flash"); });
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      el.focus({ preventScroll: true });
      void el.offsetWidth;
      el.classList.add("is-flash");
      clearTimeout(el._t);
      el._t = setTimeout(function () { el.classList.remove("is-flash"); }, 2600);
    });
    apply();
  }

  // ---------- Interview Library ----------
  function setupInterviews() {
    var grid = $("iv-grid");
    if (!grid) return;
    var V = [];
    DATA.forEach(function (r) {
      arr(r.interviews).forEach(function (v) {
        if (!v || !v.title) return;
        var yt = v.youtube_id && /^[\w-]{6,20}$/.test(v.youtube_id) ? v.youtube_id : "";
        V.push({ i: V.length, r: r, v: v, yt: yt, year: +v.year || 0, outlet: String(v.outlet || "Other").trim(), hay: norm([v.title, v.outlet, r.name, v.year].join(" | ")) });
      });
    });
    var oc = {};
    V.forEach(function (x) { oc[x.outlet] = (oc[x.outlet] || 0) + 1; });
    var outlets = Object.keys(oc).sort(function (a, b) { return oc[b] - oc[a] || a.localeCompare(b); });
    var OCOLOR = {};
    outlets.forEach(function (o) {
      var h = 0;
      for (var k = 0; k < o.length; k++) h = (h * 31 + o.charCodeAt(k)) >>> 0;
      OCOLOR[o] = (h % 7) + 1;
    });
    var oSel = $("iv-outlet");
    oSel.insertAdjacentHTML("beforeend", outlets.slice(0, 20).map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + " (" + oc[o] + ")</option>"; }).join(""));
    peopleOptions($("iv-person"), "interviews");

    // Decades
    var dc = {};
    V.forEach(function (x) { if (x.year) { var d = Math.floor(x.year / 10) * 10; dc[d] = (dc[d] || 0) + 1; } });
    var decades = Object.keys(dc).map(Number).sort(function (a, b) { return a - b; }).map(function (d) { return [String(d), d + "s"]; });
    var dBox = $("iv-decades");
    dBox.innerHTML = chipsHTML(decades, dc, V.length, "data-dec");
    bindChips(dBox, "data-dec", function (v) { st.dec = v; apply(); });

    var PAGE = 24, st = { q: "", outlet: "", person: "", dec: "" }, list = [], shown = 0;
    var status = $("iv-status"), more = $("iv-more");

    function card(x) {
      var v = x.v, r = x.r;
      var url = x.yt ? "https://www.youtube.com/watch?v=" + x.yt : safeUrl(v.url);
      var media = x.yt
        ? '<img src="https://i.ytimg.com/vi/' + x.yt + '/hqdefault.jpg" alt="" loading="lazy" /><span class="x-iv__play"><span>' + PLAY + "</span></span>"
        : '<span class="x-ivc__tile" style="--c: var(--chart-' + OCOLOR[x.outlet] + ')"><span>' + esc(x.outlet) + "</span></span>";
      var title = url ? '<a class="x-ivc__link" href="' + url + '" target="_blank" rel="noopener" aria-label="' + esc(v.title) + ' (opens in a new tab)">' + esc(v.title) + "</a>" : esc(v.title);
      return '<article class="x-ivc">' +
        '<div class="x-ivc__media" aria-hidden="true">' + media + "</div>" +
        '<div class="x-ivc__body"><h3>' + title + "</h3>" +
        '<p class="x-ivc__meta">' + esc(x.outlet) + (x.year ? " · " + x.year : "") + (x.yt ? " · Video" : "") + "</p>" +
        '<p class="x-ivc__foot"><a class="x-ivc__person" href="#' + esc(r.slug) + '">' + avatar(r, 24) + "<span>" + esc(r.name) + "</span></a>" +
        (v.unverified ? '<span class="chip">unverified</span>' : "") + "</p></div></article>";
    }
    function paint(reset) {
      var from = reset ? 0 : grid.querySelectorAll(".x-ivc").length;
      if (reset) grid.innerHTML = "";
      if (!list.length) grid.innerHTML = '<p class="x-empty">No interviews match. Try another outlet, decade or person.</p>';
      else grid.insertAdjacentHTML("beforeend", list.slice(from, shown).map(card).join(""));
      more.hidden = shown >= list.length;
      more.textContent = "Load " + Math.min(PAGE, list.length - shown) + " more";
      status.textContent = list.length
        ? "Showing " + shown + " of " + plural(list.length, "interview", "interviews") + (list.length < V.length ? " (" + V.length + " in total)" : "")
        : "0 of " + V.length + " interviews match";
    }
    function apply() {
      var t = terms(st.q);
      list = V.filter(function (x) {
        if (st.outlet && x.outlet !== st.outlet) return false;
        if (st.person && x.r.slug !== st.person) return false;
        if (st.dec && Math.floor(x.year / 10) * 10 !== +st.dec) return false;
        return !t.length || matches(x.hay, t);
      }).sort(function (a, b) { return b.year - a.year || a.i - b.i; });
      shown = Math.min(PAGE, list.length);
      paint(true);
    }
    var qIn = $("iv-q");
    qIn.addEventListener("input", function () { st.q = qIn.value; apply(); });
    oSel.addEventListener("change", function () { st.outlet = oSel.value; apply(); });
    $("iv-person").addEventListener("change", function (e) { st.person = e.target.value; apply(); });
    more.addEventListener("click", function () {
      var first = grid.querySelectorAll(".x-ivc").length;
      shown = Math.min(list.length, shown + PAGE);
      paint(false);
      var a = grid.querySelectorAll(".x-ivc")[first];
      a = a && a.querySelector("a");
      if (a) a.focus({ preventScroll: true });
    });
    apply();

    // Top-10 outlets chart
    var top = outlets.slice(0, 10);
    var cv = $("iv-chart");
    if (cv && window.Chart && top.length) {
      var cap = $("iv-cap");
      cap.innerHTML = esc(top[0]) + (top[1] ? " and " + esc(top[1]) : "") + " carry the most interviews<small>Top 10 outlets by number of interviews · tap a bar to filter</small>";
      cv.setAttribute("aria-label", top.map(function (o) { return o + " " + oc[o]; }).join(", "));
      new Chart(cv, {
        type: "bar",
        data: { labels: top, datasets: [{ label: "Interviews", data: top.map(function (o) { return oc[o]; }) }] },
        options: {
          indexAxis: "y",
          onClick: function (e, els) {
            if (!els || !els.length) return;
            var o = top[els[0].index];
            oSel.value = st.outlet === o ? "" : o;
            st.outlet = oSel.value;
            apply();
          },
          onHover: function (e, els) { if (e.native && e.native.target) e.native.target.style.cursor = els && els.length ? "pointer" : "default"; },
          // Outlet names such as "80,000 Hours" are names, not numbers: keep them in the category-label font.
          scales: { y: { ticks: { font: function () { return { family: getComputedStyle(document.documentElement).getPropertyValue("--sans").trim(), size: 14 }; } } } },
          plugins: { legend: { display: false }, datalabels: Hark.labels.values }
        }
      });
    }
  }

  // ---------- Reading List ----------
  function setupReading() {
    var body = $("rd-body");
    if (!body) return;
    var map = {}, W = [], entries = 0;
    DATA.forEach(function (r) {
      arr(r.key_works).forEach(function (w) {
        if (!w || !w.title) return;
        entries++;
        var key = norm(w.title).replace(/\(co-?author\)|co-?author/g, "").replace(/[^a-z0-9]+/g, " ").trim();
        var x = map[key];
        if (!x) {
          x = map[key] = { i: W.length, title: String(w.title).trim(), year: +w.year || 0, url: safeUrl(w.url), people: [], cats: [] };
          W.push(x);
        }
        if (!x.url && safeUrl(w.url)) x.url = safeUrl(w.url);
        if (x.people.indexOf(r) < 0) x.people.push(r);
        if (x.cats.indexOf(r.category) < 0) x.cats.push(r.category);
      });
    });
    W.forEach(function (x) { x.hay = norm([x.title, x.year, x.people.map(function (r) { return r.name; }).join(" ")].join(" | ")); });
    var counts = {};
    W.forEach(function (x) { x.cats.forEach(function (c) { counts[c] = (counts[c] || 0) + 1; }); });
    var cBox = $("rd-cats");
    cBox.innerHTML = chipsHTML(CATS, counts, W.length, "data-rcat");
    bindChips(cBox, "data-rcat", function (v) { st.cat = v; apply(); });

    var PAGE = 50, st = { q: "", cat: "", sort: "new" }, list = [], shown = 0;
    var status = $("rd-status"), more = $("rd-more");
    function row(x) {
      var t = x.url ? '<a class="link" href="' + x.url + '" target="_blank" rel="noopener">' + esc(x.title) + "</a>" : esc(x.title);
      var ppl = x.people.map(function (r) { return '<a class="link" href="#' + esc(r.slug) + '">' + esc(r.name) + "</a>"; }).join(", ");
      var cats = x.cats.map(function (c) { return esc(CAT_LABEL[c] || c); }).join(", ");
      return '<tr><th scope="row">' + t + "</th>" +
        '<td class="num" data-label="Year">' + (x.year || "—") + "</td>" +
        '<td data-label="People">' + ppl + "</td>" +
        '<td class="muted" data-label="Category">' + cats + "</td></tr>";
    }
    function paint(reset) {
      var from = reset ? 0 : body.children.length;
      if (reset) body.innerHTML = "";
      if (!list.length) body.innerHTML = '<tr><td colspan="4" class="x-empty">No works match. Try a shorter word or another category.</td></tr>';
      else body.insertAdjacentHTML("beforeend", list.slice(from, shown).map(row).join(""));
      more.hidden = shown >= list.length;
      more.textContent = "Show " + Math.min(PAGE, list.length - shown) + " more";
      status.textContent = list.length
        ? "Showing " + shown + " of " + plural(list.length, "work", "works") + (list.length < W.length ? " (" + W.length + " in total)" : " · " + entries + " entries across " + DATA.length + " profiles")
        : "0 of " + W.length + " works match";
    }
    function apply() {
      var t = terms(st.q);
      list = W.filter(function (x) {
        if (st.cat && x.cats.indexOf(st.cat) < 0) return false;
        return !t.length || matches(x.hay, t);
      });
      list.sort(st.sort === "az"
        ? function (a, b) { return a.title.localeCompare(b.title); }
        : st.sort === "old"
          ? function (a, b) { return (a.year || 9999) - (b.year || 9999) || a.title.localeCompare(b.title); }
          : function (a, b) { return b.year - a.year || a.title.localeCompare(b.title); });
      shown = Math.min(PAGE, list.length);
      paint(true);
    }
    var qIn = $("rd-q");
    qIn.addEventListener("input", function () { st.q = qIn.value; apply(); });
    $("rd-sort").addEventListener("change", function (e) { st.sort = e.target.value; apply(); });
    more.addEventListener("click", function () {
      var first = body.children.length;
      shown = Math.min(list.length, shown + PAGE);
      paint(false);
      var a = body.children[first] && body.children[first].querySelector("a");
      if (a) a.focus({ preventScroll: true });
    });
    apply();
  }

  function start() {
    [setupQuotes, setupInterviews, setupReading].forEach(function (f) {
      try { f(); } catch (e) { if (window.console) console.warn("features2:", e); }
    });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start);
  else start();
})();
