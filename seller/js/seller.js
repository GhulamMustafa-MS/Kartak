/*
 * seller/js/seller.js - the seller app: log in with the password, make, reset, turn off and delete codes.
 *
 * Purpose:    Draws every screen of seller/index.html into #app. Talks only to POST /api/admin on the
 *             worker app's address (API below), which checks the password on every call. The password is
 *             kept on this phone in localStorage "kartak-admin-key" so it is typed once.
 *             "Send on WhatsApp" opens wa.me with the code and the worker link (appLink).
 *             Destructive buttons need a second tap within 4 seconds.
 *             Also: add-to-home-screen card + help sheet (decision D13), service worker registration.
 * Used by:    seller/index.html.
 * Depends on: api/admin.js (on https://kartak-app.vercel.app), seller/sw.js, seller/icons/.
 */
(function () {
  "use strict";
  var app = document.getElementById("app");
  var S = { key: get("kartak-admin-key"), list: [], made: null, err: null, busy: false, q: "" };
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
        } else { S.list = j.list; if (cb) cb(j); }
        draw();
      })
      .catch(function () { S.busy = false; S.err = "No internet. Connect and try again."; draw(); });
  }

  function share(code) {
    var msg = "Kartak practice test\n\nYour code: " + fmt(code) + "\n\nOpen this link and type the code:\n" + appLink + "\n\nThe code works on one phone only.";
    return "https://wa.me/?text=" + encodeURIComponent(msg);
  }

  function draw() {
    if (!S.key) {
      app.innerHTML = '<header><b>Kartak codes</b></header>' + installCard() + '<section class="card"><h2>Enter your password</h2><p class="muted">You only need to do this once on this phone.</p>' +
        '<input type="password" id="key" autocomplete="current-password">' + (S.err ? '<div class="err">' + esc(S.err) + '</div>' : '') +
        '<button class="btn" id="login">Open</button></section>';
      return;
    }
    var total = S.list.length, active = S.list.filter(function (r) { return r.active && !r.disabled; }).length, unused = S.list.filter(function (r) { return !r.active && !r.disabled; }).length;
    var q = S.q.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
    var rows = S.list.filter(function (r) { return !q || r.code.indexOf(q.replace(/ /g, "")) > -1 || (r.note || "").toUpperCase().indexOf(q) > -1; });
    var html = '<header><b>Kartak codes</b><span>' + (S.busy ? "Working…" : "") + '</span></header>' +
      installCard() + '<section class="stats"><div><b>' + total + '</b><small>codes made</small></div><div><b>' + active + '</b><small>on a phone</small></div><div><b>' + unused + '</b><small>not used yet</small></div></section>' +
      '<section class="card"><h2>New code</h2><p class="muted">Make one code for each person who pays. It works on one phone only.</p>' +
      '<input type="text" id="note" placeholder="Name (optional)" maxlength="60">' +
      '<button class="btn" id="make"' + (S.busy ? " disabled" : "") + '>Make a new code</button>' +
      (S.made ? '<div class="new-code"><span class="muted">New code</span><span class="big">' + fmt(S.made) + '</span><div class="row"><button class="btn ghost" id="copy">Copy</button><a class="btn" style="display:grid;place-items:center;text-decoration:none" href="' + share(S.made) + '" target="_blank" rel="noopener">Send on WhatsApp</a></div></div>' : '') +
      '</section>' + (S.err ? '<div class="err">' + esc(S.err) + '</div>' : '') +
      '<section class="list"><h2>All codes</h2><input type="text" class="search" id="q" placeholder="Search code or name" value="' + esc(S.q) + '">' +
      (rows.length ? rows.map(function (r) {
        var st = r.disabled ? '<span class="pill off">Turned off</span>' : r.active ? '<span class="pill active">On a phone</span>' : '<span class="pill unused">Not used yet</span>';
        return '<div class="item"><div class="top"><span class="c">' + fmt(r.code) + '</span>' + st + '</div>' +
          '<span class="muted">' + esc(r.note || "No name") + ' · made ' + day(r.created_at) + (r.reset_count ? ' · reset ' + r.reset_count + '×' : '') + '</span>' +
          '<div class="acts">' + (r.active && !r.disabled ? '<button data-act="reset" data-code="' + r.code + '">Reset for new phone</button>' : '') +
          (r.disabled ? '<button data-act="enable" data-code="' + r.code + '">Turn back on</button>' : '<button data-act="disable" data-code="' + r.code + '">Turn off</button>') +
          '<button class="del" data-act="delete" data-code="' + r.code + '">Delete</button></div></div>';
      }).join("") : '<p class="muted">No codes yet.</p>') + '</section>' +
      '<p class="muted">Reset lets the same code work once on a new phone. Turn off stops the code working, and you can turn it back on later. Delete removes the code for good, and anyone using it is locked out.</p>';
    app.innerHTML = html;
  }

  app.addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (!b || b.disabled) return;
    if (b.id === "installBtn") { installNow(); return; }
    if (b.id === "login") { var k = document.getElementById("key").value.trim(); if (!k) return; S.key = k; set("kartak-admin-key", k); call({ action: "list" }); return; }
    if (b.id === "make") { var note = document.getElementById("note").value; call({ action: "new", note: note }, function (j) { S.made = j.made; }); return; }
    if (b.id === "copy" && S.made) { try { navigator.clipboard.writeText(fmt(S.made)); b.textContent = "Copied"; } catch (e) {} return; }
    if (b.dataset.act) {
      if (b.dataset.confirm !== "1") { b.dataset.confirm = "1"; b.textContent = b.dataset.act === "delete" ? "Tap again to delete for good" : "Tap again to confirm"; setTimeout(function () { if (b.isConnected) draw(); }, 4000); return; }
      if (b.dataset.act === "delete" && S.made === b.dataset.code) S.made = null;
      call({ action: b.dataset.act, code: b.dataset.code }); return;
    }
  });
  app.addEventListener("input", function (ev) { if (ev.target.id === "q") { S.q = ev.target.value; var pos = ev.target.selectionStart; draw(); var el = document.getElementById("q"); el.focus(); el.setSelectionRange(pos, pos); } });
  app.addEventListener("keydown", function (ev) { if (ev.key === "Enter" && ev.target.id === "key") document.getElementById("login").click(); });

  if (S.key) call({ action: "list" }); else draw();
})();
