/*
 * api/activate.js - POST /api/activate: unlock the worker app with an access code.
 *
 * Purpose:    Checks a code and locks it to the first phone that uses it (decision D9).
 *             Request  { code, device }  (device = random id the app keeps in localStorage "kartak-dev")
 *             Response { ok: true } | { ok: false, reason: "invalid" | "used" | "disabled" }
 *             The same phone can call it again any time (the app re-checks on every launch).
 * Used by:    js/app.js (activate()).
 * Depends on: api/_db.js; table kartak_codes (db/schema.sql).
 */
import { sql, normCode as norm, readBody } from "./_db.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const body = readBody(req);
  const code = norm(body.code);
  const device = String(body.device || "").slice(0, 64);
  if (code.length !== 6 || device.length < 8) return res.json({ ok: false, reason: "invalid" });
  try {
    const won = await sql`
      update kartak_codes
         set device_id = ${device}, activated_at = coalesce(activated_at, now()), last_seen = now()
       where code = ${code} and not disabled and (device_id is null or device_id = ${device})
   returning code`;
    if (won.length) return res.json({ ok: true });
    const row = await sql`select disabled from kartak_codes where code = ${code}`;
    if (!row.length) return res.json({ ok: false, reason: "invalid" });
    return res.json({ ok: false, reason: row[0].disabled ? "disabled" : "used" });
  } catch (e) {
    return res.status(500).json({ ok: false, reason: "server" });
  }
}
