<div align="center">

<a href="https://agi-asi.github.io/safe/"><img src="og.jpg" alt="SAFE: Can we keep superintelligence safe?" width="100%"></a>

# SAFE

### The open hub for AI safety, alignment, interpretability, superintelligence and the singularity

**[agi-asi.github.io/safe](https://agi-asi.github.io/safe/)**

![Researchers](https://img.shields.io/badge/researchers-173-ffb547?style=flat-square)
![Videos](https://img.shields.io/badge/verified%20videos-688-ff5a36?style=flat-square)
![Quotes](https://img.shields.io/badge/sourced%20quotes-684-f3efe6?style=flat-square)
![Interviews](https://img.shields.io/badge/interviews-807-a39f96?style=flat-square)
![Hosted on GitHub Pages](https://img.shields.io/badge/hosted-GitHub%20Pages-0d0d12?style=flat-square&logo=github)

</div>

---

Advanced AI may become the most consequential technology humanity ever builds. **SAFE** brings together the people, research, films, video libraries and the daily news of that conversation in one place, so anyone, from a curious student to a working researcher, can understand what is at stake and who is working on it.

Every quote is verbatim and linked to its source. Every video is verified. Everything is free and open.

## Routes

| # | Route | What it is |
|---|---|---|
| 01 | [**The Guardians of AI**](https://agi-asi.github.io/safe/ai-safety-researchers/) · `/ai-safety-researchers/` | Who's who of AI safety and alignment: 173 researchers and public voices, 684 verbatim sourced quotes, 807 interviews and 688 verified videos, with a theater, comparisons, trust scores and timelines. |
| 02 | [**Inside the Insiders**](https://agi-asi.github.io/safe/frominside/) · `/frominside/` | Who to trust on frominside.ai: lab insiders interviewed by Palisade Research, with fact-checks, answers, motion explainers and comparisons. |
| 03 | [**CONTROL**](https://agi-asi.github.io/safe/control-superintelligence/) · `/control-superintelligence/` | Inside the race to keep superintelligence on our side: twelve insiders from OpenAI, Google DeepMind and Anthropic on the odds of losing control. |
| 04 | [**AI Safety Cinema**](https://agi-asi.github.io/safe/ai-safety-cinema/) · `/ai-safety-cinema/` | The most important conversation of our century as a cinema: documentaries, debates and talks on AI risk. |
| 05 | [**AI Safety Video Library**](https://agi-asi.github.io/safe/ai-safety-library/) · `/ai-safety-library/` | 21 topics and 175 hand-picked explainers with a seven-step learning path, scored from full-transcript reviews. |
| 06 | [**SIGNAL**](https://agi-asi.github.io/safe/signal/) · `/signal/` | The focused AI video library: 30 essential talks, about 38 hours, on research, alignment and safety. No feeds, no algorithm. |
| 07 | [**X Focus Digest**](https://agi-asi.github.io/safe/x-focus-digest/) · `/x-focus-digest/` | Today's AI timeline minus the scroll: must-reads, news and posts, ranked and summarised. |
| 08 | [**Digest Archive**](https://agi-asi.github.io/safe/x-digest/) · `/x-digest/` | Every daily edition of the digest, one page per day (`/x-digest/YYYY-MM-DD/`). |

## On the landing page

- **Singularity hero**: an interactive particle field spiralling into an event horizon that follows your cursor.
- **Voices**: a rotating carousel of verbatim, sourced quotes from Hinton, Bengio, Russell, Toner, Amodei, Christiano, Olah, Nanda, Bostrom and more.
- **Field guide**: AI safety, alignment, interpretability, AI control, superintelligence, the singularity, recursive self-improvement and governance in one sentence each.
- **Timeline**: from Turing (1950) and I. J. Good's intelligence explosion (1965) to the EU AI Act (2024) and the International AI Safety Report (2025).
- **Command palette**: press <kbd>⌘K</kbd> / <kbd>Ctrl K</kbd> or <kbd>/</kbd> to search every route and all 173 researchers.
- **Roadmap** of upcoming routes, a **FAQ**, and full accessibility (keyboard, reduced motion, semantic landmarks).

## Built to be found

- **SEO**: descriptive titles and meta, canonical URL, Open Graph and Twitter cards with a 1200×630 social image, `sitemap.xml`, `robots.txt`, web manifest and icons.
- **Structured data** (schema.org JSON-LD): `WebSite`, `CollectionPage` with an `ItemList` of routes, `FAQPage`, `DefinedTermSet` glossary, `BreadcrumbList` and the author `Person`.
- **Geo**: `geo.region` IN-WB, `geo.placename` Kolkata, `ICBM` coordinates, `en-IN` locale and hreflang alternates.
- **GEO (generative engine optimisation)**: an [`llms.txt`](https://agi-asi.github.io/safe/llms.txt) summary, plain one-sentence definitions and Q&A that answer engines can quote, and `robots.txt` that welcomes AI crawlers.

## Structure

```
safe/
├── index.html                  # landing page
├── 404.html                    # custom not-found page
├── og.jpg · icon.svg · icon-*.png · site.webmanifest
├── sitemap.xml · robots.txt · llms.txt · humans.txt
├── ai-safety-researchers/      # The Guardians of AI
├── frominside/                 # Inside the Insiders
├── control-superintelligence/  # CONTROL
├── ai-safety-cinema/           # AI Safety Cinema
├── ai-safety-library/          # AI Safety Video Library
├── signal/                     # SIGNAL
├── x-focus-digest/             # today's X Focus Digest
└── x-digest/                   # daily digest archive (YYYY-MM-DD/)
```

Every route is a self-contained static site. No build step: GitHub Pages serves the `main` branch root.

## Run locally

```bash
git clone https://github.com/Agi-Asi/safe.git
cd safe
python3 -m http.server 8000
# open http://localhost:8000
```

## Adding a new route

1. Add a folder, e.g. `lab-tracker/`, with its own `index.html`.
2. Add a card for it on the landing page and a row in the Routes table above.
3. Add its URL to `sitemap.xml` and `llms.txt`.

## Sources and credits

Quotes, interviews and videos belong to their original authors, publishers and channels; each is linked to its source. Interviews in *Inside the Insiders* are by frominside.ai / Palisade Research (CC BY 4.0). Researcher roles were verified in 2025–2026; corrections are welcome via issues.

## Author

**Aniruddha Adak**, AI Agent Engineer and full-stack developer from Kolkata, India.
[GitHub](https://github.com/Agi-Asi) · [YouTube: AI AGI ASI](https://www.youtube.com/@ai-asi) · [aniruddhaadak.tech](https://aniruddhaadak.tech) · [LinkedIn](https://www.linkedin.com/in/aniruddha-adak)

<div align="center"><sub>If SAFE helps you, star the repo and share it. The more people understand what's being built, the better our odds.</sub></div>
