# Process — how this site is designed, built and shipped

This document records the workflow behind `vagnerbomjesus.github.io` so that any future change
(new section, new language, redesign) follows the same path. The home page itself mirrors this
process in its **"How I work"** section: *Design → Development → Security & Maintenance*.

---

## 1. Design

1. **Reference mockups** — desktop, mobile and copy (EN/PL) boards were used as the layout reference:
   fixed dark navigation, split hero with photo, dark featured band, boxed uppercase section titles,
   icon-based skills, filterable portfolio grid, contact form, dark footer with "back to top".
   The files are in [`docs/design/`](design/README.md).
2. **Palette** — light grey `#ececec` and near-black `#1b1b1b` from the mock, plus the purple accent
   `#9A01A2` taken from `border-accent.svg`. The accent is used for underlines, hover states, icons,
   badges and the progress bar — never as a large background, so the page stays calm.
3. **Typography** — Montserrat (700/800, uppercase, wide letter-spacing) for titles and buttons;
   Inter for body text.
4. **Content mapping** — the template's placeholders were replaced by real content:
   `IT BERRIES` → *The Biomimicry Database (TBDB)*, `Design / Development / Maintenance` →
   *Design / Development / Security & Maintenance*, skills → Flutter/Dart/Firebase/…,
   portfolio → items from `data/data.json`.

## 2. Structure

The repository was reorganised so that each kind of file has one home:

| Folder | Contents |
|--------|----------|
| `/` | Only pages (`index`, `404`, legal) and files that GitHub Pages / Google require in the root |
| `assets/css`, `assets/js`, `assets/img` | Front-end code and images |
| `data/` | Editable content (`data.json`) |
| `admin/` | Self-contained admin panel (has its own `base.css`) |
| `docs/` | This process, design references |
| `.github/workflows/` | CI validation |

Minified copies (`*.min.js`, `*.min.css`) were dropped: the site is small, GitHub Pages serves gzip/brotli,
and a single source file avoids the "which one is current?" problem.

## 3. Development

* **HTML first** — semantic sections with `id`s used by the navigation (`#about`, `#process`, `#skills`,
  `#portfolio`, `#contact`). English copy is written in the HTML so it is indexable without JavaScript.
* **CSS** — one file, mobile-first, tokens in `:root`. Sections: tokens → reset → typography → buttons →
  header → hero → … → responsive breakpoints (`1024px`, `860px`, `600px`) → reduced-motion.
* **JavaScript** — one IIFE, ES5-compatible, no dependencies:
  * navigation (hamburger, active link, header shadow, progress bar, back-to-top),
  * i18n (`data-i18n` + `translations`, persisted in `localStorage.lang`, shared with `/admin`),
  * portfolio (fetches `data/data.json`, sanitises every item, renders cards with `createElement` —
    never `innerHTML` with user data; honours the admin's `localStorage.portfolioData` preview),
  * contact form (`mailto:` built with `encodeURIComponent`),
  * cookie banner, scroll-reveal via `IntersectionObserver`, service-worker registration.
* **Security headers** — a Content-Security-Policy `<meta>` whitelists only the CDNs actually used
  (Google Fonts, cdnjs, jsDelivr for Devicon, Google Analytics/AdSense, GitHub avatars).

## 4. Verification

Before every push:

```bash
python -m http.server 8000      # serve locally
# open http://localhost:8000 — check desktop (≥1024px) and mobile (≤600px)
```

Checklist:

- [ ] No 404s in the browser console (assets, data.json, fonts)
- [ ] EN ↔ PT switch translates every visible text
- [ ] Portfolio filters (All / Projects / Useful links) and card links work
- [ ] Contact form validates and opens the email client
- [ ] `/admin` loads, logs in and reads `../data/data.json`
- [ ] `404.html` renders and redirects
- [ ] `sitemap.xml` / `manifest.json` are valid (CI does this automatically)

The GitHub Actions workflow `ci.yml` validates the HTML with `html-validate`, parses every JSON file and
checks that local links/assets referenced from the HTML exist.

## 5. Deployment (GitHub Pages)

* Source: **branch `main`, folder `/ (root)`** — configured in *Settings → Pages*.
* Every push to `main` runs GitHub's *pages build and deployment* workflow automatically.
* No Jekyll processing is needed; if it ever gets in the way, add an empty `.nojekyll` file.
* Cache busting: bump `?v=N` on `main.css` / `main.js` in `index.html` **and** `CACHE_NAME` in `sw.js`.

## 6. Maintenance

* Content: edit `data/data.json` (or use `/admin` → Export) and commit.
* Dependencies: Font Awesome, Devicon and Google Fonts are loaded from CDNs with pinned versions —
  review them a couple of times a year.
* Legal pages: update the "Last updated" line whenever the text changes.
* Keep `CHANGELOG.md` up to date with user-visible changes.
