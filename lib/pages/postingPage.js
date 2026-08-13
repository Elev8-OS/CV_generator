const { BASE_CSS } = require("./styles");

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** Read-only view of the original job posting text (and link, if any) that a
 * given application was generated from — so Raffael can always go back and
 * re-check the actual requirements, independent of what the AI selected. */
function renderPostingPage({ entry }) {
  const g = entry.generated || {};
  const title = [g.jobTitle, g.company].filter(Boolean).join(" — ") || "Stelleninserat";

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — Original-Inserat</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${BASE_CSS}
  header.top { background: var(--ink); color: #fff; padding: 26px 0; }
  header.top .container { display: flex; justify-content: space-between; align-items: center; }
  header.top h1 { font-size: 18px; margin: 0; font-weight: 700; }
  header.top a.navlink { font-size: 13.5px; color: #cfd3da; text-decoration: none; }
  main { padding: 40px 0 80px; max-width: 760px; margin: 0 auto; }
  h2.title { font-size: 20px; margin: 0 0 6px; font-weight: 800; }
  p.subtitle { color: var(--grey); margin: 0 0 18px; line-height: 1.5; }
  pre.posting { white-space: pre-wrap; font-family: inherit; font-size: 14.5px; line-height: 1.65; color: var(--ink-soft); background: var(--paper-soft); padding: 22px; border-radius: 14px; margin: 18px 0 0; }
</style>
</head>
<body>
  <header class="top">
    <div class="container">
      <h1>🛠️ Bewerbungs-Generator</h1>
      <a class="navlink" href="/">← Zurück zum Tool</a>
    </div>
  </header>
  <main class="container">
    <div class="card">
      <h2 class="title">${esc(title)}</h2>
      <p class="subtitle">Gespeichert am ${esc(new Date(entry.createdAt).toLocaleDateString("de-CH"))} — das ist der Original-Text, aus dem diese Bewerbung generiert wurde.</p>
      ${
        entry.jobUrl
          ? `<a class="btn btn-outline" href="${esc(entry.jobUrl)}" target="_blank" rel="noopener">Original-Inserat online öffnen ↗</a>`
          : `<div class="status">Kein Link hinterlegt — das Inserat wurde damals als Text eingefügt (siehe unten).</div>`
      }
      <pre class="posting">${esc(entry.jobPostingRaw || "Kein Text gespeichert.")}</pre>
    </div>
  </main>
</body>
</html>`;
}

module.exports = { renderPostingPage };
