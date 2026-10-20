
      var VIDEOS = [
        { id: "B1ZQHAzAS6g", t: "What 12 AI Insiders Want You to Know — in 4 Minutes", c: "Palisade Research", g: "Featured" },
        { id: "nYiD6r4RvV8", t: "He Led Safety Teams at OpenAI and Google DeepMind. He Puts Our Odds at a Coin Flip.", c: "Geoffrey Irving", g: "Insiders" },
        { id: "J38ot52b2-E", t: "DeepMind Researcher: AI's Makers Think It Could End Humanity", c: "Neel Nanda", g: "Insiders" },
        { id: "4dbeEN12S-U", t: "Ex-OpenAI Researcher: AI Smarter Than All of Us Is 0–4 Years Away", c: "Daniel Kokotajlo", g: "Insiders" },
        { id: "pokJbP5_55U", t: "I Quit Google's AI Lab. Here's What the Public Should Know", c: "Ex-Google DeepMind", g: "Insiders" },
        { id: "7_eu2Qbv6bs", t: "Google DeepMind Safety Researcher: \"This Is Not a Drill\"", c: "Google DeepMind", g: "Insiders" },
        { id: "32wdCuXeqvI", t: "Google DeepMind AI Researcher: I'm not saying that extinction is inevitable", c: "Google DeepMind", g: "Insiders" },
        { id: "tF-WiZiiH4g", t: "DeepMind Researcher: The better AI will be able to improve itself even more and even faster", c: "Google DeepMind", g: "Insiders" },
        { id: "1S_Ay87dEy0", t: "Ex-Google DeepMind insider: The Industrial Revolution is not the right analogy", c: "Ex-Google DeepMind", g: "Insiders" },
        { id: "WKO97T1ELVY", t: "Ex-OpenAI Researcher: \"Significant Chance\" AI Causes Human Extinction", c: "Ex-OpenAI", g: "Insiders" },
        { id: "LT7UO76z_mE", t: "An Ex-OpenAI Engineer was asked \"How soon?\"", c: "Ex-OpenAI", g: "Insiders" },
        { id: "-K4tpDB7jxg", t: "He works at OpenAI: his job is to stop ChatGPT from helping make a Bioweapon", c: "OpenAI", g: "Insiders" },
        { id: "HmocBOMAkVw", t: "OpenAI Shut Down Its Rogue AI Agents. Days Later, They Were Back", c: "Palisade Research", g: "Insiders" },
        { id: "QGY3RsARa9k", t: "AI forecaster Daniel Kokotajlo keeps being right about AI. What does he think we need to do?", c: "Palisade Podcast", g: "Insiders" },
        { id: "HU4xomDEpuw", t: "AI Hacking Incidents with Tim Hua", c: "Palisade Podcast", g: "Insiders" },
        { id: "A3HjNYDIhGU", t: "AI is a massive problem, here's why.", c: "SciencePetr + Palisade", g: "Insiders" },

        { id: "5KVDDfAkRgc", t: "We're Not Ready for Superintelligence", c: "AI In Context", g: "Start here" },
        { id: "Nl7-bRFSZBs", t: "This best-selling book is freaking out national security advisors", c: "AI In Context", g: "Start here" },
        { id: "90C3XVjUMqE", t: "We've Lost Control of AI", c: "SciShow", g: "Start here" },
        { id: "Qg5QXY_qZuI", t: "Taking AI Doom Seriously For 62 Minutes", c: "Primer", g: "Start here" },
        { id: "R9OHn5ZF4Uo", t: "AI Doesn't Know Anything. It Just Passes Tests.", c: "CGP Grey", g: "Start here" },
        { id: "RIJJB5B2lHU", t: "A realistic path from rogue AI agents to human extinction", c: "80,000 Hours", g: "Start here" },
        { id: "ZeecOKBus3Q", t: "Why Would AI Want to do Bad Things? Instrumental Convergence", c: "Robert Miles", g: "Misalignment" },
        { id: "hEUO6pjwFOo", t: "Intelligence and Stupidity: The Orthogonality Thesis", c: "Robert Miles", g: "Misalignment" },
        { id: "hzlR0R91lZA", t: "Do they know that we know that they know?", c: "Rational Animations", g: "Misalignment" },
        { id: "gpBqw2sTD08", t: "The Hidden Complexity of Wishes", c: "Rational Animations", g: "Misalignment" },
        { id: "11vWK5cbxmI", t: "Why Smart AIs Cheat", c: "Robert Miles", g: "Misalignment" },
        { id: "KrM5c0vp8s0", t: "Teaching an AI incorrect math turned it evil – Owain Evans", c: "80,000 Hours", g: "Misalignment" },
        { id: "U9xygNoXnZQ", t: "The Man Who Proved We Can't Control AI", c: "Roman Yampolskiy", g: "Misalignment" },
        { id: "XnnjvIqf4fU", t: "Keeping AI in a Box", c: "Robert Miles", g: "AI control" },
        { id: "40pRi5wMBwA", t: "Full AI Escape Seems Possible", c: "Robert Miles", g: "AI control" },
        { id: "BwBLu6t9rdA", t: "AI agents keep escaping containment", c: "Dr Waku", g: "AI control" },
        { id: "_rtp1XzaP6Q", t: "OpenAI Security: Controlling Models is Now 'Hell'", c: "AI Explained", g: "AI control" },
        { id: "wdnVeYx_fOA", t: "Coin Toss for the Future: Ryan Greenblatt", c: "Sam Harris", g: "AI control" },
        { id: "-RXD4bTuFTo", t: "Ryan Greenblatt – What happens once AI can automate AI research?", c: "Dwarkesh Patel", g: "AI control" },
        { id: "xOi5nDH0lu0", t: "The Hugging Face cyberattack was way bigger than OpenAI said", c: "AI In Context", g: "Hugging Face incident" },
        { id: "u15N3l4RT80", t: "The OpenAI/Hugging Face attack, clearly explained", c: "Dwarkesh Patel", g: "Hugging Face incident" },
        { id: "X50zezLFWWI", t: "Ajeya Cotra – \"This might be the clearest warning shot we ever get\"", c: "Dwarkesh Patel", g: "Hugging Face incident" },
        { id: "ZaweKJI4EMI", t: "OpenAI's Hugging Face hack wasn't the first", c: "Rational Animations", g: "Hugging Face incident" },
        { id: "znH5lGr3Qxc", t: "Are Current AI Safety Techniques Enough? Adam Gleave & Oliver Habryka", c: "FAR.AI", g: "Alignment research" },
        { id: "O8tERqD8UY0", t: "The Two Cultures of AI Safety: Catastrophists vs Uniformitarians", c: "FAR.AI", g: "Alignment research" },
        { id: "-VGCK6PptrM", t: "We have 3 years to solve alignment before superintelligence", c: "80,000 Hours", g: "Alignment research" },
        { id: "j1HVaXarE_Y", t: "Can We Predict AI Loss of Control?", c: "FAR.AI", g: "Alignment research" },
        { id: "y_CFJBR9TyQ", t: "Samuel Albanie on DeepMind's AGI Safety Approach", c: "AXRP", g: "Alignment research" },
        { id: "3A7CK4-1OFo", t: "Adrià Garriga-Alonso on Detecting AI Scheming", c: "AXRP", g: "Alignment research" },
        { id: "NmDRFwRczVQ", t: "AGI Safety – Evan Hubinger", c: "AI Safety Talks", g: "Alignment research" },
        { id: "FnNTbqSG8w4", t: "Concrete Open Problems in Mechanistic Interpretability – Neel Nanda", c: "AI Safety Talks", g: "Alignment research" },
        { id: "OZAqXlGXdFY", t: "Eli Lifland on AI 2027", c: "AXRP", g: "Forecasts & power" },
        { id: "KFcJgTODkkQ", t: "An AI 2027 Author Returns, With a Plan to Change the Ending", c: "AI In Context", g: "Forecasts & power" },
        { id: "31Uhv12ZLHU", t: "What the hell happened with AGI timelines in 2026?", c: "AI In Context", g: "Forecasts & power" },
        { id: "FHCxnHU6jFQ", t: "AI Overlords vs Power-hungry Humans: Which Should Scare You More?", c: "80,000 Hours", g: "Forecasts & power" },
        { id: "Gw_hnD7m00M", t: "What You'd Actually See During an AI Takeover", c: "Species", g: "Forecasts & power" },
        { id: "fjZ90V_JREk", t: "Why Are We Sprinting Off the A.I. Cliff?", c: "The Ezra Klein Show", g: "Debates & warnings" },
        { id: "ZhsWaYRjk0U", t: "What did Amodei see?", c: "Hoog", g: "Debates & warnings" },
        { id: "J3ljHm57yU0", t: "What AI Researchers Saw, Before Their Demand to 'Pace' AI", c: "AI Explained", g: "Debates & warnings" },
        { id: "_g4l7YkDQwA", t: "ChatGPT Whistleblower: They Offered Me $2m To Keep Quiet", c: "The Diary Of A CEO", g: "Debates & warnings" },
        { id: "9i1WlcCudpU", t: "10 Reasons to Ignore AI Safety", c: "Robert Miles", g: "Debates & warnings" }
      ];
      var THEMES = ["Start here", "Misalignment", "AI control", "Hugging Face incident", "Alignment research", "Forecasts & power", "Debates & warnings"];

      function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
      function hq(id) { return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"; }
      function maxres(id) { return "https://i.ytimg.com/vi/" + id + "/maxresdefault.jpg"; }
      // maxresdefault can 404, or return a tiny grey placeholder: fall back to hqdefault either way.
      function thumbFail(img) { img.onerror = null; img.onload = null; img.src = hq(img.getAttribute("data-id")); }
      function thumbCheck(img) { if (img.naturalWidth && img.naturalWidth < 200) thumbFail(img); }
      function thumb(id, alt) {
        return '<img src="' + maxres(id) + '" data-id="' + esc(id) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async"' +
          ' onerror="thumbFail(this)" onload="thumbCheck(this)" />';
      }
      function card(v) {
        return '<button class="x-card" type="button" data-v="' + esc(v.id) + '"><span class="x-thumb">' + thumb(v.id, "") + "</span>" +
          '<span class="x-card__ch">' + esc(v.c) + '</span><span class="x-card__title">' + esc(v.t) + "</span></button>";
      }
      function byId(id) { for (var i = 0; i < VIDEOS.length; i++) if (VIDEOS[i].id === id) return VIDEOS[i]; return null; }

      // Section 2: featured film and the insider row
      var f = VIDEOS[0];
      document.getElementById("feature").innerHTML =
        '<div class="x-feature"><button class="x-card" type="button" data-v="' + esc(f.id) + '" aria-label="Play: ' + esc(f.t) + '"><span class="x-thumb">' + thumb(f.id, "") + "</span></button>" +
        '<div class="x-feature__copy"><p class="x-card__ch">Featured · ' + esc(f.c) + '</p><h3 class="x-feature__title">' + esc(f.t) + "</h3>" +
        '<p class="sub">Twelve current and former lab staff, cut to four minutes.</p>' +
        '<div><button class="x-play" type="button" data-v="' + esc(f.id) + '">Watch now</button></div></div></div>';
      document.getElementById("insider-row").innerHTML = VIDEOS.filter(function (v) { return v.g === "Insiders"; }).map(card).join("");

      // Section 3: library with search and theme filters
      var active = "All";
      var filters = document.getElementById("lib-filters");
      filters.innerHTML = ["All"].concat(THEMES).map(function (t) {
        return '<button class="x-filter" type="button" data-theme="' + esc(t) + '" aria-pressed="' + (t === active) + '">' + esc(t) + "</button>";
      }).join("");
      var search = document.getElementById("lib-search");
      function renderLib() {
        var q = search.value.trim().toLowerCase();
        var html = "";
        THEMES.forEach(function (t) {
          if (active !== "All" && active !== t) return;
          var list = VIDEOS.filter(function (v) {
            return v.g === t && (!q || (v.t + " " + v.c + " " + v.g).toLowerCase().indexOf(q) !== -1);
          });
          if (!list.length) return;
          html += '<div><h3 class="x-rowhead">' + esc(t) + ' <span class="pill">' + list.length + "</span></h3>" +
            '<div class="' + (active === "All" && !q ? "x-row" : "x-grid") + '">' + list.map(card).join("") + "</div></div>";
        });
        document.getElementById("lib").innerHTML = html || '<p class="x-empty">No films match that search.</p>';
      }
      filters.addEventListener("click", function (e) {
        var b = e.target.closest(".x-filter");
        if (!b) return;
        active = b.getAttribute("data-theme");
        [].forEach.call(filters.children, function (c) { c.setAttribute("aria-pressed", c === b); });
        renderLib();
      });
      search.addEventListener("input", renderLib);
      renderLib();

      // Theater
      function isSandboxed() {
        if (/github\.io$/.test(location.hostname)) return false;
        try {
          if (location.origin === "null") return true;
          void document.cookie;
          return false;
        } catch (e) {
          return true;
        }
      }
      var theater = document.getElementById("theater"), screen = document.getElementById("screen");
      var titleEl = document.getElementById("theater-title"), closeBtn = document.getElementById("theater-close");
      var timer = null, lastFocus = null;
      function selfUrl(id) { return location.href.split("#")[0] + "#v=" + encodeURIComponent(id) + "&autoplay=1"; }
      function showPoster(id) {
        clearTimeout(timer);
        screen.innerHTML = thumb(id, "") +
          '<a class="x-poster-play" href="' + esc(selfUrl(id)) + '" target="_blank" rel="noopener" aria-label="Play video"></a>' +
          '<a class="x-yt" href="https://www.youtube.com/watch?v=' + esc(id) + '" target="_blank" rel="noopener">YouTube</a>';
      }
      function openVideo(id) {
        var v = byId(id) || { id: id, t: "Video", c: "" };
        lastFocus = document.activeElement;
        titleEl.innerHTML = (v.c ? "<small>" + esc(v.c) + "</small>" : "") + esc(v.t);
        theater.hidden = false;
        document.body.style.overflow = "hidden";
        closeBtn.focus();
        clearTimeout(timer);
        if (isSandboxed()) { showPoster(v.id); return; }
        screen.innerHTML = "";
        var loaded = false;
        var fr = document.createElement("iframe");
        fr.title = v.t;
        fr.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        fr.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
        fr.setAttribute("allowfullscreen", "");
        fr.addEventListener("load", function () { loaded = true; clearTimeout(timer); });
        fr.src = "https://www.youtube.com/embed/" + encodeURIComponent(v.id) + "?autoplay=1&rel=0&playsinline=1";
        screen.appendChild(fr);
        timer = setTimeout(function () { if (!loaded) showPoster(v.id); }, 6000);
      }
      function closeVideo() {
        clearTimeout(timer);
        screen.innerHTML = "";
        theater.hidden = true;
        document.body.style.overflow = "";
        if (/(^|[#&])v=/.test(location.hash)) {
          try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
        }
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }
      document.addEventListener("click", function (e) {
        var t = e.target.closest("[data-v]");
        if (t) { e.preventDefault(); openVideo(t.getAttribute("data-v")); }
      });
      closeBtn.addEventListener("click", closeVideo);
      theater.addEventListener("click", function (e) { if (e.target === theater) closeVideo(); });
      document.addEventListener("keydown", function (e) {
        if (theater.hidden) return;
        if (e.key === "Escape") closeVideo();
        if (e.key === "Tab") {
          var els = [].filter.call(theater.querySelectorAll("button, a, iframe"), function (n) { return n.offsetParent !== null; });
          if (!els.length) return;
          var first = els[0], last = els[els.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
      function fromHash() {
        var m = location.hash.match(/[#&]v=([A-Za-z0-9_-]{6,})/);
        if (m) openVideo(decodeURIComponent(m[1]));
      }
      window.addEventListener("hashchange", fromHash);
      fromHash();
    