/*
 * scripts/validate-questions.js - checks data/questions.json before every commit that touches it.
 *
 * Purpose:    Every question must have the same structure in every language, a valid answer and a
 *             known type, so a bad edit can't break the live app. Prints OK or a list of problems and
 *             exits with code 1 on any problem.
 * Run:        node scripts/validate-questions.js            (from the repo root, no install needed)
 * Depends on: data/questions.json (format: data/CLAUDE.md); chapters 1-13 = docs/handbook.md;
 *             js/i18n.js (every language with screen words must be in the bank, and the other way round);
 *             data/words.json (Key words, D27: every word in every language, pictures and videos present);
 *             videos/ (every clip question's MP4 must exist, D31).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const file = path.join(__dirname, "..", "data", "questions.json");
const bank = JSON.parse(fs.readFileSync(file, "utf8"));
const LANGS = bank.languages;
const TYPES = ["single", "multi", "tf", "order", "picture", "video"];
const PIC_KINDS = ["fridge", "freezer", "probe", "hot"];
const problems = [];
const ids = new Set();
const say = (q, msg) => problems.push(`${q.id || "?"} (${q.type}): ${msg}`);

for (const q of bank.questions) {
  if (!q.id || ids.has(q.id)) say(q, "missing or duplicate id");
  ids.add(q.id);
  if (!TYPES.includes(q.type)) say(q, "unknown type");
  const n = q.en && q.en.o ? q.en.o.length : 0;
  for (const lang of LANGS) {
    const t = q[lang];
    if (!t || !t.q || !t.e) { say(q, `${lang}: missing question (q) or explanation (e)`); continue; }
    if (q.type === "tf" || q.clip) { if (t.o) say(q, `${lang}: true/false and clip questions must not have options`); }
    else if (!Array.isArray(t.o) || t.o.length !== n) say(q, `${lang}: needs ${n} options like English`);
  }
  if (["single", "picture", "video"].includes(q.type) && !q.clip && !(Number.isInteger(q.ans) && q.ans >= 0 && q.ans < n)) say(q, "ans must be an option index");
  // Clip questions (D31): an MP4 in videos/ and two fixed answers, 0 = right, 1 = wrong, like the real exam.
  if (q.clip) {
    if (q.type !== "video") say(q, "only video questions have a clip");
    if (q.ans !== 0 && q.ans !== 1) say(q, "clip ans must be 0 (right) or 1 (wrong)");
    if (!/^\/videos\/[a-z0-9-]+\.mp4$/.test(q.clip) || !fs.existsSync(path.join(__dirname, "..", q.clip))) say(q, `clip ${q.clip} not found in videos/`);
  }
  if (q.type === "tf" && q.ans !== 0 && q.ans !== 1) say(q, "ans must be 0 (true) or 1 (false)");
  if (q.type === "multi" && !(Array.isArray(q.ans) && q.ans.length >= 2 && q.ans.every((a) => a >= 0 && a < n))) say(q, "ans must list at least two option indexes");
  if (q.type === "order" && "ans" in q) say(q, "order questions list options in the right order and have no ans");
  if (q.type === "picture" && !(q.pic && PIC_KINDS.includes(q.pic.kind) && typeof q.pic.v === "number")) say(q, "pic needs a kind and a number");
  if ("ch" in q && !(Number.isInteger(q.ch) && q.ch >= 1 && q.ch <= 13)) say(q, "ch must be a handbook chapter 1-13 (docs/handbook.md)");
  if ("d" in q && ![1, 2, 3, 4].includes(q.d)) say(q, "d must be 1, 2, 3 or 4");
  if (q.type === "video" && !q.clip && q.enabled !== false) say(q, "video questions without a clip (frames only) stay disabled (D5, D31)");
}

// The app offers a language only when js/i18n.js has its screen words; every one of those must be in the bank.
globalThis.window = {};
await import(path.join(__dirname, "..", "js", "i18n.js"));
const uiLangs = Object.keys(window.KARTAK_UI);
for (const l of uiLangs) if (!LANGS.includes(l)) problems.push(`js/i18n.js has "${l}" but data/questions.json does not`);
for (const l of LANGS) if (!uiLangs.includes(l)) problems.push(`data/questions.json has "${l}" but js/i18n.js does not`);
for (const l of uiLangs) if (!window.KARTAK_LANGS.some((m) => m.code === l)) problems.push(`"${l}" is missing from KARTAK_LANGS in js/i18n.js`);

// Key words (data/words.json, D27): every word in every language, a known picture, the video file present.
const words = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "words.json"), "utf8")).words;
const wids = new Set();
for (const w of words) {
  if (!w.id || wids.has(w.id)) problems.push(`words.json ${w.id || "?"}: missing or duplicate id`);
  wids.add(w.id);
  for (const lang of LANGS) if (!w[lang] || !w[lang].t || !w[lang].d) problems.push(`words.json ${w.id}: ${lang} needs t and d`);
  const p = w.pic || {};
  if (!p.icon && !p.thermo && !p.video) problems.push(`words.json ${w.id}: pic needs icon, thermo or video`);
  if (p.video && !fs.existsSync(path.join(__dirname, "..", p.video))) problems.push(`words.json ${w.id}: video ${p.video} not found`);
}
for (const lang of LANGS) if (!window.KARTAK_UI[lang] || !window.KARTAK_UI[lang].words) problems.push(`js/i18n.js ${lang}: needs "words" and "wordsD"`);

const live = bank.questions.filter((q) => q.enabled !== false);
const byType = live.reduce((m, q) => ((m[q.type] = (m[q.type] || 0) + 1), m), {});
const byCh = live.reduce((m, q) => ((m[q.ch || "none"] = (m[q.ch || "none"] || 0) + 1), m), {});
if (problems.length) { console.log(problems.join("\n")); console.log(`${problems.length} problem(s)`); process.exit(1); }
console.log(`OK: ${words.length} key words; ${bank.questions.length} questions (${live.length} live), languages ${LANGS.join(", ")}, live by type ${JSON.stringify(byType)}, live by handbook chapter ${JSON.stringify(byCh)}`);
if (live.length < 50) { console.log("Problem: fewer than 50 live questions, the full mock needs 50"); process.exit(1); }
