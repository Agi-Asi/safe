      (function () {
        var DAY = 86400000, HOUR = 3600000, MIN = 60000;
        var list = document.getElementById("x-radar");
        var items = [].slice.call(list.querySelectorAll(".x-rad"));
        var done = {}; // in memory only
        items.forEach(function (el, i) {
          el._at = Date.parse(el.getAttribute("data-at"));
          el._id = i;
          var name = el.querySelector("h3").textContent;
          var btn = el.querySelector(".x-toggle");
          btn.setAttribute("aria-label", "Mark " + name + " done");
          btn.addEventListener("click", function () {
            done[i] = !done[i];
            btn.setAttribute("aria-pressed", done[i] ? "true" : "false");
            el.classList.toggle("is-done", !!done[i]);
            tick();
          });
        });
        items.sort(function (a, b) { return a._at - b._at; }).forEach(function (el) { list.appendChild(el); });

        function pad(n) { return n < 10 ? "0" + n : "" + n; }
        function parts(ms) {
          return { d: Math.floor(ms / DAY), h: Math.floor((ms % DAY) / HOUR), m: Math.floor((ms % HOUR) / MIN), s: Math.floor((ms % MIN) / 1000) };
        }
        function render(box, ms) {
          if (ms <= 0) { box.className = "x-count x-count--closed"; box.textContent = "Closed"; return; }
          var p = parts(ms);
          box.className = "x-count";
          box.innerHTML =
            "<span>" + p.d + "<small>days</small></span>" +
            "<span>" + pad(p.h) + "<small>hrs</small></span>" +
            "<span>" + pad(p.m) + "<small>min</small></span>" +
            "<span>" + pad(p.s) + "<small>sec</small></span>";
        }
        var heroCount = document.getElementById("x-hero-count");
        var sum = document.getElementById("x-sum");
        function tick() {
          var now = Date.now(), open = 0, closed = 0, nDone = 0;
          items.forEach(function (el) {
            var ms = el._at - now;
            var u = ms <= 0 ? "closed" : ms < 3 * DAY ? "now" : ms < 14 * DAY ? "soon" : "later";
            el.setAttribute("data-urgency", u);
            render(el.querySelector(".x-count"), ms);
            if (done[el._id]) nDone++;
            else if (ms <= 0) closed++;
            else open++;
          });
          sum.innerHTML = "<b>" + open + "</b> open · <b>" + nDone + "</b> done · <b>" + closed + "</b> closed";
          var dms = items[0]._at - now;
          if (dms <= 0) { heroCount.textContent = "Closed"; }
          else { var p = parts(dms); heroCount.textContent = p.d + "d " + pad(p.h) + "h " + pad(p.m) + "m " + pad(p.s) + "s"; }
        }
        tick();
        setInterval(tick, 1000);

        // Filter bar
        var fbtns = [].slice.call(document.querySelectorAll("[data-filter]"));
        fbtns.forEach(function (b) {
          b.addEventListener("click", function () {
            var f = b.getAttribute("data-filter");
            fbtns.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
            items.forEach(function (el) {
              var cats = (el.getAttribute("data-cat") || "").split(" ");
              el.hidden = f !== "all" && cats.indexOf(f) === -1;
            });
          });
        });

        // "What you need ready" counters (in memory)
        [].slice.call(document.querySelectorAll(".x-guide")).forEach(function (g) {
          var boxes = [].slice.call(g.querySelectorAll(".x-need input"));
          var out = g.querySelector(".x-need__count");
          function upd() {
            var n = boxes.filter(function (b) { return b.checked; }).length;
            out.textContent = n + "/" + boxes.length;
          }
          boxes.forEach(function (b) { b.checked = false; b.addEventListener("change", upd); });
          upd();
        });

        // Copy all deadlines as plain text
        var copyBtn = document.getElementById("x-copy");
        copyBtn.addEventListener("click", function () {
          var lines = ["Aniruddha's deadlines (IST)", ""];
          items.forEach(function (el, n) {
            var a = el.querySelector(".x-apply");
            var line = (n + 1) + ". " + el.querySelector("h3").textContent.trim() +
              " | " + el.querySelector(".x-rad__when").textContent.trim() +
              (a ? " | " + a.href : "") + (done[el._id] ? " [done]" : "");
            lines.push(line);
          });
          var text = lines.join("\n");
          var box = document.getElementById("x-copy-box");
          var area = document.getElementById("x-copy-text");
          var status = document.getElementById("x-copy-status");
          area.value = text;
          box.hidden = false;
          function fallbackCopy() {
            var ok = false;
            try {
              area.removeAttribute("readonly");
              area.focus({ preventScroll: true });
              area.select();
              area.setSelectionRange(0, text.length);
              ok = document.execCommand("copy");
            } catch (e) {}
            area.setAttribute("readonly", "");
            status.textContent = ok ? "Copied to clipboard." : "Select the list below to copy it.";
          }
          if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext !== false) {
            navigator.clipboard.writeText(text).then(function () { status.textContent = "Copied to clipboard."; }, fallbackCopy);
          } else {
            fallbackCopy();
          }
          copyBtn.textContent = "Copied";
          copyBtn.classList.add("is-copied");
          clearTimeout(copyBtn._t);
          copyBtn._t = setTimeout(function () { copyBtn.textContent = "Copy all deadlines"; copyBtn.classList.remove("is-copied"); }, 2000);
        });

        var moves = [
          "Write 3 lines of your Pivotal research pitch",
          "Open one issue on an AI safety repo",
          "Draft a sponsor email for AI AGI ASI",
          "Record a 60-second Short on today's AI news",
          "Read one METR or Apollo post and note one eval idea",
          "Push a commit to your hackathon repo",
          "Reply to one pending email",
          "Post a build-in-public update on X"
        ];
        var last = -1, out = document.getElementById("x-move-out");
        document.getElementById("x-move-btn").addEventListener("click", function () {
          var i;
          do { i = Math.floor(Math.random() * moves.length); } while (i === last);
          last = i;
          out.textContent = moves[i];
          out.classList.remove("is-empty");
          this.textContent = "Another move";
        });
      })();
