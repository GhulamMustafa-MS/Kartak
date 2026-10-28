/*
 * api/activate.js - POST /api/activate: unlock the worker app with an access code.
 *
 * Purpose:    Checks a code and locks it to the first phone that uses it (decision D9).
 *             Request  { code, device }  (device = random id the app keeps in localStorage "kartak-dev")
 *             Response { ok: true, ends? } | { ok: false, reason: "invalid" | "used" | "disabled" | "expired" }
 *             The same phone can call it again any time (the app re-checks on every launch with internet).
 *             A code with a time limit (valid_days, D25) stops working valid_days after its first use;
 *             "ends" is that moment (ISO date), so the app can show it.
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
         and (valid_days is null or activated_at is null or activated_at + make_interval(days => valid_days) > now())
   returning activated_at + make_interval(days => valid_days) as ends`;
    if (won.length) return res.json(won[0].ends ? { ok: true, ends: new Date(won[0].ends).toISOString() } : { ok: true });
    const row = await sql`
      select disabled, valid_days is not null and activated_at + make_interval(days => valid_days) <= now() as expired
        from kartak_codes where code = ${code}`;
    if (!row.length) return res.json({ ok: false, reason: "invalid" });
    return res.json({ ok: false, reason: row[0].disabled ? "disabled" : row[0].expired ? "expired" : "used" });
  } catch (e) {
    return res.status(500).json({ ok: false, reason: "server" });
  }
}
