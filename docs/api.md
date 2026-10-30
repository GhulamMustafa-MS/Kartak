# API endpoints

**The one home for endpoints.** All are Vercel functions in `api/` on https://kartak-app.vercel.app,
take and return JSON, and send `Cache-Control: no-store`. Every response has `ok`.

| Method + path | File | Who calls it | Request | Response |
|---|---|---|---|---|
| POST /api/activate | api/activate.js | Worker app, on unlock and every launch | `{code, device}` | `{ok:true, ends?}` (`ends` = ISO date the time limit runs out, only for limited codes) or `{ok:false, reason:"invalid" \| "used" \| "disabled" \| "expired"}` |
| POST /api/transfer | api/transfer.js | Worker app on iPhone | make: `{action:"make", code, device}`; redeem: `{action:"redeem", token, device}` | make: `{ok, token}`; redeem: `{ok, code}` |
| POST /api/result | api/result.js | Worker app, after each finished test (outbox, D26) | `{code, device, items:[{id, mode, lang, total, correct, timedOut, seconds, asked:[ids], wrong:[ids], at}]}` (max 50 items) | `{ok:true, saved}` or `{ok:false, reason:"code" \| "invalid"}` ("code" = not the locked phone: the app drops what it holds) |
| POST /api/admin | api/admin.js | Seller app (CORS from kartak-seller.vercel.app) | `{key, action, code?, note?, days?, count?, batch?}`; action `list` \| `new` \| `reset` \| `disable` \| `enable` \| `delete` \| `limit` \| `stats` \| `results` \| `batch_disable` \| `batch_enable` \| `batch_delete`; `days` (for `new` and `limit`) = 1-365, or null / missing = no limit; `count` (for `new`) = 1-50, default 1, more than 1 makes a bunch sharing one `batch` id (D33); `batch_*` act on every code with that `batch` | `{ok, made?, madeAll?, list:[{code, note, active, disabled, created_at, activated_at, last_seen, reset_count, valid_days, batch, ends, expired, tests, avg, last_test, fulls, fulls_passed}], stats?: {overall, modes, langs, questions:[{id, asked, wrong}]}, results?: [{mode, lang, total, correct, timed_out, seconds, asked, wrong, finished_at}]}`; wrong key: 401 `{ok:false, reason:"key"}` after 1 s |
| GET /api/health | api/health.js | People, after a deploy | none | `{ok:true}` if the database answers |

Status codes: 200 for answered requests (including "not allowed" answers, which use `ok:false`), 204 for CORS
pre-flight, 401 wrong seller password, 405 wrong method, 500 database error (`{ok:false}` / `reason:"server"`).

Rules (tested in `tests/api.test.mjs`):
- Codes are matched case-insensitively and ignoring spaces and dashes.
- A code locks to the first device id; the same device can activate again; reset clears the lock once.
- Turned-off codes answer `disabled`; deleted codes answer `invalid`.
- A time limit (`valid_days`, D25) counts from the first use (`activated_at`); a reset for a new phone does
  not restart it. Once it has passed, activate answers `expired` and a hand-over token can't be made or used.
  Changing the limit (`limit`) takes effect at once, so a code can be extended or made unlimited.
- Results (D26) are saved only when the code is locked to the sending device (also after its time is over);
  each item's `id` is unique, so a retry never saves it twice; broken items are skipped; a result's time is
  the phone's `at` if it is within the last 60 days. Deleting a code deletes its results. A full mock counts
  as passed at 80% (`correct * 5 >= total * 4`).
- A transfer token is made only by the locked device, expires after a day and works once.
