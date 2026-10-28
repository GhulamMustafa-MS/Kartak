# Progress

**The one home for status** (CLAUDE.md section 3): where we are, what's next, open items and a dated log.
Update after every piece of work: rewrite START HERE (under 40 lines) and add a log entry on top. When the log
passes about ten entries, move the oldest into the Archive at the bottom.

## START HERE (last updated 28 Oct 2026)

**Where we are:** both apps are live and in use for testing in Saudi Arabia.
- Worker app https://kartak-app.vercel.app: 4 languages, 100 live questions, full mock / quick test /
  practice / learn the types, code lock, installable, offline.
- Seller app https://kartak-seller.vercel.app: make, send, reset, turn off and delete codes.
- Wessam has the seller link and password. Price agreed: 20 SAR per person, upfront (plan.md 5).
- Code split for growth and fully documented; tests pass (`cd tests && npm test`).

**Next steps (roadmap step 1-2, plan.md 6):**
1. Wessam gives codes to workers; collect confusing words per language and real exam results.
2. Ask workers what the real exam videos show (needed before making clips, D5).
3. Native speakers check Bangla, Urdu and Hindi.
4. The user tests the apps on a real iPhone (home-screen install and hand-over).
5. Turn off or delete the test code MUSTFA ("Mustafa test") in the seller app once testing is finished.

**Open items (the user's decisions):**
- Make the GitHub repo private? Protects the questions and this plan; the old GitHub Pages link would stop
  forwarding (summary.md 2, D20).
- Who legally receives the money and under which entity, before this is regular income (plan.md 5).
- Trademark/app-store check on the name before spending money on it (D2).

**Where things are:** rules `CLAUDE.md`; plan `docs/plan.md`; decisions `docs/design_decisions.md`; system and
IDs `docs/architecture.md`; endpoints `docs/api.md`; problems and limits `docs/summary.md`. A copy of the repo
is in the user's laptop folder `Downloads\Kartak` (not a git clone; see that folder's note).

## Log

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

## Archive

(empty)
