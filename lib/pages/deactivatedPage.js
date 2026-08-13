const { BASE_CSS } = require("./styles");

// Shown instead of the real digital application page / PDFs once Raffael has
// manually deactivated a link. Deliberately contains zero personal data
// (no name, address, photo, job title) — this can stay reachable forever
// via an old link, email thread, or QR code, so it must be as neutral as a
// generic "not found" page.
function renderDeactivatedPage() {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nicht mehr verfügbar</title>
<meta name="robots" content="noindex">
<style>
${BASE_CSS}
  main { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
  .box { max-width: 420px; text-align: center; }
  .box .icon { font-size: 34px; margin-bottom: 14px; }
  .box h1 { font-size: 20px; margin: 0 0 10px; }
  .box p { color: var(--grey); font-size: 14.5px; line-height: 1.5; margin: 0; }
</style>
</head>
<body>
  <main class="container">
    <div class="box">
      <div class="icon">🔒</div>
      <h1>Diese Seite ist nicht mehr verfügbar</h1>
      <p>Der Link wurde deaktiviert.</p>
    </div>
  </main>
</body>
</html>`;
}

module.exports = { renderDeactivatedPage };
