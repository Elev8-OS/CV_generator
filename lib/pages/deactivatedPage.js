const { baseCss } = require("./styles");
const { t, normalizeLang } = require("../i18n");

// Shown instead of the real digital application page / PDFs once the account
// owner has manually deactivated a link. Deliberately contains zero personal
// data (no name, address, photo, job title) — this can stay reachable
// forever via an old link, email thread, or QR code, so it must be as
// neutral as a generic "not found" page. `lang` follows the deactivated
// application's own language (entry.language) where the caller has it
// available, so an employer who received a French application still sees
// this in French if the link is later disabled.
function renderDeactivatedPage(lang = "de") {
  const l = normalizeLang(lang);
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t(l, "deactivated.title")}</title>
<meta name="robots" content="noindex">
<style>
${baseCss()}
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
      <h1>${t(l, "deactivated.heading")}</h1>
      <p>${t(l, "deactivated.text")}</p>
    </div>
  </main>
</body>
</html>`;
}

module.exports = { renderDeactivatedPage };
