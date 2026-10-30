# seller/js/

| File | Purpose |
|---|---|
| `seller.js` | Login (password kept on the phone), Codes and Results tabs, make / copy / WhatsApp a code with an optional time limit (D25), or a bunch of up to 50 codes handled together (D33), list (with each code's results summary), reset, change the time limit, turn off/on, delete, install help; the phone's Back button goes up a level (D28) |
| `stats.js` | The Results tab (D26): totals, pass rate, people with a readiness verdict, test types, weakest topics, hardest questions, languages; one person's page. Plain functions returning HTML (`window.KartakStats`) |

Rules: every call goes through `call()` to `API + "/admin"`; the WhatsApp text uses `appLink` (the worker app).
