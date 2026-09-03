# Vagner Bom Jesus | Portfolio

Personal portfolio: projects, publications and curated resources.
Static site, no build step, hosted on **GitHub Pages**.

**Live:** [vagnerbomjesus.github.io](https://vagnerbomjesus.github.io)

---

## Overview

| Area | What it is |
|------|------------|
| **Home page** | Single-page layout: Hero → Featured project (TBDB) → About → Process → Skills → Portfolio → Contact |
| **Bilingual** | EN / PT switch in the header (`data-i18n` attributes + `translations` in `assets/js/main.js`); remembered in `localStorage` |
| **Portfolio** | Cards rendered from `data/data.json`, filterable (All / Projects / Useful links) |
| **Contact** | `mailto:` form: opens the visitor's email client with the message pre-filled |
| **Admin panel** | `/admin`: password-protected CRUD UI for `data/data.json` (exports the JSON you commit) |
| **PWA** | `manifest.json` + `sw.js` (network-first cache) |
| **SEO** | Meta/OpenGraph/Twitter tags, JSON-LD (Person, WebSite, SoftwareApplication, Breadcrumb), `sitemap.xml`, `robots.txt` |
| **Analytics / Ads** | Google Analytics 4 with Web Vitals (`assets/js/analytics.js`), Google AdSense Auto Ads |

Design language taken strictly from the mockups: light grey `#D7D7D7`, black `#000000`, white `#FFFFFF`, grey boxes `#C4C4C4` and muted grey `#909090`. Montserrat headings, Inter body. No other colours are used.
Mockups live in [`docs/design/`](docs/design/README.md); the build process is described in [`docs/PROCESS.md`](docs/PROCESS.md).

## Project structure

```
.
├── index.html                # Home page (all sections)
├── 404.html                  # Not-found page (auto-redirects to /)
├── privacy-policy.html       # Legal
├── terms.html                # Legal
│
├── assets/
│   ├── css/main.css          # Design system + layout (tokens in :root)
│   ├── js/main.js            # Nav, i18n, portfolio rendering, contact form, cookie banner
│   ├── js/analytics.js       # GA4 + Web Vitals
│   ├── js/ads-init.js        # AdSense helper (kept for manual ad units)
│   └── img/                  # favicon.svg, og-image.svg
│
├── data/
│   └── data.json             # Projects & useful links (EN + PT), the only content file to edit
│
├── admin/                    # Admin panel (not indexed)
│   ├── index.html
│   ├── admin.js
│   ├── admin.css             # Admin-specific styles (purple accent overrides)
│   └── base.css              # Legacy design system used only by the admin UI
│
├── docs/
│   ├── PROCESS.md            # How the site was designed, built and is deployed
│   └── design/               # Mockups & references (large exports are git-ignored)
│
├── .github/workflows/ci.yml  # Validates HTML / JSON / links on every push & PR
├── .githooks/commit-msg      # Rejects AI attribution trailers in commit messages
│
├── manifest.json  sw.js      # PWA
├── robots.txt  sitemap.xml   # SEO
├── ads.txt                   # AdSense verification
├── googlefcb97ae6900f3a92.html  # Google Search Console verification
├── CHANGELOG.md  LICENSE  README.md
└── .gitignore
```

Files that **must stay in the repository root** because GitHub Pages / Google look for them there:
`index.html`, `404.html`, `manifest.json`, `sw.js`, `robots.txt`, `sitemap.xml`, `ads.txt`, `googlefcb97ae6900f3a92.html`.

## Quick start

```bash
git clone https://github.com/VagnerBomJesus/vagnerbomjesus.github.io.git
cd vagnerbomjesus.github.io
python -m http.server 8000     # → http://localhost:8000
```

Serve over HTTP (not `file://`) so `fetch('data/data.json')` works.

## Editing content

### Projects & links
Edit `data/data.json` directly, or open `/admin`, log in, make the changes and **Export** the JSON; then commit it.

```json
{
  "en": {
    "projects": [{ "title": "...", "desc": "...", "link": "https://...", "type": "website", "featured": true, "isNew": false }],
    "useful":   [{ "title": "...", "desc": "...", "link": "https://...", "type": "website" }]
  },
  "pt": { "projects": [...], "useful": [...] }
}
```

`type` controls the card icon: `apk`, `website`, `article`, `pdf`. Only `http(s)` links are rendered.

### Texts (EN / PT)
Static copy lives in `index.html` (English) and in the `translations` object in `assets/js/main.js` (both languages).
Add a `data-i18n="key"` attribute to an element and a matching key in both `en` and `pt`.

### Skills
The skill lists are plain HTML in the `#skills` section of `index.html`. Icons come from
[Devicon](https://devicon.dev) (`devicon-<name>-plain colored`) or Font Awesome.

### Colours / typography
All tokens are CSS custom properties at the top of `assets/css/main.css` (`--bg`, `--bg-dark`, `--box`, `--text-muted`, fonts). Keep to the five mock colours above.

## Commit rules

No `Co-Authored-By:` or `Claude-Session:` lines in commit messages. A `commit-msg` hook enforces it;
enable it once per clone:

```bash
git config core.hooksPath .githooks
```

## Deployment

GitHub Pages serves the `main` branch from the repository root. Every push to `main` triggers the
built-in **pages build and deployment** workflow; the site is live within a minute or two.

After changing CSS/JS, bump the cache-busting query (`?v=10`) in `index.html` and `CACHE_NAME` in `sw.js`
so returning visitors get the new files.

## Tech stack

HTML5 · CSS3 (custom properties, grid, clip-path) · Vanilla JavaScript (ES5-compatible) ·
Google Fonts (Montserrat, Inter) · Font Awesome · Devicon · GitHub Pages · GitHub Actions (validation only).

## License

See [LICENSE](LICENSE).

---

Developed by [Vagner Bom Jesus](https://www.linkedin.com/in/vagnerbomjesus)
