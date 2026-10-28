/*
 * tests/api.test.mjs - checks every API rule against an in-memory database (no internet needed).
 *
 * Purpose:    Codes lock to one phone, reset frees them, turned-off and deleted codes stop working,
 *             wrong passwords are refused, the iPhone hand-over token works once, CORS is only for the
 *             seller app. Prints each check and exits with code 1 if any fails.
 * Run:        cd tests && npm install && node api.test.mjs
 * Depends on: tests/testdb.mjs, api/*.js.
 */
import { callApi, ADMIN_PASSWORD } from "./testdb.mjs";

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
check("delete removes it", list.length === 0);
check("deleted code refused", (await callApi("activate", { code: made, device: "home-CCCC" })).body.reason === "invalid");

const pre = await callApi("admin", {}, { method: "OPTIONS", origin: "https://kartak-seller.vercel.app" });
check("CORS allowed for the seller app", pre.status === 204 && pre.headers["Access-Control-Allow-Origin"] === "https://kartak-seller.vercel.app");
const other = await callApi("admin", {}, { method: "OPTIONS", origin: "https://evil.example" });
check("CORS not given to other sites", !other.headers["Access-Control-Allow-Origin"]);
check("health ok", (await callApi("health", null, { method: "GET" })).body.ok);

console.log(failed ? `${failed} check(s) failed` : "ALL API CHECKS PASSED");
process.exit(failed ? 1 : 0);
