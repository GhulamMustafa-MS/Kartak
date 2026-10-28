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
- 11 languages: Arabic, English, Urdu, Malayalam, Hindi, Bengali, Tamil, Turkish, Filipino, Indonesian, Nepali.
- One free retake (at least 3 days and at most 3 months after the first attempt); after a second fail, proof
  of training and a paid attempt. The certificate is renewed every 3 years.
- The official handbook (BK-FS-Workers-E-2025-01) forbids copying or translating it, so Kartak's questions are
  original (D6).

**Fixed food-safety numbers** used in every question, so the bank never contradicts itself (WHO Five Keys,
Codex general hygiene principles): fridge 5°C or below; freezer −18°C or colder; danger zone 5°C to 60°C;
cook to at least 70°C in the centre; reheat once, until steaming hot, at least 70°C; hot holding 60°C or
above; never more than 2 hours at room temperature; wash hands with soap at least 20 seconds and dry with a
paper towel; defrost in the fridge; first in, first out; never use food past its use-by date. No other
specific numbers (no fines, ppm or legal details).

## 4. What is built (details: [architecture.md](architecture.md), [api.md](api.md))

Worker app (installable, works offline after the first visit):
- Language picker: English, اردو, हिंदी, বাংলা; switchable any time; Urdu right-to-left.
- Code gate: a code from the seller unlocks the app on one phone (D9).
- Full mock exam (50 random questions, 1:30 each, 80% to pass), quick test (15, timed), practice (15, no timer,
  answer and reason after each), "Learn the question types" with a small example of each type.
- 100 live questions (+2 video questions held back, D5) in all four languages; question order and answer
  order shuffled every time; results with a score ring, counts, and every mistake explained.
- Add-to-home-screen button with phone-specific help; iPhone code hand-over (D13).

Seller app: password once per phone; make / copy / WhatsApp a code; list with status; reset for a new phone;
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
2. **Content quality:** native speakers check Bangla, Urdu and Hindi; check answers that rely on general
   advice (fridge shelf order, return to work after vomiting, dented cans) against what the real exam
   expects; add questions on any topic workers report from the real exam.
3. **Video questions:** find out what the real videos show; make 7-8 short clips with an AI video tool
   (Google Veo via Gemini/Flow, or Kling; about £19 for a month) or film them; host them with the app; turn
   the video questions back on (`enabled: true`) and add new ones (D5).
4. **Protect the content:** make the GitHub repo private (Vercel deploys private repos; the old GitHub Pages
   link then stops working); optionally load questions from the API only for unlocked phones.
5. **More languages** the exam offers: Nepali, Malayalam, Tamil, Filipino first (section 8).
6. **Results and progress:** save each attempt (with consent) so the seller/owner sees who is ready;
   per-topic weak areas; spaced repetition of mistakes.
7. **Owner product:** owners buy codes for their staff and see readiness; later the per-branch food-safety
   checks product (fridge temperature logs, certificate expiry tracker, inspection checklists) at around
   149 SAR per branch per month.
8. **Grow beyond one seller:** several sellers with their own logins and code counts; online payment through
   a merchant of record, later a Saudi entity; a custom domain.

## 7. Competition (researched before 28 Oct 2026)

Taqtics (operations software for big chains), AKLI (digital HACCP, about 299 SAR per branch per month),
Modeeri (Egypt), SafetyCulture (global checklists), Ektefa (HR). None sells exam practice for this test.

## 8. How to make common changes

**Add or fix a question:** edit `data/questions.json` (format: `data/CLAUDE.md`), give it the next free id,
fill all four languages, run `node scripts/validate-questions.js`, then the tests (CLAUDE.md section 5).

**Add a language** (example: Nepali, `ne`):
1. `js/i18n.js`: copy the `en` block to `ne` and translate every value.
2. `data/questions.json`: add `"ne"` to `languages` and a `ne` block to every question
   (the validator lists any that are missing).
3. `index.html`: add a button in `#langs`; `js/app.js`: add the tile in `drawLang()` and the voice code in
   `TTS`; `css/app.css`: font and line-height rules if the script needs them (Google Fonts link in
   index.html). Right-to-left languages also need the `dir` rule in `syncChrome()`.
4. Tests, then check a question and the result screen on a phone.

**Change the timer or test sizes:** `QSEC` and `SIZES` at the top of `js/app.js`; update the wording in
`js/i18n.js` (`fullD`, `quickD`, `practiceD`, `intro`) and plan.md section 3.

**Change the seller password:** pick a new one, compute its SHA-256 and run
`update kartak_settings set v = '<hash>' where k = 'admin_hash'` on the `kartak` database (Neon console).
Tell the seller privately; never write the password in the repo.
