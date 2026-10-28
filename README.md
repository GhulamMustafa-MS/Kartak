# Kartak

Practice for the Saudi food workers' health certificate exam, in English, اردو, हिंदी and বাংলা, on any phone.

- **Workers:** https://kartak-app.vercel.app (needs an access code)
- **Seller:** https://kartak-seller.vercel.app (password protected)

Independent practice questions written for this app; not the official test.

## Repository layout

| Path | What it is |
|---|---|
| `index.html`, `css/`, `js/`, `data/`, `icons/`, `manifest.webmanifest`, `sw.js` | The worker app (static files, no build step) |
| `api/` | Serverless API (Vercel functions) for access codes |
| `db/` | Database schema and migrations (Neon Postgres) |
| `seller/` | The seller app (deployed as its own Vercel project) |
| `scripts/` | Question-bank validator, icon maker |
| `tests/` | API tests and browser tests |
| `docs/` | Plan, decisions, architecture, API, progress, problems and limitations |
| `CLAUDE.md` (every folder) | Working rules and a description of every file in that folder |

## Checks

```
node scripts/validate-questions.js
cd tests && npm install && npx playwright install chromium && npm test
```

Every push to `main` deploys both apps on Vercel. Start with `docs/progress.md`.
