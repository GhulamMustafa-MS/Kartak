# tests/

Automatic checks. Own `package.json` so Vercel never installs these tools. Not published.

| File | Purpose |
|---|---|
| `package.json` | Test tools (PGlite in-memory Postgres, Playwright); `npm test` runs the validator, API and browser tests |
| `testdb.mjs` | Builds the in-memory database from `db/schema.sql`, plugs it into `api/_db.js`, gives `callApi()` |
| `api.test.mjs` | 28 checks of every API rule (lock, reset, transfer, turn off, delete, time limits, CORS, password) |
| `e2e.test.mjs` | Both apps in a phone-sized browser: works offline after the first visit, seller makes a code and a 7-day code (the app locks when it is over), worker unlocks and finishes a 50-question mock, "All questions" saves and resumes the place, second phone refused, every language in the dropdown (its words, its questions, right-to-left for Arabic and Urdu, fits 390 px), a tile per language on the first screen, iPhone install help and hand-over |

Run (first time: `npm install && npx playwright install chromium`): `cd tests && npm test`.
Screenshots of the browser run go to `tests/screenshots/` (git-ignored).
Rule: every new API rule or screen gets a check here in the same commit.
