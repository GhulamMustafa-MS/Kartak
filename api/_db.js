/*
 * api/_db.js - shared database connection and helpers for every API function.
 *
 * Purpose:    One place that creates the Postgres client, so each endpoint file only holds its own logic.
 *             Files starting with "_" are not turned into endpoints by Vercel.
 * Used by:    api/activate.js, api/admin.js, api/transfer.js, api/health.js.
 * Depends on: @neondatabase/serverless (HTTP driver), env var DATABASE_URL (set in the Vercel project
 *             "kartak": the "kartak" database in the Neon project "amigodb", login role kartak_app).
 * Testing:    tests/ sets globalThis.__KARTAK_TEST_SQL__ to an in-memory Postgres (PGlite) before importing,
 *             so the same code runs without the real database.
 */
import { neon } from "@neondatabase/serverless";

/** Tagged-template SQL client: sql`select ... where x = ${value}` (values are always sent as parameters). */
export const sql = globalThis.__KARTAK_TEST_SQL__ || neon(process.env.DATABASE_URL);

/** Codes are stored as 6 upper-case letters/digits; accept "abc-123", "ABC 123" etc. from people. */
export const normCode = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Vercel parses JSON bodies for us, but fall back to parsing a raw string. */
export const readBody = (req) => (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {});
