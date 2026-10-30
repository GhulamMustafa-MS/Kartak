# Progress

**The one home for status** (CLAUDE.md section 3): where we are, what's next, open items and a dated log.
Update after every piece of work: rewrite START HERE (under 40 lines) and add a log entry on top. When the log
passes about ten entries, move the oldest into the Archive at the bottom.

## START HERE (last updated 30 Oct 2026)

**Where we are:** both apps are live and in use for testing in Saudi Arabia.
- Worker app https://kartak-app.vercel.app: all 11 exam languages (English, Arabic, Urdu, Hindi, Bangla,
  Nepali, Malayalam, Tamil, Filipino, Indonesian, Turkish; dropdown at the top, D24), 306 live questions
  (all 13 handbook chapters, D22, D23), full mock / quick test / practice / all questions (saved place, every
  type or one type such as ordering only, D29) /
  key words, learn the types, code lock, installable, offline. The phone's Back button goes back a screen.
- Seller app https://kartak-seller.vercel.app: make (with an optional 1/3/7/30-day limit for trials), send,
  reset, change the time limit, turn off and delete codes; Results tab with each person's scores, readiness,
  weak topics and the hardest questions (D26).
- Wessam has the seller link and password. Price agreed: 20 SAR per person, upfront (plan.md 5).
- Code split for growth and fully documented; tests pass (`cd tests && npm test`).

**Next steps (roadmap steps 1 and 3, plan.md 6):**
1. Wessam gives codes to workers; collect confusing words per language and real exam results.
2. Ask workers what the real exam videos show (needed before making clips, D5).
3. Native speakers check every language except English (all AI-translated; reviewers' open points per
   language are in summary.md 2).
4. The user tests the apps on a real iPhone (home-screen install and hand-over).
5. Turn off or delete the test code MUSTFA ("Mustafa test") in the seller app once testing is finished.

**Open items (the user's decisions):**
- Make the GitHub repo private? Protects the questions and this plan; the old GitHub Pages link would stop
  forwarding (summary.md 2, D20).
- Who legally receives the money and under which entity, before this is regular income (plan.md 5).
- Trademark/app-store check on the name before spending money on it (D2).

**Where things are:** rules `CLAUDE.md`; plan `docs/plan.md`; decisions `docs/design_decisions.md`; system and
IDs `docs/architecture.md`; endpoints `docs/api.md`; problems and limits `docs/summary.md`. A copy of the repo
is in the user's laptop folder `Downloads\Code\Kartak` (not a git clone; see that folder's note).

## Log

- **30 Oct 2026 (2):** beginner review of the whole bank (D30): 15 confusing questions rewritten in kitchen words
  in all 11 languages (none dropped, every topic is in the handbook), 2 new ordering questions (k308 spill,
  k309 HACCP as a chicken routine), fridge and display numbers tied together in the explanations. 306 live
  questions (52 ordering). "All questions" now keeps the saved place when questions change. Translations by AI,
  each checked; native-speaker check still open.
- **30 Oct 2026:** ordering question k139 (spores) rewritten as a cooked-rice story in all 11 languages, after
  Mustafa found it made no sense; the other 50 ordering questions read through and kept. Same id, so saved
  places in "All questions" carry on.
- **29 Oct 2026 (4):** fixed "Listen" giving away the answer on ordering questions (it read the steps in the
  correct order); it now reads every question's choices in the order on the screen. Cache `kartak-v7`.
- **29 Oct 2026 (3):** "All questions" can be one type only (D29): a chooser shows All types and each
  question type with its count; the type is saved with the place. New words in all 11 languages (allPickT,
  allPickD, allTypes, nQ). Service worker cache `kartak-v6`. Tested in the test browser, not yet on a real phone.
- **29 Oct 2026 (2):** the phone's Back button no longer closes the apps (D28): worker app goes to the home
  screen and asks before throwing away test answers (new `leaveTest` words in all 11 languages); seller app goes
  person -> Results -> Codes. Service worker cache now `kartak-v5`. Tested in the test browser, not yet on a real phone.
- **29 Oct 2026:** "Key words" screen (D27): 33 exam words in all 11 languages with pictures, thermometers and
  a cartoon cross-contamination clip; clip maker in `scripts/`. Pitch for managers reframed as "Kartak makes the
  course pay off" (Wessam: workers need the course to understand the words). Real exam videos are real footage.
- **28 Oct 2026 (night, 3):** results and analytics (D26): the worker app sends every finished test; the seller
  app shows each code's summary, a Results tab and a page per person. Table `kartak_results` (migration 004)
  created on the live database. Recording starts now for all codes, old and new.
- **28 Oct 2026 (night, 2):** time-limited codes (D25): the seller picks no limit / 1 / 3 / 7 / 30 days when making
  a code and can change it later; counted from the first use; the app locks with a message in the worker's
  language when the time is over. Migration 003 run on the live database (existing codes have no limit).
- **28 Oct 2026 (night):** offline fixed for the first visit: the service worker now saves the app and all
  questions as soon as it installs (it used to save only what loaded after it started); browser test turns the
  internet off and checks practice still works.
- **28 Oct 2026 (late, 6):** Malayalam, Tamil, Filipino, Indonesian and Turkish added; every language had a
  word list, three translators and an independent full review before going live (D24).

## Archive

- **28 Oct 2026 (late, 5):** Nepali added (app screens + all 306 questions; review checked it is real Nepali, not
  Hindi: 2 meaning and 22 wording fixes).
- **28 Oct 2026 (late, 4):** Arabic added (app screens + all 306 questions, independent review: 3 meaning and 46
  wording fixes). Temperatures like −18°C now stay left-to-right inside Arabic and Urdu text, and the
  thermometer scale too (was showing "C°18−"); browser test checks it for every language.
- **28 Oct 2026 (late, 3):** language dropdown at the top instead of four buttons; first screen shows a tile per
  language; `KARTAK_LANGS` in `js/i18n.js` drives both; validator checks every screen language is in the bank;
  browser test opens every language and checks it fits a 390 px phone (D24). Seven more languages in progress.
- **28 Oct 2026 (late, 2):** checked the exam languages again in the official 2026 candidate guide (plan.md 3).
- **28 Oct 2026 (late):** the official handbook became the source of every question (D22): `docs/handbook.md`
  (syllabus and numbers); 17 old questions corrected to its numbers (63°C, 75°C, above 82°C, 1.5 hours, thaw
  in the fridge or microwave, wash hands before the hair cover); every question tagged with its chapter (`ch`);
  validator checks `ch` and `d`; browser test follows the bank size. Then 204 new questions in four languages,
  written chapter by chapter from the handbook, checked by an independent review (4 ambiguous ordering
  questions, duplicates and wording close to the handbook fixed): 304 live in all, every chapter covered (D23).
- **28 Oct 2026 (night):** "All questions" mode: the whole bank, untimed, answer after each, place saved
  on the phone with "carry on" and "start again" (D21). Roadmap: grow the bank to 200-300. Browser test added.
- **28 Oct 2026 (evening):** split the app into `index.html`, `css/`, `js/`, `data/questions.json`;
  `api/_db.js` shared by the endpoints; `db/schema.sql` + migrations; `scripts/` (question validator, icon
  maker); `tests/` (19 API checks, 11 browser checks, all passing); CLAUDE.md in every folder, a header on
  every file, `docs/` written from the chat history (D16, D19). Hindi added to the 2 held-back video questions.
- **28 Oct 2026 (afternoon):** seller app moved to its own address and icon (D12); delete codes (D14); tap
  fixes (D15); app icons, add-to-home-screen button and help, offline support, iPhone hand-over (D13);
  Hindi interface and all questions (D4); access codes on Vercel + Neon (D8, D9).
- **28 Oct 2026 (midday):** 100-question bank written in English, Urdu and Bangla; full mock 50 / quick 15 /
  practice 15 with shuffling (D17, D18); video questions held back (D5); ordering with arrows and a 1:30 timer
  after worker feedback (D3, D7); renamed to Kartak (D2); hosted on GitHub Pages.
- **28 Oct 2026 (morning):** first practice-test demo with Bangla, per-question timer and question-type help;
  first tests by Wessam (14/15) and a Bangla-speaking worker (failed; ordering and some words were hard).
- **Before 28 Oct 2026:** research on Saudi food-worker certificates, the Al Arkkan exam guide, competitors and
  the business model (plan.md 1, 3, 5, 7).
