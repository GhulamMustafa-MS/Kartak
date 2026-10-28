/*
 * tests/api.test.mjs - checks every API rule against an in-memory database (no internet needed).
 *
 * Purpose:    Codes lock to one phone, reset frees them, turned-off and deleted codes stop working,
 *             wrong passwords are refused, the iPhone hand-over token works once, CORS is only for the
 *             seller app, time limits (a code ends N days after its first use, the seller can change
 *             or remove the limit, D25). Prints each check and exits with code 1 if any fails.
 * Run:        cd tests && npm install && node api.test.mjs
 * Depends on: tests/testdb.mjs, api/*.js.
 */
import { callApi, ADMIN_PASSWORD, db } from "./testdb.mjs";

let failed = 0;
const check = (name, ok) => { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; };
const admin = (action, extra = {}) => callApi("admin", { key: ADMIN_PASSWORD, action, ...extra });

check("wrong password refused", (await callApi("admin", { key: "nope", action: "list" })).status === 401);
const made = (await admin("new", { note: "Test" })).body.made;
check("new code is 6 characters", /^[A-Z2-9]{6}$/.test(made));
const pretty = made.slice(0, 3) + "-" + made.slice(3).toLowerCase();
check("code works on phone A (any format)", (await callApi("activate", { code: pretty, device: "phone-AAAA" })).body.ok);
check("phone A can check again", (await callApi("activate", { code: made, device: "phone-AAAA" })).body.ok);
check("phone B is refused", (await callApi("activate", { code: made, device: "phone-BBBB" })).body.reason === "used");
check("unknown code refused", (await callApi("activate", { code: "ZZZZZZ", device: "phone-BBBB" })).body.reason === "invalid");
await admin("reset", { code: made });
check("after reset phone B works", (await callApi("activate", { code: made, device: "phone-BBBB" })).body.ok);
check("after reset phone A is locked out", (await callApi("activate", { code: made, device: "phone-AAAA" })).body.reason === "used");

const tok = (await callApi("transfer", { action: "make", code: made, device: "phone-BBBB" })).body;
check("hand-over token made by the locked phone", tok.ok && tok.token.length > 8);
check("other phone can't make a token", !(await callApi("transfer", { action: "make", code: made, device: "phone-AAAA" })).body.ok);
check("token moves the code to the home-screen copy", (await callApi("transfer", { action: "redeem", token: tok.token, device: "home-CCCC" })).body.code === made);
check("token works only once", !(await callApi("transfer", { action: "redeem", token: tok.token, device: "home-DDDD" })).body.ok);

await admin("disable", { code: made });
check("turned-off code refused", (await callApi("activate", { code: made, device: "home-CCCC" })).body.reason === "disabled");
await admin("enable", { code: made });
check("turned back on", (await callApi("activate", { code: made, device: "home-CCCC" })).body.ok);
const list = (await admin("delete", { code: made })).body.list;
check("delete removes it", !list.some((x) => x.code === made));
check("deleted code refused", (await callApi("activate", { code: made, device: "home-CCCC" })).body.reason === "invalid");

// Time limits (D25): days count from the first use; the code stops once they pass; the seller can change them.
const trial = (await admin("new", { note: "Trial", days: 7 })).body.made;
const row = (r) => r.body.list.find((x) => x.code === trial);
check("7-day code: limit saved, not started before first use", row(await admin("list")).valid_days === 7 && !row(await admin("list")).ends);
const first = (await callApi("activate", { code: trial, device: "phone-TTTT" })).body;
check("7-day code works and says when it ends", first.ok && Math.round((new Date(first.ends) - Date.now()) / 86400000) === 7);
await db.query("update kartak_codes set activated_at = now() - interval '8 days' where code = $1", [trial]);
check("after 7 days the code is refused as expired", (await callApi("activate", { code: trial, device: "phone-TTTT" })).body.reason === "expired");
check("seller list shows it as time over", row(await admin("list")).expired === true);
check("expired code can't be handed to an iPhone home screen", !(await callApi("transfer", { action: "make", code: trial, device: "phone-TTTT" })).body.ok);
await admin("limit", { code: trial, days: 30 });
check("seller gives more days: works again", (await callApi("activate", { code: trial, device: "phone-TTTT" })).body.ok);
await db.query("update kartak_codes set activated_at = now() - interval '40 days' where code = $1", [trial]);
await admin("limit", { code: trial, days: null });
check("no limit: works however long ago it started", (await callApi("activate", { code: trial, device: "phone-TTTT" })).body.ok);
const bad = (await admin("new", { days: 5000 })).body;
check("a silly number of days means no limit", bad.list.find((x) => x.code === bad.made).valid_days === null);

const pre = await callApi("admin", {}, { method: "OPTIONS", origin: "https://kartak-seller.vercel.app" });
check("CORS allowed for the seller app", pre.status === 204 && pre.headers["Access-Control-Allow-Origin"] === "https://kartak-seller.vercel.app");
const other = await callApi("admin", {}, { method: "OPTIONS", origin: "https://evil.example" });
check("CORS not given to other sites", !other.headers["Access-Control-Allow-Origin"]);
check("health ok", (await callApi("health", null, { method: "GET" })).body.ok);

console.log(failed ? `${failed} check(s) failed` : "ALL API CHECKS PASSED");
process.exit(failed ? 1 : 0);
