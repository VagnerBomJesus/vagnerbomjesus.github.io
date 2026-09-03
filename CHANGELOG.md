# Changelog

All notable changes to this site are documented here.

## [2.0.0] - 2026-09-03

### Added
- New single-page home following the design mockups: hero with photo, featured TBDB band,
  About, **How I work** (Design → Development → Security & Maintenance), Skills with icons,
  filterable Portfolio, Contact form (`mailto:`), dark footer.
- Palette restricted to the mock colours (#D7D7D7, #000000, #FFFFFF, #C4C4C4, #909090) across the site and the admin panel.
- `docs/PROCESS.md` describing design, structure, development, verification and deployment.
- `docs/design/` with the mockups used as reference.
- `.github/workflows/ci.yml`: validates HTML, JSON and local links on push/PR.
- `CHANGELOG.md`.

### Changed
- Repository reorganised: `assets/{css,js,img}`, `data/`, `docs/`; root keeps only pages and
  files required by GitHub Pages / Google.
- `404.html`, `privacy-policy.html`, `terms.html` rebuilt on the new design system.
- Admin panel now self-contained (`admin/base.css`) and reads `../data/data.json`.
- `sw.js` cache bumped to `v10`, only same-origin GET requests are cached.
- `sitemap.xml` limited to this host's pages (external URLs removed).
- `manifest.json` theme colour and SVG icon updated.

### Removed
- `main.min.js`, `styles.min.css` (single source files instead).
- Legacy two-column layout, Ctrl+K command palette, GitHub stats/visitor counter widgets.

## [1.x] - 2026-02 to 2026-03

Initial portfolio with profile card, tabbed resources, dark/light mode, EN/PT, admin panel,
PWA, AdSense and Analytics.
