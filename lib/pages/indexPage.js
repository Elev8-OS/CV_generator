const { BASE_CSS } = require("./styles");

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function daysAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86400000);
  if (d <= 0) return "heute";
  if (d === 1) return "gestern";
  return `vor ${d} Tagen`;
}

function renderIndexPage({ applications, hasApiKey, statuses }) {
  const statusOptions = (current) =>
    statuses
      .map(
        (s) =>
          `<option value="${esc(s.key)}" data-color="${esc(s.color)}" ${s.key === current ? "selected" : ""}>${esc(s.label)}</option>`
      )
      .join("");

  const statusByKey = Object.fromEntries(statuses.map((s) => [s.key, s]));

  const rows = applications
    .map((a) => {
      const st = statusByKey[a.status] || statuses[0];
      return `
      <tr data-row="${a.slug}" data-status="${esc(a.status || "")}">
        <td>
          <div class="job-title">${esc(a.jobTitle || "—")}</div>
          <div class="job-company">${esc(a.company || "")}</div>
          <div class="job-meta">${new Date(a.createdAt).toLocaleDateString("de-CH")} · ${daysAgo(a.createdAt)}</div>
        </td>
        <td>
          <div class="status-select-wrap">
            <span class="status-dot" style="background:${st.color}"></span>
            <select class="status-select" data-status-select="${a.slug}">${statusOptions(a.status)}</select>
          </div>
          <input type="text" class="note-input" placeholder="Notiz (z.B. Interviewtermin) …" data-note-input="${a.slug}" value="${esc(a.note || "")}">
        </td>
        <td class="actions">
          <a href="/a/${a.slug}" target="_blank" class="link">Digitale Seite ↗</a>
          <a href="/pdf/${a.slug}/cv" target="_blank" class="link">CV</a>
          <a href="/pdf/${a.slug}/cover" target="_blank" class="link">Anschreiben</a>
          <button class="link danger" data-delete="${a.slug}">Löschen</button>
        </td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bewerbungs-Generator — Raffael Putra Wyss</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${BASE_CSS}
  header.top { background: var(--ink); color: #fff; padding: 26px 0; }
  header.top .container { display: flex; justify-content: space-between; align-items: center; }
  header.top h1 { font-size: 18px; margin: 0; font-weight: 700; }
  header.top a.navlink { font-size: 13.5px; color: #cfd3da; text-decoration: none; }
  main { padding: 40px 0 80px; }
  .grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 26px; align-items: start; }
  @media (max-width: 880px) { .grid { grid-template-columns: 1fr; } }
  h2.title { font-size: 24px; margin: 0 0 6px; font-weight: 800; letter-spacing: -0.01em; }
  p.subtitle { color: var(--grey); margin: 0 0 26px; line-height: 1.5; }
  label { display: block; font-size: 13px; font-weight: 600; margin: 18px 0 6px; color: var(--ink-soft); }
  label:first-of-type { margin-top: 0; }
  .tab-row { display: flex; gap: 8px; margin-bottom: 6px; }
  .tab-btn { padding: 7px 14px; border-radius: 999px; border: 1.5px solid var(--border); background: #fff; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--grey); }
  .tab-btn.active { border-color: var(--ink); color: var(--ink); background: var(--paper-soft); }
  .field-url, .field-text { display: none; }
  .field-url.active, .field-text.active { display: block; }
  .warning { background: #fff6ec; border: 1px solid #f3d9b6; color: #7a4b12; padding: 12px 14px; border-radius: 10px; font-size: 13.5px; margin-bottom: 18px; }
  .result { margin-top: 10px; }
  .copybox { position: relative; }
  .copybox textarea { min-height: 160px; }
  .copybox .copybtn { position: absolute; top: 10px; right: 10px; }
  .dl-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
  .status { font-size: 13.5px; color: var(--grey); margin-top: 10px; min-height: 18px; }
  .status.err { color: #b3261e; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td { padding: 12px 8px; border-bottom: 1px solid var(--border); font-size: 14px; vertical-align: top; }
  td.grey { color: var(--grey); white-space: nowrap; }
  .job-title { font-weight: 600; }
  .job-company { font-size: 12.5px; color: var(--grey); }
  .job-meta { font-size: 11.5px; color: var(--grey-light); margin-top: 3px; }
  .actions { display: flex; gap: 10px; flex-wrap: wrap; white-space: nowrap; }
  .link { font-size: 12.5px; text-decoration: none; color: var(--accent); font-weight: 600; background: none; border: none; cursor: pointer; font-family: inherit; padding: 0; }
  .link.danger { color: var(--grey-light); }
  .link.danger:hover { color: #b3261e; }
  .empty { color: var(--grey); font-size: 14px; padding: 20px 0; }
  .filter-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .filter-row label { margin: 0; white-space: nowrap; }
  .filter-row select { font-family: inherit; font-size: 13px; padding: 7px 10px; border-radius: 8px; border: 1.5px solid var(--border); background: #fff; color: var(--ink); }
  .status-select-wrap { display: flex; align-items: center; gap: 6px; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
  .status-select { font-family: inherit; font-size: 12.5px; padding: 5px 6px; border-radius: 7px; border: 1.5px solid var(--border); background: #fff; color: var(--ink); max-width: 190px; }
  .note-input { margin-top: 6px; width: 100%; font-family: inherit; font-size: 12px; padding: 5px 8px; border-radius: 7px; border: 1.5px dashed var(--border); background: transparent; color: var(--ink-soft); }
  .note-input:focus { outline: none; border-color: var(--accent); border-style: solid; background: #fff; }
  tr[data-hidden="1"] { display: none; }
  #spinner { display: none; }
  #spinner.on { display: inline-block; }
  .spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.5); border-top-color: #fff; border-radius: 50%; animation: sp .7s linear infinite; display: inline-block; }
  @keyframes sp { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <header class="top">
    <div class="container">
      <h1>🛠️ Bewerbungs-Generator</h1>
      <a class="navlink" href="/profile">Profil-Daten bearbeiten →</a>
    </div>
  </header>

  <main class="container">
    ${!hasApiKey ? `<div class="warning">⚠️ Kein ANTHROPIC_API_KEY gesetzt. Bitte in den Railway-Variablen hinterlegen, bevor Bewerbungen generiert werden können.</div>` : ""}

    <div class="grid">
      <div class="card">
        <h2 class="title">Neue Bewerbung erstellen</h2>
        <p class="subtitle">Stelleninserat einfügen oder Link angeben — das Tool erstellt automatisch ein passendes E-Mail-Anschreiben, CV-PDF, Motivationsschreiben-PDF und eine digitale Bewerbungsseite mit eigener URL.</p>

        <div class="tab-row">
          <button class="tab-btn active" data-tab="text">Text einfügen</button>
          <button class="tab-btn" data-tab="url">Link einfügen</button>
        </div>

        <div class="field-text active" id="field-text">
          <label>Stelleninserat (Text)</label>
          <textarea id="jobText" rows="10" placeholder="Text des Stelleninserats hier einfügen…"></textarea>
        </div>
        <div class="field-url" id="field-url">
          <label>Link zum Stelleninserat</label>
          <input type="url" id="jobUrl" placeholder="https://…">
          <div class="status" style="margin-top:6px;">Funktioniert nur bei öffentlich zugänglichen Seiten ohne Login (z.B. viele Firmen-Karriereseiten). Bei LinkedIn & Co. lieber den Text direkt einfügen.</div>
        </div>

        <button id="generateBtn" class="btn btn-primary" style="margin-top:18px; width:100%; justify-content:center;">
          <span id="spinner"><span class="spin"></span></span> Bewerbung generieren
        </button>
        <div id="genStatus" class="status"></div>

        <div id="result" class="result" style="display:none;">
          <hr style="border:none;border-top:1px solid var(--border);margin:24px 0;">

          <label>E-Mail-Text (für Bewerbung per E-Mail)</label>
          <div class="copybox">
            <textarea id="emailText" rows="9" readonly></textarea>
            <button class="btn btn-outline copybtn" data-copy="emailText">Kopieren</button>
          </div>

          <label>Motivationsschreiben (Fliesstext, für Online-Plattformen zum Copy-Paste)</label>
          <div class="copybox">
            <textarea id="coverText" rows="10" readonly></textarea>
            <button class="btn btn-outline copybtn" data-copy="coverText">Kopieren</button>
          </div>

          <label>Downloads &amp; digitale Bewerbung</label>
          <div class="dl-row">
            <a id="dlCv" class="btn btn-dark" target="_blank">⬇ CV (PDF)</a>
            <a id="dlCover" class="btn btn-dark" target="_blank">⬇ Anschreiben (PDF)</a>
            <a id="dlLehrzeugnis" class="btn btn-outline" href="/documents/lehrzeugnis.pdf" target="_blank">⬇ Lehrzeugnis</a>
            <a id="dlEfz" class="btn btn-outline" href="/documents/efz.pdf" target="_blank">⬇ EFZ</a>
          </div>
          <div class="dl-row">
            <a id="dlApp" class="btn btn-primary" target="_blank" style="flex:1; justify-content:center;">🌐 Digitale Bewerbungsseite öffnen</a>
          </div>
          <div class="copybox" style="margin-top:10px;">
            <input type="text" id="appUrl" readonly>
            <button class="btn btn-outline copybtn" data-copy="appUrl" style="top:6px;">Kopieren</button>
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="title" style="font-size:18px;">Bisherige Bewerbungen</h2>
        <div class="filter-row">
          <label for="statusFilter" style="margin:0;">Filter:</label>
          <select id="statusFilter">
            <option value="">Alle Status</option>
            ${statuses.map((s) => `<option value="${esc(s.key)}">${esc(s.label)}</option>`).join("")}
          </select>
        </div>
        <table>
          <tbody id="appTableBody">
            ${rows || `<tr><td colspan="3" class="empty">Noch keine Bewerbungen erstellt.</td></tr>`}
          </tbody>
        </table>
        <div id="filterEmpty" class="empty" style="display:none;">Keine Bewerbungen mit diesem Status.</div>
      </div>
    </div>
  </main>

  <script src="/app.js"></script>
</body>
</html>`;
}

module.exports = { renderIndexPage };
