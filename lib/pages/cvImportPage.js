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
  .issue-block { border: 1px solid var(--border, #e2e2e2); border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; }
  .issue-pill { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; padding: 2px 8px; border-radius: 100px; background: #f1e9d8; color: #8a6a1f; margin-bottom: 6px; }
  .issue-desc { font-size: 13.5px; color: var(--ink-soft); margin: 0 0 8px; line-height: 1.4; }
  .issue-block textarea { width: 100%; box-sizing: border-box; font: inherit; }
  .issues-actions { display: flex; gap: 10px; margin-top: 6px; }
  .issues-actions .btn-secondary { flex: none; }
</style>
</head>
<body>
  <main class="container">
    <div class="top-lang">${renderLangSwitcher(l, "/onboarding/cv-import")}</div>
    <div class="card box">
      <div id="uploadSection">
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
      <div id="issuesSection" style="display:none;">
        <h1>🔎 ${esc(t(l, "cvImport.issuesHeading"))}</h1>
        <p class="subtitle">${esc(t(l, "cvImport.issuesSubtitle"))}</p>
        <div id="issuesList"></div>
        <div class="issues-actions">
          <button type="button" id="continueBtn" class="btn btn-primary" style="flex:1; justify-content:center;">${esc(t(l, "cvImport.continueBtn"))}</button>
          <button type="button" id="skipAllBtn" class="btn btn-secondary">${esc(t(l, "cvImport.skipAllBtn"))}</button>
        </div>
        <div id="issuesStatus" class="status"></div>
      </div>
    </div>
  </main>
  <script>
    (function () {
      var ISSUE_TYPE_LABELS = {
        gap: ${JSON.stringify(t(l, "cvImport.issueTypeGap"))},
        missing: ${JSON.stringify(t(l, "cvImport.issueTypeMissing"))},
        contradiction: ${JSON.stringify(t(l, "cvImport.issueTypeContradiction"))}
      };

      function escHtml(s) {
        return String(s || "").replace(/[&<>"']/g, function (c) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
      }

      function showIssues(issues) {
        document.getElementById('uploadSection').style.display = 'none';
        var section = document.getElementById('issuesSection');
        section.style.display = '';
        var list = document.getElementById('issuesList');
        list.innerHTML = '';
        issues.forEach(function (issue, i) {
          var block = document.createElement('div');
          block.className = 'issue-block';
          var pillLabel = ISSUE_TYPE_LABELS[issue.type] || ISSUE_TYPE_LABELS.missing;
          block.innerHTML =
            '<div class="issue-pill">' + escHtml(pillLabel) + '</div>' +
            '<p class="issue-desc">' + escHtml(issue.description) + '</p>' +
            '<textarea rows="2" data-issue-id="' + escHtml(issue.id || ('issue-' + i)) + '" ' +
            'data-issue-type="' + escHtml(issue.type || 'sonstiges') + '" ' +
            'data-issue-description="' + escHtml(issue.description || '') + '" ' +
            'placeholder="' + escHtml(${JSON.stringify(t(l, "cvImport.explanationPlaceholder"))}) + '"></textarea>';
          list.appendChild(block);
        });
      }

      async function submitClarifications() {
        var textareas = document.querySelectorAll('#issuesList textarea');
        var answers = [];
        textareas.forEach(function (ta) {
          answers.push({
            id: ta.getAttribute('data-issue-id'),
            type: ta.getAttribute('data-issue-type'),
            description: ta.getAttribute('data-issue-description'),
            explanation: ta.value.trim()
          });
        });
        var status = document.getElementById('issuesStatus');
        status.textContent = ${JSON.stringify(t(l, "cvImport.savingClarifications"))};
        status.className = 'status';
        try {
          await fetch('/api/onboarding/cv-clarify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: answers })
          });
        } catch (err) {
          // Clarifications are a nice-to-have on top of an already-saved
          // profile — a network hiccup here shouldn't strand the user.
        }
        window.location.href = '/profile?imported=1';
      }

      document.getElementById('continueBtn').addEventListener('click', submitClarifications);
      document.getElementById('skipAllBtn').addEventListener('click', function () {
        window.location.href = '/profile?imported=1';
      });

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
          if (data.issues && data.issues.length) {
            showIssues(data.issues);
            return;
          }
          status.textContent = ${JSON.stringify(t(l, "cvImport.statusDone"))};
          status.className = 'status ok';
          window.location.href = '/profile?imported=1';
        } catch (err) {
          status.textContent = err.message;
          status.className = 'status err';
          btn.disabled = false;
        }
      });
    })();
  </script>
</body>
</html>`;
}

module.exports = { renderCvImportPage };
