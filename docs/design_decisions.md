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
