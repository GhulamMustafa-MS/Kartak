# seller/

The seller app ("Kartak Codes"), deployed as its own Vercel project `kartak-seller` with this folder as the
root, at https://kartak-seller.vercel.app (D12). It has no API of its own: it calls `/api/admin` on
https://kartak-app.vercel.app. English only (the seller reads English).

| File / folder | Purpose |
|---|---|
| `index.html` | Page shell, head tags for the separate app identity |
| [css/](css/CLAUDE.md) | Styles |
| [js/](js/CLAUDE.md) | The app logic |
| [icons/](icons/CLAUDE.md) | Brown card-with-key icons, so it differs from the worker app |
| `manifest.webmanifest` | App name "Kartak Codes", colours, icons (JSON, no comments) |
| `sw.js` | Minimal service worker so Android offers "Install app"; caches nothing |
| `.vercelignore` | Keeps CLAUDE.md files off the live site |

Rules: the seller password is never written in this folder; destructive actions need two taps; if this app
moves to another address, add it to `ALLOWED_ORIGINS` in `api/admin.js`.
