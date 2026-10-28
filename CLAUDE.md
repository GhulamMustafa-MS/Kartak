# Working rules for Kartak (read fully at the start of every chat)

Kartak is a practice app for the Saudi food workers' health certificate exam, in the exam's languages
(see `KARTAK_LANGS` in `js/i18n.js`), plus a separate seller app for selling one-phone access codes.
Owner: Ghulam Mustafa (GitHub `GhulamMustafa-MS`). On-the-ground partner and seller in Saudi Arabia: Wessam.
These rules were set by the user; follow them without being reminded. If a rule here conflicts with what the
user says now, the user wins, then update this file.

## 1. Start of every chat

1. Read [docs/progress.md](docs/progress.md): the START HERE section says where we are and what's next.
2. Read [docs/plan.md](docs/plan.md) (what we're building and the roadmap) and skim the index at the top of
   [docs/design_decisions.md](docs/design_decisions.md) (every decision, dated, with who made it).
3. `git status` / `git log -5` so you know what's committed and deployed (every push to `main` deploys).
4. The CLAUDE.md in each folder lists its files; read the one for the folder you're about to change.

## 2. End of every piece of work (before saying it's done)

1. Run the checks (section 5). Only push when they pass.
2. Update `docs/progress.md`: START HERE (under 40 lines) and a dated log entry at the top of the log.
3. Record every decision in `docs/design_decisions.md` only (row in the index: date, who - User / AI -> user /
   AI - and why; an entry below for anything non-trivial, with the alternative rejected).
4. Problems met and how they were solved -> `docs/summary.md` section 1; limitations and risks -> section 2.
5. Update the header of every file you touched and the CLAUDE.md of every folder you touched (section 3).
6. Commit with a clear message ending in the Co-Authored-By line, push, then confirm the Vercel deployments
   are READY and the live check passes (section 6).
7. Sync the user's laptop copy `C:\Users\ghula\Downloads\Kartak` (not a git clone): copy every file changed in
   the commit there when the chat is linked to the laptop; if it isn't, say so and list the files to copy.
   Do this every time, without being asked. Goal: any new chat can pick up from the repo alone.

## 3. Documentation rules (always apply)

- **Every folder has a `CLAUDE.md`** with what the folder is for, a table of its files and the rules for
  changing them. Add the row when you add a file, in the same commit.
- **Every file starts with a header** saying what it is (JSON and PNG files can't have comments, so their
  folder's CLAUDE.md documents them instead). Shapes:
  ```
  /*                                    <!--                                -- file.sql - one line.
   * path/file.js - one-line summary.     path/file.html - one-line summary.  --
   *                                                                          -- Purpose: ...
   * Purpose:    what it does and why     Purpose:    ...                     -- Used by: ...
   * Used by:    who loads / calls it     Depends on: ...
   * Depends on: what it needs          -->
   * Run:        how (scripts only)
   */
  ```
- **One home per fact.** Status (where we are, what's next, open items) -> `docs/progress.md`;
  decisions -> `docs/design_decisions.md`; the plan, product facts, roadmap and how-tos -> `docs/plan.md`;
  how the system fits together, addresses and IDs -> `docs/architecture.md`; endpoints -> `docs/api.md`;
  problems, limitations, risks -> `docs/summary.md`; handbook syllabus and food-safety numbers ->
  `docs/handbook.md`. Everything else links to the home instead of repeating it.
- Don't create other planning files outside `docs/` unless asked.

## 4. How to write the code

- **No build step, no framework** (D16): plain HTML, CSS and browser JavaScript; files are served as they are.
  Keep it readable for the user: small functions, comments only where the *why* isn't obvious.
- **Every word the worker sees goes in `js/i18n.js`** in every language the app offers (the list is
  `KARTAK_LANGS` at the top of that file; the exam's 11 languages, D24) in the same commit. Never hard-code
  English in `js/app.js`. Arabic and Urdu are right-to-left. Indonesian's code is `ind`, never `id`. Words
  must be simple, everyday speech for kitchen workers (D4); explain harder words in brackets.
- **Questions live only in `data/questions.json`** (format in `data/CLAUDE.md`). They test the facts of the
  official handbook BK-FS-Workers-E-2025-01, whose syllabus and numbers are in `docs/handbook.md` (D22): every
  question must agree with it and carry its chapter (`ch`). Wording is always our own: never copy or translate
  the handbook's text or its "Test Your Knowledge" questions (it forbids it), never put the handbook PDF in the
  repo, and never claim questions are "the real questions" (D6).
- **Phones first:** test at 390 px wide; tap targets at least 44 px; hover effects only inside
  `@media (hover: hover)`; no text selection on buttons (D15). Respect `prefers-reduced-motion` and dark mode.
- **API** (`api/`): Vercel serverless functions, ES modules, one file per endpoint, shared code in
  `api/_db.js`. Every SQL value goes through the tagged template (parameters), never string-joined. Every
  request returns JSON with `ok`; never return secrets; `Cache-Control: no-store`.
- **Database changes** only through a new numbered file in `db/migrations/`, then update `db/schema.sql`.
- **Secrets never go in the repo** (it is public): the seller password and `DATABASE_URL` live only with the
  user, in the database (hashed) and in Vercel environment variables.

## 5. Checks (before every push)

```
node scripts/validate-questions.js          # question bank structure, every language
cd tests && npm install && npm test         # API rules + both apps in a phone-sized browser
```
First time on a computer: `cd tests && npm install && npx playwright install chromium`.
Only push when both end in OK / ALL ... PASSED.

## 6. Deploying (Vercel, from GitHub)

- Repo `GhulamMustafa-MS/Kartak`, branch `main`. **Every push to main deploys both apps automatically.**
- Two Vercel projects (team `ghulam-mustafas-projects-95532a5c`), details in `docs/architecture.md`:
  `kartak` (repo root -> https://kartak-app.vercel.app, workers + API) and
  `kartak-seller` (root directory `seller/` -> https://kartak-seller.vercel.app).
- After a push: check both deployments are READY and https://kartak-app.vercel.app/api/health returns
  `{"ok":true}`.

## 7. Working with the user

- The user is Mustafa: direct, busy, often on his phone or voice. Reply in plain, short, full sentences; be
  honest about limits; double-check numbers and counts before stating them.
- Do the work rather than offering to; ask only about decisions that are genuinely his.
- Messages he'll forward (to Wessam or workers) go in code blocks, short and natural, correct grammar,
  no colons or semicolons.
- Be exact about what is live, tested on a real phone, or only tested in the test browser.

## 8. Files and folders at the root

| File / folder | Purpose |
|---|---|
| `index.html` | Worker app shell (header, language switch, containers); everything else is drawn by `js/app.js` |
| `manifest.webmanifest` | Worker app identity for "Add to home screen": name Kartak, colours, icons (JSON, no comments) |
| `sw.js` | Worker service worker: install + offline, network first, never caches `/api/` |
| `seller.html` | Old seller address; forwards to the seller app |
| `package.json` / `package-lock.json` | Runtime dependency of `api/` only (`@neondatabase/serverless`); Vercel installs it |
| `.vercelignore` | What the `kartak` Vercel project must not publish (seller/, tests/, scripts/, docs/, db/, *.md) |
| `.gitignore` | node_modules, test screenshots, local Vercel/env files |
| `README.md` | Short public description and checks |
| [api/](api/CLAUDE.md) | Serverless endpoints for access codes |
| [css/](css/CLAUDE.md), [js/](js/CLAUDE.md) | Worker app styles and scripts |
| [data/](data/CLAUDE.md) | The question bank (`questions.json`) and its format |
| [db/](db/CLAUDE.md) | Schema and migrations |
| [icons/](icons/CLAUDE.md) | Worker app icons |
| [seller/](seller/CLAUDE.md) | The seller app (separate Vercel project) |
| [scripts/](scripts/CLAUDE.md) | Question validator, icon maker |
| [tests/](tests/CLAUDE.md) | API and browser tests |
| [docs/](docs/CLAUDE.md) | Plan, decisions, handbook facts, architecture, API, progress, problems and limitations |
