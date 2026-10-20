/* Round 19: advanced search drawer (directory + Theater), player power controls (queue, A–B, tap zones, speed, chapters), motion polish. */
(function () {
  "use strict";
  var doc = document, win = window, root = doc.documentElement;
  function $(id) { return doc.getElementById(id); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function norm(s) { return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function clock(s) {
    s = Math.max(0, Math.floor(s || 0));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h ? h + ":" + pad(m) + ":" + pad(x) : pad(m) + ":" + pad(x);
  }
  function lsGet(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked: memory only */ } }
  function motionOk() { return !root.classList.contains("x-rm") && !(win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function toast(msg) {
    var el = doc.querySelector(".x-toast");
    if (!el) { el = doc.createElement("div"); el.className = "x-toast"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); doc.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("is-on"); }, 2400);
  }
  function copyText(text, okMsg) {
    function fallback() {
      var ta = doc.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      doc.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = doc.execCommand("copy"); } catch (e) { ok = false; }
      ta.parentNode.removeChild(ta);
      toast(ok ? okMsg : text);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, fallback);
    else fallback();
  }

  // ---------- Data ----------
  var DATA = arr(win.DATA);
  var VIDEOS = arr(win.THEATER);
  var META = win.VMETA || {};
  var TRUST = {};
  try { TRUST = (Hark.data("trust-data") || {}).people || {}; } catch (e) { TRUST = {}; }
  var CAT_LABEL = (win.XDIR && win.XDIR.catLabel) || {
    "lab-safety": "Frontier Lab Safety", "academic-alignment": "Academic Alignment", "independent-org": "Independent Orgs",
    "interpretability": "Interpretability", "governance-policy": "Governance & Policy", "pioneer-public-voice": "Pioneers & Public Voices"
  };
  var BY_SLUG = {}, BY_ID = {}, VCOUNT = {}, PHOTO = {};
  DATA.forEach(function (p) { BY_SLUG[p.slug] = p; });
  VIDEOS.forEach(function (v) { BY_ID[v.id] = v; VCOUNT[v.s] = (VCOUNT[v.s] || 0) + 1; });
  [].forEach.call(doc.querySelectorAll("#photo-bank img"), function (im) { PHOTO[im.getAttribute("data-p")] = im.getAttribute("src"); });
  function personName(slug) { var p = BY_SLUG[slug]; return p ? p.name : slug || ""; }
  function thumb(id) { return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"; }
  function scoreOf(slug) { var t = TRUST[slug]; return t && typeof t.score === "number" ? t.score : null; }
  function tierOf(slug) { var s = scoreOf(slug); return s == null ? "none" : s >= 85 ? "strong" : s >= 70 ? "solid" : "weaker"; }
  var TIER_NAME = { strong: "Strong (85+)", solid: "Solid (70–84)", weaker: "Weaker (under 70)", none: "Not scored" };
  function lenOf(v) { var m = META[v.id]; return (m && m.length_sec) || v.d || 0; }
  function chanOf(v) { var m = META[v.id]; return (m && m.channel) || v.ch || ""; }
  function watchHist() { var o = lsGet("x-watch-history-v1", null); return (o && o.items) || {}; }

  var LABS = [
    ["Anthropic", /anthropic/i], ["OpenAI", /openai/i], ["Google DeepMind", /deepmind|google/i],
    ["Meta", /\bmeta\b(?!-)|facebook|\bFAIR\b/], ["Microsoft", /microsoft/i], ["xAI", /\bxai\b/i],
    ["Apollo Research", /apollo research/i], ["Palisade Research", /palisade/i], ["Redwood Research", /redwood/i],
    ["METR", /\bmetr\b/i], ["BlueDot Impact", /bluedot/i], ["MIRI", /\bmiri\b|machine intelligence research institute/i],
    ["CAIS", /\bcais\b|center for ai safety/i], ["Epoch AI", /epoch ai|\bepoch\b/i], ["FAR.AI", /far\.ai|\bfar ai\b/i],
    ["UK AISI", /\baisi\b|ai security institute|ai safety institute/i], ["Thinking Machines", /thinking machines/i],
    ["SSI", /safe superintelligence|\bssi\b/i]
  ];
  var LAB_ORDER = LABS.map(function (l) { return l[0]; }).concat(["Other"]);
  function labsIn(s) { return LABS.filter(function (l) { return l[1].test(s); }).map(function (l) { return l[0]; }); }
  var LEFT_RE = /\b(left|resigned|resigns|quit|departed)\b/i;

  // ---------- Search documents ----------
  var VOCAB = {};
  function addWords(d, field, bit) {
    String(d.n[field] || "").split(/[^a-z0-9]+/).forEach(function (w) {
      if (w.length < 3) return;
      d.words[w] = (d.words[w] || 0) | bit;
      VOCAB[w] = 1;
    });
  }
  function makeDoc(kind, item, raw, fields) {
    var d = { kind: kind, item: item, raw: raw, n: {}, words: {}, fv: {} };
    fields.forEach(function (f, i) { d.n[f[0]] = norm(raw[f[0]]); addWords(d, f[0], 1 << i); });
    d.all = fields.map(function (f) { return d.n[f[0]]; }).join(" | ");
    return d;
  }
  var PF = [["name", 10, "Name"], ["role", 6, "Role"], ["orgs", 6, "Career"], ["ideas", 4, "Key ideas"], ["iv", 3, "Interviews"], ["quotes", 2, "Quotes"], ["bio", 2, "Bio"]];
  var VF = [["title", 10, "Title"], ["person", 6, "Person"], ["channel", 5, "Channel"], ["tags", 4, "Tags"], ["chap", 2, "Chapters"], ["summary", 2, "Summary"]];

  var PDOCS = DATA.map(function (r) {
    var orgs = arr(r.orgs_history), role = r.current_role || "";
    var d = makeDoc("p", r, {
      name: r.name, role: role, orgs: orgs.join(" · "), ideas: arr(r.key_ideas).join(" · "),
      iv: arr(r.interviews).map(function (x) { return x.title; }).join(" · "),
      quotes: arr(r.quotes).map(function (q) { return q.text; }).join(" … "), bio: r.bio || ""
    }, PF);
    var labs = labsIn([role].concat(orgs).join(" | "));
    var ctry = arr(r._ctry).length ? r._ctry.slice() : (r.country ? [String(r.country).split(/\s*[\/;(]/)[0].trim()] : []);
    var left = [role].concat(orgs).some(function (s) { return LEFT_RE.test(s) && /\b202[56]\b/.test(s) && labsIn(s).length > 0; });
    var nv = VCOUNT[r.slug] || 0;
    var years = {};
    arr(r.interviews).concat(arr(r.key_works)).forEach(function (x) { if (x && x.year) years[x.year] = 1; });
    d.years = Object.keys(years).map(Number);
    d.fv = {
      lab: labs.length ? labs : ["Other"], cat: [r.category], country: ctry.filter(Boolean),
      stance: [r.p_doom_or_stance ? "yes" : "no"], tier: [tierOf(r.slug)],
      vids: [nv === 0 ? "0" : nv === 1 ? "1" : nv <= 3 ? "2-3" : "4+"], left: left ? ["yes"] : []
    };
    d.photo = !!(r.photo && (PHOTO[r.photo] || !doc.getElementById("photo-bank")));
    d.video = nv > 0 || arr(r.interviews).some(function (x) { return x.youtube_id; });
    return d;
  });
  var VDOCS = VIDEOS.map(function (v) {
    var m = META[v.id] || {};
    var d = makeDoc("v", v, {
      title: v.t, person: personName(v.s), channel: chanOf(v), tags: arr(v.tg).join(" · ") + " · " + (v.k || ""),
      chap: arr(m.chapters).map(function (c) { return c.label; }).join(" · "),
      summary: (m.summary || "") + " " + arr(m.key_points).join(" ")
    }, VF);
    var L = lenOf(v), p = BY_SLUG[v.s];
    d.labs = p ? labsIn([p.current_role || ""].concat(arr(p.orgs_history)).join(" | ")) : [];
    d.fv = {
      person: [v.s], channel: [chanOf(v) || "Unknown"], year: [v.y ? String(v.y) : "unknown"],
      len: [!L ? "unknown" : L < 600 ? "short" : L <= 3600 ? "mid" : "long"], watched: ["no"], tier: [tierOf(v.s)]
    };
    return d;
  });
  var VOCAB_LIST = Object.keys(VOCAB);

  // ---------- Fuzzy matching ----------
  function lev(a, b, max) {
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > max) return max + 1;
    var p2 = null, p = [], c, i, j;
    for (j = 0; j <= lb; j++) p[j] = j;
    for (i = 1; i <= la; i++) {
      c = [i]; var best = i;
      for (j = 1; j <= lb; j++) {
        var v = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, p2[j - 2] + 1);
        c[j] = v; if (v < best) best = v;
      }
      if (best > max) return max + 1;
      p2 = p; p = c;
    }
    return p[lb];
  }
  var FZ = {};
  function fuzzy(t) {
    if (FZ[t]) return FZ[t];
    var out = [];
    if (t.length >= 4 && /^[a-z0-9]+$/.test(t)) {
      var max = t.length >= 8 ? 2 : 1;
      for (var i = 0; i < VOCAB_LIST.length; i++) {
        var w = VOCAB_LIST[i];
        if (w.indexOf(t) >= 0) continue;
        if (lev(t, w, max) <= max || (w.length > t.length && lev(t, w.slice(0, t.length), max) <= max)) out.push(w);
        if (out.length > 40) break;
      }
    }
    return (FZ[t] = out);
  }

  // ---------- Query parsing: "phrase", -word, OR, field:value ----------
  var FIELDS = { org: 1, cat: 1, country: 1, year: 1, has: 1, is: 1, person: 1, channel: 1 };
  function parse(q) {
    var toks = [], re = /(-?)(?:([a-z]+):)?(?:"([^"]*)"?|(\S+))/gi, m;
    while ((m = re.exec(q))) {
      if (!m[0]) { re.lastIndex++; continue; }
      var neg = m[1] === "-", field = m[2] ? m[2].toLowerCase() : "", phrase = m[3] != null, val = phrase ? m[3] : m[4];
      if (field && !FIELDS[field]) { val = m[2] + ":" + (val || ""); field = ""; }
      if (!field && !phrase && !neg && val === "OR") { toks.push({ or: true }); continue; }
      if (val == null || !String(val).trim()) continue;
      if (!field && !phrase && !/[a-z0-9]/.test(norm(val))) continue;
      toks.push({ neg: neg, field: field, phrase: phrase, val: norm(val).trim(), rawVal: val });
    }
    var groups = [], cur = null, orNext = false;
    toks.forEach(function (t) {
      if (t.or) { orNext = true; return; }
      if (orNext && cur && !t.neg && !cur[0].neg) cur.push(t);
      else { cur = [t]; groups.push(cur); }
      orNext = false;
    });
    return groups;
  }
  var COUNTRY_ALIAS = { uk: "united kingdom", britain: "united kingdom", us: "united states", usa: "united states", america: "united states" };
  function yearOk(val, years) {
    var m;
    if ((m = /^(\d{4})\s*-\s*(\d{4})$/.exec(val))) return years.some(function (y) { return y >= +m[1] && y <= +m[2]; });
    if ((m = /^(>=?|<=?)(\d{4})$/.exec(val))) return years.some(function (y) { return m[1] === ">" ? y > +m[2] : m[1] === ">=" ? y >= +m[2] : m[1] === "<" ? y < +m[2] : y <= +m[2]; });
    return years.indexOf(+val) >= 0;
  }
  function fieldOk(d, f, val) {
    var r = d.item;
    if (d.kind === "p") {
      if (f === "org") return d.fv.lab.some(function (l) { return norm(l).indexOf(val) >= 0; }) || d.n.role.indexOf(val) >= 0 || d.n.orgs.indexOf(val) >= 0;
      if (f === "cat") return norm(r.category).indexOf(val) >= 0 || norm(CAT_LABEL[r.category]).indexOf(val) >= 0;
      if (f === "country") { var c = COUNTRY_ALIAS[val] || val; return norm(r.country).indexOf(c) >= 0 || d.fv.country.some(function (x) { return norm(x).indexOf(c) >= 0; }); }
      if (f === "year") return yearOk(val, d.years);
      if (f === "person") return d.n.name.indexOf(val) >= 0;
      if (f === "channel") return d.n.iv.indexOf(val) >= 0;
      if (f === "has") return val === "photo" ? d.photo : val === "video" || val === "videos" ? d.video : val === "stance" ? d.fv.stance[0] === "yes" : /^quotes?$/.test(val) ? arr(r.quotes).length > 0 : val === "works" ? arr(r.key_works).length > 0 : false;
      if (f === "is") return val === "new" ? !!r.added : val === "left" ? d.fv.left.length > 0 : false;
    } else {
      if (f === "org") return d.labs.some(function (l) { return norm(l).indexOf(val) >= 0; }) || d.n.channel.indexOf(val) >= 0;
      if (f === "cat") return norm(r.c).indexOf(val) >= 0 || norm(CAT_LABEL[r.c]).indexOf(val) >= 0;
      if (f === "country") { var p = BY_SLUG[r.s], cc = COUNTRY_ALIAS[val] || val; return !!p && norm(p.country).indexOf(cc) >= 0; }
      if (f === "year") return r.y ? yearOk(val, [r.y]) : false;
      if (f === "person") return d.n.person.indexOf(val) >= 0;
      if (f === "channel") return d.n.channel.indexOf(val) >= 0;
      if (f === "has") return val === "photo" ? !!(BY_SLUG[r.s] && BY_SLUG[r.s].photo) : val === "video" ? true : val === "chapters" ? d.n.chap.length > 0 : false;
      if (f === "is") return val === "new" ? r.new === true : val === "watched" ? d.fv.watched[0] === "yes" : val === "unwatched" ? d.fv.watched[0] === "no" : false;
    }
    return false;
  }
  function termScore(d, t, fields, exactOnly) {
    var s = 0, fz = exactOnly ? [] : fuzzy(t), mask = 0;
    for (var k = 0; k < fz.length; k++) mask |= d.words[fz[k]] || 0;
    fields.forEach(function (f, i) {
      if (d.n[f[0]].indexOf(t) >= 0) s += f[1];
      else if (mask & (1 << i)) s += f[1] / 2;
    });
    return s;
  }
  function tokScore(d, t, fields) {
    if (t.field) return fieldOk(d, t.field, t.val) ? 1 : 0;
    if (t.phrase || t.neg) return d.all.indexOf(t.val) >= 0 ? (t.phrase ? 8 : 1) : 0;
    var words = t.val.split(/[^a-z0-9]+/).filter(Boolean);
    if (!words.length) return 0;
    var total = 0;
    for (var i = 0; i < words.length; i++) { var s = termScore(d, words[i], fields, false); if (!s) return 0; total += s; }
    return total;
  }
  function evalDoc(d, groups, fields) {
    var score = 0;
    for (var g = 0; g < groups.length; g++) {
      var grp = groups[g];
      if (grp[0].neg) { if (tokScore(d, grp[0], fields) > 0) return -1; continue; }
      var best = 0;
      for (var k = 0; k < grp.length; k++) best = Math.max(best, tokScore(d, grp[k], fields));
      if (!best) return -1;
      score += best;
    }
    return score;
  }
  function hlTerms(groups) {
    var out = [];
    groups.forEach(function (grp) {
      grp.forEach(function (t) {
        if (t.neg) return;
        if (t.field) { if (/^(org|person|channel|country)$/.test(t.field)) out.push(t.rawVal); return; }
        if (t.phrase) { out.push(t.rawVal); return; }
        t.val.split(/[^a-z0-9]+/).forEach(function (w) { if (w.length >= 2) { out.push(w); fuzzy(w).forEach(function (f) { out.push(f); }); } });
      });
    });
    out = out.filter(function (x, i) { return x && out.indexOf(x) === i; }).sort(function (a, b) { return b.length - a.length; });
    if (!out.length) return null;
    return new RegExp("(" + out.map(function (x) { return x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")", "gi");
  }
  function hl(text, re) {
    text = String(text == null ? "" : text);
    if (!re) return esc(text);
    var out = "", last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(text))) {
      if (!m[0]) { re.lastIndex++; continue; }
      out += esc(text.slice(last, m.index)) + '<mark class="x-p19mark">' + esc(m[0]) + "</mark>";
      last = m.index + m[0].length;
    }
    return out + esc(text.slice(last));
  }
  function snippet(d, re, fields) {
    if (!re) return "";
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i][0], txt = String(d.raw[f] || "");
      if (!txt) continue;
      re.lastIndex = 0;
      var m = re.exec(txt);
      if (!m) continue;
      var a = Math.max(0, m.index - 60), b = Math.min(txt.length, m.index + 130);
      if (a > 0) { var sp = txt.indexOf(" ", a); if (sp > -1 && sp < m.index) a = sp + 1; }
      return '<span class="x-p19r__snip"><b>' + esc(fields[i][2]) + "</b> " + (a > 0 ? "…" : "") + hl(txt.slice(a, b), re) + (b < txt.length ? "…" : "") + "</span>";
    }
    return "";
  }

  // ---------- Facets and sorts ----------
  var PGROUPS = [
    { k: "lab", label: "Lab / org", order: LAB_ORDER },
    { k: "cat", label: "Category", name: function (v) { return CAT_LABEL[v] || v; }, order: Object.keys(CAT_LABEL) },
    { k: "country", label: "Country", collapse: 8 },
    { k: "stance", label: "Stance on AI risk", name: { yes: "Stance stated", no: "No stance stated" }, order: ["yes", "no"] },
    { k: "tier", label: "Trust tier", name: TIER_NAME, order: ["strong", "solid", "weaker", "none"] },
    { k: "vids", label: "Theater videos", name: { "0": "None", "1": "1 video", "2-3": "2–3 videos", "4+": "4 or more" }, order: ["0", "1", "2-3", "4+"] },
    { k: "left", label: "Moves", name: { yes: "Resigned or left a lab, 2025–26" } }
  ];
  var VGROUPS = [
    { k: "person", label: "Person", select: true, name: personName },
    { k: "channel", label: "Channel", select: true },
    { k: "year", label: "Year", collapse: 10, year: true, name: function (v) { return v === "unknown" ? "Unknown" : v; } },
    { k: "len", label: "Length", name: { short: "Under 10 min", mid: "10–60 min", long: "Over 60 min", unknown: "Unknown" }, order: ["short", "mid", "long", "unknown"] },
    { k: "watched", label: "Watched", name: { yes: "Watched", no: "Unwatched" }, order: ["yes", "no"] },
    { k: "tier", label: "Trust tier", name: TIER_NAME, order: ["strong", "solid", "weaker", "none"] }
  ];
  var SORTS = {
    people: [["rel", "Best match"], ["name", "Name A–Z"], ["trust", "Trust score"], ["videos", "Most videos"], ["quotes", "Most quotes"], ["new", "Newest added"]],
    theater: [["rel", "Best match"], ["new", "Newest"], ["old", "Oldest"], ["long", "Longest"], ["views", "Most viewed"], ["title", "Title A–Z"]]
  };
  function nameOf(g, v) { return typeof g.name === "function" ? g.name(v) : g.name && g.name[v] != null ? g.name[v] : v; }
  function sorter(sc, key) {
    var byName = function (a, b) { return sc === "people" ? a.d.item.name.localeCompare(b.d.item.name) : a.d.item.t.localeCompare(b.d.item.t); };
    if (sc === "people") {
      if (key === "name") return byName;
      if (key === "trust") return function (a, b) { return (scoreOf(b.d.item.slug) || 0) - (scoreOf(a.d.item.slug) || 0) || byName(a, b); };
      if (key === "videos") return function (a, b) { return (VCOUNT[b.d.item.slug] || 0) - (VCOUNT[a.d.item.slug] || 0) || byName(a, b); };
      if (key === "quotes") return function (a, b) { return arr(b.d.item.quotes).length - arr(a.d.item.quotes).length || byName(a, b); };
      if (key === "new") return function (a, b) { return String(b.d.item.added || "").localeCompare(String(a.d.item.added || "")) || byName(a, b); };
    } else {
      if (key === "title") return byName;
      if (key === "new") return function (a, b) { return (b.d.item.y || 0) - (a.d.item.y || 0) || byName(a, b); };
      if (key === "old") return function (a, b) { return (a.d.item.y || 9999) - (b.d.item.y || 9999) || byName(a, b); };
      if (key === "long") return function (a, b) { return lenOf(b.d.item) - lenOf(a.d.item) || byName(a, b); };
      if (key === "views") return function (a, b) { var ma = META[a.d.item.id] || {}, mb = META[b.d.item.id] || {}; return (mb.views || 0) - (ma.views || 0) || byName(a, b); };
    }
    return function (a, b) { return b.s - a.s || byName(a, b); };
  }

  // ---------- State ----------
  var S = { scope: "people", q: { people: "", theater: "" }, f: { people: {}, theater: {} }, sort: { people: "rel", theater: "rel" }, shown: 30, more: {} };
  var SAVED = arr(lsGet("x-p19-saved", []));

  // ---------- Drawer ----------
  var SEARCH_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>';
  var panel = doc.createElement("div");
  panel.className = "x-adv x-p19d";
  panel.id = "p19";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-labelledby", "p19-title");
  panel.innerHTML =
    '<div class="x-adv__head"><h2 id="p19-title">Advanced search</h2><button class="x-iconbtn" type="button" id="p19-close" aria-label="Close advanced search">✕</button></div>' +
    '<div class="x-adv__body">' +
    '<div class="x-seg" role="group" aria-label="Search in"><button class="x-seg__btn" type="button" data-p19scope="people" aria-pressed="true">People <span>' + DATA.length + '</span></button>' +
    '<button class="x-seg__btn" type="button" data-p19scope="theater" aria-pressed="false">Theater <span>' + VIDEOS.length + "</span></button></div>" +
    '<label class="x-adv__group"><span class="x-adv__label">Search <span class="x-p19hint">typos are fine</span></span>' +
    '<input class="x-field" type="search" id="p19-q" autocomplete="off" spellcheck="false" aria-describedby="p19-help" /></label>' +
    '<details class="x-p19help" id="p19-help"><summary>Search syntax</summary><ul>' +
    '<li><code>"exact phrase"</code> matches the words in that order</li>' +
    "<li><code>-word</code> leaves out anything containing it</li>" +
    "<li><code>a OR b</code> matches either term</li>" +
    "<li><code>org:anthropic</code> <code>cat:policy</code> <code>country:uk</code> <code>year:2025</code> or <code>year:2020-2024</code></li>" +
    "<li><code>has:photo</code> <code>has:video</code> <code>is:new</code>; in the Theater also <code>person:</code> <code>channel:</code> <code>is:watched</code></li>" +
    "</ul></details>" +
    '<div class="x-p19row"><select class="x-field x-sort" id="p19-sort" aria-label="Sort results"></select>' +
    '<button class="x-iconbtn" type="button" id="p19-save">Save search</button><button class="x-iconbtn" type="button" id="p19-link">Copy link</button></div>' +
    '<div class="x-p19saved" id="p19-saved" role="group" aria-label="Saved searches" hidden></div>' +
    '<details class="x-p19fd" id="p19-fd"><summary>Filters <span id="p19-fn"></span></summary><div class="x-p19facets" id="p19-facets"></div></details>' +
    '<p class="x-status" id="p19-status" aria-live="polite"></p>' +
    '<ol class="x-p19r" id="p19-res"></ol>' +
    '<div class="x-more"><button class="btn" type="button" id="p19-more" hidden>Show more</button></div>' +
    "</div>" +
    '<div class="x-adv__foot"><div class="links"><button class="btn" type="button" id="p19-reset">Reset</button><button class="btn x-adv__done" type="button" id="p19-done">Done</button></div></div>';
  doc.body.appendChild(panel);
  var qIn = $("p19-q"), sortSel = $("p19-sort"), facetsBox = $("p19-facets"), resBox = $("p19-res"), statusEl = $("p19-status");
  var moreBtn = $("p19-more"), savedBox = $("p19-saved"), fd = $("p19-fd"), fnEl = $("p19-fn");
  if (win.matchMedia && win.matchMedia("(min-width: 600px)").matches) fd.open = true;

  function setScope(sc) {
    S.scope = sc === "theater" ? "theater" : "people";
    [].forEach.call(panel.querySelectorAll("[data-p19scope]"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-p19scope") === S.scope ? "true" : "false"); });
    qIn.value = S.q[S.scope];
    qIn.placeholder = S.scope === "people" ? "e.g. interpretibility -openai org:anthropic" : "e.g. \"scalable oversight\" year:2025";
    sortSel.innerHTML = SORTS[S.scope].map(function (o) { return '<option value="' + o[0] + '">Sort: ' + o[1] + "</option>"; }).join("");
    sortSel.value = S.sort[S.scope];
    S.shown = 30;
  }

  var lastRe = null;
  function facetsHTML(defs, counts, sel) {
    return defs.map(function (g) {
      var c = counts[g.k], vals = Object.keys(c), chosen = sel[g.k] || [];
      chosen.forEach(function (v) { if (!(v in c)) { c[v] = 0; vals.push(v); } });
      if (!vals.length) return "";
      vals.sort(function (a, b) {
        if (g.year) return (a === "unknown") - (b === "unknown") || +b - +a;
        if (g.order) { var ia = g.order.indexOf(a), ib = g.order.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); }
        return c[b] - c[a] || String(nameOf(g, a)).localeCompare(String(nameOf(g, b)));
      });
      if (g.select) {
        if (g.k === "person") vals.sort(function (a, b) { return String(nameOf(g, a)).localeCompare(String(nameOf(g, b))); });
        return '<label class="x-adv__group"><span class="x-adv__label">' + esc(g.label) + "</span>" +
          '<select class="x-field" data-p19sel="' + g.k + '"><option value="">Any ' + esc(g.label.toLowerCase()) + " (" + vals.length + ")</option>" +
          vals.map(function (v) { return '<option value="' + esc(v) + '"' + (chosen[0] === v ? " selected" : "") + ">" + esc(nameOf(g, v)) + " (" + c[v] + ")</option>"; }).join("") + "</select></label>";
      }
      var key = S.scope + ":" + g.k, lim = g.collapse && !S.more[key] ? g.collapse : Infinity;
      var shown = vals.filter(function (v, i) { return i < lim || chosen.indexOf(v) > -1; });
      return '<fieldset class="x-adv__group"><legend>' + esc(g.label) + '</legend><div class="x-filters">' +
        shown.map(function (v) {
          var on = chosen.indexOf(v) > -1;
          return '<button class="x-filter" type="button" data-p19g="' + g.k + '" data-p19v="' + esc(v) + '" aria-pressed="' + on + '"' + (!on && !c[v] ? " disabled" : "") + ">" + esc(nameOf(g, v)) + " <span>" + c[v] + "</span></button>";
        }).join("") +
        (vals.length > shown.length || S.more[key] && g.collapse && vals.length > g.collapse ? '<button class="x-filter x-p19more" type="button" data-p19more="' + g.k + '" aria-expanded="' + !!S.more[key] + '">' + (S.more[key] ? "Fewer" : "+" + (vals.length - shown.length) + " more") + "</button>" : "") +
        "</div></fieldset>";
    }).join("");
  }

  function run() {
    var sc = S.scope, people = sc === "people", docs = people ? PDOCS : VDOCS, fields = people ? PF : VF, defs = people ? PGROUPS : VGROUPS;
    var groups = parse(S.q[sc]), sel = S.f[sc];
    if (!people) {
      var H = watchHist();
      VDOCS.forEach(function (d) { var r = H[d.item.id]; d.fv.watched = [r && (r.completed || r.percent > 0) ? "yes" : "no"]; });
    }
    var hits = [];
    docs.forEach(function (d) { var s = groups.length ? evalDoc(d, groups, fields) : 0; if (s >= 0) hits.push({ d: d, s: s }); });
    function pass(d, except) {
      for (var k in sel) {
        if (k === except || !sel[k] || !sel[k].length) continue;
        var vals = d.fv[k] || [], ok = false;
        for (var i = 0; i < sel[k].length; i++) if (vals.indexOf(sel[k][i]) > -1) { ok = true; break; }
        if (!ok) return false;
      }
      return true;
    }
    var counts = {};
    defs.forEach(function (g) {
      var c = counts[g.k] = {};
      hits.forEach(function (h) { if (pass(h.d, g.k)) (h.d.fv[g.k] || []).forEach(function (v) { c[v] = (c[v] || 0) + 1; }); });
    });
    var res = hits.filter(function (h) { return pass(h.d, null); });
    var key = S.sort[sc] === "rel" && !groups.length ? (people ? "name" : "new") : S.sort[sc];
    res.sort(sorter(sc, key));

    // facets, keeping focus on the control that was used
    var a = doc.activeElement, fk = null;
    if (a && facetsBox.contains(a)) fk = a.getAttribute("data-p19sel") ? '[data-p19sel="' + a.getAttribute("data-p19sel") + '"]' : a.getAttribute("data-p19more") ? '[data-p19more="' + a.getAttribute("data-p19more") + '"]' : a.getAttribute("data-p19g") ? '[data-p19g="' + a.getAttribute("data-p19g") + '"][data-p19v="' + String(a.getAttribute("data-p19v")).replace(/"/g, '\\"') + '"]' : null;
    facetsBox.innerHTML = facetsHTML(defs, counts, sel);
    if (fk) { var back = facetsBox.querySelector(fk); if (back) back.focus({ preventScroll: true }); }
    var nAct = 0;
    for (var k in sel) nAct += (sel[k] || []).length;
    fnEl.textContent = nAct ? "(" + nAct + " on)" : "";

    lastRe = hlTerms(groups);
    var slice = res.slice(0, S.shown);
    resBox.innerHTML = slice.length ? slice.map(function (h) { return people ? personItem(h.d) : videoItem(h.d); }).join("") :
      '<li class="x-empty">Nothing matches. Remove a filter, or try fewer words.</li>';
    moreBtn.hidden = res.length <= S.shown;
    moreBtn.textContent = "Show " + Math.min(30, res.length - S.shown) + " more";
    var total = docs.length, noun = people ? (res.length === 1 ? "person" : "people") : (res.length === 1 ? "video" : "videos");
    statusEl.textContent = res.length + " " + noun + (res.length < total ? " of " + total : "") + (S.q[sc].trim() ? " for “" + S.q[sc].trim() + "”" : "") + (nAct ? " · " + nAct + " filter" + (nAct > 1 ? "s" : "") : "");
    if (!panel.hidden) writeHash();
    if (typeof win.__p19reveal === "function") win.__p19reveal(resBox);
  }
  function personItem(d) {
    var r = d.item, sc = scoreOf(r.slug), re = lastRe;
    return '<li><button class="x-p19r__item" type="button" data-p19slug="' + esc(r.slug) + '">' +
      '<span class="x-p19r__top"><span class="x-p19r__name">' + hl(r.name, re) + "</span>" + (r.added ? '<span class="x-newb">New</span>' : "") + "</span>" +
      '<span class="x-p19r__role">' + hl(r.current_role, re) + "</span>" + snippet(d, re, PF.slice(2)) +
      '<span class="x-p19r__meta">' + esc(CAT_LABEL[r.category] || r.category) + (sc != null ? " · Trust " + sc : "") + (VCOUNT[r.slug] ? " · " + VCOUNT[r.slug] + " video" + (VCOUNT[r.slug] > 1 ? "s" : "") : "") + "</span>" +
      "</button></li>";
  }
  function videoItem(d) {
    var v = d.item, L = lenOf(v), re = lastRe, w = d.fv.watched[0] === "yes";
    return '<li class="x-p19r__v"><button class="x-p19r__item x-p19r__item--v" type="button" data-p19tv="' + esc(v.id) + '">' +
      '<img src="' + thumb(v.id) + '" alt="" loading="lazy" decoding="async" /><span class="x-p19r__txt">' +
      '<span class="x-p19r__name">' + hl(v.t, re) + "</span>" +
      '<span class="x-p19r__role">' + hl(personName(v.s), re) + " · " + hl(chanOf(v), re) + (v.y ? " · " + v.y : "") + (L ? " · " + clock(L) : "") + (w ? " · Watched" : "") + "</span>" +
      snippet(d, re, VF.slice(3)) + "</span></button>" + addBtn(v.id) + "</li>";
  }

  // ---------- Saved searches and shareable hash ----------
  function facetStr(sel) { return Object.keys(sel).map(function (k) { return (sel[k] || []).map(function (v) { return k + ":" + v; }).join("|"); }).filter(Boolean).join("|"); }
  function facetParse(s) {
    var o = {};
    String(s || "").split("|").forEach(function (kv) { var i = kv.indexOf(":"); if (i > 0) (o[kv.slice(0, i)] = o[kv.slice(0, i)] || []).push(kv.slice(i + 1)); });
    return o;
  }
  function hashStr() {
    var sc = S.scope, p = ["q=" + encodeURIComponent(S.q[sc])];
    if (sc === "theater") p.push("in=theater");
    var f = facetStr(S.f[sc]);
    if (f) p.push("f=" + encodeURIComponent(f));
    if (S.sort[sc] !== "rel") p.push("sort=" + S.sort[sc]);
    return "#" + p.join("&");
  }
  function writeHash() { try { history.replaceState(null, "", location.pathname + location.search + hashStr()); } catch (e) { /* sandboxed history */ } }
  function clearHash() { if (/^#q=/.test(location.hash)) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* skip */ } } }
  function readHash() {
    if (!/^#q=/.test(location.hash)) return false;
    var o = {};
    location.hash.slice(1).split("&").forEach(function (kv) { var i = kv.indexOf("="); if (i > 0) { try { o[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)); } catch (e) { /* bad escape */ } } });
    var sc = o["in"] === "theater" ? "theater" : "people";
    S.q[sc] = o.q || "";
    S.f[sc] = facetParse(o.f);
    if (o.sort && SORTS[sc].some(function (x) { return x[0] === o.sort; })) S.sort[sc] = o.sort;
    openD(sc);
    return true;
  }
  function saveName(sc) {
    var bits = [];
    if (S.q[sc].trim()) bits.push(S.q[sc].trim());
    var defs = sc === "people" ? PGROUPS : VGROUPS;
    defs.forEach(function (g) { (S.f[sc][g.k] || []).forEach(function (v) { bits.push(nameOf(g, v)); }); });
    var n = bits.join(" · ") || (sc === "people" ? "Everyone" : "All videos");
    return n.length > 42 ? n.slice(0, 41) + "…" : n;
  }
  function renderSaved() {
    savedBox.hidden = !SAVED.length;
    savedBox.innerHTML = SAVED.map(function (s, i) {
      return '<span class="x-p19sv"><button class="x-filter" type="button" data-p19sv="' + i + '">' + esc(s.n) + " <span>" + (s.s === "theater" ? "Theater" : "People") + "</span></button>" +
        '<button class="x-iconbtn x-p19sv__x" type="button" data-p19svx="' + i + '" aria-label="Delete saved search: ' + esc(s.n) + '">✕</button></span>';
    }).join("");
  }
  renderSaved();

  // ---------- Open / close ----------
  var openers = [], lastFocus = null;
  function openD(sc) {
    setScope(sc || S.scope);
    if (panel.hidden) {
      lastFocus = doc.activeElement;
      panel.hidden = false;
      requestAnimationFrame(function () { panel.classList.add("is-open"); });
    }
    openers.forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    run();
    qIn.focus({ preventScroll: true });
    try { qIn.setSelectionRange(qIn.value.length, qIn.value.length); } catch (e) { /* search input */ }
  }
  function closeD(restore) {
    if (panel.hidden) return;
    panel.classList.remove("is-open");
    panel.hidden = true;
    openers.forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    clearHash();
    if (restore !== false && lastFocus && doc.contains(lastFocus) && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    lastFocus = null;
  }
  function opener(host, after, sc) {
    if (!host) return;
    var b = doc.createElement("button");
    b.type = "button";
    b.className = "x-iconbtn x-p19open";
    b.setAttribute("aria-controls", "p19");
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-keyshortcuts", "/");
    b.title = "Advanced search (/)";
    b.innerHTML = SEARCH_ICON + "<span>Advanced search</span>" + '<kbd class="x-p19kbd" aria-hidden="true">/</kbd>';
    b.addEventListener("click", function () { if (!panel.hidden && S.scope === sc) closeD(); else openD(sc); });
    if (after) host.insertBefore(b, after.nextSibling); else host.appendChild(b);
    openers.push(b);
  }
  var dirWrap = doc.querySelector("#directory .x-searchwrap");
  if (dirWrap) opener(dirWrap.parentNode, dirWrap, "people");
  var tvQ = $("tv-q");
  if (tvQ) opener(tvQ.parentNode, tvQ, "theater");

  // ---------- Events ----------
  var qt = 0;
  qIn.addEventListener("input", function () { clearTimeout(qt); qt = setTimeout(function () { S.q[S.scope] = qIn.value; S.shown = 30; run(); }, 140); });
  qIn.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); var f = resBox.querySelector("button"); if (f) f.focus(); }
  });
  sortSel.addEventListener("change", function () { S.sort[S.scope] = sortSel.value; S.shown = 30; run(); });
  moreBtn.addEventListener("click", function () { S.shown += 30; run(); });
  facetsBox.addEventListener("change", function (e) {
    var s = e.target.closest("[data-p19sel]");
    if (!s) return;
    S.f[S.scope][s.getAttribute("data-p19sel")] = s.value ? [s.value] : [];
    S.shown = 30; run();
  });
  facetsBox.addEventListener("click", function (e) {
    var m = e.target.closest("[data-p19more]");
    if (m) { var key = S.scope + ":" + m.getAttribute("data-p19more"); S.more[key] = !S.more[key]; run(); return; }
    var b = e.target.closest("[data-p19g]");
    if (!b) return;
    var g = b.getAttribute("data-p19g"), v = b.getAttribute("data-p19v"), list = S.f[S.scope][g] = S.f[S.scope][g] || [];
    var i = list.indexOf(v);
    if (i > -1) list.splice(i, 1); else list.push(v);
    S.shown = 30; run();
  });
  panel.addEventListener("click", function (e) {
    var t = e.target;
    var sc = t.closest("[data-p19scope]");
    if (sc) { S.q[S.scope] = qIn.value; setScope(sc.getAttribute("data-p19scope")); run(); return; }
    if (t.closest("#p19-close") || t.closest("#p19-done")) { closeD(); return; }
    if (t.closest("#p19-reset")) { S.q[S.scope] = ""; S.f[S.scope] = {}; S.sort[S.scope] = "rel"; S.more = {}; setScope(S.scope); run(); qIn.focus(); return; }
    if (t.closest("#p19-link")) { S.q[S.scope] = qIn.value; copyText(location.href.split("#")[0] + hashStr(), "Link to this search copied"); return; }
    if (t.closest("#p19-save")) {
      S.q[S.scope] = qIn.value;
      var item = { n: saveName(S.scope), s: S.scope, q: S.q[S.scope], f: facetStr(S.f[S.scope]), o: S.sort[S.scope] };
      SAVED = SAVED.filter(function (x) { return !(x.s === item.s && x.q === item.q && x.f === item.f && x.o === item.o); });
      SAVED.unshift(item);
      SAVED = SAVED.slice(0, 20);
      lsSet("x-p19-saved", SAVED);
      renderSaved();
      toast("Saved: " + item.n);
      return;
    }
    var sv = t.closest("[data-p19sv]");
    if (sv) {
      var s = SAVED[+sv.getAttribute("data-p19sv")];
      if (!s) return;
      S.q[s.s] = s.q || ""; S.f[s.s] = facetParse(s.f); S.sort[s.s] = s.o || "rel";
      setScope(s.s); run();
      return;
    }
    var svx = t.closest("[data-p19svx]");
    if (svx) {
      var idx = +svx.getAttribute("data-p19svx");
      SAVED.splice(idx, 1);
      lsSet("x-p19-saved", SAVED);
      renderSaved();
      var next = savedBox.querySelectorAll("[data-p19svx]");
      (next[Math.min(idx, next.length - 1)] || qIn).focus();
      return;
    }
    var ps = t.closest("[data-p19slug]");
    if (ps) { closeD(false); location.hash = ps.getAttribute("data-p19slug"); return; }
    var pv = t.closest("[data-p19tv]");
    if (pv) { closeD(false); playId(pv.getAttribute("data-p19tv"), pv); }
  });
  panel.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeD(); }
  });
  win.addEventListener("keydown", function (e) {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target, tag = t && t.tagName;
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || (t && t.isContentEditable)) return;
    var tvm = doc.querySelector(".x-tvm");
    if (tvm && !tvm.hidden) return;
    e.preventDefault();
    var inTheater = false, th = $("theater");
    if (th) { var r = th.getBoundingClientRect(); inTheater = r.top < win.innerHeight / 2 && r.bottom > win.innerHeight / 2; }
    openD(inTheater ? "theater" : panel.hidden ? "people" : S.scope);
  }, true);
  win.addEventListener("hashchange", function () { readHash(); });

  function playId(id, from) {
    if (win.HarkPlayer && typeof win.HarkPlayer.open === "function") win.HarkPlayer.open(id, 0, from);
    else if (typeof win.openTheater === "function") win.openTheater(id, from);
  }

  // ---------- Queue / watch later ----------
  var QKEY = "x-p19-queue";
  var Q = arr(lsGet(QKEY, [])).filter(function (id) { return BY_ID[id]; });
  var qHosts = [];
  function inQ(id) { return Q.indexOf(id) > -1; }
  function saveQ() { lsSet(QKEY, Q); }
  function addBtn(id) {
    var on = inQ(id), v = BY_ID[id];
    return '<button class="x-p19add" type="button" data-p19q="' + esc(id) + '" aria-pressed="' + on + '" aria-label="' + (on ? "Remove from queue: " : "Add to queue: ") + esc(v ? v.t : id) + '" title="' + (on ? "In your queue" : "Add to queue") + '">' + (on ? "✓" : "+") + "</button>";
  }
  function syncQ() {
    [].forEach.call(doc.querySelectorAll("[data-p19q]"), function (b) {
      var id = b.getAttribute("data-p19q"), on = inQ(id), v = BY_ID[id];
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.textContent = on ? "✓" : "+";
      b.title = on ? "In your queue" : "Add to queue";
      b.setAttribute("aria-label", (on ? "Remove from queue: " : "Add to queue: ") + (v ? v.t : id));
    });
    [].forEach.call(doc.querySelectorAll(".x-p19qn"), function (n) { n.textContent = Q.length; });
    qHosts.forEach(function (fn) { fn(); });
  }
  function toggleQ(id) {
    var i = Q.indexOf(id);
    if (i > -1) Q.splice(i, 1); else Q.push(id);
    saveQ(); syncQ();
    toast(i > -1 ? "Removed from your queue" : "Added to your queue · " + Q.length + " up next");
  }
  function qItem(id) {
    var v = BY_ID[id], L = lenOf(v);
    return '<li class="x-p19ql__i" data-qid="' + esc(id) + '">' +
      '<button class="x-p19ql__h" type="button" data-p19qh aria-label="Reorder ' + esc(v.t) + ': drag, or press arrow up or down">⠿</button>' +
      '<img src="' + thumb(id) + '" alt="" loading="lazy" decoding="async" />' +
      '<span class="x-p19ql__t"><span>' + esc(v.t) + "</span><small>" + esc(personName(v.s)) + (L ? " · " + clock(L) : "") + "</small></span>" +
      '<button class="x-iconbtn" type="button" data-p19qa="play" data-qid="' + esc(id) + '" aria-label="Play now: ' + esc(v.t) + '">Play</button>' +
      '<button class="x-iconbtn" type="button" data-p19qa="rm" data-qid="' + esc(id) + '" aria-label="Remove from queue: ' + esc(v.t) + '">✕</button></li>';
  }
  function qList() { return '<ol class="x-p19ql">' + Q.map(qItem).join("") + "</ol>"; }
  function refocus(host, sel) { if (!host) return; var el = host.querySelector(sel); if (el) el.focus({ preventScroll: true }); }

  doc.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    var b = t.closest("[data-p19q]");
    if (b) { e.preventDefault(); e.stopPropagation(); toggleQ(b.getAttribute("data-p19q")); return; }
    var a = t.closest("[data-p19qa]");
    if (!a) return;
    var act = a.getAttribute("data-p19qa"), id = a.getAttribute("data-qid"), host = a.closest(".x-p19q, .x-p19qbar");
    if (act === "play" || act === "start") {
      var nx = act === "start" ? Q[0] : id;
      if (!nx) return;
      Q.splice(Q.indexOf(nx), 1); saveQ(); syncQ();
      playId(nx, a);
    } else if (act === "rm") {
      var i = Q.indexOf(id);
      if (i > -1) Q.splice(i, 1);
      saveQ(); syncQ();
      var rest = host ? host.querySelectorAll('[data-p19qa="rm"]') : [];
      if (rest.length) rest[Math.min(i, rest.length - 1)].focus({ preventScroll: true });
      else refocus(host, "button");
    } else if (act === "clear") {
      Q = []; saveQ(); syncQ(); toast("Queue cleared");
      refocus(host, "button");
    }
  });
  doc.addEventListener("keydown", function (e) {
    var h = e.target && e.target.closest && e.target.closest("[data-p19qh]");
    if (!h || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault(); e.stopPropagation();
    var id = h.closest("li").getAttribute("data-qid"), i = Q.indexOf(id), j = i + (e.key === "ArrowUp" ? -1 : 1);
    if (i < 0 || j < 0 || j >= Q.length) return;
    Q.splice(i, 1); Q.splice(j, 0, id); saveQ();
    var host = h.closest(".x-p19q, .x-p19qbar");
    syncQ();
    refocus(host, '[data-qid="' + id + '"] [data-p19qh]');
    toast("Moved to position " + (j + 1) + " of " + Q.length);
  }, true);
  doc.addEventListener("pointerdown", function (e) {
    var h = e.target && e.target.closest && e.target.closest("[data-p19qh]");
    if (!h || e.button > 0) return;
    var li = h.closest("li"), list = li && li.parentNode;
    if (!list) return;
    e.preventDefault();
    li.classList.add("is-drag");
    try { h.setPointerCapture(e.pointerId); } catch (x) { /* older browsers */ }
    function move(ev) {
      var items = list.children;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (it === li) continue;
        var r = it.getBoundingClientRect();
        if (ev.clientY < r.top + r.height / 2) { if (li.nextSibling !== it) list.insertBefore(li, it); return; }
      }
      if (list.lastElementChild !== li) list.appendChild(li);
    }
    function up() {
      h.removeEventListener("pointermove", move); h.removeEventListener("pointerup", up); h.removeEventListener("pointercancel", up);
      li.classList.remove("is-drag");
      var id = li.getAttribute("data-qid"), host = h.closest(".x-p19q, .x-p19qbar");
      Q = [].map.call(list.children, function (x) { return x.getAttribute("data-qid"); }).filter(function (x) { return BY_ID[x]; });
      saveQ(); syncQ();
      refocus(host, '[data-qid="' + id + '"] [data-p19qh]');
    }
    h.addEventListener("pointermove", move); h.addEventListener("pointerup", up); h.addEventListener("pointercancel", up);
  });

  // Theater: "Your queue" block under the browse tools
  (function () {
    var tools = doc.querySelector("#tv-browse .x-tools");
    if (!tools) return;
    var box = doc.createElement("div");
    box.className = "x-p19qbar";
    box.setAttribute("role", "region");
    box.setAttribute("aria-label", "Your queue");
    tools.parentNode.insertBefore(box, tools.nextSibling);
    function render() {
      box.hidden = !Q.length;
      box.innerHTML = Q.length ? '<div class="x-p19q__head"><h4>Your queue <span class="pill x-p19qn">' + Q.length + "</span></h4>" +
        '<button class="btn" type="button" data-p19qa="start">Play queue</button><button class="x-iconbtn" type="button" data-p19qa="clear">Clear</button></div>' + qList() : "";
    }
    qHosts.push(render);
    render();
  })();

  // ---------- Player power controls ----------
  (function () {
    var modal = doc.querySelector(".x-tvm"), pl = modal && modal.querySelector(".x-pl"), bar = pl && pl.querySelector(".x-pc"), HP = win.HarkPlayer;
    if (!pl || !bar || !HP || typeof HP.onTick !== "function") return;
    function pc(k) { return bar.querySelector('[data-pc="' + k + '"]'); }

    // Speed 0.25–3×
    var rate = pc("rate");
    if (rate) {
      if (!rate.querySelector('option[value="0.25"]')) rate.insertAdjacentHTML("afterbegin", '<option value="0.25">0.25×</option>');
      ["2.5", "3"].forEach(function (v) { if (!rate.querySelector('option[value="' + v + '"]')) rate.insertAdjacentHTML("beforeend", '<option value="' + v + '">' + v + "×</option>"); });
      rate.addEventListener("change", function () {
        var want = parseFloat(rate.value);
        if (want > 2) setTimeout(function () { toast(parseFloat(rate.value) !== want ? "YouTube capped this video at " + rate.value + "×" : "Speed " + want + "×, where YouTube allows it"); }, 900);
      });
    }

    var row = doc.createElement("div");
    row.className = "x-p19pc";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Section repeat, link, chapters and queue");
    row.innerHTML =
      '<span class="x-p19ab" role="group" aria-label="A–B repeat">' +
      '<button class="x-iconbtn" type="button" data-p19="a" aria-pressed="false" title="Set repeat start at the current time">A</button>' +
      '<button class="x-iconbtn" type="button" data-p19="b" aria-pressed="false" title="Set repeat end at the current time">B</button>' +
      '<span class="x-p19ab__txt" aria-live="polite">A–B repeat off</span>' +
      '<button class="x-iconbtn" type="button" data-p19="abx" hidden>Clear</button></span>' +
      '<button class="x-iconbtn" type="button" data-p19="copy">Copy link at <span class="x-p19t">00:00</span></button>' +
      '<input class="x-field x-p19chap" type="search" placeholder="Jump to chapter…" aria-label="Jump to chapter" aria-controls="p19-chaps" autocomplete="off" disabled />' +
      '<button class="x-iconbtn" type="button" data-p19="queue" aria-expanded="false" aria-controls="p19-queue">Queue <b class="x-p19qn">' + Q.length + "</b></button>";
    bar.parentNode.insertBefore(row, bar.nextSibling);
    var chapList = doc.createElement("div");
    chapList.className = "x-p19chapl";
    chapList.id = "p19-chaps";
    chapList.hidden = true;
    row.parentNode.insertBefore(chapList, row.nextSibling);
    var qPanel = doc.createElement("div");
    qPanel.className = "x-p19q";
    qPanel.id = "p19-queue";
    qPanel.hidden = true;
    chapList.parentNode.insertBefore(qPanel, chapList.nextSibling);
    function q(sel) { return row.querySelector(sel); }
    var btnA = q('[data-p19="a"]'), btnB = q('[data-p19="b"]'), abx = q('[data-p19="abx"]'), abTxt = q(".x-p19ab__txt"), tEl = q(".x-p19t"), chapIn = q(".x-p19chap"), qBtn = q('[data-p19="queue"]');

    function renderQPanel() {
      qPanel.innerHTML = '<div class="x-p19q__head"><h4>Queue</h4>' + (Q.length ? '<button class="x-iconbtn" type="button" data-p19qa="clear">Clear</button>' : "") + "</div>" +
        (Q.length ? '<p class="fineprint">The next video starts when this one ends. Drag ⠿ or use the arrow keys to reorder.</p>' + qList() : '<p class="fineprint">Your queue is empty. Tap + on any Theater card to add a video.</p>');
    }
    qHosts.push(renderQPanel);
    renderQPanel();

    // A–B repeat
    var A = null, B = null, curId = null, ended = null, chaps = [];
    function abSync() {
      abTxt.textContent = A == null ? "A–B repeat off" : B == null ? "A at " + clock(A) + ", now set B" : "Repeating " + clock(A) + "–" + clock(B);
      abx.hidden = A == null;
      btnA.setAttribute("aria-pressed", A != null ? "true" : "false");
      btnB.setAttribute("aria-pressed", B != null ? "true" : "false");
    }
    function loopOn() { var l = pc("loop"); return !!(l && l.getAttribute("aria-pressed") === "true"); }

    row.addEventListener("click", function (e) {
      var b = e.target.closest("[data-p19]");
      if (!b) return;
      var k = b.getAttribute("data-p19"), t = HP.getTime() || 0;
      if (k === "a") { A = t; if (B != null && B <= A + 0.5) B = null; abSync(); }
      else if (k === "b") {
        if (A == null) A = 0;
        if (t <= A + 0.5) { toast("Set B after A (" + clock(A) + ")"); return; }
        B = t; abSync(); HP.seek(A);
      }
      else if (k === "abx") { A = B = null; abSync(); btnA.focus(); }
      else if (k === "copy") { var s = pc("share"); if (s) s.click(); }
      else if (k === "queue") {
        qPanel.hidden = !qPanel.hidden;
        qBtn.setAttribute("aria-expanded", qPanel.hidden ? "false" : "true");
      }
    });

    // Jump to chapter
    function loadChaps(id) {
      var m = META[id];
      chaps = (m && m.chapters ? m.chapters.slice() : []).sort(function (a, b) { return a.t - b.t; });
      chapIn.value = "";
      chapList.hidden = true;
      chapIn.disabled = !chaps.length;
      chapIn.placeholder = chaps.length ? "Jump to chapter (" + chaps.length + ")…" : "No chapters for this video";
    }
    function chapMatches(text) {
      var words = norm(text).split(/[^a-z0-9]+/).filter(Boolean);
      if (!words.length) return chaps.slice();
      return chaps.filter(function (c) {
        var n = norm(c.label), ws = n.split(/[^a-z0-9]+/);
        return words.every(function (w) {
          return n.indexOf(w) > -1 || (w.length >= 4 && ws.some(function (x) { return lev(w, x, 1) <= 1 || (x.length > w.length && lev(w, x.slice(0, w.length), 1) <= 1); }));
        });
      });
    }
    function renderChaps() {
      if (!chaps.length) { chapList.hidden = true; return; }
      var list = chapMatches(chapIn.value), re = chapIn.value.trim() ? hlTerms(parse(chapIn.value.replace(/[":-]/g, " "))) : null;
      chapList.hidden = false;
      chapList.innerHTML = list.length ? list.map(function (c) {
        return '<button class="x-p19chapl__b" type="button" data-p19t="' + c.t + '"><span>' + clock(c.t) + "</span> " + hl(c.label, re) + "</button>";
      }).join("") : '<p class="fineprint">No chapter matches “' + esc(chapIn.value.trim()) + "”.</p>";
    }
    function jump(t, label) { HP.seek(+t || 0); chapList.hidden = true; chapIn.value = ""; toast("Jumped to " + clock(t) + (label ? " · " + label : "")); }
    chapIn.addEventListener("input", renderChaps);
    chapIn.addEventListener("focus", renderChaps);
    chapIn.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); var f = chapMatches(chapIn.value)[0]; if (f) jump(f.t, f.label); }
      else if (e.key === "ArrowDown") { var b = chapList.querySelector("button"); if (b) { e.preventDefault(); b.focus(); } }
    });
    chapList.addEventListener("keydown", function (e) {
      var b = e.target.closest("button");
      if (!b || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
      e.preventDefault();
      var n = e.key === "ArrowDown" ? b.nextElementSibling : b.previousElementSibling;
      if (n) n.focus(); else if (e.key === "ArrowUp") chapIn.focus();
    });
    chapList.addEventListener("click", function (e) {
      var b = e.target.closest("[data-p19t]");
      if (!b) return;
      var c = chaps.filter(function (x) { return String(x.t) === b.getAttribute("data-p19t"); })[0];
      jump(b.getAttribute("data-p19t"), c && c.label);
      chapIn.focus({ preventScroll: true });
      chapList.hidden = true;
    });
    pl.addEventListener("focusout", function () {
      setTimeout(function () { var a = doc.activeElement; if (a !== chapIn && !chapList.contains(a)) chapList.hidden = true; }, 120);
    });

    // Ticks: A–B loop, queue autoplay, current time
    HP.onTick(function (t, d, id) {
      if (id !== curId) { curId = id; A = B = null; ended = null; abSync(); loadChaps(id); }
      tEl.textContent = clock(t);
      if (A != null && B != null && t >= B) { HP.seek(A); return; }
      if (ended === id && d && t < d - 3) ended = null;
      if (d > 5 && t >= d - 1 && ended !== id && Q.length && !loopOn() && A == null) {
        ended = id;
        var nx = Q.filter(function (x) { return x !== id; })[0];
        if (!nx) return;
        Q.splice(Q.indexOf(nx), 1); saveQ(); syncQ();
        toast("Up next from your queue: " + BY_ID[nx].t);
        setTimeout(function () { playId(nx); }, 800);
      }
    });

    // Double-tap zones: 10s back / forward, single tap plays or pauses
    var stage = pl.querySelector(".x-vmodal__stage");
    var zones = doc.createElement("div");
    zones.className = "x-p19z";
    zones.setAttribute("aria-hidden", "true");
    zones.innerHTML = '<div class="x-p19z__s x-p19z__s--l" data-z="back"><span class="x-p19z__fb">−10s</span></div><div class="x-p19z__s x-p19z__s--r" data-z="fwd"><span class="x-p19z__fb">+10s</span></div>';
    pl.appendChild(zones);
    function size() { if (stage && stage.parentNode === pl) zones.style.height = stage.offsetHeight + "px"; }
    if (win.ResizeObserver && stage) new ResizeObserver(size).observe(stage);
    size();
    var last = { t: 0, z: "" }, single = 0;
    zones.addEventListener("pointerup", function (e) {
      var z = e.target.closest("[data-z]");
      if (!z || e.button > 0) return;
      var k = z.getAttribute("data-z"), now = Date.now();
      if (last.z === k && now - last.t < 320) {
        clearTimeout(single); last.t = 0;
        var b = pc(k); if (b) b.click();
        z.classList.remove("is-hit"); void z.offsetWidth; z.classList.add("is-hit");
        setTimeout(function () { z.classList.remove("is-hit"); }, 650);
        return;
      }
      last = { t: now, z: k };
      clearTimeout(single);
      single = setTimeout(function () { var p = pc("play"); if (p) p.click(); }, 330);
    });
  })();

  // ---------- Theater cards: "+" queue button and watched-% ring ----------
  function cardId(c) { return c.getAttribute("data-tv") || c.getAttribute("data-play") || ""; }
  function decorateCards(scope) {
    var sel = "#tv-grid .x-vcard[data-tv], .x-wlwrap > .x-vcard[data-play]";
    var els = scope.querySelectorAll ? [].slice.call(scope.querySelectorAll(sel)) : [];
    if (scope.matches && scope.matches(sel)) els.push(scope);
    els.forEach(function (card) {
      if (card.hasAttribute("data-p19c")) return;
      var id = cardId(card);
      if (!BY_ID[id]) return;
      card.setAttribute("data-p19c", "");
      var host = card.parentNode;
      if (!host.classList.contains("x-wlwrap")) {
        var w = doc.createElement("div");
        w.className = "x-p19w";
        host.insertBefore(w, card);
        w.appendChild(card);
        host = w;
      }
      host.insertAdjacentHTML("beforeend", addBtn(id));
    });
  }
  function rings() {
    var H = watchHist();
    [].forEach.call(doc.querySelectorAll(".x-vcard[data-tv], .x-vcard[data-play]"), function (card) {
      var media = card.querySelector(".x-vcard__media");
      if (!media) return;
      var r = H[cardId(card)], p = r && !r.completed ? Math.round(r.percent || 0) : 0;
      var el = media.querySelector(".x-p19ring");
      if (!(p > 0 && p < 100)) { if (el) el.parentNode.removeChild(el); return; }
      if (!el) { el = doc.createElement("span"); el.className = "x-p19ring"; el.setAttribute("aria-hidden", "true"); el.innerHTML = "<b></b>"; media.appendChild(el); }
      if (el.getAttribute("data-p") !== String(p)) { el.setAttribute("data-p", String(p)); el.style.setProperty("--x19p", p + "%"); el.firstChild.textContent = p + "%"; }
    });
  }

  // ---------- Motion: stagger on newly rendered cards, magnetic researcher cards ----------
  var seen = {};
  function keyOf(el) { return el.getAttribute("data-slug") || el.getAttribute("data-tv") || el.getAttribute("data-p19slug") || el.getAttribute("data-p19tv") || ""; }
  function stagger(el, i) {
    el.style.setProperty("--x19d", Math.min(i, 10) * 45 + "ms");
    el.classList.add("x-p19in");
    var done = function () { el.classList.remove("x-p19in"); el.style.removeProperty("--x19d"); };
    el.addEventListener("animationend", function h(ev) { if (ev.target === el) { el.removeEventListener("animationend", h); done(); } });
    setTimeout(done, 1500);
  }
  function revealBox(name, box, sel) {
    if (!box) return;
    var prev = seen[name], next = {}, n = 0, ok = motionOk();
    [].forEach.call(box.querySelectorAll(sel), function (el) {
      var k = keyOf(el);
      next[k] = 1;
      if (!prev || prev[k] || !ok || el.classList.contains("x-rv") || (el.parentNode && el.parentNode.classList.contains("x-rv"))) return;
      var b = el.getBoundingClientRect();
      if (b.bottom < 0 || b.top > win.innerHeight) return;
      stagger(el, n++);
    });
    seen[name] = next;
  }
  function revealAll() {
    revealBox("grid", $("grid"), ".x-card[data-slug]");
    revealBox("tv", $("tv-grid"), ".x-vcard[data-tv]");
  }
  win.__p19reveal = function (box) { revealBox("res", box, "[data-p19slug], [data-p19tv]"); };

  (function () {
    var grid = $("grid");
    if (!grid) return;
    var cur = null, x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    function step() {
      raf = 0;
      if (!cur) return;
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      if (Math.abs(tx - x) < 0.05 && Math.abs(ty - y) < 0.05) { x = tx; y = ty; }
      cur.style.translate = x.toFixed(2) + "px " + y.toFixed(2) + "px";
      if (x !== tx || y !== ty) raf = requestAnimationFrame(step);
    }
    function release(el) {
      if (!el) return;
      el.classList.add("x-p19mag-out");
      el.style.removeProperty("translate");
      setTimeout(function () { el.classList.remove("x-p19mag-out"); }, 360);
    }
    grid.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || !motionOk() || grid.classList.contains("x-grid--list")) { if (cur) { release(cur); cur = null; } return; }
      var el = e.target.closest(".x-card[data-slug]");
      if (el !== cur) { release(cur); cur = el; x = y = 0; }
      if (!el) return;
      var r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 10;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 8;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    grid.addEventListener("pointerleave", function () { release(cur); cur = null; });
  })();

  // ---------- Watch the page for new cards ----------
  var pending = [], pend = 0;
  function flush() {
    pend = 0;
    var list = pending;
    pending = [];
    list.forEach(function (n) { if (n.isConnected) decorateCards(n); });
    rings();
    revealAll();
  }
  new MutationObserver(function (recs) {
    for (var i = 0; i < recs.length; i++) {
      var add = recs[i].addedNodes;
      for (var j = 0; j < add.length; j++) {
        var n = add[j];
        if (n.nodeType !== 1 || n.classList.contains("x-p19ring") || n.classList.contains("x-p19add") || n.classList.contains("x-toast") || panel.contains(n)) continue;
        pending.push(n);
      }
    }
    if (pending.length && !pend) pend = requestAnimationFrame(flush);
  }).observe(doc.body, { childList: true, subtree: true });
  decorateCards(doc.body);
  rings();
  revealAll();
  setInterval(function () { if (!doc.hidden) rings(); }, 5000);
  doc.addEventListener("visibilitychange", function () { if (!doc.hidden) rings(); });

  setTimeout(readHash, 0);
})();
