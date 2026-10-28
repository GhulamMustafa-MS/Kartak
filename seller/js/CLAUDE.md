# seller/js/

| File | Purpose |
|---|---|
| `seller.js` | Login (password kept on the phone), make / copy / WhatsApp a code, list, reset, turn off/on, delete, install help |

Rules: every call goes through `call()` to `API + "/admin"`; the WhatsApp text uses `appLink` (the worker app).
