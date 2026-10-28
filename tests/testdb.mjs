/*
 * tests/testdb.mjs - an in-memory Postgres for the tests, wired into the real API code.
 *
 * Purpose:    Creates a PGlite database from db/schema.sql and sets globalThis.__KARTAK_TEST_SQL__ so
 *             api/_db.js uses it instead of Neon. Also gives callApi(), which runs an API handler with
 *             a fake Vercel request/response and returns { status, headers, body }.
 * Used by:    tests/api.test.mjs, tests/e2e.test.mjs.
 * Depends on: @electric-sql/pglite, db/schema.sql, api/*.js.
 */
import fs from "node:fs";
import crypto from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

export const ROOT = new URL("..", import.meta.url).pathname;
export const db = new PGlite();
await db.exec(fs.readFileSync(ROOT + "db/schema.sql", "utf8"));

globalThis.__KARTAK_TEST_SQL__ = async (strings, ...values) => {
  let text = "";
  strings.forEach((s, i) => { text += s + (i < values.length ? "$" + (i + 1) : ""); });
  return (await db.query(text, values)).rows;
};

export const ADMIN_PASSWORD = "test-password";
await db.query("insert into kartak_settings (k, v) values ('admin_hash', $1)", [crypto.createHash("sha256").update(ADMIN_PASSWORD).digest("hex")]);

const handlers = {};
for (const name of ["activate", "admin", "transfer", "health", "result"]) handlers[name] = (await import(ROOT + "api/" + name + ".js")).default;

export async function callApi(name, body, { method = "POST", origin } = {}) {
  const out = { status: 200, headers: {}, body: null };
  const res = {
    setHeader(k, v) { out.headers[k] = v; },
    status(c) { out.status = c; return this; },
    json(j) { out.body = j; return this; },
    end() { return this; },
  };
  await handlers[name]({ method, headers: { origin }, body }, res);
  return out;
}
