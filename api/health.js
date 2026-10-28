/*
 * api/health.js - GET /api/health: { ok: true } when the API can reach the database.
 *
 * Purpose:    Quick check after a deploy or a database change (open the URL in a browser).
 * Used by:    people; nothing in the apps calls it.
 * Depends on: api/_db.js; table kartak_codes.
 */
import { sql } from "./_db.js";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try { await sql`select 1 from kartak_codes limit 1`; return res.json({ ok: true }); }
  catch (e) { return res.status(500).json({ ok: false }); }
}
