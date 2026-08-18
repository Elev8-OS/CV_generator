const { BASE_CSS } = require("./styles");
const { t, normalizeLang } = require("../i18n");
const { renderLangSwitcher } = require("./langSwitcher");

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Optional, skippable onboarding step shown right after signup (and
// reachable again later from /profile) — lets a brand-new account start
// from an AI-prefilled profile instead of a blank one, by uploading an
// existing CV (PDF/Word) or pasting its text. Never mandatory: a "skip"
// link always leads straight into the (empty) dashboard.
function renderCvImportPage({ lang = "de", returnTo = "/" } = {}) {
  const l = normalizeLang(lang);
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t(l, "cvImport.title"))}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${BASE_CSS}
  main { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; position: relative; }
  .top-lang { position: absolute; top: 20px; right: 24px; }
  .box { max-width: 480px; width: 100%; }
  h1 { font-size: 22px; margin: 0 0 6px; font-weight: 800; text-align: center; }
  p.subtitle { color: var(--grey); margin: 0 0 22px; text-align: center; font-size: 14px; line-height: 1.5; }
  label { display: block; font-size: 13px; font-weight: 600; margin: 16px 0 6px; color: var(--ink-soft); }
  label:first-of-type { margin-top: 0; }
  .divider { text-align: center; font-size: 12px; color: var(--grey-light); margin: 16px 0; text-transform: uppercase; letter-spacing: .05em; }
  .status { font-size: 13.5px; color: var(--grey); margin-top: 12px; min-height: 18px; }
  .status.err { color: #b3261e; }
  .status.ok { color: #1a7f37; }
  .switch { text-align: center; margin-top: 18px; font-size: 13.5px; color: var(--grey); }
  .switch a { color: var(--accent); font-weight: 600; text-decoration: none; }
  .privacy-hint { font-size: 12px; color: var(--grey-light); margin-top: 14px; text-align: center; line-height: 1.4; }
</style>
</head>
<body>
  <main class="container">
    <div class="top-lang">${renderLangSwitcher(l, "/onboarding/cv-import")}</div>
    <div class="card box">
      <h1>📄 ${esc(t(l, "cvImport.heading"))}</h1>
      <p class="subtitle">${esc(t(l, "cvImport.subtitle"))}</p>
      <form id="cvImportForm">
        <label>${esc(t(l, "cvImport.fileLabel"))}</label>
        <input type="file" id="cvFile" accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
        <div class="divider">${esc(t(l, "cvImport.orPaste"))}</div>
        <label>${esc(t(l, "cvImport.pasteLabel"))}</label>
        <textarea id="cvText" rows="6" placeholder="${esc(t(l, "cvImport.pastePlaceholder"))}"></textarea>
        <button type="submit" id="analyzeBtn" class="btn btn-primary" style="margin-top:18px; width:100%; justify-content:center;">${esc(t(l, "cvImport.analyzeBtn"))}</button>
        <div id="status" class="status"></div>
      </form>
      <div class="switch"><a href="${esc(returnTo)}">${esc(t(l, "cvImport.skipLink"))}</a></div>
      <div class="privacy-hint">${esc(t(l, "cvImport.hintPrivacy"))}</div>
    </div>
  </main>
  <script>
    document.getElementById('cvImportForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = document.getElementById('cvFile').files[0];
      const cvText = document.getElementById('cvText').value.trim();
      const status = document.getElementById('status');
      const btn = document.getElementById('analyzeBtn');
      if (!file && !cvText) {
        status.textContent = ${JSON.stringify(t(l, "cvImport.errorNoInput"))};
        status.className = 'status err';
        return;
      }
      btn.disabled = true;
      status.textContent = ${JSON.stringify(t(l, "cvImport.statusAnalyzing"))};
      status.className = 'status';
      try {
        const formData = new FormData();
        if (file) formData.append('file', file);
        if (cvText) formData.append('cvText', cvText);
        const res = await fetch('/api/onboarding/cv-import', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || ${JSON.stringify(t(l, "cvImport.errorGeneric"))});
        status.textContent = ${JSON.stringify(t(l, "cvImport.statusDone"))};
        status.className = 'status ok';
        window.location.href = '/profile?imported=1';
      } catch (err) {
        status.textContent = err.message;
        status.className = 'status err';
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`;
}

module.exports = { renderCvImportPage };
