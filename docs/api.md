# API endpoints

**The one home for endpoints.** All are Vercel functions in `api/` on https://kartak-app.vercel.app,
take and return JSON, and send `Cache-Control: no-store`. Every response has `ok`.

| Method + path | File | Who calls it | Request | Response |
|---|---|---|---|---|
| POST /api/activate | api/activate.js | Worker app, on unlock and every launch | `{code, device}` | `{ok:true}` or `{ok:false, reason:"invalid" \| "used" \| "disabled"}` |
| POST /api/transfer | api/transfer.js | Worker app on iPhone | make: `{action:"make", code, device}`; redeem: `{action:"redeem", token, device}` | make: `{ok, token}`; redeem: `{ok, code}` |
| POST /api/admin | api/admin.js | Seller app (CORS from kartak-seller.vercel.app) | `{key, action, code?, note?}`; action `list` \| `new` \| `reset` \| `disable` \| `enable` \| `delete` | `{ok, made?, list:[{code, note, active, disabled, created_at, activated_at, last_seen, reset_count}]}`; wrong key: 401 `{ok:false, reason:"key"}` after 1 s |
| GET /api/health | api/health.js | People, after a deploy | none | `{ok:true}` if the database answers |

Status codes: 200 for answered requests (including "not allowed" answers, which use `ok:false`), 204 for CORS
pre-flight, 401 wrong seller password, 405 wrong method, 500 database error (`{ok:false}` / `reason:"server"`).

Rules (tested in `tests/api.test.mjs`):
- Codes are matched case-insensitively and ignoring spaces and dashes.
- A code locks to the first device id; the same device can activate again; reset clears the lock once.
- Turned-off codes answer `disabled`; deleted codes answer `invalid`.
- A transfer token is made only by the locked device, expires after a day and works once.
