# scripts/

Tools run by people (or the AI) from the repo root; not published (`.vercelignore`).

| File | Purpose | Run |
|---|---|---|
| `validate-questions.js` | Checks `data/questions.json`: types, answers, every language complete, at least 50 live | `node scripts/validate-questions.js` |
| `make-icons.mjs` | Renders all PNG icon sizes from an `icon.svg` | from `tests/`: `node ../scripts/make-icons.mjs ../icons/icon.svg "#0A6B4E"` (needs `npm install` in tests/) |
