# AGENTS Instructions

## Deploy Cache-Busting (GitHub Pages)

- This project is hosted on GitHub Pages and uses query-string cache-busting for static assets.
- For every shipped frontend change that can affect runtime behavior or styling, update both asset version params in `index.html` at the same time:
  - `style.css?v=...`
  - `script.js?v=...`
- Keep both values identical and bump once per release (example: `20260409.2`).
- Do not change existing local progress storage keys unless a migration is intentionally planned.
