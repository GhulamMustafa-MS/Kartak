// GET -> { ok: true } when the function can reach the database.
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try { await sql`select 1 from kartak_codes limit 1`; return res.json({ ok: true }); }
  catch (e) { return res.status(500).json({ ok: false }); }
}
