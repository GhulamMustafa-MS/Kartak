# scripts/

Tools run by people (or the AI) from the repo root; not published (`.vercelignore`).

| File | Purpose | Run |
|---|---|---|
| `validate-questions.js` | Checks `data/questions.json` (types, answers, every language complete, at least 50 live), `data/words.json` (Key words) and that every language in `js/i18n.js` is in the bank | `node scripts/validate-questions.js` |
| `make-clip.mjs` | Renders a clip from `clips/<name>.html` (drawn frame by frame) into `videos/<name>.mp4` (D27) | `node scripts/make-clip.mjs cross-contamination 13` (needs `npm install` in tests/ and ffmpeg) |
| `clips/cross-contamination.html` | The drawing code of the cross-contamination clip (`window.render(t)`) | used by `make-clip.mjs` |
| `make-icons.mjs` | Renders all PNG icon sizes from an `icon.svg` | from `tests/`: `node ../scripts/make-icons.mjs ../icons/icon.svg "#0A6B4E"` (needs `npm install` in tests/) |
