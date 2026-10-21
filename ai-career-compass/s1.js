
      (function () {
        var $ = function (s, r) { return (r || document).querySelector(s); };
        var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
        var charts = {};

        /* ---------- Charts ---------- */
        var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        function monthLabel(startYear, startMonth, offset) {
          var m = startMonth + Math.round(offset);
          return MONTHS[((m % 12) + 12) % 12] + " " + (startYear + Math.floor(m / 12));
        }

        var share = Hark.data("share-data");
        new Chart($("#share-chart"), {
          type: "line",
          data: {
            datasets: [
              { label: "Google, new code", data: share.google, pointRadius: 3 },
              { label: "Anthropic, merged lines", data: share.anthropic, pointRadius: 3 }
            ]
          },
          options: {
            scales: {
              x: { type: "linear", min: 0, max: 20, ticks: { stepSize: 6, callback: function (v) { return monthLabel(2024, 9, v); } } },
              y: { min: 0, max: 100, ticks: { callback: function (v) { return v + "%"; } } }
            },
            plugins: {
              datalabels: Object.assign({}, Hark.labels.points, { formatter: function (v) { return v.y + "%"; } }),
              tooltip: { callbacks: { title: function (items) { return items[0].raw.when; }, label: function (ctx) { return ctx.dataset.label + ": " + ctx.raw.y + "%"; } } }
            }
          }
        });

        function fmtHours(h) { return h < 1 ? Math.round(h * 60) + " min" : (Math.round(h * 10) / 10) + " h"; }
        var metr = Hark.data("metr-data");
        var named = ["GPT-4", "o1", "o3", "GPT-5", "Claude Opus 4.6", "Mythos Preview"];
        new Chart($("#metr-chart"), {
          type: "scatter",
          data: {
            datasets: [
              { label: "Time horizon", data: metr.map(function (d) { return { x: d.x, y: d.min / 60, label: d.label, when: d.when }; }), pointRadius: 4 },
              { type: "line", label: "16 h: reliability limit", data: [{ x: 0, y: 16 }, { x: 40, y: 16 }], borderColor: "var(--chart-reference)", borderDash: [3, 4], borderWidth: 1, pointRadius: 0 }
            ]
          },
          options: {
            scales: {
              x: { type: "linear", min: 0, max: 40, ticks: { stepSize: 6, callback: function (v) { return monthLabel(2023, 2, v); } } },
              y: { type: "logarithmic", min: 0.05, max: 30, ticks: { callback: function (v) { return [0.1, 0.25, 0.5, 1, 2, 4, 8, 16].indexOf(+v) > -1 ? fmtHours(v) : ""; } } }
            },
            plugins: {
              legend: { display: false },
              datalabels: Object.assign({}, Hark.labels.names, { display: function (ctx) { var r = ctx.dataset.data[ctx.dataIndex]; return !!(r && r.label && named.indexOf(r.label) > -1); } }),
              tooltip: { callbacks: { title: function (items) { var r = items[0].raw; return r.label ? r.label + " · " + r.when : ""; }, label: function (ctx) { return fmtHours(ctx.raw.y); } } }
            }
          }
        });

        var swe = Hark.data("swe-data");
        new Chart($("#swe-chart"), {
          type: "line",
          data: {
            labels: swe.map(function (d) { return [d.model, d.when]; }),
            datasets: [{ label: "SWE-bench Verified", data: swe.map(function (d) { return d.score; }), fill: true, pointRadius: 3 }]
          },
          options: {
            scales: { y: { min: 0, max: 100, ticks: { callback: function (v) { return v + "%"; } } } },
            plugins: {
              legend: { display: false },
              datalabels: Object.assign({}, Hark.labels.points, { formatter: function (v) { return v + "%"; } }),
              tooltip: { callbacks: { label: function (ctx) { return ctx.raw + "%"; } } }
            }
          }
        });

        function compact(n) {
          if (n >= 1e6) return (n / 1e6) + "M";
          if (n >= 1e3) return (n / 1e3) + "k";
          return String(n);
        }
        function barChart(id, rows, unit) {
          return new Chart($(id), {
            type: "bar",
            data: {
              labels: rows.map(function (d) { return d.name; }),
              datasets: [{ data: rows.map(function (d) { return d.value; }), backgroundColor: rows.map(function (d) { return d.safety ? "var(--chart-ink)" : "var(--chart-muted)"; }) }]
            },
            options: {
              indexAxis: "y",
              scales: { x: { type: "linear", ticks: { callback: function (v) { return tick(v, this.type === "logarithmic", unit); } } } },
              plugins: {
                legend: { display: false },
                datalabels: Object.assign({}, Hark.labels.values, { formatter: function (v, ctx) { return rows[ctx.dataIndex].display; } }),
                tooltip: { callbacks: { label: function (ctx) { return rows[ctx.dataIndex].display; } } }
              }
            }
          });
        }
        function tick(v, log, unit) {
          if (log && Math.abs(Math.log10(v) % 1) > 1e-9) return "";
          if (unit === "$") return v < 1 ? "$" + Math.round(v * 1000) + "M" : "$" + v + "B";
          return compact(v);
        }
        charts.heads = barChart("#heads-chart", Hark.data("heads-data"), "");
        charts.heads._logMin = 100;
        charts.money = barChart("#money-chart", Hark.data("money-data"), "$");
        charts.money._logMin = 0.1;

        $$("[data-scale]").forEach(function (b) {
          b.addEventListener("click", function () {
            var c = charts[b.dataset.chart], t = b.dataset.scale;
            $$('[data-chart="' + b.dataset.chart + '"]').forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
            c.options.scales.x.type = t;
            c.options.scales.x.min = t === "logarithmic" ? c._logMin : undefined;
            c.update();
          });
        });

        var branches = Hark.data("branch-data");
        new Chart($("#branch-chart"), {
          type: "bar",
          data: {
            labels: branches.map(function (d) { return d.branch; }),
            datasets: [{ data: branches.map(function (d) { return d.lakh; }), backgroundColor: branches.map(function (d) { return d.branch === "CSE" ? "var(--chart-ink)" : "var(--chart-muted)"; }) }]
          },
          options: {
            plugins: {
              legend: { display: false },
              datalabels: Object.assign({}, Hark.labels.values, { formatter: function (v) { return v.toFixed(2) + " L"; } }),
              tooltip: { callbacks: { label: function (ctx) { return ctx.raw.toFixed(2) + " lakh students"; } } }
            }
          }
        });

        /* ---------- Myth cards + Belief Score ---------- */
        var myths = $$(".x-myth");
        function syncFaces(card) {
          var flipped = card.classList.contains("is-flipped");
          $(".x-myth__front", card).setAttribute("aria-hidden", String(flipped));
          $(".x-myth__back", card).setAttribute("aria-hidden", String(!flipped));
        }
        function updateMeter() {
          var shown = myths.filter(function (c) { return c.dataset.seen === "1"; });
          var sum = shown.reduce(function (a, c) { return a + parseFloat(c.dataset.score); }, 0);
          $("#meter-count").textContent = "· " + shown.length + " of " + myths.length + " revealed";
          var pct = shown.length ? Math.round((sum / shown.length) * 100) : 0;
          $("#meter-fig").textContent = shown.length ? pct + "% accurate" : "–";
          $("#meter-fill").style.width = pct + "%";
        }
        myths.forEach(function (card) {
          syncFaces(card);
          $$("[data-flip]", card).forEach(function (btn) {
            btn.addEventListener("click", function () {
              card.classList.toggle("is-flipped");
              card.dataset.seen = "1";
              syncFaces(card);
              updateMeter();
              var target = card.classList.contains("is-flipped") ? $(".x-myth__back [data-flip]", card) : $(".x-myth__front [data-flip]", card);
              setTimeout(function () { target.focus({ preventScroll: true }); }, 360);
            });
          });
        });
        $("#reveal-all").addEventListener("click", function () {
          myths.forEach(function (c) { c.classList.add("is-flipped"); c.dataset.seen = "1"; syncFaces(c); });
          updateMeter();
        });
        $("#reset-all").addEventListener("click", function () {
          myths.forEach(function (c) { c.classList.remove("is-flipped"); c.dataset.seen = ""; syncFaces(c); });
          updateMeter();
        });

        /* ---------- Paradigm tabs ---------- */
        var tabs = $$('[role="tab"]');
        tabs.forEach(function (t) {
          t.addEventListener("click", function () {
            tabs.forEach(function (o) {
              var on = o === t;
              o.setAttribute("aria-selected", String(on));
              document.getElementById(o.getAttribute("aria-controls")).hidden = !on;
            });
          });
        });

        /* ---------- Path Finder ---------- */
        var PATHS = {
          a: ["(a) AI safety research engineer", "You like research, can run lean and take risk. Start BlueDot now, ship an agent-safety eval, then aim for SPAR, MATS or LASR."],
          b: ["(b) AI agent engineer now, safety on the side", "You need income and love shipping. Take an AI/agent engineering job and build safety projects on the side: the bridge this guide recommends."],
          c: ["(c) MTech / PhD in India", "You want depth and stability. GATE or IISc with a PMRF-level stipend fits; if you love hardware, an AI + aerospace or robotics thesis is the hybrid that pays."],
          d: ["(d) MS abroad", "You want to go abroad and have runway. Weigh the 62% drop in US F-1 visas to Indians and the contested H-1B fee; Germany is drawing many more Indian applicants."],
          e: ["(e) MBA via CAT", "You lean toward business. CAT 2026 is on 29 Nov, but only if you registered by 22 Sep."],
          f: ["(f) Creator / founder", "You're a risk-taker who builds audiences. Create, but as an amplifier for real work: only 8–10% of Indian creators monetise well."]
        };
        var quiz = $("#quiz");
        quiz.addEventListener("submit", function (e) { e.preventDefault(); });
        quiz.addEventListener("change", function () {
          var score = { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0 }, answered = 0;
          for (var i = 1; i <= 5; i++) {
            var sel = quiz.querySelector('input[name="q' + i + '"]:checked');
            if (!sel) continue;
            answered++;
            sel.value.split(" ").forEach(function (tok) { score[tok[0]] += parseInt(tok.slice(1), 10); });
          }
          var box = $("#quiz-result");
          $$("#path-cards > div").forEach(function (d) { d.classList.remove("x-picked"); });
          if (answered < 5) {
            box.innerHTML = '<p class="sub">Answer all five to see your path. ' + (5 - answered) + " left.</p>";
            return;
          }
          var best = "a";
          Object.keys(score).forEach(function (k) { if (score[k] > score[best]) best = k; });
          var p = PATHS[best];
          $("#path-" + best).classList.add("x-picked");
          box.innerHTML = '<p class="sub">Your best fit</p><h3>' + p[0] + "</h3><p>" + p[1] + '</p><a class="btn" href="#path-' + best + '">Read this path</a>';
        });

        /* ---------- Video library ---------- */
        function isSandboxed() {
          if (/github\.io$/.test(location.hostname)) return false;
          try {
            if (location.origin === "null") return true;
            void document.cookie;
            return false;
          } catch (e) { return true; }
        }
        var sandboxed = isSandboxed();
        var selfURL = location.href.split("#")[0];
        function play(card) {
          var id = card.dataset.vid, frame = $(".x-video__frame", card);
          if ($("iframe", frame)) return;
          var poster = $(".x-video__play", card), img = $("img", frame);
          var f = document.createElement("iframe");
          f.src = "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1";
          f.title = $(".x-video__title", card).textContent;
          f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
          f.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen");
          f.setAttribute("allowfullscreen", "");
          var loaded = false;
          f.addEventListener("load", function () { loaded = true; });
          poster.hidden = true;
          img.hidden = true;
          frame.appendChild(f);
          setTimeout(function () {
            if (loaded) return;
            f.remove();
            img.hidden = false;
            poster.hidden = false;
            poster.href = "https://www.youtube.com/watch?v=" + id;
            poster.target = "_blank";
            poster.rel = "noopener";
            poster.dataset.fallback = "1";
            $("span", poster).textContent = "▶ Watch on YouTube";
          }, 6000);
        }
        $$(".x-video").forEach(function (card) {
          var poster = $(".x-video__play", card);
          if (sandboxed) {
            poster.href = selfURL + "#v=" + card.dataset.vid + "&autoplay=1";
            poster.target = "_blank";
            poster.rel = "noopener";
          } else {
            poster.addEventListener("click", function (e) {
              if (poster.dataset.fallback) return;
              e.preventDefault();
              play(card);
            });
          }
        });
        function openFromHash() {
          var params = new URLSearchParams(location.hash.slice(1));
          var v = params.get("v");
          if (!v || sandboxed) return;
          var card = $$(".x-video").filter(function (c) { return c.dataset.vid === v; })[0];
          if (!card) return;
          card.scrollIntoView({ block: "center" });
          play(card);
        }
        openFromHash();
        window.addEventListener("hashchange", openFromHash);
      })();
    