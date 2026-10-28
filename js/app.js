/*
 * js/app.js - the worker practice app: every screen, the timer, scoring, access codes and install.
 *
 * Purpose:    One IIFE, no framework, no build step (decision D16). Sections, in file order:
 *               Text      UI strings and the language list come from js/i18n.js (KARTAK_UI, KARTAK_LANGS)
 *               Bank      questions fetched from /data/questions.json; enabled !== false only
 *               Settings  SIZES (full 50 / quick 15 / practice 15 / all = whole bank), PASS = 80%,
 *                         QSEC = 90 s per question; full and quick are timed, practice and all are not
 *               State     S (current screen, mode, question index, answers); store() wraps localStorage
 *               Codes     API is only used on *.vercel.app; deviceId(), activate() -> /api/activate
 *               Speech    "Listen" button, shown only when the phone has a voice for the language
 *               Helpers   shuffle, grading (single/picture/tf/multi/order), type tags
 *               Screens   drawLang, drawHome, drawLearn, drawIntro, drawQ (+ dial, thermometer SVG,
 *                         order arrows), drawResults, drawGate (code entry)
 *               Install   add-to-home-screen card + help sheet; iPhone code transfer (/api/transfer)
 *               Events    one click handler for #app and #bar, the language dropdown, start-up
 * Storage:    localStorage keys: jahiz-lang (language; old name kept so nobody loses it),
 *             kartak-code, kartak-dev (device id), kartak-best-full (best full-mock %),
 *             kartak-all (saved place in "All questions", so it can be finished over several days).
 * Used by:    index.html.
 * Depends on: js/i18n.js, data/questions.json, api/activate.js, api/transfer.js, sw.js, icons/.
 */
(function () {
  "use strict";

  /* ---------------- Text ---------------- */
  var UI = window.KARTAK_UI;


  /* Question bank: loaded from /data/questions.json (see data/CLAUDE.md). */
  var BANK = [];
  var bankReady = fetch("/data/questions.json").then(function (r) { return r.json(); }).then(function (d) {
    BANK = d.questions.filter(function (q) { return q.enabled !== false; });
  });
  var SIZES = { full: 50, quick: 15, practice: 15, all: 100000 }; // "all" = every live question
  function timed() { return S.mode === "full" || S.mode === "quick"; }
  function N() { return S.qs.length; }
  function PASS() { return Math.ceil(N() * 0.8); }
  var QSEC = 90;                      // seconds per question in the mock test (workers report 1:30)
  // Languages offered: those in KARTAK_LANGS that have screen wording in KARTAK_UI (js/i18n.js).
  var LANGS = window.KARTAK_LANGS.filter(function (l) { return UI[l.code]; });
  function meta(code) { for (var k = 0; k < LANGS.length; k++) if (LANGS[k].code === code) return LANGS[k]; return LANGS[0]; }

  var ICONS = {
    single: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/></svg>',
    multi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="2"/><path d="M5 7l1.5 1.5L9.5 5.5"/><rect x="13" y="13" width="8" height="8" rx="2"/><path d="M15 17l1.5 1.5 3-3"/><rect x="13" y="3" width="8" height="8" rx="2"/></svg>',
    tf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12.5l3 3 5-6"/><path d="M15 9l6 6M21 9l-6 6"/></svg>',
    order: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 5l1.5-1v4" /><path d="M3.5 11.2c.6-.9 2.6-.7 2.3.6-.2.8-2.3 2-2.3 2.7h2.5"/><path d="M3.5 17h2l-1 1.4c1.3 0 1.6 2.1 0 2.2-.6 0-1-.2-1.2-.5"/></svg>',
    picture: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="9.5" r="1.8"/><path d="M3.5 18l5.5-5.5 4 4 3-3 4.5 4.5"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/></svg>',
    quick: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/></svg>',
    stack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M6 5h12M8 2h8" stroke-linecap="round"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5C4.7 20 4 19.3 4 18.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/></svg>',
    shapes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="7" cy="7" r="4"/><rect x="13" y="3" width="8" height="8" rx="2"/><path d="M7 13l4 7H3z"/><path d="M14 15h6v6h-6z"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>'
  };

  /* ---------------- State ---------------- */
  var S = { lang: null, screen: "lang", mode: null, i: 0, sel: null, checked: false, results: [], shuffles: [], qDeadline: 0, tick: null, notice: false, startedAt: 0, endedAt: 0, speaking: false };

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  // Access codes: only enforced when served from the Vercel deployment, which has the /api backend.
  var API = /\.vercel\.app$/.test(location.hostname) ? "/api" : null;
  function deviceId() {
    var d = store("kartak-dev");
    if (!d) { d = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2); store("kartak-dev", d); }
    return d;
  }
  function activate(code, cb) {
    fetch(API + "/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code, device: deviceId() }) })
      .then(function (r) { return r.json(); }).then(function (j) { cb(j); })
      .catch(function () { cb({ ok: false, reason: "net" }); });
  }
  var saved = store("jahiz-lang");
  if (saved && UI[saved] && meta(saved).code === saved) { S.lang = saved; S.screen = "home"; }

  var app = document.getElementById("app"), bar = document.getElementById("bar");
  function T() { return UI[S.lang || "en"]; }
  function L(q) { return q[S.lang || "en"] || q.en; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // Question text: escape it, and keep temperatures and number ranges ("−18°C", "0-4°C", "10-20") reading left to
  // right inside Arabic and Urdu sentences, otherwise the browser shows "C°18−".
  function txt(s) {
    return esc(s).replace(/[−-]?\d+(?:[.,]\d+)?(?:\s?[-–]\s?[−-]?\d+(?:[.,]\d+)?)?(?:\s?°C|%)?/g, function (m) { return '<bdi dir="ltr">' + m + '</bdi>'; });
  }
  function minus(v) { return String(v).replace("-", "−"); }

  /* ---------------- Speech (only shown when the phone has a voice for the language) ---------------- */
  var voices = [];
  function loadVoices() { try { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch (e) { voices = []; } }
  function voiceFor(lang) {
    var ps = meta(lang).voice;
    for (var j = 0; j < ps.length; j++) for (var k = 0; k < voices.length; k++) if ((voices[k].lang || "").toLowerCase().replace("_", "-").indexOf(ps[j]) === 0) return voices[k];
    return null;
  }
  function canSpeak() { return !!(window.speechSynthesis && S.lang && voiceFor(S.lang)); }
  function stopSpeak() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} S.speaking = false; }
  function speak(text) {
    try {
      stopSpeak();
      var u = new SpeechSynthesisUtterance(text);
      var v = voiceFor(S.lang); if (v) { u.voice = v; u.lang = v.lang; }
      u.rate = 0.9;
      u.onend = u.onerror = function () { S.speaking = false; var b = document.getElementById("listenBtn"); if (b) { b.setAttribute("aria-pressed", "false"); b.lastChild.textContent = T().listen; } };
      speechSynthesis.speak(u); S.speaking = true;
    } catch (e) { S.speaking = false; }
  }
  loadVoices();
  try { if (window.speechSynthesis) speechSynthesis.onvoiceschanged = function () { loadVoices(); if (S.screen === "q") drawQ(); }; } catch (e) {}

  /* ---------------- Helpers ---------------- */
  function shuffle(n) {
    var a = []; for (var k = 0; k < n; k++) a.push(k);
    do { for (var j = n - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)); var t = a[j]; a[j] = a[r]; a[r] = t; } }
    while (a.every(function (v, k) { return v === k; }));
    return a;
  }
  function optsOf(q) { return q.type === "tf" ? [T().tTrue, T().tFalse] : L(q).o; }
  function hasAnswer(q, sel) {
    if (q.type === "multi") return sel && sel.length > 0;
    if (q.type === "order") return sel && sel.length === q.en.o.length;
    return sel !== null && sel !== undefined;
  }
  function grade(q, sel) {
    if (!hasAnswer(q, sel)) return false;
    if (q.type === "multi") { var a = sel.slice().sort(), b = q.ans.slice().sort(); return a.length === b.length && a.every(function (v, k) { return v === b[k]; }); }
    if (q.type === "order") return sel.every(function (v, k) { return v === k; });
    return sel === q.ans;
  }
  function tag(type, compact) {
    var t = T().types[type];
    return '<div class="tag t-' + type + '">' + ICONS[type] + '<div><div class="tt">' + t[0] + '</div>' + (compact ? '' : '<div class="th">' + t[1] + '</div>') + '</div></div>';
  }
  function setBar(html) { bar.innerHTML = html ? '<div class="in' + (html.indexOf("data-two") > -1 ? " two" : "") + '">' + html + '</div>' : ""; }

  /* ---------------- Chrome ---------------- */
  function syncChrome() {
    var m = meta(S.lang || "en");
    document.documentElement.lang = m.html;
    document.documentElement.dir = m.dir;
    var sel = document.getElementById("langSel");
    if (!sel.options.length) sel.innerHTML = LANGS.map(function (l) { return '<option value="' + l.code + '" lang="' + l.html + '">' + esc(l.name) + '</option>'; }).join("");
    sel.value = m.code;
    var nm = document.getElementById("langName"); nm.textContent = m.name; nm.lang = m.html; nm.dir = m.dir;
    sel.setAttribute("aria-label", T().chooseLang);
    document.getElementById("langs").hidden = !S.lang;
  }

  /* ---------------- Screens ---------------- */
  function drawLang() {
    var tiles = LANGS.map(function (l) {
      return '<button type="button" class="lang-tile" data-pick="' + l.code + '"><span class="nm" lang="' + l.html + '" dir="' + l.dir + '">' + esc(l.name) + '</span>' +
        (l.name !== l.en ? '<span class="sub">' + l.en + '</span>' : '') + '</button>';
    }).join("");
    // "Choose your language" in a few of the languages, taken from i18n.js so nothing is hard-coded here.
    var lead = LANGS.filter(function (l) { return l.code !== "en"; }).slice(0, 4).map(function (l) { return '<span lang="' + l.html + '" dir="' + l.dir + '">' + esc(UI[l.code].chooseLang) + '</span>'; }).join(" · ");
    app.innerHTML = '<section class="pick"><h1>' + UI.en.chooseLang + '</h1><p class="lead">' + lead + '</p>' + installCard() + '<div class="tiles">' + tiles + '</div></section>';
    setBar("");
  }

  function drawHome() {
    var t = T(), best = store("kartak-best-full");
    var facts = t.facts.map(function (f) { return '<div class="f"><strong>' + f[0] + '</strong><small>' + f[1] + '</small></div>'; }).join("");
    app.innerHTML =
      '<section class="hello"><h1>' + t.title + '</h1><p>' + t.sub + '</p></section>' + installCard() +
      '<section class="realtest" aria-label="' + t.real + '"><div class="cap">' + t.real + '</div>' + facts + '</section>' +
      '<section class="modes">' +
        '<button type="button" class="mode main" data-go="intro-full"><span class="ic">' + ICONS.clock + '</span><span class="t">' + t.full + '</span><span class="d">' + t.fullD + '</span></button>' +
        '<button type="button" class="mode" data-go="intro-quick"><span class="ic">' + ICONS.quick + '</span><span class="t">' + t.quick + '</span><span class="d">' + t.quickD + '</span></button>' +
        '<button type="button" class="mode" data-go="practice"><span class="ic">' + ICONS.book + '</span><span class="t">' + t.practice + '</span><span class="d">' + t.practiceD + '</span></button>' +
        allCard() +
        '<button type="button" class="mode" data-go="learn"><span class="ic">' + ICONS.shapes + '</span><span class="t">' + t.learn + '</span><span class="d">' + t.learnD + '</span></button>' +
      '</section>' +
      '<div class="best"><span>' + t.best + '</span><b>' + (best ? '<bdi dir="ltr">' + best + '%</bdi>' : t.none) + '</b></div>' +
      '<p class="fine">' + t.fine + '</p>';
    setBar("");
  }

  function allCard() {
    var t = T(), d = savedAll(), n = BANK.length || 100;
    var desc = d ? t.allResume.replace("{i}", d.results.length + 1).replace("{n}", d.ids.length) : t.allD.replace("{n}", n);
    return '<button type="button" class="mode" data-go="all"><span class="ic">' + ICONS.stack + '</span><span class="t">' + t.all + '</span><span class="d">' + desc + '</span></button>' +
      (d ? '<button type="button" class="small-btn" data-go="all-restart">' + t.allRestart + '</button>' : '');
  }

  function drawLearn() {
    var t = T(), on = function (c) { return c ? " on" : ""; };
    var ex = {
      single: '<div class="mini"><div class="r"><span class="d"></span>A</div><div class="r on"><span class="d"></span>B</div><div class="r"><span class="d"></span>C</div></div>',
      multi: '<div class="mini"><div class="r sq on"><span class="d"></span>A</div><div class="r sq"><span class="d"></span>B</div><div class="r sq on"><span class="d"></span>C</div></div>',
      tf: '<div class="mini"><div class="two"><span class="on">' + t.tTrue + '</span><span>' + t.tFalse + '</span></div></div>',
      order: '<div class="mini"><div class="r"><span class="num">1</span><span style="flex:1">' + esc(t.exampleSteps[0]) + '</span><b>↑ ↓</b></div><div class="r"><span class="num">2</span><span style="flex:1">' + esc(t.exampleSteps[1]) + '</span><b>↑ ↓</b></div></div>',
      picture: '<div class="mini" style="justify-items:center">' + thermo("fridge", 3).replace('<svg ', '<svg style="width:56px" ') + '</div>'
    };
    ex.video = '<div class="mini"><div class="vgrid">' + ["🧑‍🍳", "🔪🍗", "🥬", "🥗"].map(function (e, k) { return '<div class="vp" style="min-height:56px;animation-delay:' + (k * 0.8) + 's"><span class="vn">' + (k + 1) + '</span><div class="sc" style="font-size:24px">' + e + '</div></div>'; }).join("") + '</div></div>';
    var cards = ["single", "multi", "tf", "order", "picture"].map(function (ty) {
      return '<div class="ex">' + tag(ty) + ex[ty] + '</div>';
    }).join("");
    app.innerHTML = '<section class="learn"><h1>' + t.learn + '</h1><p class="lead">' + t.learnD + '</p>' + cards + '</section>';
    setBar('<button type="button" class="cta" data-go="practice">' + t.tryPractice + '</button>');
  }

  function drawIntro() {
    var t = T();
    var n = SIZES[S.pending], nums = [n, "1:30", Math.ceil(n * 0.8)];
    var rules = t.intro.map(function (r, k) { return '<div class="rule"><span class="big">' + nums[k] + '</span><span>' + r[1] + '</span></div>'; }).join("");
    app.innerHTML = '<section class="intro"><h1>' + t.introT + '</h1><div class="rules">' + rules + '</div><p class="note">' + t.introNote + '</p></section>';
    setBar('<button type="button" class="cta ghost" data-two="1" data-go="home">' + t.back + '</button><button type="button" class="cta" data-go="' + S.pending + '">' + t.start + '</button>');
  }

  function start(mode) {
    if (!BANK.length) { bankReady.then(function () { if (BANK.length) start(mode); }); return; }
    stopSpeak(); clearInterval(S.tick); S.tick = null;
    S.mode = mode; S.i = 0; S.results = []; S.notice = false; S.screen = "q";
    if (mode === "all" && resumeAll()) return;
    var idx = BANK.map(function (q, k) { return k; });
    for (var j = idx.length - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)); var tt = idx[j]; idx[j] = idx[r]; idx[r] = tt; }
    S.qs = idx.slice(0, Math.min(SIZES[mode], BANK.length)).map(function (k) { return BANK[k]; });
    S.shuffles = S.qs.map(function (q) { return q.type === "order" ? shuffle(q.en.o.length) : null; });
    S.perms = S.qs.map(function (q) { return q.type === "order" || q.type === "tf" ? null : shuffle(q.en.o.length); });
    S.startedAt = Date.now();
    openQ();
  }

  /* "All questions" can take several sittings: keep the place on the phone (decision D21). */
  function saveAll() {
    if (S.mode !== "all") return;
    store("kartak-all", JSON.stringify({ ids: S.qs.map(function (q) { return q.id; }), results: S.results, shuffles: S.shuffles, perms: S.perms }));
  }
  function savedAll() {
    try { var d = JSON.parse(store("kartak-all") || "null"); return d && d.ids && d.results.length < d.ids.length ? d : null; } catch (e) { return null; }
  }
  function resumeAll() {
    var d = savedAll(); if (!d) return false;
    var byId = {}; BANK.forEach(function (q) { byId[q.id] = q; });
    if (!d.ids.every(function (id) { return byId[id]; })) { forgetAll(); return false; } // bank changed: start fresh
    S.qs = d.ids.map(function (id) { return byId[id]; });
    S.results = d.results; S.shuffles = d.shuffles; S.perms = d.perms; S.i = d.results.length;
    S.startedAt = Date.now(); openQ(); return true;
  }
  function forgetAll() { try { localStorage.removeItem("kartak-all"); } catch (e) {} }

  function openQ() {
    var q = S.qs[S.i];
    S.sel = q.type === "order" ? S.shuffles[S.i].slice() : q.type === "multi" ? [] : null;
    S.touched = false;
    S.vidStart = Date.now();
    S.checked = false;
    stopSpeak();
    clearInterval(S.tick); S.tick = null;
    if (timed()) { S.qDeadline = Date.now() + QSEC * 1000; S.tick = setInterval(tick, 250); }
    drawQ();
    window.scrollTo(0, 0);
  }

  function tick() {
    var left = Math.max(0, (S.qDeadline - Date.now()) / 1000);
    paintDial(left);
    if (left <= 0) {
      clearInterval(S.tick); S.tick = null;
      var q = S.qs[S.i];
      S.results[S.i] = { ok: grade(q, S.sel), sel: copy(S.sel), timedOut: !hasAnswer(q, S.sel) || (q.type === "order" && !S.touched) };
      S.notice = true;
      advance();
    }
  }

  function dialHTML(left) {
    var R = 30, C = 2 * Math.PI * R, off = C * (1 - left / QSEC);
    return '<div class="dial' + (left <= 10 ? " low" : "") + '" id="dial" role="timer" aria-label="' + Math.ceil(left) + " " + T().sec + '">' +
      '<svg viewBox="0 0 72 72"><circle class="bgc" cx="36" cy="36" r="' + R + '"/><circle class="fgc" id="dialArc" cx="36" cy="36" r="' + R + '" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '"/></svg>' +
      '<b id="dialNum">' + mmss(left) + '</b></div>';
  }
  function mmss(left) { var t = Math.ceil(left), m = Math.floor(t / 60), x = t % 60; return m + ":" + (x < 10 ? "0" : "") + x; }
  function paintDial(left) {
    var d = document.getElementById("dial"); if (!d) return;
    var R = 30, C = 2 * Math.PI * R;
    document.getElementById("dialArc").setAttribute("stroke-dashoffset", (C * (1 - left / QSEC)).toFixed(2));
    document.getElementById("dialNum").textContent = mmss(left);
    d.classList.toggle("low", left <= 10);
    d.setAttribute("aria-label", Math.ceil(left) + " " + T().sec);
  }

  function thermo(kind, v) {
    var ranges = { fridge: [-5, 15, 5], probe: [0, 100, 20], hot: [0, 100, 20], freezer: [-30, 10, 10] };
    var r = ranges[kind], min = r[0], max = r[1], step = r[2], top = 16, bot = 176, x = 40;
    function y(val) { return bot - (val - min) / (max - min) * (bot - top); }
    var ticks = "";
    for (var val = min; val <= max; val += step) {
      var yy = y(val);
      ticks += '<line class="th-tick" x1="' + (x + 14) + '" x2="' + (x + 24) + '" y1="' + yy + '" y2="' + yy + '"/><text class="th-lab" x="' + (x + 28) + '" y="' + (yy + 4) + '">' + minus(val) + '</text>';
    }
    var lv = y(Math.max(min, Math.min(max, v)));
    return '<svg viewBox="0 0 110 214" role="img" aria-label="' + minus(v) + '°C">' +
      '<rect class="th-tube" x="' + (x - 9) + '" y="' + (top - 8) + '" width="18" height="' + (bot - top + 16) + '" rx="9"/>' +
      '<circle class="th-tube" cx="' + x + '" cy="' + (bot + 18) + '" r="17"/>' +
      '<rect class="th-liquid" x="' + (x - 4) + '" y="' + lv + '" width="8" height="' + (bot + 10 - lv) + '" rx="4"/>' +
      '<circle class="th-liquid" cx="' + x + '" cy="' + (bot + 18) + '" r="12"/>' + ticks + '</svg>';
  }

  function drawQ() {
    var t = T(), q = S.qs[S.i], lq = L(q), mock = timed();
    var trackHTML = "";
    if (N() > 20) trackHTML = '<i class="done" style="flex:' + S.i + '"></i><i class="now" style="flex:1"></i><i style="flex:' + (N() - S.i - 1) + '"></i>';
    else for (var k = 0; k < N(); k++) trackHTML += '<i class="' + (k < S.i ? "done" : k === S.i ? "now" : "") + '"></i>';
    var html = '<div class="qhead"><div class="pos"><span>' + t.q + ' <bdi dir="ltr">' + (S.i + 1) + ' / ' + N() + '</bdi></span><div class="track" aria-hidden="true">' + trackHTML + '</div></div>' +
      (mock ? dialHTML(Math.max(0, (S.qDeadline - Date.now()) / 1000)) : '') + '</div>';
    if (S.notice) { html += '<div class="notice">' + t.timeUp + '</div>'; S.notice = false; }
    html += tag(q.type === "picture" ? "picture" : q.type);

    html += '<section class="qcard"><div class="qrow"><h1 class="qtext">' + txt(lq.q) + '</h1>' +
      (canSpeak() ? '<button type="button" class="listen" id="listenBtn" aria-pressed="' + S.speaking + '">' + ICONS.speaker + '<span>' + (S.speaking ? t.stop : t.listen) + '</span></button>' : '') + '</div>';

    if (q.vid) {
      var el = (Date.now() - S.vidStart) / 1000;
      html += '<div class="vid"><div class="vgrid">' + q.vid.map(function (f, k) { return '<div class="vp" style="animation-delay:' + (k * 1.2 - el).toFixed(2) + 's"><span class="vn">' + (k + 1) + '</span><div>' + f + '</div></div>'; }).join("") +
        '</div><div class="vbar"><button type="button" class="small-btn" data-replay="1">↻ ' + t.replay + '</button></div></div>';
    }
    if (q.pic) {
      html += '<div class="pic">' + thermo(q.pic.kind, q.pic.v) + '<div class="reading"><strong>' + minus(q.pic.v) + '°C</strong><small>' + t[q.pic.kind] + '</small></div></div>';
    }

    if (q.type === "order") html += orderHTML(q);
    else if (q.type === "tf") {
      html += '<div class="tfrow">' + [t.tTrue, t.tFalse].map(function (o, k) { return optBtn(q, o, k, "tfb"); }).join("") + '</div>';
    } else {
      var oo = optsOf(q);
      html += '<div class="opts">' + S.perms[S.i].map(function (k) { return optBtn(q, oo[k], k, q.type === "multi" ? "multi" : ""); }).join("") + '</div>';
    }

    if (S.checked) {
      var ok = grade(q, S.sel), extra = "";
      if (q.type === "order" && !ok) extra = '<p><bdi dir="ltr">' + S.sel.filter(function (v, k) { return v === k; }).length + ' / ' + lq.o.length + '</bdi> ' + t.inPlace + '</p>';
      html += '<div class="fb ' + (ok ? "ok" : "no") + '"><b>' + (ok ? t.correct : t.wrong) + '</b>' + extra + '<p>' + txt(lq.e) + '</p></div>';
    }
    html += '</section>';
    app.innerHTML = html;

    var last = S.i === N() - 1, ready = hasAnswer(q, S.sel);
    var label = mock ? (last ? t.finish : t.next) : (S.checked ? (last ? t.finish : t.next) : t.check);
    setBar('<button type="button" class="cta" id="cta"' + (ready ? "" : " disabled") + '>' + label + '</button>');
  }

  function optBtn(q, text, k, extra) {
    var multi = q.type === "multi";
    var on = multi ? S.sel.indexOf(k) > -1 : S.sel === k;
    var cls = "opt" + (extra ? " " + extra : "");
    if (S.checked) { var right = multi ? q.ans.indexOf(k) > -1 : q.ans === k; if (right) cls += " ok"; else if (on) cls += " no"; }
    return '<button type="button" class="' + cls + '" data-opt="' + k + '" aria-pressed="' + on + '"' + (S.checked ? " disabled" : "") + '><span class="mk" aria-hidden="true"></span><span>' + txt(text) + '</span></button>';
  }

  function orderHTML(q) {
    var t = T(), lq = L(q), n = S.sel.length;
    var up = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    var dn = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
    var html = '<div class="olist">';
    for (var k = 0; k < n; k++) {
      var it = S.sel[k], cls = "orow" + (S.touched ? " moved" : "");
      if (S.checked) cls = "orow " + (it === k ? "ok" : "no");
      html += '<div class="' + cls + '"><span class="n">' + (k + 1) + '</span><span class="tx">' + txt(lq.o[it]) + '</span>' +
        (S.checked ? '' : '<span class="arr"><button type="button" data-up="' + k + '" aria-label="' + t.up + '"' + (k === 0 ? " disabled" : "") + '>' + up + '</button><button type="button" data-down="' + k + '" aria-label="' + t.down + '"' + (k === n - 1 ? " disabled" : "") + '>' + dn + '</button></span>') + '</div>';
    }
    return html + '</div>';
  }

  function copy(s) { return Array.isArray(s) ? s.slice() : s; }

  function advance() { if (S.i < N() - 1) { S.i++; openQ(); } else finish(); }

  function finish() {
    clearInterval(S.tick); S.tick = null; stopSpeak();
    for (var k = 0; k < N(); k++) if (!S.results[k]) S.results[k] = { ok: false, sel: null, timedOut: true };
    S.endedAt = Date.now(); S.screen = "results";
    if (S.mode === "all") forgetAll();
    var score = S.results.filter(function (r) { return r.ok; }).length;
    if (S.mode === "full") { var pc = Math.round(score / N() * 100), prev = parseInt(store("kartak-best-full") || "0", 10); if (pc > prev) store("kartak-best-full", String(pc)); }
    drawResults(); window.scrollTo(0, 0);
  }

  function drawResults() {
    var t = T();
    var score = S.results.filter(function (r) { return r.ok; }).length;
    var timeouts = S.results.filter(function (r) { return r.timedOut; }).length;
    var wrongN = N() - score - timeouts;
    var pct = Math.round(score / N() * 100), pass = score >= PASS();
    var R = 62, C = 2 * Math.PI * R, dash = C * score / N(), a = (0.8 * 360 - 90) * Math.PI / 180;
    var ring = '<svg class="ring" viewBox="0 0 156 156" role="img" aria-label="' + pct + '%"><circle class="tr" cx="78" cy="78" r="' + R + '"/>' +
      '<circle class="vl ' + (pass ? "pass" : "fail") + '" cx="78" cy="78" r="' + R + '" stroke-dasharray="' + dash.toFixed(1) + ' ' + C.toFixed(1) + '"/>' +
      '<line class="pm" x1="' + (78 + (R - 10) * Math.cos(a)).toFixed(1) + '" y1="' + (78 + (R - 10) * Math.sin(a)).toFixed(1) + '" x2="' + (78 + (R + 10) * Math.cos(a)).toFixed(1) + '" y2="' + (78 + (R + 10) * Math.sin(a)).toFixed(1) + '"/>' +
      '<text x="78" y="84" text-anchor="middle">' + pct + '%</text><text class="sm" x="78" y="106" text-anchor="middle">' + score + ' / ' + N() + '</text></svg>';

    var tally = '<div class="tally"><div class="g"><b>' + score + '</b><span>' + t.tCorrect + '</span></div><div class="x"><b>' + wrongN + '</b><span>' + t.tWrong + '</span></div>' +
      (timed() ? '<div class="x"><b>' + timeouts + '</b><span>' + t.tTimeout + '</span></div>' : '<div><b>' + PASS() + '</b><span>' + t.passMark + '</span></div>') + '</div>';

    var wrong = []; S.results.forEach(function (r, k) { if (!r.ok) wrong.push(k); });
    var rv = '<h2>' + t.review + '</h2>' + (wrong.length ? "" : '<p>' + t.noMistakes + '</p>');
    wrong.forEach(function (k) {
      var q = S.qs[k], lq = L(q), ans;
      if (q.type === "order") ans = '<ol>' + lq.o.map(function (o) { return '<li>' + txt(o) + '</li>'; }).join("") + '</ol>';
      else if (q.type === "multi") ans = '<p class="a">' + t.answerIs + ': ' + q.ans.map(function (x) { return txt(lq.o[x]); }).join(", ") + '</p>';
      else ans = '<p class="a">' + t.answerIs + ': ' + txt(optsOf(q)[q.ans]) + '</p>';
      rv += '<div class="rv">' + (S.results[k].timedOut ? '<p class="to">' + t.timedOut + '</p>' : '') + '<p class="q">' + (k + 1) + '. ' + txt(lq.q) + '</p>' + ans + '<p class="e">' + txt(lq.e) + '</p></div>';
    });

    app.innerHTML = '<section class="results"><div class="score">' + ring +
      '<p class="verdict ' + (pass ? "pass" : "fail") + '">' + (pass ? t.passV : t.failV) + '</p><p>' + (pass ? t.passed : t.failed) + '</p>' + tally + '</div>' + rv + '</section>';
    setBar('<button type="button" class="cta ghost" data-two="1" data-go="home">' + t.home + '</button><button type="button" class="cta" data-go="' + S.mode + '">' + t.again + '</button>');
  }

  function needCode() { return API && !store("kartak-code"); }

  /* ---------------- Home screen install ---------------- */
  var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  function standalone() { try { return window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches; } catch (e) { return false; } }
  var installEvt = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); installEvt = e; });
  window.addEventListener("appinstalled", function () { installEvt = null; render(); });
  if ("serviceWorker" in navigator && API) { try { navigator.serviceWorker.register("/sw.js").catch(function () {}); } catch (e) {} }
  var SHARE_SVG = '<span class="glyph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5"/><path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2"/></svg></span>';
  function installCard() {
    if (standalone()) return "";
    var t = T();
    return '<div class="install"><img src="/icons/icon-192.png" alt="" onerror="this.style.display=\'none\'"><div class="tx"><b>' + t.installT + '</b><span>' + t.installD + '</span></div><button type="button" id="installBtn">' + t.installBtn + '</button></div>';
  }
  function installNow() {
    if (installEvt) { var e = installEvt; installEvt = null; e.prompt(); e.userChoice.then(function () { render(); }).catch(function () {}); return; }
    var t = T(), steps = isIOS ? t.iosSteps : t.andSteps;
    var el = document.createElement("div");
    el.className = "sheet-bg"; el.id = "sheet";
    el.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetT"><h2 id="sheetT">' + t.sheetT + '</h2><ol>' +
      steps.map(function (x) { return '<li><span>' + esc(x).replace("{share}", SHARE_SVG) + '</span></li>'; }).join("") + '</ol>' +
      (isIOS ? '<p class="note">' + t.iosSafari + '</p>' : '') + '<button type="button" class="cta" id="sheetClose">' + t.gotIt + '</button></div>';
    document.body.appendChild(el);
    el.addEventListener("click", function (ev) { if (ev.target === el || ev.target.id === "sheetClose") el.remove(); });
  }
  // iPhone home-screen apps have their own storage, so carry the unlocked code across with a one-time token in the address.
  function makeTransfer() {
    if (!API || !isIOS || standalone() || !store("kartak-code")) return;
    fetch(API + "/transfer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "make", code: store("kartak-code"), device: deviceId() }) })
      .then(function (r) { return r.json(); }).then(function (j) { if (j.ok) try { history.replaceState(null, "", "/?t=" + j.token); } catch (e) {} }).catch(function () {});
  }
  function redeemTransfer(cb) {
    var m = /[?&]t=([A-Za-z0-9_-]{8,40})/.exec(location.search);
    if (!API || !m || store("kartak-code")) return cb();
    fetch(API + "/transfer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "redeem", token: m[1], device: deviceId() }) })
      .then(function (r) { return r.json(); }).then(function (j) { if (j.ok) store("kartak-code", j.code); cb(); }).catch(function () { cb(); });
    try { history.replaceState(null, "", "/"); } catch (e) {}
  }
  function drawGate() {
    var t = T();
    app.innerHTML = '<section class="gate"><h1>' + t.codeT + '</h1><p>' + t.codeLead + '</p>' +
      '<input id="codeIn" class="code-in" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="9" placeholder="ABC-123" value="' + esc(S.codeDraft || "") + '">' +
      (S.codeErr ? '<div class="err" role="alert">' + t[S.codeErr] + '</div>' : '') + '</section>';
    setBar('<button type="button" class="cta" id="unlockBtn"' + (S.codeBusy ? " disabled" : "") + '>' + (S.codeBusy ? t.checking : t.unlock) + '</button>');
  }
  function tryUnlock() {
    var el = document.getElementById("codeIn"); var code = (el ? el.value : "").trim();
    S.codeDraft = code; if (!code) return;
    S.codeBusy = true; S.codeErr = null; drawGate();
    activate(code, function (j) {
      S.codeBusy = false;
      if (j.ok) { store("kartak-code", code.toUpperCase()); S.codeDraft = ""; S.screen = "home"; render(); makeTransfer(); return; }
      S.codeErr = { used: "errUsed", disabled: "errDisabled", net: "errNet" }[j.reason] || "errInvalid";
      drawGate();
    });
  }
  function render() {
    syncChrome();
    if (!S.lang) { S.screen = "lang"; return drawLang(); }
    if (needCode()) { S.screen = "gate"; return drawGate(); }
    if (S.screen === "home") drawHome();
    else if (S.screen === "learn") drawLearn();
    else if (S.screen === "intro") drawIntro();
    else if (S.screen === "q") drawQ();
    else if (S.screen === "results") drawResults();
    else drawHome();
  }

  function go(where) {
    if (where === "all-restart") { forgetAll(); return start("all"); }
    if (SIZES[where]) return start(where);
    if (where.indexOf("intro-") === 0) { S.pending = where.slice(6); where = "intro"; }
    clearInterval(S.tick); S.tick = null; stopSpeak();
    S.screen = where; render(); window.scrollTo(0, 0);
  }

  /* ---------------- Events ---------------- */
  document.getElementById("langSel").addEventListener("change", function (ev) {
    S.lang = ev.target.value; store("jahiz-lang", S.lang); stopSpeak(); render();
  });
  document.getElementById("brandBtn").addEventListener("click", function () { if (S.lang) go("home"); });

  function onClick(ev) {
    var b = ev.target.closest("button"); if (!b || b.disabled) return;
    if (b.dataset.pick) { S.lang = b.dataset.pick; store("jahiz-lang", S.lang); S.screen = "home"; render(); return; }
    if (b.dataset.go) { go(b.dataset.go); return; }
    if (S.screen !== "q") return;
    var q = S.qs[S.i];
    if (b.id === "listenBtn") {
      if (S.speaking) { stopSpeak(); drawQ(); return; }
      var lq = L(q), parts = [lq.q];
      if (q.type === "order") parts = parts.concat(lq.o); else parts = parts.concat(optsOf(q));
      speak(parts.join(". ")); drawQ(); return;
    }
    if (b.dataset.replay) { S.vidStart = Date.now(); drawQ(); return; }
    if (S.checked) { if (b.id === "cta") { advance(); } return; }
    if (b.dataset.opt !== undefined) {
      var k = +b.dataset.opt;
      if (q.type === "multi") { var p = S.sel.indexOf(k); if (p > -1) S.sel.splice(p, 1); else S.sel.push(k); } else S.sel = k;
      drawQ(); return;
    }
    if (b.dataset.up !== undefined || b.dataset.down !== undefined) {
      var i1 = b.dataset.up !== undefined ? +b.dataset.up : +b.dataset.down, i2 = b.dataset.up !== undefined ? i1 - 1 : i1 + 1;
      var tmp = S.sel[i1]; S.sel[i1] = S.sel[i2]; S.sel[i2] = tmp; S.touched = true;
      var y = window.scrollY; drawQ(); window.scrollTo(0, y); return;
    }
    if (b.dataset.slot !== undefined) { S.sel.splice(+b.dataset.slot, 1); drawQ(); return; }
    if (b.dataset.undo) { S.sel.pop(); drawQ(); return; }
    if (b.dataset.clear) { S.sel = []; drawQ(); return; }
    if (b.id === "cta") {
      if (!timed()) { S.results[S.i] = { ok: grade(q, S.sel), sel: copy(S.sel), timedOut: false }; S.checked = true; stopSpeak(); saveAll(); drawQ(); return; }
      clearInterval(S.tick); S.tick = null;
      S.results[S.i] = { ok: grade(q, S.sel), sel: copy(S.sel), timedOut: false };
      advance();
    }
  }
  app.addEventListener("click", onClick);
  bar.addEventListener("click", function (ev) { if (ev.target.closest("#unlockBtn")) tryUnlock(); });
  app.addEventListener("click", function (ev) { if (ev.target.closest("#installBtn")) installNow(); });
  app.addEventListener("keydown", function (ev) { if (ev.key === "Enter" && ev.target.id === "codeIn") tryUnlock(); });
  // Re-check a saved code in the background; drop it only if the server says it is no longer valid for this phone.
  if (API && store("kartak-code")) activate(store("kartak-code"), function (j) { if (j.ok) makeTransfer(); else if (j.reason !== "net") { try { localStorage.removeItem("kartak-code"); } catch (e) {} if (S.screen !== "q") render(); } });
  bar.addEventListener("click", onClick);

  redeemTransfer(render);
})();
