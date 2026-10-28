// POST { code, device } -> { ok } | { ok:false, reason: "invalid" | "used" | "disabled" }
// A code locks to the first phone (device id) that uses it. Only an admin reset frees it.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const norm = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
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
