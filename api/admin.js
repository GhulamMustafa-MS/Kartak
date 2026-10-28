// Admin actions for the person selling codes. POST { key, action, code?, note? }
// action: "list" | "new" | "reset" | "disable" | "enable" | "delete". The key is checked against a SHA-256 hash stored in the database.
import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";

const sql = neon(process.env.DATABASE_URL);
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
const gen = () => Array.from(crypto.randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join("");
const ALLOWED_ORIGINS = ["https://kartak-seller.vercel.app"];
const norm = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  // The seller app lives on its own address, so allow it to call this endpoint.
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  try {
    const hash = crypto.createHash("sha256").update(String(body.key || "")).digest("hex");
    const allowed = await sql`select 1 from kartak_settings where k = 'admin_hash' and v = ${hash}`;
    if (!allowed.length) {
      await new Promise((r) => setTimeout(r, 1000));
      return res.status(401).json({ ok: false, reason: "key" });
    }
    const code = norm(body.code);
    let made = null;
    if (body.action === "new") {
      const note = String(body.note || "").trim().slice(0, 60);
      for (let i = 0; i < 5 && !made; i++) {
        const r = await sql`insert into kartak_codes (code, note) values (${gen()}, ${note}) on conflict do nothing returning code`;
        if (r.length) made = r[0].code;
      }
    } else if (body.action === "reset") {
      await sql`update kartak_codes set device_id = null, reset_count = reset_count + 1 where code = ${code}`;
    } else if (body.action === "disable") {
      await sql`update kartak_codes set disabled = true where code = ${code}`;
    } else if (body.action === "delete") {
      await sql`delete from kartak_codes where code = ${code}`;
    } else if (body.action === "enable") {
      await sql`update kartak_codes set disabled = false where code = ${code}`;
    }
    const list = await sql`
      select code, note, device_id is not null as active, disabled, created_at, activated_at, last_seen, reset_count
        from kartak_codes order by created_at desc limit 500`;
    return res.json({ ok: true, made, list });
  } catch (e) {
    return res.status(500).json({ ok: false, reason: "server" });
  }
}
