// Moves an unlocked code to the home-screen copy of the app on iPhone, which has its own separate storage.
// POST { action: "make", code, device } -> { ok, token }   (only for the phone the code is locked to)
// POST { action: "redeem", token, device } -> { ok, code } (one use, expires after a day)
import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";

const sql = neon(process.env.DATABASE_URL);
const norm = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const device = String(body.device || "").slice(0, 64);
  if (device.length < 8) return res.json({ ok: false });
  try {
    if (body.action === "make") {
      const token = crypto.randomBytes(12).toString("base64url");
      const r = await sql`
        update kartak_codes set transfer_token = ${token}, transfer_expires = now() + interval '1 day'
         where code = ${norm(body.code)} and device_id = ${device} and not disabled returning code`;
      return res.json(r.length ? { ok: true, token } : { ok: false });
    }
    if (body.action === "redeem") {
      const r = await sql`
        update kartak_codes set device_id = ${device}, transfer_token = null, transfer_expires = null, last_seen = now()
         where transfer_token = ${String(body.token || "")} and transfer_expires > now() and not disabled returning code`;
      return res.json(r.length ? { ok: true, code: r[0].code } : { ok: false });
    }
    return res.json({ ok: false });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
}
