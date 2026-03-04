# Vagner Bom Jesus — Portfolio

Personal portfolio website showcasing projects, publications, and curated resources.

**Live:** [vagnerbomjesus.github.io](https://vagnerbomjesus.github.io)

---

## Features

| Feature | Description |
|---------|-------------|
| **Tabbed Navigation** | Projects and Useful Links separated by tabs |
| **Dark / Light Mode** | Theme toggle with localStorage persistence |
| **Bilingual (EN / PT)** | Language selector with full translation support |
| **Responsive Layout** | Two-column desktop, single-column mobile |
| **Paginated Resources** | Custom pagination per category |
| **Admin Panel** | CRUD interface at `/admin` to manage content |
| **Google AdSense** | Integrated ad placements |

## Project Structure

```
.
├── index.html           # Main page
├── main.js              # App logic (tabs, language, theme, pagination)
├── styles.css           # Design system (light/dark themes, layout)
├── data.json            # Projects & resources data (EN + PT)
├── ads.txt              # AdSense verification
├── admin/
│   ├── index.html       # Admin panel UI
│   ├── admin.js         # Admin CRUD logic
│   └── admin.css        # Admin styles
└── README.md
```

## Tech Stack

- **HTML5 / CSS3 / Vanilla JS** — No frameworks, no build step
- **CSS Custom Properties** — Full theming via CSS variables
- **Inter + Font Awesome** — Typography and icons via CDN
- **GitHub Pages** — Hosting and deployment
- **Google AdSense** — Monetisation

## Quick Start

```bash
git clone https://github.com/VagnerBomJesus/vagnerbomjesus.github.io.git
cd vagnerbomjesus.github.io
```

Open `index.html` in a browser, or serve locally:

```bash
python -m http.server 8000
# → http://localhost:8000
```

## Content Management

Resources are stored in `data.json` with the following structure:

```json
{
  "en": {
    "projects": [{ "title": "...", "desc": "...", "link": "..." }],
    "useful":   [{ "title": "...", "desc": "...", "link": "..." }]
  },
  "pt": { ... }
}
```

Edit directly or use the **Admin Panel** at `/admin` for a visual CRUD interface.

## Customisation

- **Theme colours:** Edit CSS variables in `:root` and `[data-theme="dark"]` in `styles.css`
- **Profile info:** Update the profile card section in `index.html`
- **Translations:** Modify the `translations` object in `main.js`

## Testing

```bash
npm install
npm test
```

## License

See [LICENSE](LICENSE) for details.

---

Developed by [Vagner Bom Jesus](https://www.linkedin.com/in/vagnerbomjesus)
