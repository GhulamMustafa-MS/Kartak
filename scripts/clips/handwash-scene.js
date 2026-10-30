/*
 * scripts/clips/handwash-scene.js - the hand-wash sink scene shared by the two hand-washing clips.
 *
 * Purpose:    draws what both clips have in common: tiled wall and floor, wall clock (moving second hand, no
 *             numbers), a small work counter on the left, liquid soap dispenser, paper-towel dispenser, foot-pedal
 *             bin, hand-wash basin with a lever tap and running water, the worker's legs, bigger hands with fingers,
 *             lather and water drops. Each clip only writes its own timeline in render(t).
 * Used by:    scripts/clips/handwash-right.html, scripts/clips/handwash-wrong.html (after lib.js).
 * Depends on: lib.js (g, W, H, helpers, person, arm, SKIN, SKIN_D, board, slice).
 */
// camera: zoom in a little on the sink (about the bottom edge of the floor) so hands and lather read on a phone
function camera() { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.setTransform(1.1, 0, 0, 1.1, 640 - 640 * 1.1, 700 - 700 * 1.1); }
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const SINK = { x: 640, y: 482 };          // centre of the basin bowl
const SPOUT = { x: 640, y: 414 };         // where the water comes out
const LEVER = { x: 694, y: 372 };         // tap lever pivot (top of the tap)
const SOAP = { x: 816, y: 282 };          // top-left corner of the soap dispenser
const SOAP_NOZ = { x: 846, y: 404 };      // soap comes out here
const TOWEL = { x: 940, y: 236 };         // top-left of the paper-towel dispenser
const BIN = { x: 852, y: 578, w: 132, h: 128 };
const PEDAL = { x: 874, y: 698 };
const CLOCK = { x: 1100, y: 145, r: 62 };
const LS = { x: 560, y: 290 }, RS = { x: 720, y: 290 };
const HIP_L = { x: 600, y: 480 }, HIP_R = { x: 680, y: 480 };
const FOOT_L = { x: 590, y: 700 }, FOOT_R = { x: 694, y: 700 };

function wallAndFloor() {
  g.fillStyle = "#E9EEEC"; g.fillRect(0, 0, W, 600);
  g.strokeStyle = "#D3DBD8"; g.lineWidth = 2;
  for (let y = 0; y < 600; y += 54) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  for (let r = 0; r * 54 < 600; r++) for (let x = (r % 2) * 40; x < W; x += 80) { g.beginPath(); g.moveTo(x, r * 54); g.lineTo(x, r * 54 + 54); g.stroke(); }
  g.fillStyle = "#B8C2BF"; g.fillRect(0, 0, W, 30);
  // floor
  const f = g.createLinearGradient(0, 600, 0, 720); f.addColorStop(0, "#C3CBC8"); f.addColorStop(1, "#D9DFDC");
  g.fillStyle = f; g.fillRect(0, 600, W, 120);
  g.fillStyle = "#A9B3B0"; g.fillRect(0, 596, W, 8);
  g.strokeStyle = "rgba(0,0,0,.06)"; g.lineWidth = 2;
  for (let x = -400; x < W + 400; x += 120) { g.beginPath(); g.moveTo(640 + (x - 640) * 0.8, 604); g.lineTo(640 + (x - 640) * 1.3, 720); g.stroke(); }
  g.beginPath(); g.moveTo(0, 650); g.lineTo(W, 650); g.stroke();
}

// wall clock with tick marks only; secAng = second hand angle (0 = up), wedge = [from, to] or null
function clock(secAng, wedge) {
  const { x, y, r } = CLOCK;
  g.fillStyle = "rgba(0,0,0,.1)"; g.beginPath(); g.arc(x + 4, y + 6, r + 8, 0, 7); g.fill();
  g.fillStyle = "#3A4650"; g.beginPath(); g.arc(x, y, r + 8, 0, 7); g.fill();
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  if (wedge && wedge[1] > wedge[0] + 0.001) {
    g.fillStyle = "rgba(80,150,220,.28)"; g.beginPath(); g.moveTo(x, y);
    g.arc(x, y, r - 4, wedge[0] - Math.PI / 2, wedge[1] - Math.PI / 2); g.closePath(); g.fill();
  }
  g.strokeStyle = "#3A4650"; g.lineCap = "round";
  for (let k = 0; k < 12; k++) {
    const a = k * Math.PI / 6, r0 = k % 3 ? r - 12 : r - 18;
    g.lineWidth = k % 3 ? 3 : 5; g.beginPath();
    g.moveTo(x + Math.sin(a) * r0, y - Math.cos(a) * r0); g.lineTo(x + Math.sin(a) * (r - 5), y - Math.cos(a) * (r - 5)); g.stroke();
  }
  const handLine = (a, len, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * len, y - Math.cos(a) * len); g.stroke(); };
  handLine(2.2, 30, 7, "#2A333A");            // hour hand (still)
  handLine(5.6, 44, 5, "#2A333A");            // minute hand (still)
  handLine(secAng, 52, 3, "#D0453A");         // second hand
  g.fillStyle = "#D0453A"; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill();
}

// small food-prep counter at the left edge (where the worker goes back to)
function workCounter() {
  g.fillStyle = "#8E989C"; g.fillRect(14, 520, 10, 180); g.fillRect(180, 520, 10, 180);
  g.fillStyle = "#AEB7BB"; g.fillRect(14, 640, 176, 8);
  const top = g.createLinearGradient(0, 462, 0, 520); top.addColorStop(0, "#C9D0D3"); top.addColorStop(1, "#E4E9EB");
  g.fillStyle = top; g.fillRect(0, 462, 205, 50);
  g.fillStyle = "#9FA9AD"; g.fillRect(0, 510, 205, 14);
  board("green", { x: 20, y: 466, w: 160, h: 36 });
  slice(70, 484, 0.9); slice(98, 486, 0.9); slice(124, 482, 0.9);
}

// press: 0..1 how far the push plate is pushed in
function soapDispenser(press) {
  const { x, y } = SOAP;
  g.save(); g.translate(SOAP_NOZ.x, SOAP_NOZ.y); g.scale(1.25, 1.25); g.translate(-SOAP_NOZ.x, -SOAP_NOZ.y);
  g.fillStyle = "rgba(0,0,0,.1)"; rr(x + 6, y + 8, 64, 124, 14); g.fill();
  g.fillStyle = "#F4F6F7"; rr(x, y, 62, 122, 14); g.fill();
  g.strokeStyle = "#C9D0D3"; g.lineWidth = 2; g.stroke();
  // window showing the liquid soap
  g.fillStyle = "#DDE7EA"; rr(x + 12, y + 14, 38, 60, 8); g.fill();
  g.fillStyle = "#4FB39A"; rr(x + 12, y + 32, 38, 42, 8); g.fill();
  g.fillStyle = "rgba(255,255,255,.5)"; rr(x + 16, y + 36, 6, 32, 3); g.fill();
  // push plate and nozzle
  g.fillStyle = "#3A4650"; rr(x + 8, y + 88 - press * 4, 46, 22, 8); g.fill();
  g.fillStyle = "#56615E"; rr(SOAP_NOZ.x - 7, SOAP_NOZ.y - 14, 14, 16, 4); g.fill();
  g.restore();
}

// pulled: 0..1 how far the hanging towel tab is pulled down; gone = the tab has been taken
function towelDispenser(pulled, gone) {
  const { x, y } = TOWEL;
  g.fillStyle = "rgba(0,0,0,.1)"; rr(x + 6, y + 8, 140, 112, 14); g.fill();
  g.fillStyle = "#F4F6F7"; rr(x, y, 140, 112, 14); g.fill();
  g.strokeStyle = "#C9D0D3"; g.lineWidth = 2; g.stroke();
  g.fillStyle = "#DDE3E5"; rr(x + 14, y + 14, 112, 50, 8); g.fill();       // front panel
  g.fillStyle = "#3A4650"; rr(x + 30, y + 98, 80, 10, 4); g.fill();         // slot
  const len = gone ? 18 : 30 + pulled * 50;
  g.fillStyle = "#FFFFFF"; g.strokeStyle = "#CBD3D6"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(x + 40, y + 104); g.lineTo(x + 100, y + 104); g.lineTo(x + 102, y + 104 + len); g.lineTo(x + 38, y + 104 + len); g.closePath(); g.fill(); g.stroke();
}

// paper towel held or falling: a white crumpled sheet
function towelSheet(x, y, s = 1, ang = 0) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
  g.fillStyle = "#FFFFFF"; g.strokeStyle = "#C3CCCF"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(-34, -26); g.lineTo(8, -32); g.lineTo(36, -20); g.lineTo(32, 24); g.lineTo(-4, 30); g.lineTo(-36, 20); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-20, -20); g.lineTo(-10, 20); g.moveTo(10, -24); g.lineTo(16, 22); g.stroke();
  g.restore();
}

// pedal bin: lid 0..1 open, pedal 0..1 pressed; falling() draws what drops in (only the part above the opening shows)
function bin(lid, pedal, falling) {
  const { x, y, w, h } = BIN;
  const body = g.createLinearGradient(x, 0, x + w, 0); body.addColorStop(0, "#8D979B"); body.addColorStop(0.45, "#D5DBDD"); body.addColorStop(1, "#7E888C");
  g.fillStyle = "rgba(0,0,0,.12)"; g.beginPath(); g.ellipse(x + w / 2, y + h, w / 2 + 10, 8, 0, 0, 7); g.fill();
  g.fillStyle = body; g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + w, y + 4); g.lineTo(x + w - 8, y + h); g.lineTo(x + 8, y + h); g.closePath(); g.fill();
  g.strokeStyle = "rgba(0,0,0,.15)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 4, y + 24); g.lineTo(x + w - 4, y + 24); g.stroke();
  // pedal at the front, bottom left
  g.fillStyle = "#3A4650"; rr(PEDAL.x - 22, PEDAL.y - 10 + pedal * 5, 44, 10, 4); g.fill();
  if (lid > 0.02) { g.fillStyle = "#2A3036"; g.beginPath(); g.ellipse(x + w / 2, y + 4, w / 2 - 2, 9, 0, 0, 7); g.fill(); }
  if (falling) { g.save(); g.beginPath(); g.rect(0, 0, W, y + 6); g.clip(); falling(); g.restore(); }
  // lid hinged at the back right; opens by lifting its left side
  g.save(); g.translate(x + w + 2, y + 4); g.rotate(lid * 1.0);
  g.fillStyle = "#5E696E"; rr(-w - 6, -12, w + 8, 14, 6); g.fill();
  g.fillStyle = "#717D82"; rr(-w + 30, -18, 40, 8, 4); g.fill();
  g.restore();
}

// legs and shoes; footR = where the right shoe is (moves to the pedal); dx shifts the whole person
function legs(footR = FOOT_R, footL = FOOT_L, dx = 0) {
  const leg = (hip, foot) => {
    g.lineCap = "round"; g.strokeStyle = "#3B4652"; g.lineWidth = 54;
    g.beginPath(); g.moveTo(hip.x + dx, hip.y); g.lineTo(foot.x + dx, foot.y - 26); g.stroke();
    g.fillStyle = "#1E2428"; g.beginPath(); g.ellipse(foot.x + dx + 10, foot.y - 6, 38, 15, 0, 0, 7); g.fill();
  };
  leg(HIP_L, footL); leg(HIP_R, footR);
}

function basin() {
  // pipe under the basin into the wall
  g.strokeStyle = "#AEB6B9"; g.lineWidth = 16; g.lineCap = "round";
  g.beginPath(); g.moveTo(640, 556); g.lineTo(640, 590); g.quadraticCurveTo(640, 606, 660, 606); g.lineTo(700, 606); g.stroke();
  // front of the bowl
  const fr = g.createLinearGradient(0, 480, 0, 566); fr.addColorStop(0, "#FFFFFF"); fr.addColorStop(1, "#D3DADC");
  g.fillStyle = fr; g.beginPath(); g.moveTo(452, 486); g.quadraticCurveTo(470, 566, 640, 568); g.quadraticCurveTo(810, 566, 828, 486); g.closePath(); g.fill();
  g.strokeStyle = "#C3CBCE"; g.lineWidth = 2; g.stroke();
  // rim seen from above
  g.fillStyle = "#FBFCFC"; rr(448, 438, 384, 94, 44); g.fill(); g.strokeStyle = "#D2D9DB"; g.stroke();
  // inside of the bowl
  const ins = g.createLinearGradient(0, 452, 0, 516); ins.addColorStop(0, "#B9C3C7"); ins.addColorStop(1, "#E3E8EA");
  g.fillStyle = ins; g.beginPath(); g.ellipse(SINK.x, SINK.y, 164, 34, 0, 0, 7); g.fill();
  g.fillStyle = "#8A9498"; g.beginPath(); g.ellipse(SINK.x, SINK.y + 12, 13, 5, 0, 0, 7); g.fill();
}

// lever tap: on 0 (lever down, closed) .. 1 (lever up, open)
function tap(on) {
  const steel = g.createLinearGradient(670, 0, 716, 0); steel.addColorStop(0, "#8E989C"); steel.addColorStop(0.5, "#EEF2F3"); steel.addColorStop(1, "#8E989C");
  g.fillStyle = "#9AA4A8"; g.beginPath(); g.ellipse(694, 450, 22, 8, 0, 0, 7); g.fill();
  g.fillStyle = steel; rr(680, 380, 28, 72, 10); g.fill();
  // spout curving over to the left and down
  g.strokeStyle = "#C3CBCE"; g.lineWidth = 18; g.lineCap = "round";
  g.beginPath(); g.moveTo(690, 392); g.quadraticCurveTo(642, 380, 640, SPOUT.y - 6); g.stroke();
  g.fillStyle = "#6E787C"; g.beginPath(); g.ellipse(SPOUT.x, SPOUT.y, 8, 4, 0, 0, 7); g.fill();
  // lever
  g.save(); g.translate(LEVER.x, LEVER.y); g.rotate(lerp(0.28, -0.42, on));
  g.fillStyle = "#5E696E"; rr(-6, -7, 66, 14, 7); g.fill();
  g.fillStyle = "#7E888C"; g.beginPath(); g.arc(0, 0, 11, 0, 7); g.fill();
  g.restore();
}
function leverTip(on) { const a = lerp(0.28, -0.42, on); return { x: LEVER.x + Math.cos(a) * 56, y: LEVER.y + Math.sin(a) * 56 }; }

// running water from the spout down to yEnd (stops at the hands when they are under it)
function water(flow, t, yEnd = SINK.y + 8) {
  if (flow <= 0) return;
  const w = 14 * flow;
  g.fillStyle = "rgba(120,185,235,.75)"; rr(SPOUT.x - w / 2, SPOUT.y, w, yEnd - SPOUT.y, w / 2); g.fill();
  g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 2;
  for (let k = 0; k < 4; k++) {
    const yy = SPOUT.y + ((t * 260 + k * 30) % Math.max(1, yEnd - SPOUT.y));
    g.beginPath(); g.moveTo(SPOUT.x - 2, yy); g.lineTo(SPOUT.x - 2, yy + 10); g.stroke();
  }
  // ripple where it lands
  g.strokeStyle = "rgba(120,185,235,.7)"; g.lineWidth = 3;
  g.beginPath(); g.ellipse(SPOUT.x, yEnd, 18 + Math.sin(t * 20) * 3, 5, 0, 0, 7); g.stroke();
}

// splash drops around a point (water hitting hands)
function splash(x, y, t, n = 10, spread = 60) {
  g.fillStyle = "rgba(110,175,230,.85)";
  for (let k = 0; k < n; k++) {
    const life = ((t * 2.2 + rnd(k)) % 1), a = Math.PI * (0.1 + 0.8 * rnd(k + 20)) + Math.PI;
    const r = life * spread * (0.6 + rnd(k + 40));
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.6 + life * life * 50;
    g.beginPath(); g.ellipse(px, py, 4, 5, 0, 0, 7); g.fill();
  }
}

// drops falling from wet hands
function drips(x, y, t, n = 4, seed = 0) {
  g.fillStyle = "rgba(110,175,230,.9)";
  for (let k = 0; k < n; k++) {
    const life = (t * 1.6 + rnd(k + seed)) % 1;
    const px = x - 20 + rnd(k + seed + 7) * 40, py = y + 10 + life * 90;
    g.beginPath(); g.moveTo(px, py - 8); g.quadraticCurveTo(px + 5, py, px, py + 4); g.quadraticCurveTo(px - 5, py, px, py - 8); g.fill();
  }
}

// elbow position, same rule as lib.js arm()
function elbowOf(sh, h, side) { return { x: lerp(sh.x, h.x, 0.45) + side * 60, y: lerp(sh.y, h.y, 0.55) + 20 }; }

// bigger hand with fingers; side -1 = worker's left (thumb up/inside), 1 = right. back: show knuckles (palm down).
function bigHand(sh, p, side, opts = {}) {
  const e = elbowOf(sh, p, side);
  const ang = opts.ang != null ? opts.ang : Math.atan2(p.y - e.y, p.x - e.x);
  g.save(); g.translate(p.x, p.y); g.rotate(ang);
  g.lineCap = "round";
  // fingers
  const spread = opts.spread || 0;
  for (let k = 0; k < 4; k++) {
    const yy = -12 + k * 8 + (k - 1.5) * spread;
    g.strokeStyle = SKIN_D; g.lineWidth = 11; g.beginPath(); g.moveTo(8, yy); g.lineTo(36 - Math.abs(k - 1.3) * 3, yy * 1.08); g.stroke();
    g.strokeStyle = SKIN; g.lineWidth = 8.5; g.beginPath(); g.moveTo(8, yy); g.lineTo(36 - Math.abs(k - 1.3) * 3, yy * 1.08); g.stroke();
  }
  // thumb on the upper side of the hand
  const ts = side < 0 ? -1 : 1;
  g.strokeStyle = SKIN_D; g.lineWidth = 12; g.beginPath(); g.moveTo(-4, -ts * 14); g.lineTo(16, -ts * 25); g.stroke();
  g.strokeStyle = SKIN; g.lineWidth = 9.5; g.beginPath(); g.moveTo(-4, -ts * 14); g.lineTo(16, -ts * 25); g.stroke();
  // palm
  g.fillStyle = SKIN; g.beginPath(); g.ellipse(0, 0, 22, 19, 0, 0, 7); g.fill();
  g.strokeStyle = SKIN_D; g.lineWidth = 2;
  if (opts.back) { for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(12, -12 + k * 8, 2, 0, 7); g.stroke(); } }
  if (opts.soap) { g.fillStyle = "#6CC7AE"; g.beginPath(); g.ellipse(2, 2, 11 * opts.soap, 7 * opts.soap, 0, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.ellipse(-1, 0, 4 * opts.soap, 2 * opts.soap, 0, 0, 7); g.fill(); }
  if (opts.wet) { g.fillStyle = "rgba(170,215,245,.55)"; g.beginPath(); g.ellipse(-4, -4, 9, 4, 0.3, 0, 7); g.ellipse(24, 6, 6, 3, 0, 0, 7); g.fill(); }
  g.restore();
}

// white lather bubbles around (x, y); amount 0..1; seed keeps bubbles stable between frames
function lather(x, y, amount, t, seed = 0) {
  const n = Math.floor(amount * 46);
  for (let k = 0; k < n; k++) {
    const a = rnd(k + seed) * Math.PI * 2, d = Math.sqrt(rnd(k + seed + 100)) * (30 + 34 * amount);
    const px = x + Math.cos(a) * d * 1.4 + Math.sin(t * 3 + k) * 2, py = y + Math.sin(a) * d * 0.7 + Math.cos(t * 2.6 + k) * 2;
    const r = 4 + rnd(k + seed + 200) * 8;
    g.fillStyle = "rgba(255,255,255,.95)"; g.beginPath(); g.arc(px, py, r, 0, 7); g.fill();
    g.strokeStyle = "rgba(150,175,190,.7)"; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = "rgba(190,225,245,.9)"; g.beginPath(); g.arc(px - r * 0.35, py - r * 0.35, r * 0.25, 0, 7); g.fill();
  }
}
