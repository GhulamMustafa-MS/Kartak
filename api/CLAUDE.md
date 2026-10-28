# api/

The server side: Vercel serverless functions (Node 24, ES modules) for the access codes. Each file except the
`_` ones is one endpoint at `/api/<name>` on https://kartak-app.vercel.app. Endpoint details: `docs/api.md`.

| File | Purpose |
|---|---|
| `_db.js` | Shared Postgres client (`sql`), `normCode()`, `readBody()`; swapped for an in-memory database by the tests. Not an endpoint (leading `_`) |
| `activate.js` | POST /api/activate - unlock with a code; locks it to one phone (D9) |
| `transfer.js` | POST /api/transfer - one-time token that moves a code to the iPhone home-screen app (D13) |
| `admin.js` | POST /api/admin - seller actions (list, new, reset, disable, enable, delete); password checked by hash; CORS for the seller app (D12) |
| `health.js` | GET /api/health - `{ok:true}` when the database answers |

Rules for changing files here:
- SQL only through the `sql` tagged template (values become parameters). Never build SQL strings.
- Return JSON with `ok`; `Cache-Control: no-store`; never return secrets or the password hash.
- A new endpoint: new file, header, row here, row in `docs/api.md`, checks in `tests/api.test.mjs`.
- If a change needs a new column or table, add a migration in `db/migrations/` first.
- New allowed origins for the seller API go in `ALLOWED_ORIGINS` in `admin.js`.
