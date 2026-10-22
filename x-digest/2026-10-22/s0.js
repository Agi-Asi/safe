
      (function () {
        var D = window.DIGEST || { news: [], foryou: [], following: [] };
        var NOW = window.DIGEST_NOW||Math.floor(Date.now()/1000); /* Tue 20 Oct 2026, 6:20 PM IST */
        var PAGE = 30;
        var CATS = ["AI Models & Labs", "AI Tools & Agents", "AI Video, Art & Music", "Research & Safety", "Money & Startups", "Sports", "Politics & World", "Everything Else"];
        var TIER_ORDER = { must: 0, worth: 1, skim: 2 };
        var $ = function (s, r) { return (r || document).querySelector(s); };
        var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

        function feedState() { return { tier: "mw", cats: [], media: false, q: "", sort: "imp", shown: PAGE }; }
        var S = { tab: "brief", focus: false, done: {}, feeds: { foryou: feedState(), following: feedState() } };

        /* Lookup by id, so news posts pick up their tier and category when a feed has them. */
        var byId = {};
        D.foryou.concat(D.following).forEach(function (p) { if (!byId[p.id]) byId[p.id] = p; });
        function enrich(p) { var f = byId[p.id]; return f ? f : p; }

        var mustAll = [];
        (function () {
          var seen = {};
          D.foryou.concat(D.following).forEach(function (p) {
            if (p.tier === "must" && !seen[p.id]) { seen[p.id] = 1; mustAll.push(p); }
          });
          mustAll.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
        })();
        var TOP8 = mustAll.slice(0, 8);

        $("#n-news").textContent = D.news.length;
        $("#n-foryou").textContent = D.foryou.length;
        $("#n-following").textContent = D.following.length;
        $("#n-must").textContent = mustAll.length;

        /* ---------- formatting ---------- */
        function esc(s) {
          return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
          });
        }
        function fmt(n) {
          n = +n || 0;
          if (n < 1000) return String(n);
          if (n < 1e6) { var k = n / 1e3; return (k < 100 ? k.toFixed(1).replace(/\.0$/, "") : Math.round(k)) + "K"; }
          var m = n / 1e6; return (m < 100 ? m.toFixed(1).replace(/\.0$/, "") : Math.round(m)) + "M";
        }
        var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        function rel(ts) {
          var d = NOW - ts;
          if (d < 60) return "now";
          if (d < 3600) return Math.floor(d / 60) + "m";
          if (d < 86400) return Math.floor(d / 3600) + "h";
          if (d < 86400 * 7) return Math.floor(d / 86400) + "d";
          var t = new Date(ts * 1000);
          return MONTHS[t.getUTCMonth()] + " " + t.getUTCDate() + (t.getUTCFullYear() !== 2026 ? ", " + t.getUTCFullYear() : "");
        }
        function fullDate(ts) { return new Date(ts * 1000).toUTCString().replace(":00 GMT", " UTC"); }
        function dur(s) { s = Math.round(s || 0); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
        function linkify(text) {
          var re = /(https?:\/\/[^\s]+)|(@[A-Za-z0-9_]{1,15})/g, out = "", last = 0, m;
          text = String(text || "");
          while ((m = re.exec(text))) {
            out += esc(text.slice(last, m.index));
            if (m[1]) {
              var url = m[1].replace(/[.,!?)\]]+$/, ""), tail = m[1].slice(url.length);
              var shown = url.replace(/^https?:\/\/(www\.)?/, "");
              if (shown.length > 42) shown = shown.slice(0, 40) + "…";
              out += '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(shown) + "</a>" + esc(tail);
            } else {
              out += '<a href="https://x.com/' + esc(m[2].slice(1)) + '" target="_blank" rel="noopener">' + esc(m[2]) + "</a>";
            }
            last = m.index + m[0].length;
          }
          return out + esc(text.slice(last));
        }

        /* ---------- pieces of a post ---------- */
        function tierBadge(t) {
          if (t === "must") return '<span class="chip chip--solid">Must-read</span>';
          if (t === "worth") return '<span class="chip">Worth it</span>';
          if (t === "skim") return '<span class="pill">Skim</span>';
          return "";
        }
        function avatar(p, size) {
          return '<img class="x-avatar" src="' + esc(p.avatar) + '" alt="" width="' + size + '" height="' + size + '" loading="lazy" referrerpolicy="no-referrer" />';
        }
        function media(list) {
          if (!list || !list.length) return "";
          var items = list.map(function (m, i) {
            var dl = esc(m.hd || m.url);
            if (m.type === "photo") {
              return '<figure><a class="x-media__frame" href="' + esc(m.url) + '" target="_blank" rel="noopener" aria-label="Open photo ' + (i + 1) + ' full size">' +
                '<img src="' + esc(m.url) + '" alt="Photo ' + (i + 1) + ' attached to the post" loading="lazy" referrerpolicy="no-referrer" /></a>' +
                '<a class="btn" href="' + dl + '" download target="_blank" rel="noopener">Download</a></figure>';
            }
            var label = m.type === "gif" ? "GIF" : m.dur ? dur(m.dur) : "Video";
            return '<figure><div class="x-media__frame"><video controls preload="none" playsinline referrerpolicy="no-referrer"' +
              (m.type === "gif" ? " loop muted" : "") + ' poster="' + esc(m.thumb || "") + '" src="' + esc(m.url) + '"></video>' +
              '<span class="x-dur">' + label + "</span></div>" +
              '<a class="btn" href="' + dl + '" download target="_blank" rel="noopener">Download</a></figure>';
          }).join("");
          return '<div class="x-media' + (list.length > 1 ? " x-media--multi" : "") + '">' + items + "</div>";
        }
        function quote(q) {
          if (!q) return "";
          return '<div class="x-quote"><div class="x-post__head">' + avatar(q, 24) +
            '<div class="x-who"><b>' + esc(q.name) + "</b><span>@" + esc(q.handle) + " · " + rel(q.ts) + "</span></div></div>" +
            (q.text ? '<p class="x-text">' + linkify(q.text) + "</p>" : "") + media(q.media) +
            '<a class="link" href="' + esc(q.url) + '" target="_blank" rel="noopener">Open quoted post on X</a></div>';
        }
        function threadHTML(list) {
          return list.map(function (t) {
            return '<div class="x-tpost">' + avatar(t, 40) + '<div class="x-tpost__body"><div class="x-who"><b>' + esc(t.name) +
              "</b><span>@" + esc(t.handle) + " · " + rel(t.ts) + "</span></div>" +
              (t.text ? '<p class="x-text">' + linkify(t.text) + "</p>" : "") + media(t.media) + quote(t.quote) + "</div></div>";
          }).join("");
        }
        function post(p) {
          p = enrich(p);
          var id = esc(p.id);
          if (S.done[p.id]) {
            return '<div class="x-strip" data-pid="' + id + '"><span><b>' + esc(p.name) + "</b> · " +
              esc(String(p.text || "").replace(/\s+/g, " ").slice(0, 120)) + '</span><button class="btn" type="button" data-act="undo" data-id="' + id + '">Undo</button></div>';
          }
          var th = p.thread || [];
          return '<article class="x-post" data-pid="' + id + '">' +
            (th.length ? '<div class="x-thread" hidden>' + threadHTML(th) + "</div>" : "") +
            '<div class="x-post__head">' + avatar(p, 40) +
            '<div class="x-who"><b>' + esc(p.name) + '</b><span>@' + esc(p.handle) + ' · <time datetime="' + new Date(p.ts * 1000).toISOString() + '" title="' + esc(fullDate(p.ts)) + '">' + rel(p.ts) + "</time></span></div>" +
            '<div class="x-tags">' + (p.cat ? '<span class="pill">' + esc(p.cat) + "</span>" : "") + tierBadge(p.tier) + "</div></div>" +
            (p.text ? '<p class="x-text">' + linkify(p.text) + "</p>" : "") +
            media(p.media) + quote(p.quote) +
            '<p class="x-stats"><span><b>' + fmt(p.likes) + "</b> likes</span><span><b>" + fmt(p.rts) + "</b> reposts</span><span><b>" +
            fmt(p.replies) + "</b> replies</span><span><b>" + fmt(p.views) + "</b> views</span></p>" +
            '<div class="x-actions"><button class="btn" type="button" data-act="done" data-id="' + id + '">Done</button>' +
            (th.length ? '<button class="btn" type="button" data-act="thread" aria-expanded="false" data-n="' + th.length + '">Show thread (' + th.length + ")</button>" : "") +
            '<a class="btn" href="' + esc(p.url) + '" target="_blank" rel="noopener">Open on X</a></div></article>';
        }
        var END = '<div class="x-end"><p>That\'s everything worth your time. Go build something.</p><p>Close the tab. The feed will still be there tomorrow.</p></div>';

        /* ---------- lists ---------- */
        function feedItems(name, ignoreCats) {
          var f = S.feeds[name], tier = S.focus ? "must" : f.tier, q = f.q.trim().toLowerCase();
          var list = D[name].filter(function (p) {
            if (tier === "must" && p.tier !== "must") return false;
            if (tier === "mw" && p.tier === "skim") return false;
            if (f.media && !(p.media && p.media.length) && !(p.quote && p.quote.media && p.quote.media.length)) return false;
            if (!ignoreCats && f.cats.length && f.cats.indexOf(p.cat) < 0) return false;
            if (q) {
              var hay = (p.text + " " + p.name + " " + p.handle + " " + (p.quote ? p.quote.text + " " + p.quote.name : "")).toLowerCase();
              if (hay.indexOf(q) < 0) return false;
            }
            return true;
          });
          var key = f.sort;
          list.sort(function (a, b) {
            if (key === "new") return b.ts - a.ts;
            if (key === "liked") return b.likes - a.likes;
            return (b.score || 0) - (a.score || 0);
          });
          return list;
        }
        function newsPosts(s) {
          return s.posts.map(enrich).filter(function (p) { return !S.focus || p.tier === "must"; });
        }
        function currentItems() {
          if (S.tab === "brief") return TOP8;
          if (S.tab === "news") return D.news.reduce(function (a, s) { return a.concat(newsPosts(s)); }, []);
          return feedItems(S.tab);
        }
        function progress() {
          var items = currentItems(), seen = {}, total = 0, done = 0;
          items.forEach(function (p) { if (seen[p.id]) return; seen[p.id] = 1; total++; if (S.done[p.id]) done++; });
          $("#prog-text").innerHTML = "<b>" + done + "</b> of " + total + " read" + (S.focus ? " · Focus mode" : "");
          $("#prog-fill").style.width = total ? (done / total) * 100 + "%" : "0";
        }

        function renderBrief() {
          $("#list-brief").innerHTML = TOP8.map(post).join("") + END;
        }
        function renderNews() {
          $("#list-news").innerHTML = D.news.map(function (s) {
            var posts = newsPosts(s), hidden = s.posts.length - posts.length;
            return '<article class="x-story"><div><h2>' + esc(s.headline) + '</h2><p class="x-story__meta">' + esc(s.meta) + "</p></div>" +
              '<p class="x-story__sum">' + esc(s.summary) + "</p>" +
              '<div class="links"><a class="btn" href="' + esc(s.url) + '" target="_blank" rel="noopener">Open on X</a></div>' +
              '<div class="x-story__posts">' + posts.map(post).join("") +
              (hidden ? '<p class="x-empty">' + hidden + " post" + (hidden > 1 ? "s" : "") + " hidden by Focus mode.</p>" : "") + "</div></article>";
          }).join("") + END;
        }
        function renderFeed(name) {
          var f = S.feeds[name], list = feedItems(name), shown = list.slice(0, f.shown), html = shown.map(post).join("");
          if (!list.length) html = '<p class="x-empty">Nothing matches these filters. Loosen one, or take it as a sign you\'re done.</p>';
          if (list.length > f.shown) html += '<button class="btn x-more" type="button" data-act="more" data-feed="' + name + '">Show ' + Math.min(PAGE, list.length - f.shown) + " more</button>";
          else html += END;
          $("#list-" + name).innerHTML = html;
          syncFilters(name, list.length);
        }

        /* ---------- filters ---------- */
        function buildFilters(name) {
          var box = $('.x-filters[data-feed="' + name + '"]');
          box.innerHTML =
            '<div class="x-filters__row"><span class="x-filters__label" id="tl-' + name + '">Show</span><div class="x-seg" role="group" aria-labelledby="tl-' + name + '">' +
            '<button type="button" data-f="tier" data-v="must">Must-read</button><button type="button" data-f="tier" data-v="mw">Must+Worth</button><button type="button" data-f="tier" data-v="all">Everything</button></div>' +
            '<button class="x-toggle" type="button" data-f="media">Has media</button>' +
            '<label class="x-filters__label" for="sort-' + name + '">Sort</label><select class="x-select" id="sort-' + name + '" data-f="sort"><option value="imp">Importance</option><option value="new">Newest</option><option value="liked">Most liked</option></select></div>' +
            '<div class="x-filters__row"><span class="x-filters__label">Categories</span>' +
            CATS.map(function (c) { return '<button class="x-toggle" type="button" data-f="cat" data-v="' + esc(c) + '">' + esc(c) + " <small></small></button>"; }).join("") + "</div>" +
            '<div class="x-filters__row"><input class="x-input" type="search" data-f="q" placeholder="Search posts, names, handles" aria-label="Search ' + (name === "foryou" ? "For You" : "Following") + '" />' +
            '<span class="x-count" aria-live="polite"></span></div>';
        }
        function syncFilters(name, n) {
          var f = S.feeds[name], box = $('.x-filters[data-feed="' + name + '"]'), base = feedItems(name, true), counts = {};
          base.forEach(function (p) { counts[p.cat] = (counts[p.cat] || 0) + 1; });
          $$('[data-f="tier"]', box).forEach(function (b) {
            b.setAttribute("aria-pressed", String((S.focus ? "must" : f.tier) === b.dataset.v));
            b.disabled = S.focus;
          });
          $('[data-f="media"]', box).setAttribute("aria-pressed", String(f.media));
          $$('[data-f="cat"]', box).forEach(function (b) {
            var c = b.dataset.v, on = f.cats.indexOf(c) >= 0;
            b.setAttribute("aria-pressed", String(on));
            b.querySelector("small").textContent = counts[c] || 0;
            b.disabled = !on && !counts[c];
          });
          $(".x-count", box).textContent = n + " post" + (n === 1 ? "" : "s") + (S.focus ? " · Focus mode shows must-reads only" : "");
        }
        ["foryou", "following"].forEach(function (name) {
          buildFilters(name);
          var box = $('.x-filters[data-feed="' + name + '"]'), f = S.feeds[name];
          box.addEventListener("click", function (e) {
            var b = e.target.closest("button[data-f]");
            if (!b || b.disabled) return;
            if (b.dataset.f === "tier") f.tier = b.dataset.v;
            else if (b.dataset.f === "media") f.media = !f.media;
            else if (b.dataset.f === "cat") {
              var i = f.cats.indexOf(b.dataset.v);
              if (i >= 0) f.cats.splice(i, 1); else f.cats.push(b.dataset.v);
            }
            f.shown = PAGE; renderFeed(name); progress();
          });
          $('[data-f="sort"]', box).addEventListener("change", function (e) { f.sort = e.target.value; f.shown = PAGE; renderFeed(name); progress(); });
          var t;
          $('[data-f="q"]', box).addEventListener("input", function (e) {
            clearTimeout(t);
            t = setTimeout(function () { f.q = e.target.value; f.shown = PAGE; renderFeed(name); progress(); }, 180);
          });
        });

        /* ---------- tabs, focus, actions ---------- */
        var rendered = {};
        function render(tab, force) {
          if (rendered[tab] && !force) return;
          rendered[tab] = true;
          if (tab === "brief") renderBrief();
          else if (tab === "news") renderNews();
          else renderFeed(tab);
        }
        var tabs = $$(".x-tabs [role=tab]");
        function show(tab, focusTab) {
          S.tab = tab;
          tabs.forEach(function (b) {
            var on = b.dataset.tab === tab;
            b.setAttribute("aria-selected", String(on));
            b.tabIndex = on ? 0 : -1;
            if (on && focusTab) b.focus();
          });
          $$(".x-view").forEach(function (v) { v.hidden = v.id !== "view-" + tab; });
          render(tab);
          progress();
          window.scrollTo({ top: 0, behavior: "auto" });
        }
        tabs.forEach(function (b, i) {
          b.tabIndex = i === 0 ? 0 : -1;
          b.addEventListener("click", function () { show(b.dataset.tab); });
          b.addEventListener("keydown", function (e) {
            var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
            if (!d) return;
            e.preventDefault();
            show(tabs[(i + d + tabs.length) % tabs.length].dataset.tab, true);
          });
        });
        $("#focus").addEventListener("click", function () {
          S.focus = !S.focus;
          this.setAttribute("aria-checked", String(S.focus));
          S.feeds.foryou.shown = S.feeds.following.shown = PAGE;
          rendered = {};
          render(S.tab);
          progress();
        });

        function refreshPost(id) {
          var p = byId[id] || TOP8.filter(function (x) { return x.id === id; })[0];
          if (!p) D.news.forEach(function (s) { s.posts.forEach(function (x) { if (x.id === id) p = x; }); });
          if (!p) return;
          $$('[data-pid="' + id + '"]').forEach(function (el) {
            var tmp = document.createElement("div");
            tmp.innerHTML = post(p);
            el.replaceWith(tmp.firstChild);
          });
        }
        $(".main").addEventListener("click", function (e) {
          var b = e.target.closest("[data-act]");
          if (!b) return;
          var act = b.dataset.act;
          if (act === "done" || act === "undo") {
            var id = b.dataset.id;
            if (act === "done") S.done[id] = true; else delete S.done[id];
            refreshPost(id);
            progress();
            var again = $('[data-pid="' + id + '"] [data-act]');
            if (again) again.focus({ preventScroll: true });
          } else if (act === "thread") {
            var th = b.closest(".x-post").querySelector(".x-thread"), open = th.hidden;
            th.hidden = !open;
            b.setAttribute("aria-expanded", String(open));
            b.textContent = (open ? "Hide thread (" : "Show thread (") + b.dataset.n + ")";
          } else if (act === "more") {
            var name = b.dataset.feed;
            S.feeds[name].shown += PAGE;
            renderFeed(name);
          }
        });

        /* Hide images that fail to load. */
        document.addEventListener("error", function (e) {
          var el = e.target;
          if (!el || el.tagName !== "IMG") return;
          if (el.classList.contains("x-avatar")) { el.style.visibility = "hidden"; return; }
          var fig = el.closest(".x-media figure");
          if (fig) {
            fig.style.display = "none";
            var grid = fig.parentNode;
            if (grid && !$$("figure", grid).some(function (f) { return f.style.display !== "none"; })) grid.style.display = "none";
          }
        }, true);

        show("brief");
      })();
    