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
| **Interactive Animations** | Cursor-reactive effects across the page |
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

## Animations

The portfolio includes interactive animations that respond to cursor movement, implemented in pure CSS and vanilla JS.

### Ripple Effect

Concentric rings expand from the cursor position as it moves across the page. The effect adapts to cursor speed — faster movement produces larger rings with a secondary outer ripple for depth.

- **Where:** Entire page except the profile card, toolbar and footer
- **How:** `mousemove` listener creates `.ripple` elements with CSS `@keyframes ripple-expand`. Each ripple is removed on `animationend` to keep the DOM clean
- **Files:** `main.js` (ripple creation logic) · `styles.css` (`.ripple`, `.ripple-inner`, `.ripple-outer` classes)

### Profile Card — Flee from Cursor

The avatar, name (`Vagner Bom Jesus`), username (`@VagnerBomJesus`) and role text flee away from the cursor when it enters the profile card. Each element calculates its distance and angle from the cursor and moves in the opposite direction.

- **Where:** Profile card — avatar, name, username and role only. Social icons and action buttons are not affected
- **How:** `mousemove` on `.profile-card` calculates repulsion force per element based on proximity (< 150px radius). Movement is clamped within card bounds to prevent overflow
- **Return:** 1.5 seconds after the cursor leaves the card, elements return to their original position with a bounce easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- **Files:** `main.js` (`profileCard` mousemove/mouseleave listeners)

### Glitch / Scramble Text

When profile elements return to place, the text (name, username, role) displays a glitch effect — characters are temporarily replaced with random symbols (`@#$%&*!?`) and progressively resolve back to the original text from left to right.

- **Where:** Profile name, username and role text
- **Trigger:** Fires automatically when elements return after fleeing
- **How:** `scrambleText()` replaces each character via `setInterval` at 30ms. Characters resolve sequentially (index `i` resolves when `iterations / 2 > i`)
- **Files:** `main.js` (`scrambleText` function)

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
