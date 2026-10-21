/* Round 23: Research Archive — every major safety, alignment, interpretability, evals and governance paper and landmark
   Alignment Forum / LessWrong post from the labs, institutes and researchers on this site. Lazy-loads papers.json. Add-only. */
(function () {
  "use strict";
  var doc = document, win = window;
  var box = doc.getElementById("ra-app");
  if (!box) return;
  var PEOPLE = Array.isArray(win.DATA) ? win.DATA : [];
  var SAVED_K = "x23-saved-v1";
  var PAGE = 40;
  var TOPICS = [["alignment", "Alignment"], ["interpretability", "Interpretability"], ["evals", "Evals"], ["governance", "Governance"],
    ["robustness", "Robustness"], ["red-teaming", "Red-teaming"], ["model-welfare", "Model welfare"], ["other", "Other"]];
  var TL = {}; TOPICS.forEach(function (t) { TL[t[0]] = t[1]; });

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function norm(s) { return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // author name -> person slug
  var BYNAME = {};
  PEOPLE.forEach(function (p) { if (p && p.name) BYNAME[norm(p.name).replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim()] = p.slug; });
  function slugFor(a) { return BYNAME[norm(a).replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim()] || ""; }

  var P = [], S = { q: "", topic: "", org: "", src: "", year: "", person: "", best: false, saved: false, sort: "new", shown: PAGE };
  var saved = load(SAVED_K, {});

  box.innerHTML =
    '<div class="stats ra-stats" aria-label="The archive in numbers">' +
    '<div class="stat"><span class="stat__fig" data-ra="n">…</span><span class="stat__label">Papers and posts</span></div>' +
    '<div class="stat"><span class="stat__fig" data-ra="orgs">…</span><span class="stat__label">Organisations</span></div>' +
    '<div class="stat"><span class="stat__fig" data-ra="linked">…</span><span class="stat__label">Linked to researchers here</span></div>' +
    '<div class="stat"><span class="stat__fig" data-ra="span">…</span><span class="stat__label">Years covered</span></div></div>' +
    '<div class="ra-years" aria-label="Papers per year" role="img"></div>' +
    '<div class="x-tools ra-tools"><div class="x-tools__row">' +
    '<input class="x-field x-search" id="ra-q" type="search" placeholder="Search titles, authors, labs, summaries…" aria-label="Search the research archive" autocomplete="off" />' +
    '<select class="x-field x-sort" id="ra-org" aria-label="Filter by lab or institute"><option value="">All labs and institutes</option></select>' +
    '<select class="x-field x-sort" id="ra-person" aria-label="Filter by researcher"><option value="">All researchers</option></select>' +
    '<select class="x-field x-sort" id="ra-src" aria-label="Filter by source"><option value="">All sources</option></select>' +
    '<select class="x-field x-sort" id="ra-year" aria-label="Filter by year"><option value="">All years</option></select>' +
    '<select class="x-field x-sort" id="ra-sort" aria-label="Sort"><option value="new">Sort: Newest</option><option value="old">Sort: Oldest</option><option value="az">Sort: A–Z</option><option value="karma">Sort: Forum karma</option></select>' +
    '</div><div class="x-tools__row ra-chips" role="group" aria-label="Topics"></div>' +
    '<div class="x-tools__row ra-row2"><label class="x22-check"><input type="checkbox" id="ra-best"> Best of LessWrong only</label>' +
    '<label class="x22-check"><input type="checkbox" id="ra-saved"> My saved papers</label>' +
    '<span class="ra-count" aria-live="polite"></span><span class="ra-sp"></span>' +
    '<button class="btn" type="button" data-ra-act="reset">Reset</button><button class="btn" type="button" data-ra-act="csv">Export CSV</button><button class="btn" type="button" data-ra-act="bib">Export BibTeX</button></div></div>' +
    '<ol class="ra-list" id="ra-list" aria-label="Research results"><li class="ra-empty">Loading the archive…</li></ol>' +
    '<div class="ra-more"><button class="btn" type="button" data-ra-act="more" hidden>Show more</button></div>';

  var $ = function (id) { return doc.getElementById(id); };
  var list = $("ra-list"), moreBtn = box.querySelector('[data-ra-act="more"]'), countEl = box.querySelector(".ra-count");

  function opt(sel, vals) { sel.insertAdjacentHTML("beforeend", vals.map(function (v) { return '<option value="' + esc(v[0]) + '">' + esc(v[1]) + "</option>"; }).join("")); }

  function init(data) {
    P = data.map(function (r, i) {
      r._i = i;
      r._orgs = String(r.org || "Independent").split(" · ");
      r._slugs = (r.a || []).map(slugFor);
      r._hay = norm([r.t, (r.a || []).join(" "), r.org, r.s, r.v, r.tp].join(" "));
      return r;
    });
    var orgC = {}, pc = {}, years = {}, srcs = {};
    P.forEach(function (r) {
      r._orgs.forEach(function (o) { orgC[o] = (orgC[o] || 0) + 1; });
      r._slugs.forEach(function (s) { if (s) pc[s] = (pc[s] || 0) + 1; });
      if (r.y) years[r.y] = (years[r.y] || 0) + 1;
      srcs[r.src] = (srcs[r.src] || 0) + 1;
    });
    var orgs = Object.keys(orgC).sort(function (a, b) { return orgC[b] - orgC[a] || a.localeCompare(b); });
    opt($("ra-org"), orgs.map(function (o) { return [o, o + " (" + orgC[o] + ")"]; }));
    var bySlug = {}; PEOPLE.forEach(function (p) { bySlug[p.slug] = p; });
    opt($("ra-person"), Object.keys(pc).filter(function (s) { return bySlug[s]; }).sort(function (a, b) { return bySlug[a].name.localeCompare(bySlug[b].name); }).map(function (s) { return [s, bySlug[s].name + " (" + pc[s] + ")"]; }));
    opt($("ra-src"), Object.keys(srcs).sort().map(function (s) { return [s, s + " (" + srcs[s] + ")"]; }));
    var ys = Object.keys(years).map(Number).sort(function (a, b) { return b - a; });
    opt($("ra-year"), ys.map(function (y) { return [String(y), y + " (" + years[y] + ")"]; }));
    box.querySelector(".ra-chips").innerHTML = '<button class="x-filter" type="button" data-topic="" aria-pressed="true">All</button>' +
      TOPICS.map(function (t) { var n = P.filter(function (r) { return r.tp === t[0]; }).length; return n ? '<button class="x-filter" type="button" data-topic="' + t[0] + '" aria-pressed="false">' + t[1] + " <span>" + n + "</span></button>" : ""; }).join("");
    box.querySelector('[data-ra="n"]').textContent = P.length;
    box.querySelector('[data-ra="orgs"]').textContent = orgs.filter(function (o) { return o !== "Independent"; }).length;
    box.querySelector('[data-ra="linked"]').textContent = P.filter(function (r) { return r._slugs.some(Boolean); }).length;
    box.querySelector('[data-ra="span"]').textContent = ys.length ? String(ys[0] - ys[ys.length - 1] + 1) : "0";
    if (ys.length) box.querySelector('[data-ra="span"]').nextElementSibling.textContent = "Years covered, " + ys[ys.length - 1] + " to " + ys[0];
    // year bars
    var asc = ys.slice().reverse(), max = Math.max.apply(null, asc.map(function (y) { return years[y]; }).concat(1));
    var yb = box.querySelector(".ra-years");
    yb.setAttribute("aria-label", "Papers per year: " + asc.map(function (y) { return y + " " + years[y]; }).join(", "));
    yb.innerHTML = asc.map(function (y) { return '<button type="button" class="ra-yb" data-year="' + y + '" title="' + y + ": " + years[y] + ' papers" style="--h:' + (years[y] / max * 100).toFixed(1) + '%"><span class="ra-yb__bar"></span><span class="ra-yb__y">' + String(y).slice(2) + "</span></button>"; }).join("");
    readHash();
    run();
  }

  function filtered() {
    var q = norm(S.q).trim(), terms = q ? q.split(/\s+/) : [];
    var out = P.filter(function (r) {
      if (S.topic && r.tp !== S.topic) return false;
      if (S.org && r._orgs.indexOf(S.org) < 0) return false;
      if (S.src && r.src !== S.src) return false;
      if (S.year && String(r.y) !== S.year) return false;
      if (S.person && r._slugs.indexOf(S.person) < 0) return false;
      if (S.best && !r.b) return false;
      if (S.saved && !saved[r.u]) return false;
      for (var i = 0; i < terms.length; i++) if (r._hay.indexOf(terms[i]) < 0) return false;
      return true;
    });
    var dk = function (r) { return String(r.d || r.y || ""); };
    if (S.sort === "new") out.sort(function (a, b) { return dk(b).localeCompare(dk(a)); });
    else if (S.sort === "old") out.sort(function (a, b) { return dk(a).localeCompare(dk(b)); });
    else if (S.sort === "az") out.sort(function (a, b) { return a.t.localeCompare(b.t); });
    else if (S.sort === "karma") out.sort(function (a, b) { return (b.k || 0) - (a.k || 0) || dk(b).localeCompare(dk(a)); });
    return out;
  }

  function authorsHtml(r) {
    var a = r.a || [], max = 8, h = a.slice(0, max).map(function (n, i) {
      var s = r._slugs[i];
      return s ? '<button type="button" class="ra-au ra-au--p" data-slug="' + esc(s) + '" title="Open profile">' + esc(n) + "</button>" : '<span class="ra-au">' + esc(n) + "</span>";
    }).join(", ");
    if (a.length > max) h += ' <span class="ra-au">+' + (a.length - max) + " more</span>";
    return h;
  }

  var cur = [];
  function run() {
    cur = filtered();
    countEl.textContent = cur.length + (cur.length === 1 ? " result" : " results");
    var page = cur.slice(0, S.shown);
    list.innerHTML = page.length ? page.map(function (r) {
      var on = !!saved[r.u];
      return '<li class="ra-item"><article>' +
        '<div class="ra-meta"><span class="ra-tp ra-tp--' + esc(r.tp) + '">' + esc(TL[r.tp] || r.tp) + "</span>" +
        "<span>" + esc(r.d || r.y || "") + "</span><span>" + esc(r._orgs.join(" · ")) + "</span><span>" + esc(r.v || r.src) + "</span>" +
        (r.b ? '<span class="ra-best">Best of LessWrong</span>' : "") + (r.k ? "<span>" + esc(r.k) + " karma</span>" : "") + "</div>" +
        '<h3 class="ra-title"><a href="' + esc(r.u) + '" target="_blank" rel="noopener">' + esc(r.t) + "</a></h3>" +
        (r.a && r.a.length ? '<p class="ra-authors">' + authorsHtml(r) + "</p>" : "") +
        (r.s ? '<p class="ra-sum">' + esc(r.s) + "</p>" : "") +
        '<div class="ra-acts"><a class="btn" href="' + esc(r.u) + '" target="_blank" rel="noopener">Read</a>' +
        (r.x ? '<a class="btn" href="https://arxiv.org/pdf/' + esc(r.x) + '" target="_blank" rel="noopener">PDF</a>' : "") +
        '<button class="btn" type="button" data-ra-save="' + r._i + '" aria-pressed="' + on + '">' + (on ? "Saved ✓" : "Save") + "</button>" +
        '<button class="btn" type="button" data-ra-cite="' + r._i + '">Copy citation</button></div>' +
        "</article></li>";
    }).join("") : '<li class="ra-empty">No papers match these filters. Try clearing a filter or the search.</li>';
    moreBtn.hidden = cur.length <= S.shown;
    moreBtn.textContent = "Show " + Math.min(PAGE, cur.length - S.shown) + " more (" + (cur.length - S.shown) + " left)";
    box.querySelectorAll(".ra-chips .x-filter").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-topic") === S.topic ? "true" : "false"); });
    box.querySelectorAll(".ra-yb").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-year") === S.year); });
    writeHash();
  }

  function cite(r) {
    var au = (r.a || []).join(", ");
    return au + (au ? ". " : "") + "(" + (r.y || "n.d.") + "). " + r.t + ". " + (r.v || r.src) + ". " + r.u;
  }
  function bib(r) {
    var k = (norm((r.a && r.a[0]) || r.org || "anon").split(/\s+/).pop().replace(/[^a-z]/g, "") || "anon") + (r.y || "") + norm(r.t).replace(/[^a-z]/g, "").slice(0, 10);
    return "@misc{" + k + ",\n  title = {" + r.t + "},\n  author = {" + (r.a || []).join(" and ") + "},\n  year = {" + (r.y || "") + "},\n  howpublished = {" + (r.v || r.src) + "},\n  url = {" + r.u + "}" + (r.x ? ",\n  eprint = {" + r.x + "},\n  archivePrefix = {arXiv}" : "") + "\n}";
  }
  function download(name, text, type) {
    var a = doc.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type })); a.download = name;
    doc.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csvCell(v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  var tipT = 0;
  function flash(btn, txt) { var o = btn.textContent; btn.textContent = txt; clearTimeout(tipT); tipT = setTimeout(function () { btn.textContent = o; }, 1400); }

  box.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || !box.contains(b)) return;
    if (b.hasAttribute("data-topic")) { S.topic = b.getAttribute("data-topic"); S.shown = PAGE; run(); return; }
    if (b.classList.contains("ra-yb")) { var y = b.getAttribute("data-year"); S.year = S.year === y ? "" : y; $("ra-year").value = S.year; S.shown = PAGE; run(); return; }
    if (b.hasAttribute("data-slug")) { location.hash = b.getAttribute("data-slug"); return; }
    if (b.hasAttribute("data-ra-save")) {
      var r = P[+b.getAttribute("data-ra-save")]; if (!r) return;
      if (saved[r.u]) delete saved[r.u]; else saved[r.u] = 1;
      save(SAVED_K, saved);
      var on = !!saved[r.u]; b.setAttribute("aria-pressed", on); b.textContent = on ? "Saved ✓" : "Save";
      if (S.saved) run();
      return;
    }
    if (b.hasAttribute("data-ra-cite")) {
      var rc = P[+b.getAttribute("data-ra-cite")]; if (!rc) return;
      if (navigator.clipboard) navigator.clipboard.writeText(cite(rc)).then(function () { flash(b, "Copied ✓"); }, function () { flash(b, "Copy blocked"); });
      return;
    }
    var act = b.getAttribute("data-ra-act");
    if (act === "more") { S.shown += PAGE; run(); }
    else if (act === "reset") { S = { q: "", topic: "", org: "", src: "", year: "", person: "", best: false, saved: false, sort: "new", shown: PAGE }; syncInputs(); run(); }
    else if (act === "csv") {
      download("ai-safety-research-archive.csv", "title,authors,year,date,organisation,topic,source,venue,url,arxiv_id,summary\n" + cur.map(function (r) {
        return [r.t, (r.a || []).join("; "), r.y, r.d, r.org, r.tp, r.src, r.v, r.u, r.x, r.s].map(csvCell).join(",");
      }).join("\n"), "text/csv");
    } else if (act === "bib") download("ai-safety-research-archive.bib", cur.map(bib).join("\n\n"), "text/plain");
  });

  function syncInputs() {
    $("ra-q").value = S.q; $("ra-org").value = S.org; $("ra-person").value = S.person; $("ra-src").value = S.src;
    $("ra-year").value = S.year; $("ra-sort").value = S.sort; $("ra-best").checked = S.best; $("ra-saved").checked = S.saved;
  }
  var qT = 0;
  $("ra-q").addEventListener("input", function () { var v = this.value; clearTimeout(qT); qT = setTimeout(function () { S.q = v; S.shown = PAGE; run(); }, 140); });
  [["ra-org", "org"], ["ra-person", "person"], ["ra-src", "src"], ["ra-year", "year"], ["ra-sort", "sort"]].forEach(function (p) {
    $(p[0]).addEventListener("change", function () { S[p[1]] = this.value; S.shown = PAGE; run(); });
  });
  $("ra-best").addEventListener("change", function () { S.best = this.checked; S.shown = PAGE; run(); });
  $("ra-saved").addEventListener("change", function () { S.saved = this.checked; S.shown = PAGE; run(); });

  // shareable filter state: #research?topic=interpretability&org=Anthropic
  function writeHash() {
    if (!/^#research/.test(location.hash)) return;
    var p = [];
    ["q", "topic", "org", "src", "year", "person"].forEach(function (k) { if (S[k]) p.push(k + "=" + encodeURIComponent(S[k])); });
    try { history.replaceState(null, "", location.pathname + location.search + "#research" + (p.length ? "?" + p.join("&") : "")); } catch (e) {}
  }
  function readHash() {
    var m = /^#research\?(.*)$/.exec(location.hash); if (!m) return;
    m[1].split("&").forEach(function (kv) { var i = kv.indexOf("="); if (i > 0) { var k = kv.slice(0, i); if (k in S) S[k] = decodeURIComponent(kv.slice(i + 1)); } });
    syncInputs();
  }

  // profile overlay: add a "Research in the archive" link when a profile opens
  win.X23 = { filterPerson: function (slug) { S.person = slug; S.shown = PAGE; syncInputs(); run(); var sec = doc.getElementById("research"); if (sec) sec.scrollIntoView({ behavior: "smooth" }); } };

  var started = false;
  function start() {
    if (started) return; started = true;
    fetch("papers.json", { cache: "force-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(init).catch(function () { list.innerHTML = '<li class="ra-empty">The archive could not load. Reload the page to try again.</li>'; });
  }
  var sec = doc.getElementById("research");
  if (/^#research/.test(location.hash) || !("IntersectionObserver" in win)) start();
  else {
    var io = new IntersectionObserver(function (en) { if (en.some(function (x) { return x.isIntersecting; })) { io.disconnect(); start(); } }, { rootMargin: "1200px 0px" });
    io.observe(sec || box);
  }
  doc.addEventListener("x23-start", start);
})();
