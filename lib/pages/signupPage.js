const { BASE_CSS } = require("./styles");
const { t, normalizeLang } = require("../i18n");
const { renderLangSwitcher } = require("./langSwitcher");

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderSignupPage({ lang = "de" } = {}) {
  const l = normalizeLang(lang);
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t(l, "signup.title"))}</title>
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
  .hint { font-size: 12px; color: var(--grey-light); margin-top: 5px; }
</style>
</head>
<body>
  <main class="container">
    <div class="top-lang">${renderLangSwitcher(l, "/signup")}</div>
    <div class="card box">
      <h1>🛠️ ${esc(t(l, "common.appName"))}</h1>
      <p class="subtitle">${esc(t(l, "signup.subtitle"))}</p>
      <form id="signupForm">
        <label>${esc(t(l, "signup.username"))}</label>
        <input type="text" id="username" autocomplete="username" required autofocus>
        <div class="hint">${esc(t(l, "signup.usernameHint"))}</div>
        <label>${esc(t(l, "signup.password"))}</label>
        <input type="password" id="password" autocomplete="new-password" required minlength="8">
        <div class="hint">${esc(t(l, "signup.passwordHint"))}</div>
        <label>${esc(t(l, "signup.passwordConfirm"))}</label>
        <input type="password" id="passwordConfirm" autocomplete="new-password" required minlength="8">
        <button type="submit" class="btn btn-primary" style="margin-top:18px; width:100%; justify-content:center;">${esc(t(l, "signup.submit"))}</button>
        <div id="status" class="status"></div>
      </form>
      <div class="switch">${esc(t(l, "signup.haveAccount"))} <a href="/login">${esc(t(l, "signup.loginLink"))}</a></div>
    </div>
  </main>
  <script>
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;
      const status = document.getElementById('status');
      status.textContent = '';
      status.className = 'status';
      if (password !== passwordConfirm) {
        status.textContent = ${JSON.stringify(t(l, "signup.errorMismatch"))};
        status.className = 'status err';
        return;
      }
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || ${JSON.stringify(t(l, "signup.errorGeneric"))});
        // New accounts get an optional, skippable CV-import step right after
        // signup instead of dropping straight into an empty dashboard.
        window.location.href = '/onboarding/cv-import';
      } catch (err) {
        status.textContent = err.message;
        status.className = 'status err';
      }
    });
  </script>
</body>
</html>`;
}

module.exports = { renderSignupPage };
