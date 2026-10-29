/*
 * seller/js/seller.js - the seller app: log in with the password, make, reset, turn off and delete codes.
 *
 * Purpose:    Draws every screen of seller/index.html into #app: the Codes tab and the Results tab (how each
 *             person is doing, drawn by seller/js/stats.js, decision D26). A code can get a time limit (no limit /
 *             1 / 3 / 7 / 30 days from its first use, decision D25), chosen when it is made or changed
 *             later with "Time limit" on the code. Talks only to POST /api/admin on the
 *             worker app's address (API below), which checks the password on every call. The password is
 *             kept on this phone in localStorage "kartak-admin-key" so it is typed once.
 *             "Send on WhatsApp" opens wa.me with the code and the worker link (appLink).
 *             Destructive buttons need a second tap within 4 seconds.
 *             The phone's Back button goes up a level (person -> Results -> Codes) instead of closing (D28).
 *             Also: add-to-home-screen card + help sheet (decision D13), service worker registration.
 * Used by:    seller/index.html.
 * Depends on: api/admin.js (on https://kartak-app.vercel.app), seller/js/stats.js, the worker app's
 *             data/questions.json (topic and question names), seller/sw.js, seller/icons/.
 */
(function () {
  "use strict";
  var app = document.getElementById("app");
  var S = { key: get("kartak-admin-key"), list: [], made: null, madeDays: null, days: null, limitFor: null, err: null, busy: false, q: "",
    tab: "codes", stats: null, person: null, personRows: null, bank: null };
  var K = window.KartakStats;
  // Time limits the seller can pick (decision D25): days from the code's first use; null = no limit.
  var LIMITS = [[null, "No limit"], [1, "1 day"], [3, "3 days"], [7, "7 days"], [30, "30 days"]];
  function limitName(d) { return d ? d + (d === 1 ? " day" : " days") : "No limit"; }
  function chips(current, attr, code) {
    return '<div class="chips" role="group" aria-label="Time limit">' + LIMITS.map(function (l) {
      return '<button type="button" ' + attr + '="' + (l[0] || "") + '"' + (code ? ' data-code="' + code + '"' : '') + ' aria-pressed="' + (l[0] === current) + '">' + l[1] + '</button>';
    }).join("") + '</div>';
  }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(c) { return c.slice(0, 3) + "-" + c.slice(3); }
  function day(d) { if (!d) return ""; var x = new Date(d); return x.toLocaleDateString(undefined, { day: "numeric", month: "short" }); }
  var API = "https://kartak-app.vercel.app/api";
  var appLink = "https://kartak-app.vercel.app/";
  var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  function standalone() { try { return navigator.standalone === true || matchMedia("(display-mode: standalone)").matches; } catch (e) { return false; } }
  var installEvt = null;
  addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); installEvt = e; });
  addEventListener("appinstalled", function () { installEvt = null; draw(); });
  if ("serviceWorker" in navigator) { try { navigator.serviceWorker.register("/sw.js").catch(function () {}); } catch (e) {} }
  function installCard() {
    if (standalone()) return "";
    return '<div class="install"><img src="/icons/icon-192.png" alt=""><div class="tx"><b>Add to home screen</b><span>Open this page like an app, straight from your phone.</span></div><button id="installBtn">Add</button></div>';
  }
  function installNow() {
    if (installEvt) { var e = installEvt; installEvt = null; e.prompt(); return; }
    var steps = isIOS
      ? ["Tap the Share button (the square with an arrow). On newer iPhones tap ⋯ first, then Share.", "Scroll down and tap “Add to Home Screen”.", "Tap “Add”."]
      : ["Tap the ⋮ menu at the top right of your browser.", "Tap “Add to Home screen” or “Install app”.", "Tap “Add” or “Install”."];
    var el = document.createElement("div"); el.className = "sheet-bg";
    el.innerHTML = '<div class="sheet"><h2>Add to your home screen</h2><ol>' + steps.map(function (x) { return "<li>" + x + "</li>"; }).join("") + '</ol>' +
      (isIOS ? '<p class="muted">If you opened this inside WhatsApp, tap ⋯ and choose “Open in Safari” first.</p>' : '') + '<button class="btn" id="sheetClose">Got it</button></div>';
    document.body.appendChild(el);
    el.addEventListener("click", function (ev) { if (ev.target === el || ev.target.id === "sheetClose") el.remove(); });
  }

  function call(body, cb) {
    S.busy = true; S.err = null; draw();
    body.key = S.key;
    fetch(API + "/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        S.busy = false;
        if (!j.ok) {
          if (j.reason === "key") { S.key = null; set("kartak-admin-key", null); S.err = "That password is wrong."; }
          else S.err = "Something went wrong. Try again.";
        } else { S.list = j.list; if (j.stats) S.stats = j.stats; if (j.results) S.personRows = j.results; if (cb) cb(j); }
        draw();
      })
      .catch(function () { S.busy = false; S.err = "No internet. Connect and try again."; draw(); });
  }

  function share(code) {
    var msg = "Kartak practice test\n\nYour code: " + fmt(code) + "\n\nOpen this link and type the code:\n" + appLink + "\n\nThe code works on one phone only." +
      (S.madeDays ? "\nIt works for " + limitName(S.madeDays) + " from the first time you use it." : "");
    return "https://wa.me/?text=" + encodeURIComponent(msg);
  }

  // The question bank (English text, chapter, type) names the topics and questions on the Results tab.
  // It comes from the worker app, which allows this address to read it (vercel.json).
  function loadBank() {
    if (S.bank) return;
    S.bank = {};
    fetch(appLink + "data/questions.json").then(function (r) { return r.json(); }).then(function (d) {
      var b = {}; d.questions.forEach(function (q) { b[q.id] = { ch: q.ch, type: q.type, q: q.en.q }; }); S.bank = b; draw();
    }).catch(function () { S.bank = null; });
  }
  function openResults(code) {
    S.tab = "results"; S.person = code || null; S.personRows = null; loadBank();
    if (code) call({ action: "results", code: code }); else call({ action: "stats" });
    scrollTo(0, 0);
  }
  function resultsView() {
    if (S.person) {
      var row = S.list.filter(function (r) { return r.code === S.person; })[0];
      if (!row) return '<p class="muted">This code no longer exists.</p>';
      return S.personRows ? K.person(row, S.personRows, S.bank || {}) : '<p class="muted">Loading…</p>';
    }
    return S.stats ? K.overview(S.stats, S.list, S.bank || {}) : '<p class="muted">Loading…</p>';
  }

  /* Back button (decision D28): one history entry per level (Results tab, then one person), so the phone's
     Back goes up a level instead of closing the app. Back on the Codes tab closes it as usual. */
  var pushed = 0, skipPop = 0;
  function level() { return S.key && S.tab === "results" ? (S.person ? 2 : 1) : 0; }
  function syncHistory() {
    if (!window.history || !history.pushState) return;
    var want = level();
    while (pushed < want) { pushed++; history.pushState({ kartak: pushed }, ""); }
    if (pushed > want) { skipPop++; history.go(want - pushed); pushed = want; } // went up with a button
  }
  window.addEventListener("popstate", function () {
    if (skipPop) { skipPop--; return; }
    if (!pushed) return;
    pushed--;
    if (S.person) openResults(null); else { S.tab = "codes"; S.person = null; draw(); }
  });

  function draw() {
    syncHistory();
    if (!S.key) {
      app.innerHTML = '<header><b>Kartak codes</b></header>' + installCard() + '<section class="card"><h2>Enter your password</h2><p class="muted">You only need to do this once on this phone.</p>' +
        '<input type="password" id="key" autocomplete="current-password">' + (S.err ? '<div class="err">' + esc(S.err) + '</div>' : '') +
        '<button class="btn" id="login">Open</button></section>';
      return;
    }
    var total = S.list.length, active = S.list.filter(function (r) { return r.active && !r.disabled && !r.expired; }).length, unused = S.list.filter(function (r) { return !r.active && !r.disabled; }).length;
    var q = S.q.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
    var rows = S.list.filter(function (r) { return !q || r.code.indexOf(q.replace(/ /g, "")) > -1 || (r.note || "").toUpperCase().indexOf(q) > -1; });
    var tabs = '<nav class="tabs" role="tablist"><button role="tab" data-tab="codes" aria-selected="' + (S.tab === "codes") + '">Codes</button>' +
      '<button role="tab" data-tab="results" aria-selected="' + (S.tab === "results") + '">Results</button></nav>';
    if (S.tab === "results") {
      app.innerHTML = '<header><b>Kartak codes</b><span>' + (S.busy ? "Working…" : "") + '</span></header>' + tabs +
        (S.err ? '<div class="err">' + esc(S.err) + '</div>' : '') + resultsView();
      return;
    }
    var html = '<header><b>Kartak codes</b><span>' + (S.busy ? "Working…" : "") + '</span></header>' +
      installCard() + tabs + '<section class="stats"><div><b>' + total + '</b><small>codes made</small></div><div><b>' + active + '</b><small>on a phone</small></div><div><b>' + unused + '</b><small>not used yet</small></div></section>' +
      '<section class="card"><h2>New code</h2><p class="muted">Make one code for each person who pays. It works on one phone only.</p>' +
      '<input type="text" id="note" placeholder="Name (optional)" maxlength="60">' +
      '<span class="lbl">How long it works</span>' + chips(S.days, "data-days") +
      '<p class="muted small">Counted from the first time the code is used. Pick a short time for people who want to try it first.</p>' +
      '<button class="btn" id="make"' + (S.busy ? " disabled" : "") + '>Make a new code</button>' +
      (S.made ? '<div class="new-code"><span class="muted">New code</span><span class="big">' + fmt(S.made) + '</span><div class="row"><button class="btn ghost" id="copy">Copy</button><a class="btn" style="display:grid;place-items:center;text-decoration:none" href="' + share(S.made) + '" target="_blank" rel="noopener">Send on WhatsApp</a></div></div>' : '') +
      '</section>' + (S.err ? '<div class="err">' + esc(S.err) + '</div>' : '') +
      '<section class="list"><h2>All codes</h2><input type="text" class="search" id="q" placeholder="Search code or name" value="' + esc(S.q) + '">' +
      (rows.length ? rows.map(function (r) {
        var st = r.disabled ? '<span class="pill off">Turned off</span>' : r.expired ? '<span class="pill off">Time over</span>' : r.active ? '<span class="pill active">On a phone</span>' : '<span class="pill unused">Not used yet</span>';
        var lim = !r.valid_days ? "" : ' · ' + limitName(r.valid_days) + (r.ends ? (r.expired ? ", ended " : ", ends ") + day(r.ends) : ", starts at first use");
        return '<div class="item"><div class="top"><span class="c">' + fmt(r.code) + '</span>' + st + '</div>' +
          '<span class="muted">' + esc(r.note || "No name") + ' · made ' + day(r.created_at) + (r.reset_count ? ' · reset ' + r.reset_count + '×' : '') + lim + '</span>' +
          (r.tests ? '<span class="res">' + K.summary(r) + ' ' + '<span class="pill v-' + K.verdict(r)[0] + '">' + K.verdict(r)[1] + '</span></span>' : '') +
          '<div class="acts">' + (r.active && !r.disabled ? '<button data-act="reset" data-code="' + r.code + '">Reset for new phone</button>' : '') +
          (r.disabled ? '<button data-act="enable" data-code="' + r.code + '">Turn back on</button>' : '<button data-act="disable" data-code="' + r.code + '">Turn off</button>') +
          '<button data-limitfor="' + r.code + '">Time limit</button>' +
          '<button data-person="' + r.code + '">Results</button>' +
          '<button class="del" data-act="delete" data-code="' + r.code + '">Delete</button></div>' +
          (S.limitFor === r.code ? '<div class="limit-edit"><span class="muted small">Change the time limit. The days count from the first use' + (r.activated_at ? ' (' + day(r.activated_at) + ')' : '') + '.</span>' + chips(r.valid_days || null, "data-setlimit", r.code) + '</div>' : '') + '</div>';
      }).join("") : '<p class="muted">No codes yet.</p>') + '</section>' +
      '<p class="muted">Reset lets the same code work once on a new phone. Turn off stops the code working, and you can turn it back on later. Time limit sets how many days the code works after its first use; when the time is over, the app locks the next time the person opens it with internet. Pick No limit to give someone full access after a trial. Delete removes the code for good, and anyone using it is locked out.</p>';
    app.innerHTML = html;
  }

  app.addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (!b || b.disabled) return;
    if (b.id === "installBtn") { installNow(); return; }
    if (b.dataset.tab) { if (b.dataset.tab === "results") openResults(null); else { S.tab = "codes"; S.person = null; draw(); } return; }
    if (b.dataset.person) { openResults(b.dataset.person); return; }
    if (b.dataset.back) { openResults(null); return; }
    if (b.id === "login") { var k = document.getElementById("key").value.trim(); if (!k) return; S.key = k; set("kartak-admin-key", k); call({ action: "list" }); return; }
    if (b.id === "make") { var note = document.getElementById("note").value, d = S.days; call({ action: "new", note: note, days: d }, function (j) { S.made = j.made; S.madeDays = d; }); return; }
    if (b.dataset.days !== undefined) { S.days = b.dataset.days ? +b.dataset.days : null; keepNote(draw); return; }
    if (b.dataset.limitfor) { S.limitFor = S.limitFor === b.dataset.limitfor ? null : b.dataset.limitfor; keepNote(draw); return; }
    if (b.dataset.setlimit !== undefined) { S.limitFor = null; call({ action: "limit", code: b.dataset.code, days: b.dataset.setlimit ? +b.dataset.setlimit : null }); return; }
    if (b.id === "copy" && S.made) { try { navigator.clipboard.writeText(fmt(S.made)); b.textContent = "Copied"; } catch (e) {} return; }
    if (b.dataset.act) {
      if (b.dataset.confirm !== "1") { b.dataset.confirm = "1"; b.textContent = b.dataset.act === "delete" ? "Tap again to delete for good" : "Tap again to confirm"; setTimeout(function () { if (b.isConnected) draw(); }, 4000); return; }
      if (b.dataset.act === "delete" && S.made === b.dataset.code) S.made = null;
      call({ action: b.dataset.act, code: b.dataset.code }); return;
    }
  });
  // Redraw without losing what was typed in the name box.
  function keepNote(fn) { var el = document.getElementById("note"), v = el ? el.value : ""; fn(); var n = document.getElementById("note"); if (n) n.value = v; }
  app.addEventListener("input", function (ev) { if (ev.target.id === "q") { S.q = ev.target.value; var pos = ev.target.selectionStart; draw(); var el = document.getElementById("q"); el.focus(); el.setSelectionRange(pos, pos); } });
  app.addEventListener("keydown", function (ev) { if (ev.key === "Enter" && ev.target.id === "key") document.getElementById("login").click(); });

  if (S.key) call({ action: "list" }); else draw();
})();
