# Design decisions

**The one home for every decision** (CLAUDE.md section 3): what was decided, when, by whom, why, and the
alternative rejected. Things considered and dropped stay here with the reason.

## Decision index (date order)

Who: **User** = decided by Mustafa (sometimes passing on Wessam or a worker); **AI -> user** = proposed by
the AI and accepted; **AI** = made by the AI while building, within the agreed rules, and reported.

| # | Date | Decision | Who | Why / where |
|---|---|---|---|---|
| D1 | before 28 Oct | Start with exam practice for workers; branch food-safety checks for owners later | User | Workers fail the format; no competitor does exam prep (plan.md 1, 7) |
| D2 | 28 Oct | Name: Kartak (كرتك, "your card"), replacing Jahiz | User, from an AI shortlist | Jahiz sounds like the delivery app Jahez; Najah, Najih, Amaan, Salama, Nazeef were taken |
| D3 | 28 Oct | A timer on each question, 1:30, next question opens when it runs out | User (worker reports) | Workers first said about 1 minute, then confirmed 1:30 |
| D4 | 28 Oct | Languages English, Urdu, Bangla, then Hindi; everyday spoken words | User | The workers Wessam knows; Hindi added the same day |
| D5 | 28 Oct | Video questions held back; real clips later | User | Emoji "clips" didn't feel like the exam; paying for AI video waits until we know what the real videos show |
| D6 | 28 Oct | Original questions only, fixed numbers, "not the official test" notice | AI -> user | The handbook forbids copying; one set of numbers keeps answers consistent |
| D7 | 28 Oct | Ordering: all steps shown mixed up, arrows at the end of each to move it | User (worker's sketch) | Matches the real exam; replaced tap-to-place slots |
| D8 | 28 Oct | Host on Vercel with a Neon Postgres database | AI | GitHub Pages can't run a server; Neon Functions were unavailable (account managed by Vercel, region) |
| D9 | 28 Oct | One code per person, locked to one phone; the seller resets it | User idea, AI design | Stops a link being forwarded for free; no SMS cost |
| D10 | 28 Oct | 20 SAR per person, upfront, cash to the seller | User + Wessam | Workers offered 50; "pay after you pass" rejected because people won't pay after passing |
| D11 | 28 Oct | Sell honestly: no invented "normal price", no claim of a company that doesn't exist | AI -> user | Trust is the whole sales channel |
| D12 | 28 Oct | Seller app on its own address with its own icon; the API allows it by CORS | AI, after the user's request | Installing from the same address opened the worker app |
| D13 | 28 Oct | Add-to-home-screen button; iPhone hand-over token | User request, AI design | Settings menus are hard for workers; iPhone home-screen apps don't share storage with Safari |
| D14 | 28 Oct | Seller can delete codes (two taps) | User | Clean up old and test codes |
| D15 | 28 Oct | No text selection, tap flash or sticky hover on phones | AI, after the user's report | Quick taps selected text and cards stayed highlighted |
| D16 | 28 Oct | No framework or build step; split the app into HTML, CSS, JS, strings and a JSON question bank | AI (user asked for scalability) | Easy to read and edit; questions and languages change without touching code |
| D17 | 28 Oct | Full mock 50, quick test 15, practice 15; random from the bank; answers shuffled | User | Short and full versions; can't learn "it's the second one" |
| D18 | 28 Oct | 100-question bank, more ordering questions | User asked, AI wrote | Variety for repeated mocks; workers struggle most with ordering |
| D19 | 28 Oct | Folder CLAUDE.md files, file headers, one home per fact | User | Same way of working as the user's COM661 project |
| D21 | 28 Oct | "All questions" mode: every live question, no timer, answer after each, place saved on the phone | User asked, AI designed the saving | Thorough practice over several days; 100 questions is too many for one sitting |
| D22 | 28 Oct | The official handbook is the source of every question; its numbers replace the WHO ones | User | The exam is built on the handbook (BK-FS-Workers-E-2025-01); facts in handbook.md |
| D23 | 28 Oct | Grow the bank to about 300 questions covering all 13 handbook chapters, each tagged with its chapter | User asked, AI wrote | Full mocks repeat less; every part of the syllabus is practised |
| D24 | 28 Oct | All 11 exam languages (adds Arabic, Nepali, Malayalam, Tamil, Filipino, Indonesian, Turkish); a language dropdown at the top replaces the four buttons | User | Kitchen workers in Saudi speak them; the real exam offers exactly these 11 |
| D25 | 28 Oct | Codes can have a time limit (no limit / 1 / 3 / 7 / 30 days), counted from the first use; the seller sets it when making the code and can change it later | User asked, AI designed | Trials for people who don't want to pay the full amount first |
| D26 | 28 Oct | Save every finished test against its code and show analytics in the seller app (Results tab + a page per person), for Mustafa and Wessam | User | See who is ready, which topics and questions people miss, which test types they use |
| D27 | 29 Oct | "Key words" screen: the exam's 33 hard words explained simply in every language, with pictures, thermometers and a cartoon video; the app is sold alongside the course, not instead of it | User asked (Wessam: workers won't understand HACCP, probes, danger zones before the course) | Workers learn the words before practising; managers see it supports the 800-riyal course |
| D28 | 29 Oct | The phone's Back button goes back a screen (to home in the worker app; person -> Results -> Codes in the seller app) instead of closing the app; leaving a test with answers asks first | User asked, AI designed | Back closed the whole app because it is one web page |
| D29 | 29 Oct | "All questions" can be only one type of question (for example only "Order the steps"); a chooser screen offers every type or one type, with how many questions each has | User asked, AI designed | Workers who struggle with one type (often ordering) can practise just that |
| D30 | 30 Oct | Beginner review of the bank: confusing questions are rewritten in kitchen words, never dropped, when their topic is in the handbook; two clearer ordering questions added; explanations tie the clashing numbers together (fridge 0-4°C vs 5°C, display 8°C) | User (rewrite, don't drop), AI reviewed and wrote | Workers practise with no food training; the exam covers the whole handbook, so no topic may be skipped |
| D31 | 30 Oct | Video questions go live as cartoon clips with two answers, Right and Wrong, like the real exam (Wessam: the exam always asks "is this right or wrong?"); 12 clips, half right, half wrong; replaces holding videos back (D5) | User asked, AI made the clips | The exam has video questions; workers should practise the format now, not wait for real footage |
| D32 | 30 Oct | Ordering steps stay neutral (no colour) until "Check my answer" | User | The red used for moved steps looked like a wrong answer |
| D33 | 30 Oct | The seller can make a bunch of codes in one go (1, 3, 5, 10, 20 or any number up to 50); codes made together share a batch id, show together in the list, and can be copied, turned off, turned on and deleted all at once | User asked, AI designed | Restaurants buy codes for several workers at a time; one by one was slow |
| D20 | 28 Oct | Keep the repo public for now | AI (open for the user) | The old GitHub Pages link redirects from it; see progress.md open items |

**Considered, then dropped:** pay after passing (D10); a monthly subscription (D10); SMS one-time
passwords (D9, cost); Neon Functions (D8, unavailable); emoji video clips (D5); taking money before testing
(advised against on 28 Oct, then the user and Wessam chose 20 SAR upfront with the code lock in place).

## D2. Name

Kartak (كرتك) is Saudi dialect for "your card", and "kart" sounds like "card" in Urdu, Hindi and Bangla.
Checked against app stores and the web on 28 Oct: Jahiz (too close to Jahez), Najah (education fair and an
app), Najih (an exam app; also close to the Ministry of Justice app Najiz), Amaan, Salama and Nazeef/Natheef
(existing apps) were rejected. A trademark search (SAIP) and app-store check are still needed before spending
money on the name (progress.md).

## D3, D7. Timer and ordering

The first version had one overall timer. Workers reported a timer per question ("one or two minutes"), so it
became 60 s, then 1:30 when a worker confirmed it. Ordering first used empty numbered slots filled by tapping;
a worker's sketch showed the real exam lists all steps with arrows at the end of each, so the app now shows
the steps already shuffled with up/down arrows. Side-by-side boxes (as sketched) don't fit a phone, so the
steps are stacked; the skill practised is the same.

## D8. Hosting

GitHub Pages first (free, no login). The code lock needed a server and database. Neon Functions could not be
used: the Neon account is managed through Vercel (no new projects) and the existing project's region
(aws-eu-west-2) has no Functions. So: Vercel serverless functions (region lhr1, London, next to the database)
and a separate `kartak` database with its own login `kartak_app` inside the existing Neon project, kept apart
from the Amigos data. Rejected: a separate free backend service (would need new accounts).

## D9, D13. Access codes and the iPhone hand-over

A code is 6 characters from an alphabet without look-alikes (no 0/O, 1/I/L), shown as ABC-123. The first
phone that uses it stores a random device id; other phones get "already used on another phone"; the seller's
reset frees it once. On iPhone, Safari and the home-screen copy have separate storage, so the home-screen copy
would lose the code; Safari keeps a one-time token (valid 1 day) in the address, and the home-screen copy
swaps it for the code and takes over the lock. If someone copies that address before adding to the home
screen, the token still works only once, so at most one extra phone can take the code, and the original
user then sees it is used and asks the seller. Rejected: putting the code itself in the address (forwardable).

## D12. Separate seller app

Both apps first lived on one address; installing the seller page installed the worker app (the worker
manifest covers the whole address). Now the seller app is its own Vercel project (`seller/` as root) on
kartak-seller.vercel.app, with a brown icon with a key. It calls the API on kartak-app.vercel.app, which
allows only that origin (CORS). Rejected: a second repo (more to keep in sync).

## D16. Code structure

The app started as one 300 KB HTML file. For growth it is split: `index.html` (shell), `css/app.css`,
`js/i18n.js` (all wording), `js/app.js` (logic), `data/questions.json` (the bank, fetched at start and cached
by the service worker). No framework or bundler, so any file can be read and edited directly and Vercel serves
files as they are. Tests (PGlite in-memory Postgres + Playwright) live in `tests/` with their own
package.json so Vercel never installs them. Rejected for now: React or a bundler (more tooling than the app
needs).

## D22. The handbook as the source

The user shared the official handbook on 26 Oct 2026. The first bank used general WHO numbers, and several
disagreed with the handbook: danger zone 5-60°C (handbook 5-63°C), cook to 70°C (75°C for 30 seconds), reheat
to 70°C (above 82°C), hot holding 60°C (63°C), cold running water for thawing (handbook: fridge or microwave
only), "never more than 2 hours out" (handbook: cool within 1.5 hours). On 28 Oct every question was checked
and corrected, and each was tagged with its chapter (`ch`). The syllabus and numbers now live in
[handbook.md](handbook.md). Where the handbook contradicts itself (cooling within 1.5 or 2 hours), questions
use its own test answer (1.5 hours) and never offer both as competing options. The wording stays original and
the PDF stays out of the repo, because the handbook forbids copying, adapting or translating it (D6).
Rejected: keeping WHO numbers (a worker who learns them would lose marks on the real exam).

## D23. About 300 questions

Written chapter by chapter from the handbook text, with a target mix of about 35% single answer, 20%
true/false, 18% multiple answers, 17% ordering and 10% picture, in all four languages. Each batch was checked
by script (all languages present, valid answers, no Urdu script in Hindi, no English words left in the
translations, 4-6 ordering steps) and merged with new ids after the last old one (k103-k307; k124 was
dropped in review and never published). A separate agent that had not written them then checked every new
question against the handbook: no answer was wrong; 4 ordering questions had more than one defensible order
and were fixed, and duplicates and wording too close to the handbook's lists were rewritten. Result: 304 live. Rejected: copying the
handbook's own "Test Your Knowledge" questions (forbidden, and too few).

## D24. Every exam language, and a dropdown

The user asked for all the exam's languages, Arabic first, then Nepali, then the rest, "done properly". Four
buttons don't fit eleven languages on a phone, so the header now has one dropdown: a native `<select>` styled
as a pill with a globe icon. On a phone it opens the phone's own list, which scrolls well, is large to tap and
works with screen readers. The first screen shows a tile per language (name in its own script, English name
under it). The list lives once, in `KARTAK_LANGS` in `js/i18n.js` (code, name, direction, html lang, voice),
so adding a language needs no change to `app.js`. Indonesian uses the code `ind` because every question
already has a field called `id`. Fonts: Noto Naskh Arabic (easier to read than Nastaliq for Arabic readers),
Noto Sans Malayalam and Tamil; Nepali shares the Devanagari font with Hindi.

How the translations were made, so the quality holds across 3,000+ texts: for each language, first a word
list (glossary) and the app screens; then the 306 questions in three chunks by separate agents, all using that
word list; a script checks every chunk (all questions present, same number of options, right script, no
English words left in non-Latin scripts, Western digits, and every number the same as in the English); then a
separate agent reviews each language against the English before it goes live. Rejected: a custom dropdown
menu (more code, worse on phones and for accessibility); buttons that scroll sideways (hard to discover);
machine translation without the word list (the same term would be translated differently across questions).

## D25. Time-limited codes (trials)

The user asked for codes that stop after a set time, so people can try the app before paying in full. The
seller picks no limit, 1, 3, 7 or 30 days when making a code (chips under the name box) and can change it later
with "Time limit" on the code, for example to No limit once a trial person pays. The days count from the
**first use** (`activated_at`), not from when the code is made, so a code that waits a few days in WhatsApp
loses nothing; a reset for a new phone does not restart the time, so a reset can't be used to get a fresh
trial. One new column `valid_days` (migration 003); the end date is worked out as activated_at + valid_days,
so changing the limit takes effect at once. The app already re-checks its code every time it opens with
internet; an expired code now answers `expired`, the app removes the saved code and shows the code screen with
"This code's time is over…" in the worker's language. Offline the app keeps working until the next time it
is online (as the user asked; see summary.md 2). Rejected: counting from the day the code is made (unfair if
the worker starts late); a separate end-date column (two facts to keep in step); turning the code off when it
ends (the seller couldn't tell "turned off" from "time over").

## D26. Results and analytics in the seller app

The user wanted per-customer analytics (average score, pass rate, test types taken, what they get wrong), seen
by him and Wessam in the seller app, and recorded from now on for every code, old ones included. The worker
app now sends each finished test (and every 20 answers of "All questions", which may never be finished) to
`/api/result`: type, language, score, time taken, and the ids of the questions asked and got wrong. It is
queued on the phone first (`kartak-outbox`), so offline tests are sent later, and each result has its own id,
so a retry can't count it twice. Only the phone the code is locked to can send, so nobody can fill another
person's record. The seller app shows each code's summary in the list, a Results tab (totals, full-mock pass
rate, people with a verdict, test types, weakest handbook chapters, hardest questions, languages) and a page per
person (scores over time, full mocks, weak topics, missed questions, recent tests). "Ready" = passed at least
2 full mocks and most of their full mocks, at 80% like the real exam. Topic and question names come from the
worker app's question bank, which the seller app may read (`vercel.json`). Workers are told on the results
screen, in their language, that their results are saved so the person who gave them the code can help.
Abandoned timed tests are not recorded (only finished ones). Rejected: a separate owner-only page (the user
chose the seller app); counting on the server from individual answers (more traffic, and tests run offline).

## D27. Key words, cartoon clips, and selling alongside the course

Wessam said workers won't understand the exam's words (HACCP, probe thermometer, danger zone) until they have
done the paid course. Two answers: the pitch now says Kartak makes the 800-riyal course pay off (practise after
training, send only ready workers to the exam), and the app gets a "Key words" screen. 33 words from the
handbook, each with the word as the questions use it, a short plain explanation with the handbook's numbers,
and a picture: a line icon, a thermometer at the right temperature, the danger zone drawn as a band from 5°C to
63°C, or a short video. Content lives in `data/words.json` (all 11 languages, written from each language's
glossary so the words match the questions) and loads only when the screen opens. The real exam's videos are
real footage (Wessam, 29 Oct); Claude can't film or generate realistic video, so the first clip
(cross-contamination) is a cartoon drawn frame by frame with code (`scripts/clips/`, `scripts/make-clip.mjs`).
Rejected for now: AI video tools (cost, wrong hands and text) and filming (needs a kitchen and permission);
both stay options for the video questions later.

## D28. The phone's Back button

Both apps are one web page that redraws itself, so the phone had no earlier page to go back to and Back closed
the app. Now each app adds one history entry when an inner screen opens (worker: a test, results, Learn, Key
words; seller: the Results tab, then one person) and removes it again when a button takes you back. Back
removes the entry and the app shows the screen above: the home screen in the worker app, Results then Codes
in the seller app. Back on the home screen (or the Codes tab) still closes the app, as phones expect. Leaving a
full mock, quick test or practice with at least one answer asks "Leave this test? Your answers will be lost."
(in every language), also from the Kartak logo; "All questions" never asks because it saves its place.
Rejected: going back one question at a time inside a test (answers are final in timed tests, and many Backs
would be needed to get out); a history entry per screen with the screen in the address (more to get wrong,
and Back from results would reopen a finished test).

## D29. Practise one type of question

Workers who struggle with one kind of question, most often putting steps in order, wanted to practise only
that kind. "All questions" now opens a chooser: "All types" or one type (pick one answer, pick all correct
answers, true or false, order the steps, picture question), each showing how many questions it has; types with
no live questions are hidden. The chosen type is saved with the place in "All questions", so carrying on stays
in that type and the home card says which type it is. Starting again goes back to the chooser. Results still go
to the seller as "All questions" (the analytics already show which questions each person gets wrong).
Rejected: a type filter on the timed mocks (the real exam mixes types, so the mocks should too) and filters on
several types at once (more taps for little gain; "All types" covers the mix).

## D30. Questions a beginner can follow

Mustafa found an ordering question (spores) that a worker with no food training could never follow, so every
live question was read as such a worker would read it (30 Oct). The ones that were confusing were rewritten,
not dropped, because every one of their topics is in the handbook syllabus (docs/handbook.md section 1) and the
exam can ask about it (Mustafa: "don't make them skip a topic, make it better for them"):
- Abstract or textbook questions now use plain words or a kitchen example: why food safety matters more today
  (k115), a bone in a kebab is an injury, not food poisoning (k181), HACCP's 7 principles and 12 steps (k241),
  germs that grow inside the body (k175), viruses passing from hands (k134).
- The three HACCP-steps ordering questions (k245-k247) explain each step in kitchen words, with the HACCP name in brackets, and a
  new question (k309) shows HACCP as a chicken-cooking routine (danger, safe number, check, fix, record).
- Ordering questions with more than one sensible order were rewritten so only one order makes sense (k016,
  k113, k305); the hand-washing pair became one full ordering question (k200) and one "which parts do you rub"
  question (k201); the water-temperature puzzle now shows the temperatures (k223). New k308: cleaning up a
  raw chicken juice spill.
- Numbers the handbook gives two ways stay as the handbook gives them (the exam may ask either), but the
  explanations now link them: "Set the fridge at 0-4°C, so chilled food stays at 5°C or below" and "8°C is
  only for cold food on display; in the fridge and in vans it must be 5°C or below".
Same ids are kept, so "All questions" keeps each worker's place: `resumeAll()` now drops only answered
questions that changed shape and re-shuffles unanswered ones (it used to restart when the bank changed).
Rejected: dropping the questions (skips exam topics) and changing the fridge numbers to one value (the
handbook and the exam use both).

## D31. Right-or-wrong video clips

The real exam shows a short video and asks whether what the worker does is right or wrong, with exactly two
answers (Wessam, 30 Oct). D5 had held video questions back until real clips existed; Mustafa asked for clips
now. Twelve cartoon clips were drawn with code (the method of D27, now with a shared `scripts/clips/lib.js` so
every clip has the same kitchen and worker): proper hand washing and a quick no-soap rinse dried on the apron,
separate red and green boards and the same board for chicken after vegetables, tasting with a clean spoon and
with a finger, covered raw chicken on the bottom shelf and uncovered chicken dripping onto a cake, a probe check
reaching 76°C, sneezing over a salad, a cut finger covered with a blue plaster and a glove, and touching a
phone then food in the same gloves. Six are right and six wrong, so guessing gives nothing. A right clip has no
mistake at all; a wrong clip has one, shown big and slow; no ticks, crosses or faces give the answer away.
In the bank a clip question is `"type": "video"` with `"clip"`, `ans` 0 = right, 1 = wrong, and only `q` and
`e` in each language; the app plays the MP4 above two buttons (Right, Wrong) and keeps it playing when the
worker taps. Videos are not saved for offline use, so a test started offline leaves clip questions out.
Rejected: a multiple-choice "what is wrong here?" format (the old frame questions; the exam does not ask that
way), AI video tools and filming (cost, permission; still an option to replace the cartoons with real footage).

## D32. No colour on ordering steps before checking

Moving a step used to colour every row red (the ordering type's colour), which looked like a wrong answer
before the worker had finished (Mustafa, 30 Oct). Rows and their numbers now stay neutral; green and red appear
only after "Check my answer" (or at the end of a timed test).

## D33. Bunches of codes

Mustafa (30 Oct) wanted to make several codes at once (for a restaurant buying for 3, 5 or 10 workers) and to
turn them off or delete them together. The "New code" card now has "How many codes" (chips 1 / 3 / 5 / 10 / 20
and a box for any number up to 50). Codes made in one go get the same `batch` id (`B` + 6 code letters, new
column, migration 005), the same name and the same time limit. The list draws them as one framed bunch with
Copy all, Turn all off / Turn all back on and Delete all (two taps, like every destructive button); each code
inside keeps its own buttons (reset, time limit, results). "Send on WhatsApp" for a bunch sends one message
listing every code. One code made on its own has no batch and looks exactly as before.
- Rejected: a separate "groups" table with its own name. A batch column is enough: a bunch is only ever made in
  one go, and its name is the codes' shared name.
- Rejected: letting the seller move codes between bunches later. Not asked for; adds screens.
- The cap of 50 per go keeps one request short and stops a mistyped 500.

