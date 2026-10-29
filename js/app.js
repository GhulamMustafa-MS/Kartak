/*
 * js/app.js - the worker practice app: every screen, the timer, scoring, access codes and install.
 *
 * Purpose:    One IIFE, no framework, no build step (decision D16). Sections, in file order:
 *               Text      UI strings and the language list come from js/i18n.js (KARTAK_UI, KARTAK_LANGS)
 *               Bank      questions fetched from /data/questions.json; enabled !== false only
 *               Settings  SIZES (full 50 / quick 15 / practice 15 / all = whole bank), PASS = 80%,
 *                         QSEC = 90 s per question; full and quick are timed, practice and all are not
 *               State     S (current screen, mode, question index, answers); store() wraps localStorage
 *               Codes     API is only used on *.vercel.app; deviceId(), activate() -> /api/activate; the saved
 *                         code is re-checked on every start with internet (turned off / time limit ended, D25)
 *               Speech    "Listen" button, shown only when the phone has a voice for the language; reads the
 *                         choices in the order on the screen (never the answer order)
 *               Helpers   shuffle, grading (single/picture/tf/multi/order), type tags
 *               Screens   drawLang, drawHome, drawAllPick ("All questions": every type or one type, D29), drawWords ("Key words", data/words.json, D27), drawLearn, drawIntro, drawQ (+ dial, thermometer SVG,
 *                         order arrows), drawResults, drawGate (code entry)
 *               Install   add-to-home-screen card + help sheet; iPhone code transfer (/api/transfer)
 *               Back      the phone's Back button goes to the home screen instead of closing the app (D28)
 *               Events    one click handler for #app and #bar, the language dropdown, start-up
 *               Results   record() / flushResults(): finished tests (and blocks of 20 in "All questions") go to
 *                         an outbox and are sent to /api/result for the seller's analytics (D26)
 * Storage:    localStorage keys: jahiz-lang (language; old name kept so nobody loses it), kartak-outbox
 *             (results not sent yet),
 *             kartak-code, kartak-dev (device id), kartak-best-full (best full-mock %),
 *             kartak-all (saved place in "All questions", and its question type if one was picked, so it can
 *             be finished over several days).
 * Used by:    index.html.
 * Depends on: js/i18n.js, data/questions.json, data/words.json, videos/, api/activate.js, api/transfer.js, api/result.js, sw.js, icons/.
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
    words: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h11a3 3 0 0 1 3 3v12H7a3 3 0 0 1-3-3z"/><path d="M8 9h6M8 13h4"/><path d="M18 8h2v12"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>'
  };

  /* ---------------- State ---------------- */
  var S = { lang: null, screen: "lang", mode: null, i: 0, sel: null, checked: false, results: [], shuffles: [], qDeadline: 0, tick: null, notice: false, startedAt: 0, endedAt: 0, speaking: false, allType: null };

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
        '<button type="button" class="mode" data-go="words"><span class="ic">' + ICONS.words + '</span><span class="t">' + t.words + '</span><span class="d">' + t.wordsD + '</span></button>' +
        '<button type="button" class="mode" data-go="learn"><span class="ic">' + ICONS.shapes + '</span><span class="t">' + t.learn + '</span><span class="d">' + t.learnD + '</span></button>' +
      '</section>' +
      '<div class="best"><span>' + t.best + '</span><b>' + (best ? '<bdi dir="ltr">' + best + '%</bdi>' : t.none) + '</b></div>' +
      '<p class="fine">' + t.fine + '</p>';
    setBar("");
  }

  // "All questions": with a saved place the card carries on (and says which type); otherwise it opens the
  // chooser, where the worker picks every question or only one type (decision D29).
  function allCard() {
    var t = T(), d = savedAll(), n = BANK.length || 100;
    var desc = d ? t.allResume.replace("{i}", d.results.length + 1).replace("{n}", d.ids.length) + (d.type && t.types[d.type] ? " " + t.types[d.type][0] + "." : "") : t.allD.replace("{n}", n);
    return '<button type="button" class="mode" data-go="' + (d ? "all" : "allpick") + '"><span class="ic">' + ICONS.stack + '</span><span class="t">' + t.all + '</span><span class="d">' + desc + '</span></button>' +
      (d ? '<button type="button" class="small-btn" data-go="allpick">' + t.allRestart + '</button>' : '');
  }
  function drawAllPick() {
    var t = T(), counts = {};
    BANK.forEach(function (q) { counts[q.type] = (counts[q.type] || 0) + 1; });
    var nq = function (n) { return t.nQ.replace("{n}", '<bdi dir="ltr">' + n + '</bdi>'); };
    var rows = '<button type="button" class="mode" data-alltype=""><span class="ic">' + ICONS.stack + '</span><span class="t">' + t.allTypes + '</span><span class="d">' + nq(BANK.length) + '</span></button>' +
      Object.keys(t.types).filter(function (k) { return counts[k]; }).map(function (k) {
        return '<button type="button" class="mode" data-alltype="' + k + '"><span class="ic">' + ICONS[k] + '</span><span class="t">' + t.types[k][0] + '</span><span class="d">' + nq(counts[k]) + '</span></button>';
      }).join("");
    app.innerHTML = '<section class="hello"><h1>' + t.allPickT + '</h1><p>' + t.allPickD + '</p></section><section class="modes allpick">' + rows + '</section>';
    setBar('<button type="button" class="cta ghost" data-go="home">' + t.home + '</button>');
    if (!BANK.length) bankReady.then(function () { if (S.screen === "allpick" && BANK.length) drawAllPick(); });
  }

  /* "Key words" (decision D27): the exam's hard words explained simply, each with a picture, a thermometer or a
     short video. Content in data/words.json (all languages), loaded the first time the screen opens. */
  var WORDS = null;
  var WICON = { // simple line pictures, 48x48
    person: '<circle cx="24" cy="14" r="7"/><path d="M10 42c1-9 6-14 14-14s13 5 14 14"/><path d="M17 9h14"/>',
    card: '<rect x="6" y="11" width="36" height="26" rx="4"/><circle cx="17" cy="23" r="4"/><path d="M12 32c1-3 3-4 5-4s4 1 5 4M27 20h10M27 26h8"/>',
    germ: '<circle cx="24" cy="24" r="10"/><path d="M24 8v6M24 34v6M8 24h6M34 24h6M13 13l4 4M31 31l4 4M35 13l-4 4M13 35l4-4"/><circle cx="21" cy="22" r="2"/><circle cx="27" cy="27" r="1.5"/>',
    sick: '<circle cx="24" cy="24" r="16"/><path d="M17 20h4M27 20h4M17 32c4-4 10-4 14 0"/><path d="M36 10c2 3 2 5 0 7"/>',
    meat: '<path d="M30 8c8 2 12 10 9 17-3 8-12 11-19 8l-6 6c-2 2-5 0-4-2l1-3-3-1c-2 0-3-3-1-4l6-6c-3-7 1-14 8-16"/><circle cx="29" cy="20" r="3"/>',
    plate: '<circle cx="24" cy="26" r="15"/><circle cx="24" cy="26" r="9"/><path d="M6 9v10c0 2 2 3 3 3v18M11 9v8M42 8c-3 2-4 7-4 11h4v21"/>',
    warn: '<path d="M24 7l19 33H5z"/><path d="M24 19v10M24 34v1"/>',
    clock: '<circle cx="24" cy="25" r="15"/><path d="M24 17v9l6 4M19 6h10"/>',
    timer: '<circle cx="24" cy="26" r="14"/><path d="M24 26l6-6M20 6h8M24 6v6M36 13l3-3"/>',
    snow: '<path d="M24 6v36M8.4 15l31.2 18M8.4 33l31.2-18M19 9l5 4 5-4M19 39l5-4 5 4"/>',
    calendar: '<rect x="7" y="10" width="34" height="30" rx="4"/><path d="M7 18h34M15 6v8M33 6v8M15 26h5M23 26h5M31 26h3M15 33h5M23 33h5"/>',
    boxes: '<rect x="6" y="24" width="16" height="16" rx="2"/><rect x="26" y="24" width="16" height="16" rx="2"/><rect x="16" y="8" width="16" height="16" rx="2"/><path d="M10 44h28M34 46l4-2-4-2"/>',
    nut: '<path d="M24 6c6 0 9 5 8 10-1 4-3 5-3 8s3 5 3 9c0 5-4 9-8 9s-8-4-8-9c0-4 3-6 3-9s-2-4-3-8c-1-5 2-10 8-10z"/><path d="M21 14h1M26 20h1M21 30h1M26 35h1"/>',
    hands: '<path d="M14 40V20c0-2 3-2 3 0v8M17 26V14c0-2 3-2 3 0v12M20 26V12c0-2 3-2 3 0v14M23 26V15c0-2 3-2 3 0v17l4-5c2-2 5 0 3 2l-7 10c-2 2-4 3-7 3h-3c-2 0-4-1-4-3z"/><path d="M33 8c2 3 2 5 0 7M38 6c3 4 3 9 0 13"/>',
    glove: '<path d="M14 42V22c0-2 3-2 3 0v-10c0-2 3-2 3 0v-2c0-2 3-2 3 0v2c0-2 3-2 3 0v3c0-2 3-2 3 0v14l4-4c2-2 5 0 3 2l-8 9v8z"/><path d="M14 36h17"/>',
    sponge: '<rect x="8" y="16" width="32" height="18" rx="5"/><path d="M8 24h32"/><circle cx="16" cy="29" r="1.5"/><circle cx="26" cy="30" r="1.5"/><circle cx="33" cy="28" r="1.2"/><path d="M14 10c1-2 3-2 4 0M28 8c1-2 3-2 4 0"/>',
    spray: '<path d="M16 18h12v24H16zM18 18v-6h8v6M26 12h6l4-3M34 14l6-2M34 18l6 2M34 22l5 4"/>',
    sink: '<path d="M6 22h36v6c0 7-6 12-13 12H19c-7 0-13-5-13-12z"/><path d="M14 22v-8M34 22V10c0-2-2-3-4-3s-4 1-4 3"/><path d="M18 30h12"/>',
    bug: '<ellipse cx="24" cy="27" rx="9" ry="13"/><path d="M24 14v26M18 10l3 4M30 10l-3 4M15 22H8M15 30H7M15 37l-6 3M33 22h7M33 30h8M33 37l6 3"/>',
    bottle: '<path d="M19 6h10v6l5 6v22c0 2-1 3-3 3H17c-2 0-3-1-3-3V18l5-6z"/><path d="M19 24l10 10M29 24L19 34"/>',
    hair: '<path d="M8 36c8-2 10-10 18-12s12-8 14-14"/><path d="M10 40c7-3 12-9 19-10"/><circle cx="34" cy="34" r="5"/>',
    mould: '<circle cx="24" cy="26" r="15"/><circle cx="18" cy="22" r="3"/><circle cx="28" cy="30" r="4"/><circle cx="29" cy="19" r="2"/><path d="M24 11c0-3 2-5 5-5"/>',
    check: '<rect x="9" y="6" width="30" height="36" rx="4"/><path d="M15 16l3 3 5-6M15 27l3 3 5-6M27 16h7M27 28h7M15 37h19"/>',
    flag: '<path d="M10 42V6M10 8h24l-5 7 5 7H10"/><circle cx="34" cy="36" r="6"/><path d="M31 36l2 2 4-4"/>'
  };
  // The danger zone: a band from 5°C to 63°C on a 0-100°C scale, cold and hot safe zones either side.
  function dangerZone() {
    var y = function (v) { return 176 - v / 100 * 160; };
    return '<svg viewBox="0 0 120 214" role="img" aria-label="5°C - 63°C"><rect class="dz-hot" x="22" y="' + y(100) + '" width="26" height="' + (y(63) - y(100)) + '" rx="6"/>' +
      '<rect class="dz-bad" x="22" y="' + y(63) + '" width="26" height="' + (y(5) - y(63)) + '"/><rect class="dz-cold" x="22" y="' + y(5) + '" width="26" height="' + (y(-5) - y(5)) + '" rx="6"/>' +
      [[63, "63°C"], [5, "5°C"], [37, "37°C"]].map(function (m) { return '<line class="th-tick" x1="50" x2="60" y1="' + y(m[0]) + '" y2="' + y(m[0]) + '"/><text class="th-lab" x="63" y="' + (y(m[0]) + 4) + '">' + m[1] + '</text>'; }).join("") + '</svg>';
  }
  function wordPic(p) {
    if (p.video) return '<video src="' + p.video + '" controls playsinline muted loop preload="metadata"></video>';
    if (p.thermo === "zone") return '<div class="wpic">' + dangerZone() + '</div>';
    if (p.thermo) return '<div class="wpic">' + thermo(p.thermo, p.v) + '<b><bdi dir="ltr">' + minus(p.v) + '°C</bdi></b></div>';
    return '<div class="wpic icon"><svg viewBox="0 0 48 48" aria-hidden="true">' + (WICON[p.icon] || "") + '</svg></div>';
  }
  function drawWords() {
    var t = T();
    if (!WORDS) {
      app.innerHTML = '<section class="learn"><h1>' + t.words + '</h1><p class="lead">' + t.checking + '</p></section>';
      fetch("/data/words.json").then(function (r) { return r.json(); }).then(function (d) { WORDS = d.words; if (S.screen === "words") drawWords(); }).catch(function () {});
      return;
    }
    var cards = WORDS.map(function (w) {
      var lw = w[S.lang] || w.en;
      return '<article class="word' + (w.pic.video ? " vid" : "") + '">' + wordPic(w.pic) + '<div class="wt"><h2>' + txt(lw.t) + '</h2><p>' + txt(lw.d) + '</p></div></article>';
    }).join("");
    app.innerHTML = '<section class="learn words"><h1>' + t.words + '</h1><p class="lead">' + t.wordsD + '</p>' + cards + '</section>';
    setBar('<button type="button" class="cta ghost" data-two="1" data-go="home">' + t.home + '</button><button type="button" class="cta" data-go="practice">' + t.tryPractice + '</button>');
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
    S.mode = mode; S.i = 0; S.results = []; S.notice = false; S.screen = "q"; S.allSent = 0; syncHistory();
    if (mode === "all" && resumeAll()) return;
    var idx = BANK.map(function (q, k) { return k; });
    if (mode === "all" && S.allType) idx = idx.filter(function (k) { return BANK[k].type === S.allType; }); // one type only (D29)
    for (var j = idx.length - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)); var tt = idx[j]; idx[j] = idx[r]; idx[r] = tt; }
    S.qs = idx.slice(0, Math.min(SIZES[mode], BANK.length)).map(function (k) { return BANK[k]; });
    S.shuffles = S.qs.map(function (q) { return q.type === "order" ? shuffle(q.en.o.length) : null; });
    S.perms = S.qs.map(function (q) { return q.type === "order" || q.type === "tf" ? null : shuffle(q.en.o.length); });
    S.startedAt = Date.now();
    openQ();
  }

  /* Results for the seller's analytics (decision D26): each finished test, and every 20 answers of "All
     questions", goes into an outbox on the phone and is sent to /api/result when there is internet. */
  function outbox() { try { return JSON.parse(store("kartak-outbox") || "[]"); } catch (e) { return []; } }
  function record(from, to) {
    if (!API || !store("kartak-code") || to <= from) return;
    var asked = [], wrong = [], correct = 0, timedOut = 0;
    for (var k = from; k < to; k++) {
      var q = S.qs[k], r = S.results[k] || { ok: false, timedOut: true };
      asked.push(q.id); if (r.ok) correct++; else wrong.push(q.id); if (r.timedOut) timedOut++;
    }
    var id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
    var box = outbox(); box.push({ id: id, mode: S.mode, lang: S.lang, total: to - from, correct: correct, timedOut: timedOut,
      seconds: S.mode === "all" ? null : Math.round((Date.now() - S.startedAt) / 1000), asked: asked, wrong: wrong, at: new Date().toISOString() });
    store("kartak-outbox", JSON.stringify(box.slice(-200)));
    flushResults();
  }
  function flushResults() {
    var box = outbox(), code = store("kartak-code");
    if (!API || !code || !box.length || S.sending) return;
    S.sending = true;
    var batch = box.slice(0, 50);
    fetch(API + "/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code, device: deviceId(), items: batch }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        S.sending = false;
        if (!j.ok && j.reason !== "code") return; // try again later
        var sent = batch.map(function (x) { return x.id; });
        store("kartak-outbox", JSON.stringify(outbox().filter(function (x) { return sent.indexOf(x.id) < 0; })));
        if (outbox().length && j.ok) flushResults();
      })
      .catch(function () { S.sending = false; });
  }
  // "All questions" is long, so it is reported in blocks of 20 answers (and whatever is left when the worker stops).
  function recordAll(force) {
    if (S.mode !== "all") return;
    var n = S.results.filter(function (r) { return r; }).length;
    if (n - (S.allSent || 0) >= 20 || (force && n > (S.allSent || 0))) { record(S.allSent || 0, n); S.allSent = n; saveAll(); }
  }

  /* "All questions" can take several sittings: keep the place on the phone (decision D21). */
  function saveAll() {
    if (S.mode !== "all") return;
    store("kartak-all", JSON.stringify({ ids: S.qs.map(function (q) { return q.id; }), results: S.results, shuffles: S.shuffles, perms: S.perms, sent: S.allSent || 0, type: S.allType || null }));
  }
  function savedAll() {
    try { var d = JSON.parse(store("kartak-all") || "null"); return d && d.ids && d.results.length < d.ids.length ? d : null; } catch (e) { return null; }
  }
  function resumeAll() {
    var d = savedAll(); if (!d) return false;
    var byId = {}; BANK.forEach(function (q) { byId[q.id] = q; });
    if (!d.ids.every(function (id) { return byId[id]; })) { forgetAll(); return false; } // bank changed: start fresh
    S.qs = d.ids.map(function (id) { return byId[id]; });
    S.results = d.results; S.shuffles = d.shuffles; S.perms = d.perms; S.i = d.results.length; S.allSent = d.sent || 0; S.allType = d.type || null;
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
    if (S.mode === "all") { recordAll(true); forgetAll(); } else record(0, N());
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
      '<p class="verdict ' + (pass ? "pass" : "fail") + '">' + (pass ? t.passV : t.failV) + '</p><p>' + (pass ? t.passed : t.failed) + '</p>' + tally +
      (API ? '<p class="saved">' + t.savedNote + '</p>' : '') + '</div>' + rv + '</section>';
    setBar('<button type="button" class="cta ghost" data-two="1" data-go="home">' + t.home + '</button><button type="button" class="cta" data-go="' + S.mode + '">' + t.again + '</button>');
  }

  function needCode() { return API && !store("kartak-code"); }

  /* ---------------- Home screen install ---------------- */
  var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  function standalone() { try { return window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches; } catch (e) { return false; } }
  var installEvt = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); installEvt = e; });
  window.addEventListener("appinstalled", function () { installEvt = null; render(); });
  if ("serviceWorker" in navigator && (API || location.hostname === "localhost")) { try { navigator.serviceWorker.register("/sw.js").catch(function () {}); } catch (e) {} }
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
  // Which message the code screen shows for each reason /api/activate gives.
  function codeErr(reason) { return { used: "errUsed", disabled: "errDisabled", expired: "errExpired", net: "errNet" }[reason] || "errInvalid"; }
  function tryUnlock() {
    var el = document.getElementById("codeIn"); var code = (el ? el.value : "").trim();
    S.codeDraft = code; if (!code) return;
    S.codeBusy = true; S.codeErr = null; drawGate();
    activate(code, function (j) {
      S.codeBusy = false;
      if (j.ok) { store("kartak-code", code.toUpperCase()); S.codeDraft = ""; S.screen = "home"; render(); makeTransfer(); flushResults(); return; }
      S.codeErr = codeErr(j.reason);
      drawGate();
    });
  }
  function render() {
    syncChrome();
    if (!S.lang) { S.screen = "lang"; return drawLang(); }
    if (needCode()) { S.screen = "gate"; return drawGate(); }
    if (S.screen === "home") drawHome();
    else if (S.screen === "learn") drawLearn();
    else if (S.screen === "words") drawWords();
    else if (S.screen === "allpick") drawAllPick();
    else if (S.screen === "intro") drawIntro();
    else if (S.screen === "q") drawQ();
    else if (S.screen === "results") drawResults();
    else drawHome();
    syncHistory();
  }

  /* ---------------- Back button (decision D28) ----------------
     The app is one page, so the phone's Back button used to close it. While an inner screen is open (a test,
     results, Learn, Key words) we keep one extra history entry. Back removes it and we show the home screen
     instead; Back on the home screen closes the app as usual. Leaving a test with answers asks first. */
  var inner = false, skipPop = false;
  function isInner() { return S.screen !== "home" && S.screen !== "lang" && S.screen !== "gate"; }
  function syncHistory() {
    if (!window.history || !history.pushState) return;
    if (isInner() && !inner) { history.pushState({ kartak: 1 }, ""); inner = true; }
    else if (!isInner() && inner) { inner = false; skipPop = true; history.back(); } // drop our entry
  }
  // A test with answers that would be lost ("All questions" saves itself, so it never asks).
  function midTest() { return S.screen === "q" && S.mode !== "all" && S.results.some(Boolean); }
  function okToLeave() { return !midTest() || window.confirm(T().leaveTest); }
  window.addEventListener("popstate", function () {
    if (skipPop) { skipPop = false; return; }
    if (!inner) return;
    inner = false;
    if (!okToLeave()) { history.pushState({ kartak: 1 }, ""); inner = true; return; } // stay in the test
    go("home");
  });

  function go(where) {
    if (SIZES[where]) return start(where);
    if (where.indexOf("intro-") === 0) { S.pending = where.slice(6); where = "intro"; }
    if (S.screen === "q" && S.mode === "all") recordAll(true); // leaving "All questions": report what was answered
    clearInterval(S.tick); S.tick = null; stopSpeak();
    S.screen = where; render(); window.scrollTo(0, 0);
  }

  /* ---------------- Events ---------------- */
  document.getElementById("langSel").addEventListener("change", function (ev) {
    S.lang = ev.target.value; store("jahiz-lang", S.lang); stopSpeak(); render();
  });
  document.getElementById("brandBtn").addEventListener("click", function () { if (S.lang && okToLeave()) go("home"); });

  function onClick(ev) {
    var b = ev.target.closest("button"); if (!b || b.disabled) return;
    if (b.dataset.pick) { S.lang = b.dataset.pick; store("jahiz-lang", S.lang); S.screen = "home"; render(); return; }
    if (b.dataset.go) { go(b.dataset.go); return; }
    if (b.dataset.alltype !== undefined) { forgetAll(); S.allType = b.dataset.alltype || null; start("all"); return; }
    if (S.screen !== "q") return;
    var q = S.qs[S.i];
    if (b.id === "listenBtn") {
      if (S.speaking) { stopSpeak(); drawQ(); return; }
      var lq = L(q), parts = [lq.q];
      // Read the choices in the order they are on the screen, never the answer order (ordering steps are
      // stored correct-first, and the other options are shuffled on screen).
      if (q.type === "order") parts = parts.concat(S.sel.map(function (k) { return lq.o[k]; }));
      else if (S.perms[S.i]) parts = parts.concat(S.perms[S.i].map(function (k) { return lq.o[k]; }));
      else parts = parts.concat(optsOf(q));
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
      if (!timed()) { S.results[S.i] = { ok: grade(q, S.sel), sel: copy(S.sel), timedOut: false }; S.checked = true; stopSpeak(); saveAll(); recordAll(false); drawQ(); return; }
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
  // A code with a time limit (D25) stops here: the next start with internet finds it has ended and locks the app.
  if (API && store("kartak-code")) activate(store("kartak-code"), function (j) { if (j.ok) { makeTransfer(); flushResults(); } else if (j.reason !== "net") { try { localStorage.removeItem("kartak-code"); } catch (e) {} S.codeErr = codeErr(j.reason); if (S.screen !== "q") render(); } });
  bar.addEventListener("click", onClick);
  window.addEventListener("online", flushResults); // results saved offline go out as soon as there is internet

  redeemTransfer(render);
})();
