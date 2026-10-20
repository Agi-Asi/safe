/* Round C: Trust & Fact-check — KPIs, charts, fact-check explorer, sourcing leaderboard + radar, profile badges, compare rows. */
(function () {
  "use strict";
  var doc = document;
  function $(id) { return doc.getElementById(id); }
  var TRUST = null;
  try { TRUST = Hark.data("trust-data"); } catch (e) { TRUST = null; }
  window.TRUST = TRUST;
  var DATA = window.DATA || [];
  if (!TRUST || !TRUST.people || !$("trust")) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function motionOk() { return !reduce && !doc.documentElement.classList.contains("x-rm"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function safeUrl(u) { return /^https?:\/\//i.test(u || "") ? esc(u) : ""; }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function pct(a, b) { return b ? (a / b) * 100 : 0; }

  var CAT_LABEL = (window.XDIR && window.XDIR.catLabel) || {};
  var CAT_KEYS = Object.keys(CAT_LABEL);
  var TIERS = [["primary", "Primary"], ["press", "Press"], ["community", "Community & blogs"], ["tertiary", "Tertiary"]];
  var TIER_LABEL = {}, TIER_ORDER = {};
  TIERS.forEach(function (t, i) { TIER_LABEL[t[0]] = t[1]; TIER_ORDER[t[0]] = i; });
  var LINKS = [["live", "✓ Live", "Live"], ["protected", "🛡 Protected", "Protected"], ["unreachable", "✗ Unreachable", "Unreachable"]];
  var LINK_LABEL = {}, LINK_ORDER = {};
  LINKS.forEach(function (l, i) { LINK_LABEL[l[0]] = l[1]; LINK_ORDER[l[0]] = i; });
  var LINK_NOTE = { live: "The page answered (HTTP 200)", protected: "Site blocks bots; likely live", unreachable: "Timed out or errored on 19 Oct 2026" };

  function tierBadge(t) { return t ? '<span class="x-tier x-tier--' + esc(t) + '">' + esc(TIER_LABEL[t] || t) + "</span>" : ""; }
  function linkBadge(l) { return l ? '<span class="x-lnk x-lnk--' + esc(l) + '" title="' + esc(LINK_NOTE[l] || "") + '">' + esc(LINK_LABEL[l] || l) + "</span>" : ""; }
  function band(s) { return s >= 85 ? "good" : s >= 70 ? "mid" : "low"; }
  function scoreBadge(s, label) {
    return '<span class="x-sbadge x-sbadge--' + band(s) + '" title="Sourcing score: how strong the sources are, not how right the person is">' + esc(label || "Sourcing") + " <b>" + s + "</b></span>";
  }
  function bar(v) { return '<span class="x-sbar x-sbar--' + band(v) + '" aria-hidden="true"><i style="width:' + Math.max(0, Math.min(100, v)) + '%"></i></span>'; }

  // ---------- Join DATA + TRUST ----------
  var ROWS = [], PEOPLE = [], BY = {};
  DATA.forEach(function (r) {
    BY[r.slug] = r;
    var t = TRUST.people[r.slug];
    if (!t) return;
    var tq = arr(t.quotes);
    var domains = {};
    arr(r.quotes).forEach(function (q, i) {
      var m = tq[i] || {};
      if (m.domain) domains[m.domain] = 1;
      ROWS.push({
        r: r, i: i, text: String(q.text || "").trim(), url: q.source_url, ctx: q.context || "",
        domain: m.domain || "", tier: m.tier || "", link: m.link || "", unv: !!(m.unverified || q.unverified)
      });
    });
    PEOPLE.push({
      r: r, slug: r.slug, name: r.name, cat: r.category, score: t.score, quality: t.source_quality, health: t.link_health,
      domains: t.source_breadth != null ? t.source_breadth : Object.keys(domains).length,
      unverified: t.unverified || 0, quotes: arr(r.quotes).length
    });
  });
  ROWS.forEach(function (x, k) { x.k = k; x.hay = norm([x.r.name, x.text, x.ctx, x.domain].join(" | ")); });
  var P_BY = {};
  PEOPLE.forEach(function (p) { P_BY[p.slug] = p; });

  // ---------- Header: method ----------
  var S = TRUST.summary || {};
  if ($("tr-method")) $("tr-method").textContent = S.method || "";

  // ---------- KPIs ----------
  var tiers = S.tiers || {}, ls = S.link_status || {};
  var nQ = ROWS.length;
  var nLinks = (ls.live || 0) + (ls.protected || 0) + (ls.unreachable || 0);
  var KPI = {
    quotes: { v: nQ, f: function (v) { return Math.round(v).toLocaleString("en-US"); } },
    live: { v: pct(ls.live || 0, nLinks), f: function (v) { return v.toFixed(1) + "%"; } },
    primary: { v: pct(tiers.primary || 0, nQ), f: function (v) { return v.toFixed(1) + "%"; } },
    yt: { v: S.youtube_ok || 0, f: function (v) { return Math.round(v) + " / " + (S.youtube_total || 0); } },
    dead: { v: ls.unreachable || 0, f: function (v) { return String(Math.round(v)); } }
  };
  var kpiEls = [].slice.call(doc.querySelectorAll("#tr-kpis [data-kpi]"));
  function setKpis(p) { kpiEls.forEach(function (el) { var k = KPI[el.getAttribute("data-kpi")]; if (k) el.textContent = k.f(k.v * p); }); }
  setKpis(motionOk() ? 0 : 1);
  if (motionOk() && "IntersectionObserver" in window) {
    var kio = new IntersectionObserver(function (en) {
      if (!en.some(function (e) { return e.isIntersecting; })) return;
      kio.disconnect();
      var t0 = performance.now(), D = 1100;
      (function tick(now) {
        var p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 3);
        setKpis(e);
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.4 });
    kio.observe($("tr-kpis"));
  } else setKpis(1);

  // ---------- Charts ----------
  var TIER_COLOR = { primary: "var(--chart-1)", press: "var(--chart-2)", community: "var(--chart-3)", tertiary: "var(--chart-4)" };
  if (window.Chart) {
    var tierVals = TIERS.map(function (t) { return tiers[t[0]] || 0; });
    var pPrim = Math.round(pct(tiers.primary || 0, nQ));
    $("tr-tier-cap").innerHTML = "Primary sources are the largest share: " + (tiers.primary || 0) + " of " + nQ + " quotes (" + pPrim + "%)<small>Quotes by source tier</small>";
    $("tr-tier").setAttribute("aria-label", TIERS.map(function (t, i) { return t[1] + " " + tierVals[i]; }).join(", "));
    new Chart($("tr-tier"), {
      type: "doughnut",
      data: { labels: TIERS.map(function (t) { return t[1]; }), datasets: [{ label: "Quotes", data: tierVals, backgroundColor: TIERS.map(function (t) { return TIER_COLOR[t[0]]; }) }] },
      options: { cutout: "58%", plugins: { datalabels: Hark.labels.percent } }
    });

    // Link status by tier
    var cross = {};
    ROWS.forEach(function (x) { var k = x.tier + "|" + x.link; cross[k] = (cross[k] || 0) + 1; });
    var unTier = TIERS.filter(function (t) { return cross[t[0] + "|unreachable"]; });
    var protPress = cross["press|protected"] || 0;
    var cap = (unTier.length === 1 ? "Every unreachable link is a " + unTier[0][1].toLowerCase() + " source" : (ls.unreachable || 0) + " links are unreachable") +
      (protPress ? "; " + protPress + " of " + (ls.protected || 0) + " protected links are press" : "");
    $("tr-link-cap").innerHTML = esc(cap) + "<small>Quote links by tier and status, checked 19 Oct 2026</small>";
    $("tr-link").setAttribute("aria-label", LINKS.map(function (l) { return l[2] + " " + (ls[l[0]] || 0); }).join(", "));
    var LCOL = { live: "var(--chart-good)", protected: "var(--chart-muted)", unreachable: "var(--chart-bad)" };
    new Chart($("tr-link"), {
      type: "bar",
      data: {
        labels: TIERS.map(function (t) { return t[1]; }),
        datasets: LINKS.map(function (l) { return { label: l[2], data: TIERS.map(function (t) { return cross[t[0] + "|" + l[0]] || 0; }), backgroundColor: LCOL[l[0]] }; })
      },
      options: { indexAxis: "y", scales: { x: { stacked: true }, y: { stacked: true } }, plugins: { datalabels: Hark.labels.inside } }
    });

    // Top domains
    var dom = arr(S.top_domains).slice(0, 15);
    if (dom.length) {
      $("tr-dom-cap").innerHTML = esc(dom[0][0]) + " is the most-cited source, with " + dom[0][1] + " quotes<small>Top 15 source domains, quotes per domain</small>";
      $("tr-dom").setAttribute("aria-label", dom.map(function (d) { return d[0] + " " + d[1]; }).join(", "));
      new Chart($("tr-dom"), {
        type: "bar",
        data: { labels: dom.map(function (d) { return d[0]; }), datasets: [{ label: "Quotes", data: dom.map(function (d) { return d[1]; }) }] },
        options: { indexAxis: "y", plugins: { legend: { display: false }, datalabels: Hark.labels.values } }
      });
    }
  }

  // ---------- Sortable headers ----------
  function makeSortable(table, getState, onSort) {
    [].forEach.call(table.querySelectorAll("thead th[data-sort]"), function (th) {
      var label = th.textContent.trim();
      th.innerHTML = '<button class="x-sorth" type="button">' + esc(label) + '<span class="x-sorth__i" aria-hidden="true"></span></button>';
      th.querySelector("button").addEventListener("click", function () { onSort(th.getAttribute("data-sort")); });
    });
    return function sync() {
      var st = getState();
      [].forEach.call(table.querySelectorAll("thead th[data-sort]"), function (th) {
        var on = th.getAttribute("data-sort") === st.key;
        if (on) th.setAttribute("aria-sort", st.dir > 0 ? "ascending" : "descending"); else th.removeAttribute("aria-sort");
        th.querySelector(".x-sorth__i").textContent = on ? (st.dir > 0 ? "↑" : "↓") : "↕";
      });
    };
  }
  function fillSortSelect(sel, opts, st) {
    sel.innerHTML = opts.map(function (o) { return '<option value="' + o[0] + "|" + o[1] + '">Sort: ' + esc(o[2]) + "</option>"; }).join("");
    sel.value = st.key + "|" + st.dir;
  }
  function opt(v, l) { return '<option value="' + esc(v) + '">' + esc(l) + "</option>"; }

  // ---------- Fact-check explorer ----------
  var fc = { q: "", tier: "", link: "", cat: "", person: "", key: "person", dir: 1, page: 0 }, PER = 25;
  var fcBody = $("fc-body");
  $("fc-tier").insertAdjacentHTML("beforeend", TIERS.map(function (t) { return opt(t[0], t[1] + " (" + (tiers[t[0]] || 0) + ")"); }).join(""));
  $("fc-link").insertAdjacentHTML("beforeend", LINKS.map(function (l) { return opt(l[0], l[2] + " (" + (ls[l[0]] || 0) + ")"); }).join("") + opt("unv", "Unverified only"));
  var catOpts = CAT_KEYS.map(function (c) { return opt(c, CAT_LABEL[c]); }).join("");
  $("fc-cat").insertAdjacentHTML("beforeend", catOpts);
  $("lb-cat").insertAdjacentHTML("beforeend", catOpts);
  $("fc-person").insertAdjacentHTML("beforeend", PEOPLE.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (p) { return opt(p.slug, p.name); }).join(""));
  var FC_SORTS = [["person", 1, "Person A–Z"], ["person", -1, "Person Z–A"], ["tier", 1, "Strongest tier first"], ["tier", -1, "Weakest tier first"], ["link", -1, "Link problems first"], ["domain", 1, "Domain A–Z"], ["quote", 1, "Shortest quote first"], ["flag", -1, "Unverified first"]];
  fillSortSelect($("fc-sort"), FC_SORTS, fc);
  var fcCmp = {
    person: function (a, b) { return a.r.name.localeCompare(b.r.name) || a.i - b.i; },
    quote: function (a, b) { return a.text.length - b.text.length || a.k - b.k; },
    domain: function (a, b) { return a.domain.localeCompare(b.domain) || a.k - b.k; },
    tier: function (a, b) { return (TIER_ORDER[a.tier] - TIER_ORDER[b.tier]) || a.k - b.k; },
    link: function (a, b) { return (LINK_ORDER[a.link] - LINK_ORDER[b.link]) || a.k - b.k; },
    flag: function (a, b) { return (a.unv - b.unv) || a.k - b.k; }
  };
  function excerpt(s) { return s.length > 120 ? s.slice(0, 119).replace(/\s+\S*$/, "") + "…" : s; }
  var fcSync = makeSortable($("fc-table"), function () { return fc; }, function (k) {
    if (fc.key === k) fc.dir = -fc.dir; else { fc.key = k; fc.dir = k === "link" || k === "flag" ? -1 : 1; }
    fc.page = 0; renderFC();
  });
  function fcList() {
    var terms = norm(fc.q).split(/\s+/).filter(Boolean);
    var out = ROWS.filter(function (x) {
      if (fc.tier && x.tier !== fc.tier) return false;
      if (fc.link === "unv" ? !x.unv : fc.link && x.link !== fc.link) return false;
      if (fc.cat && x.r.category !== fc.cat) return false;
      if (fc.person && x.r.slug !== fc.person) return false;
      return terms.every(function (t) { return x.hay.indexOf(t) > -1; });
    });
    var c = fcCmp[fc.key] || fcCmp.person;
    out.sort(function (a, b) { var d = c(a, b); return fc.key === "person" || fc.key === "quote" || fc.key === "domain" ? d * fc.dir : (fc.dir < 0 ? c(b, a) : d); });
    return out;
  }
  function renderFC() {
    var list = fcList(), pages = Math.max(1, Math.ceil(list.length / PER));
    if (fc.page >= pages) fc.page = pages - 1;
    var slice = list.slice(fc.page * PER, fc.page * PER + PER);
    fcBody.innerHTML = slice.length ? slice.map(function (x) {
      var u = safeUrl(x.url);
      var q = esc(excerpt(x.text));
      var qHtml = u ? '<a class="x-fcq" href="' + u + '" target="_blank" rel="noopener" title="Open source (new tab)">“' + q + "”</a>" : "“" + q + "”";
      return "<tr>" +
        '<th scope="row" data-label="Person"><a class="link" href="#' + esc(x.r.slug) + '">' + esc(x.r.name) + "</a><small>" + esc(CAT_LABEL[x.r.category] || "") + "</small></th>" +
        '<td data-label="Quote">' + qHtml + "</td>" +
        '<td data-label="Domain" class="muted">' + (esc(x.domain) || "—") + "</td>" +
        '<td data-label="Tier">' + (tierBadge(x.tier) || "—") + "</td>" +
        '<td data-label="Link">' + (linkBadge(x.link) || "—") + (x.link === "protected" ? "<small>Site blocks bots; likely live</small>" : "") + "</td>" +
        '<td data-label="Flag">' + (x.unv ? '<span class="chip">Unverified</span>' : '<span class="muted">—</span>') + "</td></tr>";
    }).join("") : '<tr><td colspan="6" class="muted">No quotes match. Clear a filter or try a shorter search.</td></tr>';
    $("fc-status").textContent = list.length ? "Showing " + (fc.page * PER + 1) + "–" + (fc.page * PER + slice.length) + " of " + list.length + " quotes" + (list.length !== ROWS.length ? " (" + ROWS.length + " in all)" : "") : "No quotes match";
    $("fc-pos").textContent = "Page " + (fc.page + 1) + " of " + pages;
    $("fc-prev").disabled = fc.page <= 0;
    $("fc-next").disabled = fc.page >= pages - 1;
    var sv = fc.key + "|" + fc.dir, sel = $("fc-sort");
    if ([].some.call(sel.options, function (o) { return o.value === sv; })) sel.value = sv;
    fcSync();
  }
  function fcSet(k, v) { fc[k] = v; fc.page = 0; renderFC(); }
  $("fc-q").addEventListener("input", function (e) { fcSet("q", e.target.value); });
  ["tier", "link", "cat", "person"].forEach(function (k) { $("fc-" + k).addEventListener("change", function (e) { fcSet(k, e.target.value); }); });
  $("fc-sort").addEventListener("change", function (e) { var p = e.target.value.split("|"); fc.key = p[0]; fc.dir = +p[1]; fc.page = 0; renderFC(); });
  function fcPage(d) {
    fc.page += d; renderFC();
    var t = $("fact-check");
    if (t && t.getBoundingClientRect().top < 0) t.scrollIntoView({ behavior: motionOk() ? "smooth" : "auto", block: "start" });
  }
  $("fc-prev").addEventListener("click", function () { fcPage(-1); });
  $("fc-next").addEventListener("click", function () { fcPage(1); });
  renderFC();

  // ---------- Sourcing leaderboard ----------
  var lb = { cat: "", min: 0, key: "score", dir: -1 }, picks = [];
  var MAXP = 4, lbBody = $("lb-body");
  var LB_SORTS = [["score", -1, "Highest score"], ["score", 1, "Lowest score"], ["quality", -1, "Source quality"], ["health", -1, "Link health"], ["domains", -1, "Most domains"], ["unverified", -1, "Most unverified"], ["quotes", -1, "Most quotes"], ["name", 1, "Name A–Z"]];
  fillSortSelect($("lb-sort"), LB_SORTS, lb);
  var lbSync = makeSortable($("lb-table"), function () { return lb; }, function (k) {
    if (lb.key === k) lb.dir = -lb.dir; else { lb.key = k; lb.dir = k === "name" ? 1 : -1; }
    renderLB();
  });
  PEOPLE.slice().sort(function (a, b) { return b.score - a.score || a.name.localeCompare(b.name); }).slice(0, 3).forEach(function (p) { picks.push(p.slug); });
  function lbList() {
    var out = PEOPLE.filter(function (p) { return (!lb.cat || p.cat === lb.cat) && p.score >= lb.min; });
    out.sort(function (a, b) {
      var d = lb.key === "name" ? a.name.localeCompare(b.name) : (a[lb.key] - b[lb.key]);
      return d * lb.dir || a.name.localeCompare(b.name);
    });
    return out;
  }
  function renderLB() {
    var list = lbList(), full = picks.length >= MAXP;
    lbBody.innerHTML = list.length ? list.map(function (p, i) {
      var on = picks.indexOf(p.slug) > -1;
      return "<tr" + (on ? ' class="is-highlight"' : "") + ">" +
        '<td data-label="Pick"><label class="x-pick"><input type="checkbox" aria-label="Compare ' + esc(p.name) + '" data-pick="' + esc(p.slug) + '"' + (on ? " checked" : "") + (!on && full ? " disabled" : "") + " /></label></td>" +
        '<th scope="row" data-label="Person"><a class="link" href="#' + esc(p.slug) + '">' + esc(p.name) + "</a><small>" + esc(CAT_LABEL[p.cat] || "") + "</small></th>" +
        '<td data-label="Score"><span class="x-scorecell">' + bar(p.score) + "<b>" + p.score + "</b></span></td>" +
        '<td data-label="Source quality" class="num">' + p.quality + "</td>" +
        '<td data-label="Link health" class="num">' + p.health + "</td>" +
        '<td data-label="Domains" class="num">' + p.domains + "</td>" +
        '<td data-label="Unverified" class="' + (p.unverified ? "num" : "muted") + '">' + p.unverified + "</td>" +
        '<td data-label="Quotes" class="num">' + p.quotes + "</td></tr>";
    }).join("") : '<tr><td colspan="8" class="muted">No one at or above that score in this category.</td></tr>';
    $("lb-status").textContent = "Showing " + list.length + " of " + PEOPLE.length + " people · " + picks.length + " of " + MAXP + " picked for the radar";
    var sv = lb.key + "|" + lb.dir, sel = $("lb-sort");
    if ([].some.call(sel.options, function (o) { return o.value === sv; })) sel.value = sv;
    lbSync();
  }
  $("lb-cat").addEventListener("change", function (e) { lb.cat = e.target.value; renderLB(); });
  $("lb-min").addEventListener("input", function (e) { lb.min = +e.target.value; $("lb-min-out").textContent = lb.min; renderLB(); });
  $("lb-sort").addEventListener("change", function (e) { var p = e.target.value.split("|"); lb.key = p[0]; lb.dir = +p[1]; renderLB(); });
  $("lb-clear").addEventListener("click", function () { picks = []; renderLB(); renderRadar(); });
  lbBody.addEventListener("change", function (e) {
    var c = e.target.closest("[data-pick]");
    if (!c) return;
    var s = c.getAttribute("data-pick"), i = picks.indexOf(s);
    if (c.checked && i < 0 && picks.length < MAXP) picks.push(s);
    else if (!c.checked && i > -1) picks.splice(i, 1);
    renderLB(); renderRadar();
    var again = lbBody.querySelector('[data-pick="' + s + '"]');
    if (again) again.focus();
  });

  // Radar
  var AXES = ["Source quality", "Link health", "Source breadth", "Verified quotes"];
  function metrics(p) {
    return [p.quality, p.health, Math.min(100, p.domains * 25), p.quotes ? Math.round(100 * (1 - p.unverified / p.quotes)) : 100];
  }
  var radar = null;
  // Radar axis text and grid follow the page's text colour at a readable strength, in both themes.
  function ink(alpha) {
    return function () {
      var probe = doc.createElement("span");
      probe.style.color = "var(--text-primary)";
      doc.body.appendChild(probe);
      var c = getComputedStyle(probe).color;
      probe.remove();
      var m = c.match(/[\d.]+/g);
      return m && m.length >= 3 ? "rgba(" + m[0] + "," + m[1] + "," + m[2] + "," + alpha + ")" : c;
    };
  }
  function renderRadar() {
    var ps = picks.map(function (s) { return P_BY[s]; }).filter(Boolean);
    var sets = ps.map(function (p, i) { return { label: p.name + " (" + p.score + ")", data: metrics(p), borderColor: "var(--chart-" + (i + 1) + ")", backgroundColor: Hark.wash ? Hark.wash("var(--chart-" + (i + 1) + ")", 0.18) : undefined, pointRadius: 3 }; });
    $("lb-radar-cap").innerHTML = (ps.length ? "Comparing " + ps.map(function (p) { return esc(p.name); }).join(", ") : "Tick up to four people in the table to compare them") +
      "<small>Source quality, link health, breadth (4+ domains = 100) and verified share, 0 to 100</small>";
    $("lb-radar").setAttribute("aria-label", ps.length ? ps.map(function (p) { var m = metrics(p); return p.name + ": " + AXES.map(function (a, i) { return a + " " + m[i]; }).join(", "); }).join("; ") : "No one picked yet");
    if (!window.Chart) return;
    if (!radar) {
      radar = new Chart($("lb-radar"), {
        type: "radar",
        data: { labels: AXES, datasets: sets },
        options: { scales: { r: { min: 0, max: 100,
          ticks: { stepSize: 25, color: ink(0.78) },
          pointLabels: { color: ink(1) },
          grid: { color: ink(0.24) },
          angleLines: { color: ink(0.24) } } } }
      });
    } else { radar.data.datasets = sets; radar.update(); }
  }
  renderLB(); renderRadar();

  // ---------- Profile overlay: sourcing badge + quote badges ----------
  var body = $("pro-body");
  function slugNow() { var s = ""; try { s = decodeURIComponent(location.hash.slice(1)); } catch (e) { s = location.hash.slice(1); } return s; }
  function enhanceProfile() {
    if (!body) return;
    var slug = slugNow(), t = TRUST.people[slug];
    if (!t) return;
    var tags = body.querySelector(".x-pro__meta .x-tags");
    if (tags && !tags.querySelector(".x-sbadge")) tags.insertAdjacentHTML("beforeend", " " + scoreBadge(t.score));
    var blocks = [].filter.call(body.querySelectorAll(".x-block"), function (b) { var h = b.querySelector(":scope > h3"); return h && h.textContent.trim() === "Quotes"; });
    if (!blocks.length) return;
    var figs = blocks[0].querySelectorAll(".x-quote");
    [].forEach.call(figs, function (f, i) {
      if (f.hasAttribute("data-trq")) return;
      f.setAttribute("data-trq", "");
      var m = arr(t.quotes)[i];
      var cap = f.querySelector("figcaption");
      if (!m || !cap) return;
      cap.insertAdjacentHTML("beforeend", '<span class="x-trbadges">' + tierBadge(m.tier) + linkBadge(m.link) + (m.domain ? '<span class="x-trdom">' + esc(m.domain) + "</span>" : "") + "</span>");
    });
  }
  if (body) {
    new MutationObserver(enhanceProfile).observe(body, { childList: true });
    window.addEventListener("hashchange", function () { setTimeout(enhanceProfile, 0); });
    enhanceProfile();
  }

  // ---------- Compare view rows ----------
  function enhanceCompare(grid) {
    grid.classList.add("x-trust-rows");
    [].forEach.call(grid.querySelectorAll(".x-cmpv__col"), function (col) {
      if (col.querySelector(".x-cmpv__row--trust")) return;
      var b = col.querySelector("[data-cmp]"), acts = col.querySelector(".x-cmpv__acts");
      var t = b && TRUST.people[b.getAttribute("data-cmp")];
      var rows;
      function row(label, html) { return '<div class="x-cmpv__row x-cmpv__row--trust"><p class="x-cmpv__label">' + label + "</p>" + html + "</div>"; }
      if (t) {
        rows = row("Sourcing score", '<p class="x-scorecell">' + scoreBadge(t.score, "Score") + bar(t.score) + "</p>") +
          row("Source quality", '<p class="x-scorecell">' + bar(t.source_quality) + "<b>" + t.source_quality + "</b></p>") +
          row("Link health", '<p class="x-scorecell">' + bar(t.link_health) + "<b>" + t.link_health + "</b></p>");
      } else rows = row("Sourcing score", '<p class="x-cmpv__none">—</p>') + row("Source quality", '<p class="x-cmpv__none">—</p>') + row("Link health", '<p class="x-cmpv__none">—</p>');
      if (acts) acts.insertAdjacentHTML("beforebegin", rows); else col.insertAdjacentHTML("beforeend", rows);
    });
  }
  var cgrid = doc.querySelector(".x-cmpv__grid");
  if (cgrid) {
    new MutationObserver(function () { enhanceCompare(cgrid); }).observe(cgrid, { childList: true });
    enhanceCompare(cgrid);
  }

  // ---------- Command palette ----------
  var prevActions = window.XCMP_ACTIONS;
  var SHIELD = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>';
  window.XCMP_ACTIONS = function () {
    var base = typeof prevActions === "function" ? prevActions() : [];
    return base.concat([{
      kind: "Action", icon: SHIELD, name: "Fact-check", sub: ROWS.length + " quotes · sources, tiers and link checks",
      run: function () {
        setTimeout(function () {
          var s = $("trust");
          if (s) s.scrollIntoView({ behavior: motionOk() ? "smooth" : "auto", block: "start" });
          var q = $("fc-q");
          if (q) q.focus({ preventScroll: true });
        }, 0);
      }
    }]);
  };
})();
