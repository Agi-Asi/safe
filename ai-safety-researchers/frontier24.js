/* Round 24: "From Inside" (frominside.ai interviews, CC BY 4.0, Palisade Research) and "Pacing the Frontier"
   (July 2026 statement by 1,386 frontier-lab employees). Lazy-loads frominside.json and ptf.json. Add-only. */
(function () {
  "use strict";
  var doc = document, win = window;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function norm(s) { return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function secs(ts) { var p = String(ts || "0").split(":").map(Number), s = 0; p.forEach(function (n) { s = s * 60 + (n || 0); }); return s; }
  function lazy(el, fn) {
    if (!el) return;
    var go = function () { if (el._started) return; el._started = 1; fn(); };
    if (!("IntersectionObserver" in win) || location.hash.indexOf(el.closest("section").id) === 1) return go();
    var io = new IntersectionObserver(function (en) { if (en.some(function (x) { return x.isIntersecting; })) { io.disconnect(); go(); } }, { rootMargin: "1200px 0px" });
    io.observe(el);
  }
  function getJSON(u) { return fetch(u, { cache: "force-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function play(id, t, from, url) {
    if (id && win.HarkPlayer && typeof win.HarkPlayer.open === "function") { win.HarkPlayer.open(id, t || 0, from); return; }
    win.open(url || "https://frominside.ai/", "_blank", "noopener");
  }
  function openProfile(slug) { if (slug) location.hash = slug; }

  /* ---------------- From Inside ---------------- */
  var fiBox = doc.getElementById("fi-app");
  lazy(fiBox, function () {
    getJSON("frominside.json").then(function (D) {
      var byK = {}; D.interviews.forEach(function (i) { byK[i.k] = i; });
      var cur = 0;
      fiBox.innerHTML =
        '<div class="fi-qs" role="tablist" aria-label="Questions">' + D.questions.map(function (q, i) {
          return '<button type="button" role="tab" class="x-filter" data-fiq="' + i + '" aria-selected="' + (i === 0) + '" aria-pressed="' + (i === 0) + '">' + esc(q.q) + " <span>" + q.a.length + "</span></button>";
        }).join("") + "</div>" +
        '<ul class="fi-answers" role="tabpanel" aria-live="polite"></ul>' +
        '<h3 class="fi-h">Full interviews</h3>' +
        '<div class="fi-grid">' + D.interviews.map(function (i) {
          return '<article class="fi-card"><button type="button" class="fi-still" data-fiv="' + esc(i.v) + '" data-fik="' + esc(i.k) + '" aria-label="Play the full interview with ' + esc(i.n) + '">' +
            '<img src="fi/still-' + esc(i.k) + '.jpg" alt="' + esc(i.n) + ' in the frominside.ai interview" loading="lazy" width="640" height="360"><span class="fi-dur">' + esc(i.dur) + '</span><span class="fi-play" aria-hidden="true">▶</span></button>' +
            '<div class="fi-meta"><strong>' + esc(i.n) + "</strong><span>" + esc(i.r) + "</span><span class=\"fi-st fi-st--" + esc(i.st) + "\">" + (i.st === "current" ? "Current employee" : "Former employee") + "</span>" +
            (i.s ? '<button type="button" class="btn fi-prof" data-slug="' + esc(i.s) + '">Profile</button>' : "") + "</div></article>";
        }).join("") + "</div>" +
        (D.clips && D.clips.length ? '<h3 class="fi-h">Clips</h3><div class="fi-clips">' + D.clips.map(function (c) { return '<button type="button" class="btn" data-fiv="' + esc(c.id) + '">' + esc(c.t || c.n) + "</button>"; }).join("") + "</div>" : "") +
        '<p class="fineprint">Interviews by <a href="https://palisaderesearch.org/" target="_blank" rel="noopener">Palisade Research</a> at <a href="https://frominside.ai/" target="_blank" rel="noopener">frominside.ai</a>, released under CC BY 4.0. Interviewees speak in a personal capacity. Palisade notes they are not a representative sample of AI-company staff.</p>';
      var ans = fiBox.querySelector(".fi-answers");
      function render() {
        ans.innerHTML = D.questions[cur].a.map(function (a) {
          var iv = byK[a.k] || {};
          return '<li class="fi-a"><img src="fi/face-' + esc(a.k) + '.jpg" alt="" width="44" height="44" loading="lazy"><blockquote><p>“' + esc(a.x) + '”</p><footer>' +
            (iv.s ? '<button type="button" class="ra-au ra-au--p" data-slug="' + esc(iv.s) + '">' + esc(a.n) + "</button>" : "<strong>" + esc(a.n) + "</strong>") +
            " · " + esc((a.labs || []).join(" · ")) + '</footer></blockquote><button type="button" class="btn fi-ts" data-fiv="' + esc(iv.v || "") + '" data-fit="' + secs(a.ts) + '" aria-label="Watch ' + esc(a.n) + " from " + esc(a.ts) + '">▶ ' + esc(a.ts) + "</button></li>";
        }).join("");
      }
      render();
      fiBox.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        if (b.hasAttribute("data-fiq")) {
          cur = +b.getAttribute("data-fiq");
          fiBox.querySelectorAll("[data-fiq]").forEach(function (x) { var on = x === b; x.setAttribute("aria-selected", on); x.setAttribute("aria-pressed", on); });
          render(); return;
        }
        if (b.hasAttribute("data-slug")) { openProfile(b.getAttribute("data-slug")); return; }
        if (b.hasAttribute("data-fiv")) play(b.getAttribute("data-fiv"), +b.getAttribute("data-fit") || 0, b, "https://frominside.ai/#interviews");
      });
    }).catch(function () { fiBox.innerHTML = '<p class="ra-empty">Could not load the interviews. Reload to try again.</p>'; });
  });

  /* ---------------- Pacing the Frontier ---------------- */
  var pBox = doc.getElementById("ptf-app");
  lazy(pBox, function () {
    getJSON("ptf.json").then(function (D) {
      var S = { q: "", c: "", site: false, shown: 60 }, C = { q: "", c: "", shown: 12 };
      var counts = {}; D.signatories.forEach(function (s) { counts[s.c] = (counts[s.c] || 0) + 1; });
      var cos = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
      var max = counts[cos[0]] || 1;
      var onSite = D.signatories.filter(function (s) { return s.s; }).length;
      pBox.innerHTML =
        '<figure class="ptf-stmt"><div class="ptf-text">' + D.statement.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
        '<blockquote class="ptf-ask"><p>“' + esc(D.ask) + '”</p></blockquote></div><figcaption>— ' + esc(D.count.toLocaleString()) + " employees of frontier AI companies, " + esc(D.date) + '. <a href="' + esc(D.url) + '" target="_blank" rel="noopener">Read and verify at pacingthefrontier.com</a>. ' + esc(D.org) + "</figcaption></figure>" +
        '<div class="stats"><div class="stat"><span class="stat__fig">' + D.count + '</span><span class="stat__label">Signatories</span></div>' +
        '<div class="stat"><span class="stat__fig">' + D.comments.length + '</span><span class="stat__label">Personal comments</span></div>' +
        '<div class="stat"><span class="stat__fig">' + onSite + '</span><span class="stat__label">Have a profile here</span></div>' +
        '<div class="stat"><span class="stat__fig">' + cos.filter(function (c) { return c !== "Other"; }).length + '</span><span class="stat__label">Companies</span></div></div>' +
        '<div class="ptf-bars" role="group" aria-label="Signatories by company">' + cos.map(function (c) {
          return '<button type="button" class="ptf-bar" data-ptfc="' + esc(c) + '" aria-pressed="false"><span class="ptf-bar__l">' + esc(c) + '</span><span class="ptf-bar__t"><span style="width:' + (counts[c] / max * 100).toFixed(1) + '%"></span></span><span class="ptf-bar__n">' + counts[c] + "</span></button>";
        }).join("") + "</div>" +
        '<h3 class="fi-h">Personal comments</h3><div class="x-tools"><div class="x-tools__row"><input class="x-field x-search" id="ptf-cq" type="search" placeholder="Search the comments…" aria-label="Search comments"><span class="ra-count" id="ptf-cn"></span></div></div>' +
        '<ul class="ptf-comments" id="ptf-cl"></ul><div class="ra-more"><button class="btn" type="button" id="ptf-cm">Show more comments</button></div>' +
        '<h3 class="fi-h">All signatories</h3><div class="x-tools"><div class="x-tools__row"><input class="x-field x-search" id="ptf-q" type="search" placeholder="Search 1,386 names and roles…" aria-label="Search signatories">' +
        '<label class="x22-check"><input type="checkbox" id="ptf-site"> Only people with a profile here</label><span class="ra-count" id="ptf-n"></span></div></div>' +
        '<ol class="ptf-sigs" id="ptf-sl"></ol><div class="ra-more"><button class="btn" type="button" id="ptf-sm">Show more signatories</button></div>' +
        '<p class="fineprint">Names, titles and comments are copied from the public statement page. Comments are made in a personal capacity and do not necessarily represent any company’s views.</p>';
      var $ = function (id) { return doc.getElementById(id); };
      function sigs() {
        var q = norm(S.q).trim();
        var L = D.signatories.filter(function (s) { return (!S.c || s.c === S.c) && (!S.site || s.s) && (!q || norm(s.n + " " + s.t).indexOf(q) >= 0); });
        $("ptf-n").textContent = L.length + " signatories";
        $("ptf-sl").innerHTML = L.slice(0, S.shown).map(function (s) {
          return '<li class="ptf-sig">' + (s.s ? '<button type="button" class="ra-au ra-au--p" data-slug="' + esc(s.s) + '">' + esc(s.n) + "</button>" : "<strong>" + esc(s.n) + "</strong>") + "<span>" + esc(s.t) + "</span>" + (s.q ? '<span class="ptf-tag">Commented</span>' : "") + "</li>";
        }).join("") || '<li class="ra-empty">No signatories match.</li>';
        $("ptf-sm").hidden = L.length <= S.shown;
      }
      function comments() {
        var q = norm(C.q).trim();
        var L = D.comments.filter(function (c) { return (!C.c || c.c === C.c) && (!q || norm(c.n + " " + c.t + " " + c.x).indexOf(q) >= 0); });
        $("ptf-cn").textContent = L.length + " comments";
        $("ptf-cl").innerHTML = L.slice(0, C.shown).map(function (c) {
          return '<li class="ptf-c"><blockquote><p>“' + esc(c.x) + '”</p><footer>' + (c.s ? '<button type="button" class="ra-au ra-au--p" data-slug="' + esc(c.s) + '">' + esc(c.n) + "</button>" : "<strong>" + esc(c.n) + "</strong>") + " · " + esc(c.t) + "</footer></blockquote></li>";
        }).join("") || '<li class="ra-empty">No comments match.</li>';
        $("ptf-cm").hidden = L.length <= C.shown;
      }
      sigs(); comments();
      var t1 = 0, t2 = 0;
      $("ptf-q").addEventListener("input", function () { var v = this.value; clearTimeout(t1); t1 = setTimeout(function () { S.q = v; S.shown = 60; sigs(); }, 140); });
      $("ptf-cq").addEventListener("input", function () { var v = this.value; clearTimeout(t2); t2 = setTimeout(function () { C.q = v; C.shown = 12; comments(); }, 140); });
      $("ptf-site").addEventListener("change", function () { S.site = this.checked; S.shown = 60; sigs(); });
      $("ptf-sm").addEventListener("click", function () { S.shown += 120; sigs(); });
      $("ptf-cm").addEventListener("click", function () { C.shown += 24; comments(); });
      pBox.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        if (b.hasAttribute("data-slug")) { openProfile(b.getAttribute("data-slug")); return; }
        if (b.hasAttribute("data-ptfc")) {
          var c = b.getAttribute("data-ptfc"), on = S.c !== c;
          S.c = C.c = on ? c : ""; S.shown = 60; C.shown = 12;
          pBox.querySelectorAll("[data-ptfc]").forEach(function (x) { x.setAttribute("aria-pressed", on && x === b); });
          sigs(); comments();
        }
      });
    }).catch(function () { pBox.innerHTML = '<p class="ra-empty">Could not load the statement data. Reload to try again.</p>'; });
  });
/* Profile badges: Pacing the Frontier signatory / From Inside interviewee */
  (function () {
    var BYN = null;
    function map() { if (BYN) return BYN; var sd = doc.getElementById("site-data"); if (!sd) return {}; BYN = {}; try { JSON.parse(sd.textContent).forEach(function (p) { BYN[p.name] = p; }); } catch (e) {} return BYN; }
    function badge() {
      var body = doc.getElementById("pro-body"), nameEl = doc.getElementById("pro-name");
      if (!body || !nameEl || body.querySelector(".x24-badges")) return;
      var p = map()[nameEl.textContent.trim()]; if (!p || !(p.ptf || p.frominside || p.photo_kind)) return;
      var d = doc.createElement("p"); d.className = "x24-badges";
      d.innerHTML = (p.ptf ? '<a class="ptf-tag" href="#pacing" title="Signed as: ' + esc(p.ptf.title) + '">Signed Pacing the Frontier</a>' : "") +
        (p.frominside ? '<a class="ptf-tag" href="#frominside">From Inside interview</a>' : "") +
        (p.photo_kind === "avatar" ? '<span class="ptf-tag" title="No verified photo of this person is public; this is their own profile avatar.">Picture is their avatar</span>' : "");
      body.insertBefore(d, body.firstChild);
    }
    win.X24badge = badge;
    var tm = 0;
    new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(badge, 80); }).observe(doc.body, { childList: true, subtree: true });
  })();
})();
