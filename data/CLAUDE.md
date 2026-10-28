# data/

The question bank. JSON can't hold comments, so its format is documented here.

| File | Purpose |
|---|---|
| `questions.json` | Every question in every language. Fetched by `js/app.js` at start; checked by `scripts/validate-questions.js` |

## Format

```json
{ "version": 1, "languages": ["en", "ur", "hi", "bn"], "questions": [ QUESTION, ... ] }
```

QUESTION:

| Field | Meaning |
|---|---|
| `id` | Stable id, `k001`, `k002`, ... Never reuse or renumber (future results will refer to it) |
| `type` | `single`, `multi`, `tf` (true/false), `order`, `picture`, `video` |
| `ans` | `single` / `picture` / `video`: index of the right option. `multi`: array of all right indexes (2+). `tf`: 0 = true, 1 = false. `order`: none - the options are written in the right order and the app shuffles them |
| `d` | Optional difficulty 1 very easy, 2 easy, 3 moderate, 4 difficult (real exam: 20/40/30/10%) |
| `ch` | Handbook chapter 1-13 the question tests (`docs/handbook.md` section 1); every question has one (D22) |
| `pic` | `picture` only: `{ "kind": "fridge" \| "freezer" \| "probe" \| "hot", "v": <°C> }`; the app draws a thermometer (scales: fridge −5..15, freezer −30..10, probe/hot 0..100) |
| `vid` | `video` only: list of frames (HTML) shown one after another; to be replaced by real clips (D5) |
| `enabled` | `false` hides a question from every test (the video questions until D5 is done) |
| `en`, `ur`, `hi`, `bn` | `{ "q": question, "o": [options], "e": explanation }`; `tf` has no `o`. Same number and order of options in every language |

## Rules

- Every fact and number must agree with `docs/handbook.md` (D22). Original wording only: never copy or
  translate the handbook's sentences or its "Test Your Knowledge" questions (D6). Options are shuffled, so never write "all of the above" or refer to letters.
- Simple everyday words in every language (D4); write numbers as 5°C, −18°C (real minus sign), 20.
- After any edit: `node scripts/validate-questions.js`, then the tests. The full mock needs at least 50 live
  questions.
