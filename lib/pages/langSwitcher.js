const { LANGS } = require("../i18n");

/**
 * Tiny DE/FR/EN switcher used in page headers. Links to GET /lang/:code,
 * which just sets the "lang" cookie and redirects back — no client JS
 * needed, and it works pre-login (login/signup pages) since it's not tied
 * to an account.
 */
function renderLangSwitcher(lang, next = "/") {
  return `<span class="lang-switcher">${LANGS.map(
    (code) =>
      `<a href="/lang/${code}?next=${encodeURIComponent(next)}" class="lang-link${code === lang ? " active" : ""}">${code.toUpperCase()}</a>`
  ).join("")}</span>`;
}

module.exports = { renderLangSwitcher };
