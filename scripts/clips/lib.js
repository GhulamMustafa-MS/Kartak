/*
 * scripts/clips/lib.js - shared drawing code for the clips (decision D31): kitchen, worker, arms, hands, boards,
 * knife, carrot, chicken, bowl, tray. Every clip loads it with <script src="lib.js"> and defines window.render(t).
 *
 * Purpose:    one look for every clip (same wall, counter, worker in white with a hair cover), so a new clip only
 *             draws what is special to it. Canvas 1280x720; g = 2D context; helpers clamp, ease, ph (phase 0-1
 *             between two times), lerp, L (point between two points), rr (rounded rectangle path).
 * Used by:    scripts/clips/*.html, rendered by scripts/make-clip.mjs.
 */
const cv = document.getElementById("c"), g = cv.getContext("2d");
const W = 1280, H = 720;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x) => { x = clamp(x); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
const ph = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const L = (p, q, k) => ({ x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k) });
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

const SKIN = "#B97A4E", SKIN_D = "#8E5A36";
const BOARD = { x: 450, y: 478, w: 380, h: 86 };
const BOWL = { x: 300, y: 520 };
const TRAY = { x: 1030, y: 540 };
const KNIFE_REST = { x: 905, y: 548 };

function background(t) {
  // tiled wall
  g.fillStyle = "#E9EEEC"; g.fillRect(0, 0, W, 430);
  g.strokeStyle = "#D3DBD8"; g.lineWidth = 2;
  for (let y = 0; y < 430; y += 54) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  for (let r = 0; r * 54 < 430; r++) for (let x = (r % 2) * 40; x < W; x += 80) { g.beginPath(); g.moveTo(x, r * 54); g.lineTo(x, r * 54 + 54); g.stroke(); }
  // shelf with jars
  g.fillStyle = "#9AA7A3"; g.fillRect(860, 150, 360, 12);
  [[890, "#D9822B"], [950, "#C0392B"], [1010, "#7B8F2A"], [1070, "#E5C14A"], [1130, "#8C5A3C"]].forEach(([x, c]) => {
    g.fillStyle = "rgba(255,255,255,.65)"; rr(x, 92, 44, 58, 8); g.fill(); g.fillStyle = c; rr(x + 4, 112, 36, 34, 5); g.fill();
    g.fillStyle = "#56615E"; rr(x + 2, 84, 40, 12, 3); g.fill();
  });
  // hood edge
  g.fillStyle = "#B8C2BF"; g.fillRect(0, 0, W, 38); g.fillStyle = "#A2ADAA"; g.fillRect(0, 38, W, 6);
}

function person(t) {
  const sway = Math.sin(t * 2.1) * 2;
  // torso: white jacket and dark apron
  g.fillStyle = "#F7F8F6"; g.beginPath();
  g.moveTo(500, 470); g.quadraticCurveTo(495, 300, 560, 262); g.lineTo(720, 262); g.quadraticCurveTo(785, 300, 780, 470); g.closePath(); g.fill();
  g.strokeStyle = "#D9DEDC"; g.lineWidth = 3; g.stroke();
  g.fillStyle = "#2F3B45"; rr(560, 330, 160, 160, 18); g.fill();
  g.strokeStyle = "#2F3B45"; g.lineWidth = 6; g.beginPath(); g.moveTo(575, 333); g.lineTo(600, 268); g.moveTo(705, 333); g.lineTo(680, 268); g.stroke();
  // jacket buttons
  g.fillStyle = "#C9CFCD"; [290, 312].forEach((y) => { g.beginPath(); g.arc(640, y, 4, 0, 7); g.fill(); });
  // neck and head (looking down at the board)
  g.fillStyle = SKIN; rr(620, 220, 40, 50, 12); g.fill();
  g.save(); g.translate(640 + sway, 180);
  g.fillStyle = SKIN; g.beginPath(); g.ellipse(0, 0, 50, 58, 0, 0, 7); g.fill();
  g.fillStyle = SKIN_D; g.beginPath(); g.ellipse(-49, 6, 9, 15, 0, 0, 7); g.ellipse(49, 6, 9, 15, 0, 0, 7); g.fill();
  // eyes looking down, eyebrows, small beard shadow
  g.strokeStyle = "#2A1A10"; g.lineWidth = 4; g.lineCap = "round";
  g.beginPath(); g.arc(-18, 12, 9, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  g.beginPath(); g.arc(18, 12, 9, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  g.lineWidth = 5; g.beginPath(); g.moveTo(-30, -4); g.lineTo(-8, -2); g.moveTo(8, -2); g.lineTo(30, -4); g.stroke();
  g.strokeStyle = "#7A4A2C"; g.lineWidth = 3; g.beginPath(); g.moveTo(-8, 36); g.quadraticCurveTo(0, 40, 8, 36); g.stroke();
  // white hair cover (cap)
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.ellipse(0, -30, 56, 40, 0, Math.PI, 2 * Math.PI); g.fill();
  rr(-56, -34, 112, 16, 8); g.fill();
  g.strokeStyle = "#DCE1DF"; g.lineWidth = 2; g.beginPath(); g.moveTo(-54, -20); g.lineTo(54, -20); g.stroke();
  g.restore();
}

function counter() {
  // counter top in light perspective, then the front panel
  const top = g.createLinearGradient(0, 430, 0, 610);
  top.addColorStop(0, "#C9D0D3"); top.addColorStop(1, "#E4E9EB");
  g.fillStyle = top; g.fillRect(0, 430, W, 180);
  g.fillStyle = "#B4BCC0"; g.fillRect(0, 430, W, 6); // back edge of the counter
  g.fillStyle = "#9FA9AD"; g.fillRect(0, 610, W, 16);
  const front = g.createLinearGradient(0, 626, 0, 720); front.addColorStop(0, "#AEB7BB"); front.addColorStop(1, "#8E989C");
  g.fillStyle = front; g.fillRect(0, 626, W, 94);
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; for (let x = 320; x < W; x += 320) { g.beginPath(); g.moveTo(x, 632); g.lineTo(x, 714); g.stroke(); }
}

// colour: "green" (vegetables), "red" (raw meat), "white", "yellow"; b = {x, y, w, h}
const BOARDS = { green: ["#1E6B3F", "#2F9A5A"], red: ["#8E1F1F", "#C93A3A"], white: ["#BFC6C9", "#F2F4F5"], yellow: ["#B08A12", "#E8C33A"] };
function board(colour = "green", b = BOARD) {
  const [edge, top] = BOARDS[colour];
  g.fillStyle = edge; rr(b.x - 4, b.y + 6, b.w + 8, b.h + 8, 14); g.fill(); // edge
  g.fillStyle = top; rr(b.x, b.y, b.w, b.h, 12); g.fill();
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 2;
  for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(b.x + 40 + k * 55, b.y + 18); g.lineTo(b.x + 20 + k * 55, b.y + b.h - 14); g.stroke(); }
  g.fillStyle = edge; g.beginPath(); g.ellipse(b.x + b.w - 26, b.y + 20, 9, 6, 0, 0, 7); g.fill(); // hanging hole
}

function bowl(slicesIn) {
  const { x, y } = BOWL;
  g.fillStyle = "rgba(0,0,0,.12)"; g.beginPath(); g.ellipse(x, y + 46, 90, 14, 0, 0, 7); g.fill();
  const s = g.createLinearGradient(x - 90, 0, x + 90, 0); s.addColorStop(0, "#9AA4A8"); s.addColorStop(0.5, "#EEF2F3"); s.addColorStop(1, "#8D979B");
  g.fillStyle = s; g.beginPath(); g.moveTo(x - 92, y - 6); g.quadraticCurveTo(x - 80, y + 52, x, y + 54); g.quadraticCurveTo(x + 80, y + 52, x + 92, y - 6); g.closePath(); g.fill();
  g.fillStyle = "#6E787C"; g.beginPath(); g.ellipse(x, y - 6, 92, 18, 0, 0, 7); g.fill();
  g.fillStyle = "#59636A"; g.beginPath(); g.ellipse(x, y - 4, 84, 13, 0, 0, 7); g.fill();
  for (let k = 0; k < slicesIn; k++) { // carrot slices heaped in the bowl
    const a = k * 2.39, r = 10 + (k % 5) * 12;
    slice(x + Math.cos(a) * r * 1.4, y - 8 + Math.sin(a) * r * 0.25 - (k % 3) * 3, 0.9);
  }
}

function tray(hasChicken) {
  const { x, y } = TRAY;
  g.fillStyle = "rgba(0,0,0,.12)"; g.beginPath(); g.ellipse(x, y + 30, 110, 12, 0, 0, 7); g.fill();
  g.fillStyle = "#D7DEE1"; rr(x - 110, y - 22, 220, 50, 10); g.fill();
  g.fillStyle = "#B5BEC2"; rr(x - 100, y - 16, 200, 36, 8); g.fill();
  if (hasChicken) chicken(x, y, 1, 0);
}

function slice(x, y, s) {
  g.fillStyle = "#D2691E"; g.beginPath(); g.ellipse(x, y, 13 * s, 8 * s, 0, 0, 7); g.fill();
  g.fillStyle = "#F39A3A"; g.beginPath(); g.ellipse(x, y - 1.5 * s, 11 * s, 6 * s, 0, 0, 7); g.fill();
  g.fillStyle = "#FFC27A"; g.beginPath(); g.ellipse(x, y - 1.5 * s, 4 * s, 2.4 * s, 0, 0, 7); g.fill();
}

// carrot lying on the board, already cut from the right down to cutX
function carrot(x0, y, cutX, dx) {
  const x1 = Math.min(cutX, x0 + 230);
  if (x1 > x0 + 4) {
    g.fillStyle = "#E3741E"; g.beginPath();
    g.moveTo(x0 + dx, y - 11); g.lineTo(x1 + dx, y - 15); g.quadraticCurveTo(x1 + 4 + dx, y, x1 + dx, y + 15); g.lineTo(x0 + dx, y + 11); g.quadraticCurveTo(x0 - 10 + dx, y, x0 + dx, y - 11); g.fill();
    g.strokeStyle = "rgba(150,70,10,.45)"; g.lineWidth = 2;
    for (let k = x0 + 30; k < x1 - 6; k += 34) { g.beginPath(); g.moveTo(k + dx, y - 9); g.lineTo(k + 6 + dx, y - 3); g.stroke(); }
    g.fillStyle = "#3C8D2F"; g.beginPath(); g.moveTo(x0 + dx, y); g.lineTo(x0 - 26 + dx, y - 14); g.lineTo(x0 - 22 + dx, y); g.lineTo(x0 - 28 + dx, y + 12); g.closePath(); g.fill();
  }
}

function chicken(x, y, s, cutFrac) {
  // raw chicken breast: pink, with a lighter fat streak; cutFrac of it already cut into pieces on the right
  const w = 120 * s, h = 46 * s, left = x - w / 2, right = lerp(x + w / 2, x - w / 2 + 20, cutFrac);
  g.fillStyle = "#E9938A"; g.beginPath();
  g.moveTo(left, y); g.quadraticCurveTo(left + 10, y - h / 2, x, y - h / 2); g.quadraticCurveTo(right, y - h / 2, right, y);
  g.quadraticCurveTo(right, y + h / 2, x, y + h / 2 - 2); g.quadraticCurveTo(left + 6, y + h / 2, left, y); g.fill();
  g.fillStyle = "#F7C4BC"; g.beginPath(); g.ellipse(x - 14 * s, y - 6 * s, 26 * s, 6 * s, -0.15, 0, 7); g.fill();
  g.strokeStyle = "rgba(170,70,70,.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(left + 18, y + 8); g.quadraticCurveTo(x, y + 14, right - 8, y + 6); g.stroke();
}
function chickenPiece(x, y, k) {
  g.fillStyle = "#E58A82"; rr(x - 14, y - 12, 28, 24, 8); g.fill();
  g.fillStyle = "#F6BDB5"; g.beginPath(); g.ellipse(x - 2, y - 4, 8, 3, k * 0.5, 0, 7); g.fill();
}

function knife(x, y, ang) {
  // (x, y) = where the hand grips the handle; blade points left
  g.save(); g.translate(x, y); g.rotate(ang);
  g.fillStyle = "#1F2326"; rr(-6, -8, 62, 16, 6); g.fill();
  g.fillStyle = "#C9CED1"; g.beginPath(); g.moveTo(-6, -9); g.lineTo(-128, -2); g.quadraticCurveTo(-136, 8, -120, 14); g.lineTo(-6, 13); g.closePath(); g.fill();
  g.fillStyle = "#EEF2F4"; g.beginPath(); g.moveTo(-6, 6); g.lineTo(-122, 10); g.lineTo(-6, 13); g.closePath(); g.fill();
  g.restore();
}

function arm(sh, hand, side) {
  const elbow = { x: lerp(sh.x, hand.x, 0.45) + side * 60, y: lerp(sh.y, hand.y, 0.55) + 20 };
  g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = "#E6EAE8"; g.lineWidth = 50; g.beginPath(); g.moveTo(sh.x, sh.y); g.lineTo(elbow.x, elbow.y); g.stroke();
  g.strokeStyle = "#F9FAF9"; g.lineWidth = 44; g.beginPath(); g.moveTo(sh.x, sh.y); g.lineTo(elbow.x, elbow.y); g.stroke();
  g.strokeStyle = SKIN; g.lineWidth = 30; g.beginPath(); g.moveTo(elbow.x, elbow.y); g.lineTo(hand.x, hand.y); g.stroke();
  // cuff
  g.strokeStyle = "#F9FAF9"; g.lineWidth = 46; g.beginPath(); g.moveTo(elbow.x, elbow.y); g.lineTo(lerp(elbow.x, hand.x, 0.18), lerp(elbow.y, hand.y, 0.18)); g.stroke();
}
// glove: null for a bare hand, or a colour like "#3B7DD8" (blue food glove)
function hand(p, grip, glove = null) {
  g.fillStyle = glove || SKIN; g.beginPath(); g.ellipse(p.x, p.y, 26, 19, 0, 0, 7); g.fill();
  g.strokeStyle = glove ? "rgba(0,0,0,.25)" : SKIN_D; g.lineWidth = 2;
  for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(p.x - 14 + (k + 1) * 9, p.y + (grip ? 6 : 12)); g.lineTo(p.x - 14 + (k + 1) * 9, p.y + (grip ? 14 : 20)); g.stroke(); }
}

