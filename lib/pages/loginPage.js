const { BASE_CSS } = require("./styles");
const { t, normalizeLang } = require("../i18n");
const { renderLangSwitcher } = require("./langSwitcher");

// Only ever used inside a <script> JSON literal below, never as raw HTML —
// but `next` originates from a query string, so it's defused defensively
// against a "</script>" breakout regardless of the allow-list check callers
// are expected to apply before this point.
function jsStringLiteral(value) {
  return JSON.stringify(String(value || "/")).replace(/</g, "\\u003c");
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderLoginPage({ next = "/", lang = "de" } = {}) {
  const l = normalizeLang(lang);
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t(l, "login.title"))}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${BASE_CSS}
  main { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; position: relative; }
  .top-lang { position: absolute; top: 20px; right: 24px; }
  .box { max-width: 380px; width: 100%; }
  h1 { font-size: 22px; margin: 0 0 6px; font-weight: 800; text-align: center; }
  p.subtitle { color: var(--grey); margin: 0 0 22px; text-align: center; font-size: 14px; }
  label { display: block; font-size: 13px; font-weight: 600; margin: 14px 0 6px; color: var(--ink-soft); }
  label:first-of-type { margin-top: 0; }
  .status { font-size: 13.5px; color: var(--grey); margin-top: 12px; min-height: 18px; }
  .status.err { color: #b3261e; }
  .switch { text-align: center; margin-top: 18px; font-size: 13.5px; color: var(--grey); }
  .switch a { color: var(--accent); font-weight: 600; text-decoration: none; }
</style>
</head>
<body>
  <main class="container">
    <div class="top-lang">${renderLangSwitcher(l, `/login?next=${encodeURIComponent(next)}`)}</div>
    <div class="card box">
      <h1>🛠️ ${esc(t(l, "common.appName"))}</h1>
      <p class="subtitle">${esc(t(l, "login.subtitle"))}</p>
      <form id="loginForm">
        <label>${esc(t(l, "login.username"))}</label>
        <input type="text" id="username" autocomplete="username" required autofocus>
        <label>${esc(t(l, "login.password"))}</label>
        <input type="password" id="password" autocomplete="current-password" required>
        <button type="submit" class="btn btn-primary" style="margin-top:18px; width:100%; justify-content:center;">${esc(t(l, "login.submit"))}</button>
        <div id="status" class="status"></div>
      </form>
      <div class="switch">${esc(t(l, "login.noAccount"))} <a href="/signup">${esc(t(l, "login.signupLink"))}</a></div>
    </div>
  </main>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const status = document.getElementById('status');
      status.textContent = '';
      status.className = 'status';
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || ${jsStringLiteral(t(l, "login.errorGeneric"))});
        window.location.href = ${jsStringLiteral(next)};
      } catch (err) {
        status.textContent = err.message;
        status.className = 'status err';
      }
    });
  </script>
</body>
</html>`;
}

module.exports = { renderLoginPage };
