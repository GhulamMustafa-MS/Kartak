/*
 * api/admin.js - POST /api/admin: everything the seller app does with codes.
 *
 * Purpose:    Request { key, action, code?, note?, days? }. action: "list" | "new" | "reset" | "disable" |
 *             "enable" | "delete" | "limit" | "stats" | "results". "new" and "limit" take days = 1-365 for a
 *             time limit counted from the code's first use, or nothing / null for no limit (decision D25).
 *             Every code in the list carries a summary of its test results (tests, avg, last_test, fulls,
 *             fulls_passed); "stats" adds the totals for all codes, "results" adds one code's tests (D26). Every call returns the full list (newest first, max 500) so the seller
 *             screen redraws from one response; "new" also returns { made: CODE }.
 *             The key is the seller password; only its SHA-256 hash is stored (kartak_settings.admin_hash).
 *             Wrong key: 401 after a 1-second delay (slows guessing).
 * Used by:    seller/js/seller.js, which runs on a different address (kartak-seller.vercel.app), so this
 *             file answers CORS pre-flight requests for the origins in ALLOWED_ORIGINS (decision D12).
 * Depends on: api/_db.js; tables kartak_codes, kartak_settings, kartak_results (db/schema.sql).
 */
import crypto from "node:crypto";

import { sql, normCode as norm, readBody } from "./_db.js";
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
const gen = () => Array.from(crypto.randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join("");
const ALLOWED_ORIGINS = ["https://kartak-seller.vercel.app"];
// Time limit in whole days (1-365), or null for no limit; anything else counts as no limit.
const days = (v) => (Number.isInteger(v) && v >= 1 && v <= 365 ? v : null);

// Everything the seller's Results tab shows for all codes together (D26).
async function stats() {
  const [overall] = await sql`
    select count(*)::int as tests, count(distinct code)::int as people,
           coalesce(round(avg(correct * 100.0 / total)), 0)::int as avg,
           count(*) filter (where mode = 'full')::int as fulls,
           count(*) filter (where mode = 'full' and correct * 5 >= total * 4)::int as fulls_passed
      from kartak_results`;
  const modes = await sql`
    select mode, count(*)::int as n, round(avg(correct * 100.0 / total))::int as avg from kartak_results group by mode`;
  const langs = await sql`select lang, count(*)::int as n from kartak_results group by lang order by n desc`;
  // How often each question was asked and got wrong, for the hardest questions and the weakest topics.
  const questions = await sql`
    select id, sum(a)::int as asked, sum(w)::int as wrong from (
      select unnest(string_to_array(asked, ',')) as id, 1 as a, 0 as w from kartak_results where asked <> ''
      union all
      select unnest(string_to_array(wrong, ',')) as id, 0 as a, 1 as w from kartak_results where wrong <> ''
    ) x group by id`;
  return { overall, modes, langs, questions };
}

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
  const body = readBody(req);
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
        const r = await sql`insert into kartak_codes (code, note, valid_days) values (${gen()}, ${note}, ${days(body.days)}) on conflict do nothing returning code`;
        if (r.length) made = r[0].code;
      }
    } else if (body.action === "reset") {
      await sql`update kartak_codes set device_id = null, reset_count = reset_count + 1 where code = ${code}`;
    } else if (body.action === "disable") {
      await sql`update kartak_codes set disabled = true where code = ${code}`;
    } else if (body.action === "delete") {
      await sql`delete from kartak_codes where code = ${code}`;
    } else if (body.action === "limit") {
      await sql`update kartak_codes set valid_days = ${days(body.days)} where code = ${code}`;
    } else if (body.action === "enable") {
      await sql`update kartak_codes set disabled = false where code = ${code}`;
    }
    // Each code with a short summary of its results (D26): tests, average %, last test, full mocks taken / passed.
    // A full mock is passed at 80%: correct * 5 >= total * 4.
    const list = await sql`
      select c.code, c.note, c.device_id is not null as active, c.disabled, c.created_at, c.activated_at, c.last_seen,
             c.reset_count, c.valid_days, c.activated_at + make_interval(days => c.valid_days) as ends,
             coalesce(c.activated_at + make_interval(days => c.valid_days) <= now(), false) as expired,
             coalesce(r.tests, 0)::int as tests, r.avg, r.last_test, coalesce(r.fulls, 0)::int as fulls,
             coalesce(r.fulls_passed, 0)::int as fulls_passed
        from kartak_codes c
        left join (select code, count(*) as tests, round(avg(correct * 100.0 / total))::int as avg, max(finished_at) as last_test,
                          count(*) filter (where mode = 'full') as fulls,
                          count(*) filter (where mode = 'full' and correct * 5 >= total * 4) as fulls_passed
                     from kartak_results group by code) r on r.code = c.code
       order by c.created_at desc limit 500`;
    const out = { ok: true, made, list };
    if (body.action === "stats") out.stats = await stats();
    if (body.action === "results") out.results = await sql`
      select mode, lang, total, correct, timed_out, seconds, asked, wrong, finished_at
        from kartak_results where code = ${code} order by finished_at desc limit 200`;
    return res.json(out);
  } catch (e) {
    return res.status(500).json({ ok: false, reason: "server" });
  }
}
