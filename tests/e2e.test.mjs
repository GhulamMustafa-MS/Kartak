/*
 * tests/e2e.test.mjs - drives both apps in a real browser on a phone-sized screen.
 *
 * Purpose:    Serves the repo files as if they were on kartak-app / kartak-seller.vercel.app and answers
 *             /api/* with the real API code on the in-memory database, then: the seller logs in and
 *             makes a code; a worker picks Bangla, unlocks, takes a full 50-question mock to the result;
 *             "All questions" saves the place, carries on and starts again;
 *             a second phone is refused; every language in the dropdown shows its own words and questions,
 *             reads in the right direction (temperatures too) and fits a 390 px phone; the first screen has a tile per
 *             language; the install help sheet
 *             opens on iPhone; the iPhone hand-over token unlocks the home-screen copy.
 *             Screenshots go to tests/screenshots/ (git-ignored).
 * Run:        cd tests && npm install && npx playwright install chromium && node e2e.test.mjs
 * Depends on: tests/testdb.mjs, playwright, every file the two apps load.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import { callApi, ROOT, ADMIN_PASSWORD } from "./testdb.mjs";

const { chromium, devices } = createRequire(import.meta.url)("playwright");
const SHOTS = ROOT + "tests/screenshots/";
fs.mkdirSync(SHOTS, { recursive: true });
// The number of live questions, so the "All questions" checks follow the bank as it grows.
const BANK_Q = JSON.parse(fs.readFileSync(ROOT + "data/questions.json", "utf8")).questions.filter((q) => q.enabled !== false);
const LIVE = BANK_Q.length;
// The app's own wording and language list, read the same way the browser does.
globalThis.window = {};
await import(ROOT + "js/i18n.js");
const UI = window.KARTAK_UI;
const UI_LANGS = window.KARTAK_LANGS.filter((l) => UI[l.code]);
const TYPES = { html: "text/html", js: "text/javascript", mjs: "text/javascript", css: "text/css", json: "application/json", png: "image/png", svg: "image/svg+xml", webmanifest: "application/manifest+json" };

let failed = 0;
const check = (name, ok) => { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; };
const errors = [];
const browser = await chromium.launch();

async function phone(device) {
  const ctx = await browser.newContext(device ? { ...devices[device] } : { viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.route("https://kartak-app.vercel.app/api/**", async (r) => {
    const req = r.request();
    const name = new URL(req.url()).pathname.slice(5);
    const out = await callApi(name, JSON.parse(req.postData() || "{}"), { method: req.method(), origin: req.headers().origin });
    await r.fulfill({ status: out.status, headers: { ...out.headers, "content-type": "application/json" }, body: out.body ? JSON.stringify(out.body) : "" });
  });
  for (const [host, dir] of [["kartak-app", ""], ["kartak-seller", "seller/"]]) {
    await page.route(`https://${host}.vercel.app/**`, async (r) => {
      const p = new URL(r.request().url()).pathname;
      if (p.startsWith("/api/")) return r.fallback();
      const file = ROOT + dir + (p === "/" ? "index.html" : p.slice(1));
      if (!fs.existsSync(file)) return r.fulfill({ status: 404, body: "" });
      await r.fulfill({ contentType: TYPES[file.split(".").pop()] || "text/plain", body: fs.readFileSync(file) });
    });
  }
  return page;
}
async function answerAll(page) {
  let n = 0;
  while (n < 60 && !(await page.$(".ring"))) {
    const opt = await page.$("[data-opt]");
    if (opt) await opt.click();
    await page.click("#cta");
    n++;
  }
  return n;
}

// Seller makes a code
const seller = await phone();
await seller.goto("https://kartak-seller.vercel.app/");
await seller.fill("#key", ADMIN_PASSWORD);
await seller.click("#login");
await seller.click("#make");
await seller.waitForSelector(".new-code");
const code = (await seller.textContent(".new-code .big")).trim();
check("seller makes a code", /^[A-Z2-9]{3}-[A-Z2-9]{3}$/.test(code));
check("WhatsApp message carries the worker link", (await seller.getAttribute(".new-code a", "href")).includes("kartak-app.vercel.app"));
await seller.screenshot({ path: SHOTS + "seller.png", fullPage: true });

// Worker unlocks and takes the full mock
const worker = await phone();
await worker.goto("https://kartak-app.vercel.app/");
await worker.click("[data-pick=bn]");
await worker.fill("#codeIn", code);
await worker.click("#unlockBtn");
await worker.waitForSelector("[data-go=intro-full]");
check("worker unlocks with the code", true);
await worker.click("[data-go=intro-full]");
await worker.click("#bar [data-go=full]");
await worker.waitForSelector(".qtext");
await worker.screenshot({ path: SHOTS + "question-bn.png" });
check("full mock has 50 questions", (await answerAll(worker)) === 50);
await worker.screenshot({ path: SHOTS + "result.png", fullPage: true });

// "All questions": every live question, untimed, place saved between sittings (D21)
await worker.click("#bar [data-go=home]");
await worker.selectOption("#langSel", "en");
await worker.click("[data-go=all]");
await worker.waitForSelector(".qtext");
check("all questions covers the whole bank", (await worker.textContent(".qhead .pos span")).includes(`/ ${LIVE}`));
for (let k = 0; k < 3; k++) {
  const opt = await worker.$("[data-opt]");
  if (opt) await opt.click();
  await worker.click("#cta"); // check answer
  await worker.click("#cta"); // next question
}
await worker.click("#brandBtn");
check("home offers to carry on", (await worker.textContent("[data-go=all] .d")).includes(`question 4 of ${LIVE}`));
await worker.click("[data-go=all]");
await worker.waitForSelector(".qtext");
check("carries on at question 4", (await worker.textContent(".qhead .pos span")).includes(`4 / ${LIVE}`));
await worker.click("#brandBtn");
await worker.click("[data-go=all-restart]");
await worker.waitForSelector(".qtext");
check("start again goes back to question 1", (await worker.textContent(".qhead .pos span")).includes(`1 / ${LIVE}`));
await worker.click("#brandBtn");

// Second phone refused
const other = await phone();
await other.goto("https://kartak-app.vercel.app/");
await other.click("[data-pick=en]");
await other.fill("#codeIn", code);
await other.click("#unlockBtn");
await other.waitForSelector(".err");
check("second phone refused", (await other.textContent(".err")).includes("another phone"));

// Every language in the dropdown: its words, its questions, the right direction, nothing wider than the phone
const offered = await worker.$$eval("#langSel option", (os) => os.map((o) => o.value));
check("dropdown offers every language the app has words for", offered.length === UI_LANGS.length);
for (const lang of offered) {
  await worker.selectOption("#langSel", lang);
  await worker.click("#bar [data-go=home]").catch(() => {});
  check(`home is in ${lang}`, (await worker.textContent(".hello h1")).trim() === UI[lang].title);
  await worker.click("[data-go=practice]");
  await worker.waitForSelector(".qtext");
  const text = (await worker.textContent(".qtext")).trim();
  const shown = BANK_Q.find((q) => q[lang] && q[lang].q === text);
  check(`practice question shows in ${lang}`, !!shown);
  const dir = await worker.evaluate(() => document.documentElement.dir);
  check(`${lang} reads ${["ar", "ur"].includes(lang) ? "right to left" : "left to right"}`, dir === (["ar", "ur"].includes(lang) ? "rtl" : "ltr"));
  // Temperatures like −18°C must sit in a left-to-right box, or Arabic and Urdu show them as "C°18−".
  const loose = await worker.evaluate(() => { let n = 0; const w = document.createTreeWalker(document.getElementById("app"), NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) if (/°C/.test(t.data) && t.parentElement.tagName !== "BDI" && !t.parentElement.closest("svg,.reading")) n++; return n; });
  check(`${lang} temperatures read left to right`, loose === 0);
  const wide = await worker.evaluate(() => document.documentElement.scrollWidth);
  check(`${lang} fits the phone width`, wide <= 390);
  await worker.screenshot({ path: SHOTS + `question-${lang}.png` });
  await worker.click("#brandBtn");
}

// First-visit language picker lists every language
const fresh1 = await phone();
await fresh1.goto("https://kartak-app.vercel.app/");
check("first screen has a tile for every language", (await fresh1.$$("[data-pick]")).length === UI_LANGS.length);
check("first screen fits the phone width", (await fresh1.evaluate(() => document.documentElement.scrollWidth)) <= 390);
await fresh1.screenshot({ path: SHOTS + "languages.png", fullPage: true });

// iPhone: install help + hand-over to the home-screen copy
const iphone = await phone("iPhone 13");
await iphone.goto("https://kartak-app.vercel.app/");
await iphone.click("[data-pick=en]");
await callApi("admin", { key: ADMIN_PASSWORD, action: "new" });
const list = (await callApi("admin", { key: ADMIN_PASSWORD, action: "list" })).body.list;
const fresh = list.find((r) => !r.active).code;
await iphone.fill("#codeIn", fresh);
await iphone.click("#unlockBtn");
await iphone.waitForSelector("#installBtn");
await iphone.click("#installBtn");
await iphone.waitForSelector("#sheet");
check("iPhone install help opens", (await iphone.textContent("#sheet")).includes("Add to Home Screen"));
await iphone.screenshot({ path: SHOTS + "install-sheet.png" });
await iphone.waitForFunction(() => location.search.includes("t="));
const homeScreen = await phone("iPhone 13");
await homeScreen.goto(iphone.url());
await homeScreen.click("[data-pick=en]").catch(() => {});
await homeScreen.waitForSelector("[data-go=intro-full]");
check("home-screen copy opens unlocked", true);

console.log("page errors:", errors.length ? errors : "none");
if (errors.length) failed++;
await browser.close();
console.log(failed ? `${failed} check(s) failed` : "ALL BROWSER CHECKS PASSED");
process.exit(failed ? 1 : 0);
