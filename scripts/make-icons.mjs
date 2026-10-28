/*
 * scripts/make-icons.mjs - turns an icon SVG into every PNG size the phones need.
 *
 * Purpose:    One source drawing per app (icons/icon.svg, seller/icons/icon.svg); this renders
 *             icon-512, icon-192, apple-touch-icon (180), favicon-32 and maskable-512 (drawing shrunk to
 *             80% on the background colour, for Android's round/squircle masks).
 * Run:        cd tests && npm install && npx playwright install chromium   (once)
 *             node ../scripts/make-icons.mjs ../icons/icon.svg "#0A6B4E"
 *             node ../scripts/make-icons.mjs ../seller/icons/icon.svg "#8A4B0B"
 * Depends on: playwright (installed in tests/node_modules).
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(path.resolve("node_modules") + "/");
const { chromium } = require("playwright");
const [svgPath, bg] = process.argv.slice(2);
if (!svgPath || !bg) { console.log('usage: node make-icons.mjs <icon.svg> "<background colour>"'); process.exit(1); }
const out = path.dirname(path.resolve(svgPath));
const svg = fs.readFileSync(svgPath, "utf8").replace(/width="512" height="512"/, 'width="100%" height="100%"');

const browser = await chromium.launch();
async function render(size, file, inset) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const box = inset ? size * 0.8 : size;
  await page.setContent(`<body style="margin:0;background:${bg};display:grid;place-items:center;width:${size}px;height:${size}px"><div style="width:${box}px;height:${box}px">${svg}</div></body>`);
  await page.screenshot({ path: path.join(out, file) });
  await page.close();
}
await render(512, "icon-512.png");
await render(192, "icon-192.png");
await render(180, "apple-touch-icon.png");
await render(32, "favicon-32.png");
await render(512, "maskable-512.png", true);
await browser.close();
console.log("icons written to", out);
