/*
 * api/transfer.js - POST /api/transfer: carry an unlocked code into the iPhone home-screen app.
 *
 * Purpose:    On iPhone the home-screen copy of a web app has its own storage, so it would not know the
 *             code (decision D13). Safari asks for a one-time token ("make"), puts it in the address
 *             (/?t=TOKEN); the home-screen copy opens that address and swaps the token for the code
 *             ("redeem"), which moves the phone lock to its own device id. Tokens expire after a day.
 *             make:   { action: "make", code, device }    -> { ok, token }  (only the locked phone)
 *             redeem: { action: "redeem", token, device } -> { ok, code }   (one use)
 * Used by:    js/app.js (makeTransfer(), redeemTransfer()).
 *             A code whose time limit has passed (D25) can't be handed over.
 * Depends on: api/_db.js; columns transfer_token, transfer_expires, valid_days in kartak_codes.
 */
import crypto from "node:crypto";

import { sql, normCode as norm, readBody } from "./_db.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const body = readBody(req);
  const device = String(body.device || "").slice(0, 64);
  if (device.length < 8) return res.json({ ok: false });
  try {
    if (body.action === "make") {
      const token = crypto.randomBytes(12).toString("base64url");
      const r = await sql`
        update kartak_codes set transfer_token = ${token}, transfer_expires = now() + interval '1 day'
         where code = ${norm(body.code)} and device_id = ${device} and not disabled
           and (valid_days is null or activated_at + make_interval(days => valid_days) > now()) returning code`;
      return res.json(r.length ? { ok: true, token } : { ok: false });
    }
    if (body.action === "redeem") {
      const r = await sql`
        update kartak_codes set device_id = ${device}, transfer_token = null, transfer_expires = null, last_seen = now()
         where transfer_token = ${String(body.token || "")} and transfer_expires > now() and not disabled
           and (valid_days is null or activated_at + make_interval(days => valid_days) > now()) returning code`;
      return res.json(r.length ? { ok: true, code: r[0].code } : { ok: false });
    }
    return res.json({ ok: false });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
}
