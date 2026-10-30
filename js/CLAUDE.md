# js/

Browser scripts for the worker app, loaded by `index.html` in this order. Plain JavaScript (ES5 style, no
modules, no build step, D16), so they run on old phones.

| File | Purpose |
|---|---|
| `i18n.js` | `window.KARTAK_LANGS` (the 11 languages) and `window.KARTAK_UI`: every word the app shows, same keys in each language |
| `app.js` | The app: screens, timer, scoring, access codes, install help, iPhone hand-over, events (section list in its header) |

Rules:
- New wording goes in `i18n.js` in every language in the same commit; `app.js` reads it with `T().key`.
- The language list (`KARTAK_LANGS` in `i18n.js`) drives the dropdown, the first-screen tiles, text direction,
  the html `lang` and the voice for "Listen"; `app.js` offers only languages that have a `KARTAK_UI` block.
- Question text is never in these files; it is in `data/questions.json`.
- Settings worth knowing: `QSEC` (seconds per question), `SIZES` (questions per mode; `all` = whole bank),
  `timed()` (full and quick are timed), pass mark 80% in `PASS()`.
- The phone's Back button (D28): `syncHistory()` keeps one history entry while an inner screen is open and the
  `popstate` handler goes home; call `render()` or `go()` to change screens so it stays right.
- "All questions" by type (D29): `S.allType` (null = every type) filters the bank in `start()` and is saved
  in `kartak-all`; the chooser is `drawAllPick()` (screen `allpick`).
- `resumeAll()` keeps a worker's place when the bank changes (D30): answered questions that changed shape are
  dropped, unanswered ones re-shuffled. Keep question ids stable when rewriting a question.
- localStorage keys are listed in the `app.js` header; renaming one logs everyone out of that setting.
