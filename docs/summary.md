# Problems and limitations

**The one home for problems met (section 1) and limitations and risks (section 2).**

## 1. Problems met and how they were solved

| Date | Problem | Solution |
|---|---|---|
| 28 Oct | The HTML file sent on WhatsApp showed tiny on Android and blank on iPhone (iPhone previews don't run scripts) | Hosted the app at a real web address (GitHub Pages, then Vercel) |
| 28 Oct | Phones kept showing the old version | Close the tab and reopen; add `?v=N` to the link; the service worker is network-first |
| 28 Oct | The name Jahiz clashed with the delivery app Jahez | Renamed to Kartak after checking alternatives (D2) |
| 28 Oct | Ordering questions didn't match the real exam | Arrows on pre-shuffled steps (D7) |
| 28 Oct | "Droppings" wasn't understood by a Bangla-speaking worker (formal Bangla word) | Everyday words in all languages ("rat, mouse or cockroach poo") |
| 28 Oct | A public link can be forwarded for free | Per-person codes locked to one phone (D9) |
| 28 Oct | Couldn't create a public repo or Neon project from the AI session | User created the repo; Vercel connector used for hosting (D8) |
| 28 Oct | Vercel's default protection would have shown workers a Vercel login | Protection limited to preview deployments |
| 28 Oct | iPhone home-screen app forgot the code | One-time hand-over token (D13) |
| 28 Oct | Installing the seller page installed the worker app | Separate seller project and address (D12) |
| 28 Oct | Quick taps selected text and cards stayed highlighted | Tap fixes (D15) |
| 28 Oct | The first bank's numbers (WHO) disagreed with the official handbook (60°C vs 63°C, 70°C vs 75°C and 82°C, thawing in cold water) | Every question checked and corrected against the handbook (D22, handbook.md) |
| 28 Oct | The handbook contradicts itself on cooling (1.5 hours in chapter 11 and its answer key, 2 hours in chapter 6) and fridge temperature (5°C or below, 0-4°C, 4°C or below) | Questions use the answer-key value (1.5 hours) and "5°C or below"; never offer both conflicting values as options |
| 28 Oct | In right-to-left text (Urdu, Arabic) temperatures showed reversed, "C°18−" for "−18°C", and the thermometer scale showed "5−" | Numbers and temperatures are wrapped in a left-to-right box (`txt()` in js/app.js); the thermometer drawing is always left-to-right; browser test checks every language |
| 28 Oct | Offline only worked from the second visit: the service worker saved files only after it had started, so the first visit's questions were not saved | `sw.js` saves the app and questions when it installs (`kartak-v3`); it also registers on localhost so the browser test can turn the internet off and check |
| 30 Oct | A beginner review found 15 more questions that a worker with no training would find confusing (textbook wording, HACCP jargon, ordering questions with more than one sensible order, numbers that seemed to clash) | Rewritten in kitchen words in all 11 languages, none dropped, 2 clearer ordering questions added (D30) |
| 30 Oct | Changing a question could reset a worker's saved place in "All questions" (any change to the bank started it again) | `resumeAll()` keeps the place and drops only answered questions that changed shape; browser test checks it |
| 30 Oct | Ordering question k139 (the life of a spore: conditions get bad, spore forms, waits, wakes) was abstract science that made no sense to a kitchen worker (Mustafa tested it on his phone) | Rewritten as a kitchen story about cooked rice left out (raw rice has spores, they survive cooking, rice left warm, spores wake and germs multiply, germs make poison), same id and chapter, all 11 languages; the other 50 ordering questions were read through and kept |
| 29 Oct | "Listen" on an ordering question read the steps in the correct order, giving the answer away (it read the stored list, which is kept correct-first); the other types were also read in stored order, not the shuffled order on screen | Listen now reads the choices exactly as they are on the screen; browser test fakes a phone voice and checks it |
| 29 Oct | The phone's Back button closed the whole app (it is one page with no history) | Each app keeps one history entry while an inner screen is open; Back now goes to the home screen (seller: up a level), and asks before losing test answers (D28) |
| 28 Oct | Earlier reply said 20 ordering questions; the bank has 16 live | Counted by `scripts/validate-questions.js`, which prints the real mix |

## 2. Limitations and risks

**Content**
- Every translation was written by AI (Urdu, Hindi, Bangla first; Arabic, Nepali, Malayalam, Tamil, Filipino,
  Indonesian, Turkish on 28 Oct, each reviewed by a second AI against the English); only one Bangla-speaking
  worker has tried the app. Points the reviewers left for a native speaker: Arabic, how "كارتك" reads and a few
  number forms; Nepali, "nuts" and "pests" wording; Malayalam, "shelf" (തട്ട്) and the Kartak spelling; Tamil,
  phone menu labels and rice (சாதம்/சோறு); Filipino, "lentils (munggo)"; Indonesian, "basi"/"rusak" for spoiled;
  Turkish, %80 vs 80% and "clean as you go". Phone menu labels in the install steps are best guesses.
- Answers follow the official handbook (D22). A few questions rely on general advice the handbook doesn't
  state (fridge shelf order, reheat only once, return to work after vomiting) and may differ from the exam.
- The handbook is an English edition; the exam's Urdu, Hindi and Bangla wording may use different words.
- No video questions yet (D5); the real exam has them.
- The real exam's videos are real footage; Kartak's clips are cartoons (D27), so they look different. The Key
  words were written by AI in every language and reviewed by a second AI (5 meaning fixes), not yet by
  native speakers.
- Some of the 204 new questions use steps or wrong options from general good practice where the handbook
  gives no fixed order or example (writers flagged them on 28 Oct); native speakers and real exam reports
  should confirm them.
- A worker who was part-way through "All questions" before 28 Oct carries on with the old 100 questions
  until they press "start again".
- The real exam's exact topic weighting is unknown; the bank's mix is a best guess.

**Security and access**
- The repo is public, so anyone technical can read the questions and the code. The code lock stops ordinary
  link sharing only. Fix: make the repo private (plan.md roadmap step 4).
- Results (D26) exist only from 28 Oct 2026; tests taken before were never stored. Timed tests left half-way are
  not recorded. A phone that never comes back online never sends its results.
- Results are personal data tied to a name the seller types: keep names to first names or nicknames, and
  delete codes (which deletes their results) when they are no longer needed. Workers are told their results
  are saved; there is no way yet for a worker to ask for their results to be removed except through the seller.
- A time-limited code (D25) is only checked when the app opens with internet, so a phone that stays offline
  keeps working after the time is over until it next goes online.
- Device ids live in the browser's storage: clearing site data or using another browser looks like a new
  phone, and the seller has to reset the code.
- One shared seller password; no per-seller accounts or audit log.
- No rate limit on `/api/activate`; codes have 887 million combinations, so guessing is impractical, but a
  limit should be added if abuse appears.

**Product**
- Test results stay on the phone; the seller can't see who is ready.
- No online payment; cash through one seller.
- Not yet tested on a real iPhone end to end (home-screen install and hand-over were tested in a simulated
  iPhone browser).

**Business and legal**
- Who legally receives the money, and under which entity, is not settled.
- The name Kartak has not been checked against the Saudi trademark register (SAIP) or both app stores.
