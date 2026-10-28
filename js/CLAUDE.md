# js/

Browser scripts for the worker app, loaded by `index.html` in this order. Plain JavaScript (ES5 style, no
modules, no build step, D16), so they run on old phones.

| File | Purpose |
|---|---|
| `i18n.js` | `window.KARTAK_UI`: every word the app shows, in en / ur / hi / bn, same keys in each |
| `app.js` | The app: screens, timer, scoring, access codes, install help, iPhone hand-over, events (section list in its header) |

Rules:
- New wording goes in `i18n.js` in all four languages in the same commit; `app.js` reads it with `T().key`.
- Question text is never in these files; it is in `data/questions.json`.
- Settings worth knowing: `QSEC` (seconds per question), `SIZES` (questions per mode; `all` = whole bank),
  `timed()` (full and quick are timed), pass mark 80% in `PASS()`.
- localStorage keys are listed in the `app.js` header; renaming one logs everyone out of that setting.
