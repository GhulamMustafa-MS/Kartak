/*
 * scripts/validate-questions.js - checks data/questions.json before every commit that touches it.
 *
 * Purpose:    Every question must have the same structure in every language, a valid answer and a
 *             known type, so a bad edit can't break the live app. Prints OK or a list of problems and
 *             exits with code 1 on any problem.
 * Run:        node scripts/validate-questions.js            (from the repo root, no install needed)
 * Depends on: data/questions.json (format: data/CLAUDE.md).
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
    if (q.type === "tf") { if (t.o) say(q, `${lang}: true/false must not have options`); }
    else if (!Array.isArray(t.o) || t.o.length !== n) say(q, `${lang}: needs ${n} options like English`);
  }
  if (["single", "picture", "video"].includes(q.type) && !(Number.isInteger(q.ans) && q.ans >= 0 && q.ans < n)) say(q, "ans must be an option index");
  if (q.type === "tf" && q.ans !== 0 && q.ans !== 1) say(q, "ans must be 0 (true) or 1 (false)");
  if (q.type === "multi" && !(Array.isArray(q.ans) && q.ans.length >= 2 && q.ans.every((a) => a >= 0 && a < n))) say(q, "ans must list at least two option indexes");
  if (q.type === "order" && "ans" in q) say(q, "order questions list options in the right order and have no ans");
  if (q.type === "picture" && !(q.pic && PIC_KINDS.includes(q.pic.kind) && typeof q.pic.v === "number")) say(q, "pic needs a kind and a number");
  if (q.type === "video" && q.enabled !== false) say(q, "video questions stay disabled until real clips exist (decision D5)");
}

const live = bank.questions.filter((q) => q.enabled !== false);
const byType = live.reduce((m, q) => ((m[q.type] = (m[q.type] || 0) + 1), m), {});
if (problems.length) { console.log(problems.join("\n")); console.log(`${problems.length} problem(s)`); process.exit(1); }
console.log(`OK: ${bank.questions.length} questions (${live.length} live), languages ${LANGS.join(", ")}, live by type ${JSON.stringify(byType)}`);
if (live.length < 50) { console.log("Problem: fewer than 50 live questions, the full mock needs 50"); process.exit(1); }
