const { BASE_CSS } = require("./styles");

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderProfilePage({ profileJson, docs = {}, media = {}, libraryDocs = [], libraryCategories = [] }) {
  const categoryLabel = (key) => (libraryCategories.find((c) => c.key === key) || {}).label || key;

  const libraryRows = libraryDocs.length
    ? libraryDocs
        .map(
          (d) => `
      <div class="doc-row">
        <div>
          <div style="font-weight:600;">${esc(d.title)}</div>
          <div style="margin-top:4px;"><span class="pill">${esc(categoryLabel(d.category))}</span></div>
          ${d.skillsText ? `<div style="margin-top:6px;font-size:12.5px;color:var(--grey);max-width:480px;">${esc(d.skillsText)}</div>` : ""}
        </div>
        <div class="doc-actions">
          <a class="btn btn-outline" href="/documents/library/${esc(d.id)}" target="_blank">Ansehen</a>
          <button class="btn btn-outline" style="color:#b3261e;border-color:#f3c6c6;" data-lib-delete="${esc(d.id)}">Löschen</button>
        </div>
      </div>`
        )
        .join("")
    : `<div style="padding:8px 0;font-size:13.5px;color:var(--grey);">Noch keine weiteren Dokumente hochgeladen.</div>`;

  const categoryOptions = libraryCategories.map((c) => `<option value="${esc(c.key)}">${esc(c.label)}</option>`).join("");

  const docRow = (key, label) => {
    const d = docs[key] || {};
    const badge = d.available
      ? d.source === "upload"
        ? `<span class="pill" style="background:#dff5e6;color:#166534;">Hochgeladen</span>`
        : `<span class="pill">Standard hinterlegt</span>`
      : `<span class="pill" style="background:#fde3e3;color:#b3261e;">Fehlt</span>`;
    return `
      <div class="doc-row">
        <div>
          <div style="font-weight:600;">${label}</div>
          <div style="margin-top:4px;">${badge}</div>
        </div>
        <div class="doc-actions">
          ${d.available ? `<a class="btn btn-outline" href="/documents/${key === "lehrzeugnis" ? "lehrzeugnis" : "efz"}.pdf" target="_blank">Ansehen</a>` : ""}
          <label class="btn btn-dark" style="cursor:pointer;">
            Hochladen
            <input type="file" accept="application/pdf" data-doc="${key}" style="display:none;">
          </label>
        </div>
      </div>`;
  };

  const mediaRow = (key, label, hint) => {
    const m = media[key] || {};
    const badge = m.available
      ? `<span class="pill" style="background:#dff5e6;color:#166534;">Hochgeladen</span>`
      : `<span class="pill" style="background:#fde3e3;color:#b3261e;">Fehlt</span>`;
    return `
      <div class="doc-row">
        <div>
          <div style="font-weight:600;">${label}</div>
          <div style="margin-top:4px;">${badge}</div>
          ${hint ? `<div style="margin-top:4px;font-size:12.5px;color:var(--grey);">${hint}</div>` : ""}
        </div>
        <div class="doc-actions">
          ${m.available ? `<a class="btn btn-outline" href="/media/${key}" target="_blank">Ansehen</a>` : ""}
          <label class="btn btn-dark" style="cursor:pointer;">
            Hochladen
            <input type="file" accept="image/jpeg,image/png,image/webp" data-media="${key}" style="display:none;">
          </label>
        </div>
      </div>`;
  };

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Profil-Daten — Bewerbungs-Generator</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${BASE_CSS}
  header.top { background: var(--ink); color: #fff; padding: 26px 0; }
  header.top .container { display: flex; justify-content: space-between; align-items: center; }
  header.top h1 { font-size: 18px; margin: 0; font-weight: 700; }
  header.top a.navlink { font-size: 13.5px; color: #cfd3da; text-decoration: none; }
  main { padding: 40px 0 80px; }
  h2.title { font-size: 22px; margin: 0 0 6px; font-weight: 800; }
  p.subtitle { color: var(--grey); margin: 0 0 20px; line-height: 1.5; max-width: 720px; }
  textarea#profileJson { min-height: 640px; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 13px; line-height: 1.5; }
  .row { display: flex; gap: 10px; margin-top: 14px; }
  .status { font-size: 13.5px; color: var(--grey); margin-top: 10px; }
  .status.ok { color: #1a7f37; }
  .status.err { color: #b3261e; }
  .card + .card { margin-top: 22px; }
  .doc-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--border); gap: 16px; }
  .doc-row:last-child { border-bottom: none; }
  .doc-actions { display: flex; gap: 8px; align-items: center; flex: none; }
  select { width: 100%; font-family: inherit; font-size: 14.5px; padding: 12px 14px; border-radius: 10px; border: 1.5px solid var(--border); background: #fff; color: var(--ink); }
  select:focus { outline: none; border-color: var(--accent); }
  .field-row { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 14px; }
  .field-row > div { flex: 1 1 220px; }
  .field-row label { margin: 0 0 6px; }
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
      <h2 class="title" style="font-size:18px;">Referenzdokumente</h2>
      <p class="subtitle">Diese PDFs werden auf jeder digitalen Bewerbungsseite zum Download angeboten. Einmal hochladen, bleibt gespeichert.</p>
      ${docRow("lehrzeugnis", "Lehrzeugnis R. Nussbaum AG")}
      ${docRow("efz", "Fähigkeitszeugnis EFZ")}
      <div id="docStatus" class="status"></div>
    </div>

    <div class="card">
      <h2 class="title" style="font-size:18px;">Portrait &amp; Unterschrift</h2>
      <p class="subtitle">Das Portrait erscheint im CV-Kopf und auf der digitalen Bewerbungsseite, die Unterschrift im Motivationsschreiben. Beides optional — ohne sie funktioniert alles weiterhin, nur ohne diesen persönlichen Touch.</p>
      ${mediaRow("photo", "Portraitfoto", "Freigestellt, neutraler Hintergrund, Hochformat")}
      ${mediaRow("signature", "Unterschrift", "Foto/Scan auf hellem Grund — Hintergrund wird automatisch entfernt")}
      <div id="mediaStatus" class="status"></div>
    </div>

    <div class="card">
      <h2 class="title" style="font-size:18px;">Weitere Dokumente</h2>
      <p class="subtitle">Zusätzliche Zertifikate, Diplome, Referenzschreiben oder sonstige Nachweise. Sie erscheinen automatisch auf jeder digitalen Bewerbungsseite zum Download — und die kurze Beschreibung hilft der KI, relevante Fähigkeiten daraus in neue Bewerbungen einzubauen, wo passend.</p>
      <div id="libraryList">${libraryRows}</div>
      <div class="field-row">
        <div>
          <label>Titel</label>
          <input type="text" id="libTitle" placeholder="z.B. Zertifikat Staplerschein Kat. R">
        </div>
        <div>
          <label>Kategorie</label>
          <select id="libCategory">${categoryOptions}</select>
        </div>
      </div>
      <label>Kurzbeschreibung für die KI (optional)</label>
      <textarea id="libSkills" rows="2" placeholder="Welche Fähigkeiten/Fakten belegt dieses Dokument? z.B. 'Staplerschein Kat. R, gültig bis 2027'"></textarea>
      <div class="row">
        <label class="btn btn-dark" style="cursor:pointer;">
          Datei wählen &amp; hochladen
          <input type="file" id="libFile" accept="application/pdf,image/jpeg,image/png,image/webp" style="display:none;">
        </label>
      </div>
      <div id="libStatus" class="status"></div>
    </div>

    <div class="card">
      <h2 class="title">Rohdaten-Profil bearbeiten</h2>
      <p class="subtitle">Dies sind die Fakten, aus denen jede Bewerbung generiert wird (Kontaktdaten, Erfahrung, Ausbildung, Stärken). Die KI erfindet nichts dazu — nur was hier steht, kann in einer Bewerbung erscheinen. Vorsichtig bearbeiten: es muss gültiges JSON bleiben.</p>
      <textarea id="profileJson" spellcheck="false">${profileJson}</textarea>
      <div class="row">
        <button id="saveBtn" class="btn btn-primary">Speichern</button>
        <button id="resetBtn" class="btn btn-outline">Auf Standard zurücksetzen</button>
      </div>
      <div id="status" class="status"></div>
    </div>
  </main>
  <script>
    document.querySelectorAll('[data-doc]').forEach((input) => {
      input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;
        const key = input.dataset.doc;
        const status = document.getElementById('docStatus');
        status.textContent = 'Lade hoch …';
        status.className = 'status';
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/documents/' + key, { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) { status.textContent = 'Hochgeladen ✓'; status.className = 'status ok'; setTimeout(() => window.location.reload(), 800); }
        else { status.textContent = 'Fehler: ' + data.error; status.className = 'status err'; }
      });
    });
    document.querySelectorAll('[data-media]').forEach((input) => {
      input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;
        const key = input.dataset.media;
        const status = document.getElementById('mediaStatus');
        status.textContent = 'Lade hoch …';
        status.className = 'status';
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/media/' + key, { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) { status.textContent = 'Hochgeladen ✓'; status.className = 'status ok'; setTimeout(() => window.location.reload(), 800); }
        else { status.textContent = 'Fehler: ' + data.error; status.className = 'status err'; }
      });
    });
    document.getElementById('libFile').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const status = document.getElementById('libStatus');
      status.textContent = 'Lade hoch …';
      status.className = 'status';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', document.getElementById('libTitle').value);
      formData.append('category', document.getElementById('libCategory').value);
      formData.append('skillsText', document.getElementById('libSkills').value);
      const res = await fetch('/api/documents/library', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) { status.textContent = 'Hochgeladen ✓'; status.className = 'status ok'; setTimeout(() => window.location.reload(), 800); }
      else { status.textContent = 'Fehler: ' + data.error; status.className = 'status err'; }
    });
    document.querySelectorAll('[data-lib-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Dieses Dokument wirklich löschen?')) return;
        const id = btn.dataset.libDelete;
        const res = await fetch('/api/documents/library/' + id, { method: 'DELETE' });
        if (res.ok) window.location.reload();
      });
    });
    document.getElementById('saveBtn').addEventListener('click', async () => {
      const status = document.getElementById('status');
      const raw = document.getElementById('profileJson').value;
      let parsed;
      try { parsed = JSON.parse(raw); }
      catch (e) { status.textContent = 'Ungültiges JSON: ' + e.message; status.className = 'status err'; return; }
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (res.ok) { status.textContent = 'Gespeichert ✓'; status.className = 'status ok'; }
      else { status.textContent = 'Fehler: ' + data.error; status.className = 'status err'; }
    });
    document.getElementById('resetBtn').addEventListener('click', async () => {
      if (!confirm('Wirklich auf die Standard-Rohdaten zurücksetzen? Eigene Änderungen gehen verloren.')) return;
      const res = await fetch('/api/profile/reset', { method: 'POST' });
      if (res.ok) window.location.reload();
    });
  </script>
</body>
</html>`;
}

module.exports = { renderProfilePage };
