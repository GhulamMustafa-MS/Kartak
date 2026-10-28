/*
 * api/result.js - POST /api/result: save test results from the worker app (decision D26).
 *
 * Purpose:    The worker app sends each finished test (and each block of 20 in "All questions") so the
 *             seller app can show how each code's person is doing. Request:
 *               { code, device, items: [{ id, mode, lang, total, correct, timedOut, seconds, asked, wrong, at }] }
 *             id = a random id made on the phone (the same result sent twice is saved once); asked / wrong =
 *             arrays of question ids; at = when the test finished (ISO; used if within the last 60 days).
 *             Only the phone the code is locked to can send (code + device must match), also after the
 *             code's time is over. Response { ok: true, saved } | { ok: false, reason: "code" | "invalid" }.
 *             "code" tells the phone to drop what it holds (the code was deleted or moved to another phone).
 * Used by:    js/app.js (record(), flushResults()).
 * Depends on: api/_db.js; tables kartak_codes, kartak_results (db/schema.sql).
 */
import { sql, normCode as norm, readBody } from "./_db.js";

const MODES = ["full", "quick", "practice", "all"];
const QID = /^k\d{3,4}$/;
const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);
const ids = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === "string" && QID.test(x)).slice(0, 400) : []);

// Checks one result from the phone; returns the row to save, or null if anything is off.
function clean(it) {
  if (!it || typeof it !== "object") return null;
  const total = int(it.total, 1, 400);
  if (!total || !MODES.includes(it.mode) || typeof it.id !== "string" || it.id.length < 8 || it.id.length > 64) return null;
  const correct = int(it.correct, 0, total), timedOut = int(it.timedOut || 0, 0, total);
  if (correct === null || timedOut === null) return null;
  const asked = ids(it.asked), wrong = ids(it.wrong);
  if (asked.length !== total || wrong.length > total) return null;
  const at = new Date(it.at), age = Date.now() - at.getTime();
  return {
    id: it.id, mode: it.mode, lang: String(it.lang || "").slice(0, 5), total, correct, timedOut,
    seconds: int(it.seconds, 0, 86400), asked: asked.join(","), wrong: wrong.join(","),
    at: age >= -60000 && age < 60 * 86400000 ? at.toISOString() : new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const body = readBody(req);
  const code = norm(body.code);
  const device = String(body.device || "").slice(0, 64);
  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (code.length !== 6 || device.length < 8) return res.json({ ok: false, reason: "invalid" });
  try {
    const owner = await sql`select 1 from kartak_codes where code = ${code} and device_id = ${device}`;
    if (!owner.length) return res.json({ ok: false, reason: "code" });
    let saved = 0;
    for (const it of items) {
      const r = clean(it);
      if (!r) continue;
      const done = await sql`
        insert into kartak_results (client_id, code, mode, lang, total, correct, timed_out, seconds, asked, wrong, finished_at)
        values (${r.id}, ${code}, ${r.mode}, ${r.lang}, ${r.total}, ${r.correct}, ${r.timedOut}, ${r.seconds}, ${r.asked}, ${r.wrong}, ${r.at})
        on conflict (client_id) do nothing returning id`;
      saved += done.length;
    }
    return res.json({ ok: true, saved });
  } catch (e) {
    return res.status(500).json({ ok: false, reason: "server" });
  }
}
