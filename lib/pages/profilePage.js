const { BASE_CSS } = require("./styles");

function renderProfilePage({ profileJson }) {
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
