/*
 * scripts/make-clip.mjs - turns a drawing file in scripts/clips/ into an MP4 in videos/.
 *
 * Purpose:    Opens the clip's HTML in a headless browser, calls window.render(t) for every frame (30 per second),
 *             saves the frames and joins them with ffmpeg (H.264, no sound) (decision D27).
 * Run:        node scripts/make-clip.mjs cross-contamination 13      (name of the HTML file, length in seconds)
 *             Needs Playwright (cd tests && npm install) and ffmpeg on the computer.
 * Depends on: scripts/clips/<name>.html, tests/node_modules/playwright, ffmpeg.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const [name, seconds = "13"] = process.argv.slice(2);
const { chromium } = createRequire(path.join(root, "tests", "package.json"))("playwright");
const frames = fs.mkdtempSync(path.join(os.tmpdir(), "clip-"));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto("file://" + path.join(root, "scripts", "clips", name + ".html"));
const total = Math.round(Number(seconds) * 30);
for (let i = 0; i < total; i++) {
  const data = await page.evaluate((t) => { window.render(t); return document.querySelector("canvas").toDataURL("image/png"); }, i / 30);
  fs.writeFileSync(path.join(frames, `f${String(i).padStart(4, "0")}.png`), Buffer.from(data.split(",")[1], "base64"));
}
await browser.close();
const out = path.join(root, "videos", name + ".mp4");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", "30", "-i", path.join(frames, "f%04d.png"), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
fs.rmSync(frames, { recursive: true });
console.log("made", out, total, "frames");
