/*
 * seller/js/stats.js - the Results screens of the seller app: how every code's person is doing (decision D26).
 *
 * Purpose:    Turns what /api/admin sends ("stats" for everyone, "results" for one code) into HTML:
 *               overview(stats, list, bank)  - totals, pass rate, test types, people, hardest questions,
 *                                              weakest topics, languages
 *               person(row, results, bank)   - one code: verdict, scores over time, test types, weak topics,
 *                                              questions they miss, recent tests
 *               summary(row)                 - the one line shown under each code in the codes list
 *             bank = { id: { ch, type, q } } built from the worker app's data/questions.json (English text),
 *             so topics and questions can be named. Readiness rule: see verdict().
 * Used by:    seller/js/seller.js (window.KartakStats).
 * Depends on: nothing; plain functions returning HTML strings.
 */
(function () {
  "use strict";
  // Handbook chapters (docs/handbook.md), short names for the seller.
  var CH = { 1: "Health certificate and your job", 2: "Food safety basics", 3: "Germs and temperatures", 4: "Chemicals and objects in food",
    5: "Food going bad", 6: "Food poisoning and allergies", 7: "Personal hygiene", 8: "Cleaning and pests", 9: "Kitchen layout",
    10: "HACCP", 11: "Safe food handling", 12: "Practical skills", 13: "Safety at work" };
  var MODES = { full: "Full mock", quick: "Quick test", practice: "Practice", all: "All questions" };
  var LANGS = { en: "English", ar: "Arabic", ur: "Urdu", hi: "Hindi", bn: "Bangla", ne: "Nepali", ml: "Malayalam", ta: "Tamil", fil: "Filipino", ind: "Indonesian", tr: "Turkish" };
  var TYPES = { single: "one answer", multi: "choose all", tf: "true or false", order: "put in order", picture: "picture", video: "video" };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(c) { return c.slice(0, 3) + "-" + c.slice(3); }
  function day(d) { return d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : ""; }
  function when(d) { return d ? new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""; }
  function pct(a, b) { return b ? Math.round(a * 100 / b) : 0; }
  function passed(r) { return r.correct * 5 >= r.total * 4; } // 80% or more, as in the real exam
  function bar(p, cls) { return '<span class="bar ' + (cls || "") + '"><span style="width:' + Math.max(0, Math.min(100, p)) + '%"></span></span>'; }

  // Readiness, from the code's summary: two or more passed full mocks and most full mocks passed = ready.
  function verdict(r) {
    if (!r.tests) return ["none", "Not started"];
    if (r.fulls_passed >= 2 && r.fulls_passed * 3 >= r.fulls * 2) return ["ready", "Ready"];
    if (r.fulls_passed >= 1 || r.avg >= 65) return ["close", "Getting there"];
    return ["weak", "Needs practice"];
  }
  function pill(r) { var v = verdict(r); return '<span class="pill v-' + v[0] + '">' + v[1] + '</span>'; }

  function summary(r) {
    if (!r.tests) return "";
    return r.tests + (r.tests === 1 ? " test" : " tests") + " · avg " + r.avg + "%" +
      (r.fulls ? " · full mocks passed " + r.fulls_passed + " of " + r.fulls : "") + " · last " + day(r.last_test);
  }

  // Wrong-answer rate per handbook chapter from per-question counts [{id, asked, wrong}].
  function chapters(qs, bank, minAsked) {
    var by = {};
    qs.forEach(function (q) { var b = bank[q.id]; if (!b) return; var c = by[b.ch] || (by[b.ch] = { ch: b.ch, asked: 0, wrong: 0 }); c.asked += q.asked; c.wrong += q.wrong; });
    return Object.keys(by).map(function (k) { return by[k]; }).filter(function (c) { return c.asked >= minAsked; })
      .sort(function (a, b) { return b.wrong / b.asked - a.wrong / a.asked; });
  }
  function topicRows(list, n) {
    if (!list.length) return '<p class="muted">Not enough answers yet.</p>';
    return list.slice(0, n).map(function (c) {
      var p = pct(c.wrong, c.asked);
      return '<div class="trow"><span class="tn">' + esc(CH[c.ch] || "Chapter " + c.ch) + '</span>' + bar(p, p >= 40 ? "bad" : p >= 25 ? "mid" : "good") +
        '<span class="tv">' + p + '% wrong</span></div>';
    }).join("");
  }
  function questionRows(qs, bank, n, minAsked, empty) {
    var hard = qs.filter(function (q) { return q.asked >= minAsked && q.wrong > 0 && bank[q.id]; })
      .sort(function (a, b) { return b.wrong / b.asked - a.wrong / a.asked || b.wrong - a.wrong; }).slice(0, n);
    if (!hard.length) return '<p class="muted">' + (empty || "No missed questions yet.") + '</p>';
    return hard.map(function (q) {
      var b = bank[q.id];
      return '<div class="qrow"><b>' + pct(q.wrong, q.asked) + '% wrong</b> <span class="muted">(' + q.wrong + ' of ' + q.asked + ') · ' +
        esc(CH[b.ch] || "") + ' · ' + (TYPES[b.type] || b.type) + '</span><span>' + esc(b.q) + '</span></div>';
    }).join("");
  }

  function overview(st, list, bank) {
    var o = st.overall;
    if (!o.tests) return '<section class="card"><h2>Results</h2><p class="muted">No results yet. They appear here as soon as someone with a code finishes a test.</p></section>';
    var people = list.filter(function (r) { return r.tests; }).sort(function (a, b) { return new Date(b.last_test) - new Date(a.last_test); });
    var ready = people.filter(function (r) { return verdict(r)[0] === "ready"; }).length;
    var modes = ["full", "quick", "practice", "all"].map(function (m) {
      var x = st.modes.filter(function (y) { return y.mode === m; })[0];
      return x ? '<div class="trow"><span class="tn">' + MODES[m] + ' <span class="muted">· ' + x.n + '</span></span>' + bar(x.avg, x.avg >= 80 ? "good" : x.avg >= 65 ? "mid" : "bad") + '<span class="tv">avg ' + x.avg + '%</span></div>' : "";
    }).join("");
    return '<section class="stats"><div><b>' + o.tests + '</b><small>tests taken</small></div><div><b>' + o.people + '</b><small>people practising</small></div><div><b>' + o.avg + '%</b><small>average score</small></div></section>' +
      '<section class="stats"><div><b>' + o.fulls + '</b><small>full mocks</small></div><div><b>' + pct(o.fulls_passed, o.fulls) + '%</b><small>full mocks passed</small></div><div><b>' + ready + '</b><small>ready for the exam</small></div></section>' +
      '<section class="card"><h2>People</h2><p class="muted small">Tap someone to see their tests. Ready = passed at least 2 full mocks, and most of their full mocks.</p>' +
      people.map(function (r) {
        return '<button class="person" data-person="' + r.code + '"><span class="top"><span class="c">' + esc(r.note || fmt(r.code)) + '</span>' + pill(r) + '</span>' +
          '<span class="muted small">' + (r.note ? fmt(r.code) + ' · ' : '') + summary(r) + '</span></button>';
      }).join("") + '</section>' +
      '<section class="card"><h2>By test type</h2>' + modes + '</section>' +
      '<section class="card"><h2>Weakest topics</h2><p class="muted small">Share of answers that were wrong, all people together.</p>' + topicRows(chapters(st.questions, bank, 10), 13) + '</section>' +
      '<section class="card"><h2>Hardest questions</h2><p class="muted small">Asked at least 3 times. The wording is the English version.</p>' + questionRows(st.questions, bank, 10, 3, "Shows once questions have been answered at least 3 times.") + '</section>' +
      '<section class="card"><h2>Languages</h2><p>' + st.langs.map(function (l) { return esc(LANGS[l.lang] || l.lang) + ' <b>' + l.n + '</b>'; }).join(" · ") + '</p></section>';
  }

  function person(row, results, bank) {
    var head = '<button class="btn ghost back" data-back="1">Back</button>' +
      '<section class="card"><div class="top"><h2>' + esc(row.note || fmt(row.code)) + '</h2>' + pill(row) + '</div><p class="muted">' + fmt(row.code) + (row.activated_at ? ' · first used ' + day(row.activated_at) : ' · not used yet') + '</p></section>';
    if (!results.length) return head + '<section class="card"><p class="muted">No tests finished yet. Results appear after the first test this person finishes with internet.</p></section>';
    var scores = results.map(function (r) { return pct(r.correct, r.total); });
    var fulls = results.filter(function (r) { return r.mode === "full"; });
    var last10 = results.slice(0, 10).reverse();
    var trend = '<div class="trend">' + last10.map(function (r) {
      var p = pct(r.correct, r.total);
      return '<span title="' + MODES[r.mode] + ' ' + p + '%"><i class="' + (p >= 80 ? "good" : p >= 65 ? "mid" : "bad") + '" style="height:' + Math.max(4, p) + '%"></i><small>' + p + '</small></span>';
    }).join("") + '</div>';
    // Per-question counts for this person, for their weak topics and missed questions.
    var qs = {};
    results.forEach(function (r) {
      (r.asked ? r.asked.split(",") : []).forEach(function (id) { (qs[id] || (qs[id] = { id: id, asked: 0, wrong: 0 })).asked++; });
      (r.wrong ? r.wrong.split(",") : []).forEach(function (id) { (qs[id] || (qs[id] = { id: id, asked: 0, wrong: 0 })).wrong++; });
    });
    qs = Object.keys(qs).map(function (k) { return qs[k]; });
    var byMode = ["full", "quick", "practice", "all"].map(function (m) {
      var rs = results.filter(function (r) { return r.mode === m; }); if (!rs.length) return "";
      var a = Math.round(rs.reduce(function (s, r) { return s + pct(r.correct, r.total); }, 0) / rs.length);
      return '<div class="trow"><span class="tn">' + MODES[m] + ' <span class="muted">· ' + rs.length + '</span></span>' + bar(a, a >= 80 ? "good" : a >= 65 ? "mid" : "bad") + '<span class="tv">avg ' + a + '%</span></div>';
    }).join("");
    return head +
      '<section class="stats"><div><b>' + results.length + '</b><small>tests</small></div><div><b>' + Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) + '%</b><small>average</small></div><div><b>' + Math.max.apply(null, scores) + '%</b><small>best</small></div></section>' +
      '<section class="card"><h2>Full mock exams</h2><p>' + (fulls.length ? 'Passed <b>' + fulls.filter(passed).length + ' of ' + fulls.length + '</b> (80% or more). Last ones: ' +
        fulls.slice(0, 3).map(function (r) { return pct(r.correct, r.total) + "%"; }).join(", ") : 'No full mock yet. A full mock is the best sign of being ready.') + '</p></section>' +
      '<section class="card"><h2>Latest scores</h2><p class="muted small">Up to the last 10 tests, oldest on the left. Green = 80% or more.</p>' + trend + '</section>' +
      '<section class="card"><h2>By test type</h2>' + byMode + '</section>' +
      '<section class="card"><h2>Weakest topics</h2>' + topicRows(chapters(qs, bank, 4), 4) + '</section>' +
      '<section class="card"><h2>Questions they miss</h2>' + questionRows(qs, bank, 8, 1) + '</section>' +
      '<section class="card"><h2>Recent tests</h2>' + results.slice(0, 20).map(function (r) {
        var p = pct(r.correct, r.total);
        var mins = r.seconds == null ? "" : r.seconds < 60 ? "under 1 min" : Math.round(r.seconds / 60) + " min";
        return '<div class="trow two"><span class="tn">' + when(r.finished_at) + ' · ' + MODES[r.mode] + ' <span class="muted">· ' + esc(LANGS[r.lang] || r.lang) + (mins ? ' · ' + mins : '') + '</span></span>' +
          '<span class="tv ' + (r.mode === "full" ? (passed(r) ? "ok" : "no") : "") + '">' + p + '%<small class="muted"> ' + r.correct + '/' + r.total + '</small></span></div>';
      }).join("") + '</section>';
  }

  window.KartakStats = { overview: overview, person: person, summary: summary, verdict: verdict };
})();
