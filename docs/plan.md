# Plan

**The one home for the plan** (CLAUDE.md section 3): what Kartak is, who it is for, the facts it is built on,
what is built, the roadmap, and how to make common changes. Decisions behind it are in
[design_decisions.md](design_decisions.md); status is in [progress.md](progress.md).

## 1. The problem

In Saudi Arabia every food worker (kitchen, counter, cashier) must hold a health certificate, which needs a
pass in the computer-based food workers' health education test. Many workers are from Bangladesh, Pakistan,
India and Nepal, read slowly and have never sat a computer test. They fail not only on food safety but on the
format: per-question timers, "select all", ordering questions and video questions they don't recognise. A
fail costs a free retake, then a paid attempt (about 150 SAR + VAT, workers report 175) and can cost the job.
Restaurant owners already pay for courses (one owner paid about 800 SAR per worker: 500 course + 300 exam)
and still see workers fail. No mock-exam product for this test was found (competitors in section 7).

**Kartak** ("your card" in Saudi dialect; workers call the certificate their card) gives workers realistic
practice in their own language on their own phone, so the real exam feels familiar.

## 2. Users

| User | What they need | App |
|---|---|---|
| Worker | Practise in Bangla / Urdu / Hindi / English, learn the question types, take timed mocks until they pass consistently | Worker app, https://kartak-app.vercel.app |
| Seller (Wessam, in KSA) | Make a code for each person who pays, send it on WhatsApp, reset it when someone changes phone, turn off or delete codes | Seller app, https://kartak-seller.vercel.app |
| Owner (later) | Pay for staff and see who is ready; later, branch food-safety checks | Not built (section 6) |

## 3. Facts the app is built on

**The real exam** (Al Arkkan 2026 candidate guide, plus reports from workers via Wessam on 28 Oct 2026):
- 50 questions, 90 minutes in total, taken on a computer at a test centre. Workers report a timer on each
  question of **1 minute 30** (D3). Pass mark **80% (40 of 50)**.
- Difficulty mix: 20% very easy, 40% easy, 30% moderate, 10% difficult.
- Types: single answer, multiple answers, true/false, put in order (steps shown mixed up with arrows at the
  end of each to move them, D7), picture, video. Workers say ordering questions are common and the hardest.
- 11 languages: Arabic, English, plus 9 more: Urdu, Malayalam, Hindi, Bengali, Tamil, Turkish, Filipino,
  Indonesian, Nepali (candidate guide 2026, section 7.1, checked again 28 Oct 2026:
  https://arkkanapp.net/Municipal/Certification_Candidate_Guide-Ar-2026.pdf). For any other language the centre
  provides a reader who translates the exam aloud.
- One free retake (at least 3 days and at most 3 months after the first attempt); after a second fail, proof
  of training and a paid attempt. The health certificate is valid for 1 year; refresher health education
  every 3 years (handbook chapter 1).
- The official handbook (BK-FS-Workers-E-2025-01) forbids copying or translating it, so Kartak's questions are
  original (D6).

**The handbook is the source of every question (D22).** The exam is built on the official handbook
BK-FS-Workers-E-2025-01 (13 chapters). Its syllabus and every number Kartak uses (danger zone 5-63°C, cook
75°C, reheat above 82°C, hot holding 63°C, fridge 5°C or below, freezer −18°C, cool within 1.5 hours, thaw in
the fridge or microwave, and so on) are in [handbook.md](handbook.md), the one home for those facts. The
handbook itself stays outside the repo (copyright).

## 4. What is built (details: [architecture.md](architecture.md), [api.md](api.md))

Worker app (installable, works offline after the first visit):
- Languages: a tile for each on the first screen and a dropdown at the top to switch any time (D24);
  Arabic and Urdu right-to-left. The app offers the languages listed in `KARTAK_LANGS` (js/i18n.js).
- Code gate: a code from the seller unlocks the app on one phone (D9). The code is re-checked every time the
  app opens with internet: a turned-off code or one whose time limit is over locks the app with a message
  in the worker's language (D25).
- Full mock exam (50 random questions, 1:30 each, 80% to pass), quick test (15, timed), practice (15, no timer,
  answer and reason after each), all questions (the whole bank, no timer, answer after each, carries on where
  the worker stopped, D21; every type or only one type, such as ordering, D29), "Key words" (33 exam words explained simply with pictures, thermometers and a
  cartoon clip, D27), "Learn the question types" with a small example of each type.
- Video questions like the real exam (D31): a short cartoon clip of a kitchen action, then "Is this right or
  wrong?" with two buttons, Right and Wrong. 12 clips, half right and half wrong (hand washing, boards,
  tasting, fridge shelves, probe, sneezing, cut finger, phone and gloves). Clips need internet, so tests started
  offline leave them out.
- 318 live questions from all 13 handbook chapters, 12 of them video clips (+2 old picture-frame video questions held back, D5) in every language the app offers; question order and answer
  order shuffled every time; results with a score ring, counts, and every mistake explained.
- Add-to-home-screen button with phone-specific help; iPhone code hand-over (D13).

Seller app: password once per phone; make / copy / WhatsApp a code, with an optional time limit (1, 3, 7 or 30
days from the first use, for people who want to try it first; changeable later, D25); make a bunch of codes in
one go (up to 50) and copy, turn off, turn on or delete the whole bunch at once (D33); list with status
(including "Time over") and each code's results summary; a Results tab with totals, full-mock pass rate, who is
ready, test types, weakest topics, hardest questions and languages, and a page per person (D26); reset for a
new phone;
turn off / on; delete; its own home-screen icon (D12, D14).

## 5. Business model (agreed 28 Oct 2026)

- 20 SAR per person, paid upfront in cash to the seller, who makes them a code (D10). One payment, not a
  subscription: workers need it for a few weeks before their exam.
- Workers offered 50 SAR, so there is room to raise the price once pass results prove it works.
- Sell honestly (D11): independent practice, not official questions, no made-up "normal price".
- Before this becomes regular income: settle who legally receives the money and under which entity, and
  how payments move from Saudi Arabia (open item in progress.md).

## 6. Roadmap

Ordered; each step should be finished, tested and documented before the next.

1. **Prove it works** (now): free or paid testers through Wessam; collect confusing words per language and,
   above all, real exam results. Target: 10 workers with results.
2. **Bigger bank:** done 28 Oct 2026, about 300 questions written from the handbook, every chapter covered (D23).
   Next: add questions on topics workers report from the real exam.
3. **Content quality:** native speakers check Bangla, Urdu and Hindi; check the few answers that rely on
   general advice the handbook doesn't state (fridge shelf order, reheat only once, return to work after
   vomiting); add questions on any topic workers report from the real exam.
4. **Video questions:** 12 cartoon clips are live (D31). Next: ask workers what the real exam clips show and
   add clips for those situations; later, real footage (filmed in a kitchen) could replace the cartoons.
5. **Protect the content:** make the GitHub repo private (Vercel deploys private repos; the old GitHub Pages
   link then stops working); optionally load questions from the API only for unlocked phones.
6. **More languages** the exam offers: Nepali, Malayalam, Tamil, Filipino first (section 8).
7. **Results and progress:** done 28 Oct 2026 for the seller (Results tab, D26). Next: show workers their own
   progress and weak topics; spaced repetition of mistakes; an owner view per business.
8. **Owner product:** owners buy codes for their staff and see readiness; later the per-branch food-safety
   checks product (fridge temperature logs, certificate expiry tracker, inspection checklists) at around
   149 SAR per branch per month.
9. **Grow beyond one seller:** several sellers with their own logins and code counts; online payment through
   a merchant of record, later a Saudi entity; a custom domain.

## 7. Competition (researched before 28 Oct 2026)

Taqtics (operations software for big chains), AKLI (digital HACCP, about 299 SAR per branch per month),
Modeeri (Egypt), SafetyCulture (global checklists), Ektefa (HR). None sells exam practice for this test.

## 8. How to make common changes

**Add or fix a question:** check the fact in [handbook.md](handbook.md) (and the handbook itself), edit
`data/questions.json` (format: `data/CLAUDE.md`), give it the next free id and its chapter (`ch`), fill all
languages, run `node scripts/validate-questions.js`, then the tests (CLAUDE.md section 5).

**Add a language** (example: Swahili, `sw`):
1. `js/i18n.js`: add `{ code, name in its own script, English name, dir, html lang, voice prefixes }` to
   `KARTAK_LANGS` (its place there is its place in the dropdown and on the first screen), then copy the `en`
   block of `KARTAK_UI` to `sw` and translate every value (same keys and array lengths).
2. `data/questions.json`: add `"sw"` to `languages` and a `sw` block to every question. Do it in stages: a
   word list (glossary) first so every question uses the same words, then the questions in chunks, then an
   independent review (how it was done for the 7 languages added on 28 Oct: D24).
3. `css/app.css` + the Google Fonts link in `index.html`: a font and line-height rule if the script needs one.
   Nothing to change in `js/app.js`: the dropdown, tiles, direction and voice come from `KARTAK_LANGS`.
4. `node scripts/validate-questions.js` (checks the bank and that every language in `i18n.js` is in the bank),
   then the tests: the browser test opens every language, checks its words and questions, its direction and
   that nothing is wider than a 390 px phone.

**Make a clip** (cartoon, no sound, no words, D27, D31): write `scripts/clips/<name>.html` that loads
`lib.js` (shared kitchen, worker, hands, boards, knife) and defines `render(t)`; copy a finished clip as a start.
Then `node scripts/make-clip.mjs <name> <seconds>` writes `videos/<name>.mp4` (keep it under 1 MB). A "right"
clip has no mistake at all; a "wrong" clip has exactly one, big and slow. Use it in `data/words.json` as
`"pic": {"video": "/videos/<name>.mp4"}`, or as a question: `"type": "video", "clip": "/videos/<name>.mp4",
"ans": 0` (right) or `1` (wrong), `q` and `e` in every language and no `o` (format in `data/CLAUDE.md`).
Add a row to `videos/CLAUDE.md` and `scripts/CLAUDE.md`.

**Change the timer or test sizes:** `QSEC` and `SIZES` at the top of `js/app.js`; update the wording in
`js/i18n.js` (`fullD`, `quickD`, `practiceD`, `intro`) and plan.md section 3.

**Change the seller password:** pick a new one, compute its SHA-256 and run
`update kartak_settings set v = '<hash>' where k = 'admin_hash'` on the `kartak` database (Neon console).
Tell the seller privately; never write the password in the repo.
