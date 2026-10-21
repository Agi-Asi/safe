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
