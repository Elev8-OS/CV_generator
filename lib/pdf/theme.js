const { normalizeAccentColor, accentSoft, DEFAULT_ACCENT } = require("../accentColor");

const BASE = {
  ink: "#14181f",
  inkSoft: "#3a4150",
  paper: "#ffffff",
  paperSoft: "#f4f2ee",
  grey: "#6b7280",
  greyLight: "#9aa1ad",
  border: "#e4e2dd"
};

/**
 * Resolves the fixed neutral palette plus the account's customizable accent
 * color into a full theme object for the PDF builders (lib/pdf/cv.js,
 * cover.js, insights.js). Must be called fresh inside each doc-definition
 * build with the color threaded in as an explicit parameter — never cached
 * at module scope — so a color can never leak across concurrent requests for
 * different users (renderPdfBufferFit calls these builders in a loop with
 * `await` between iterations).
 */
function resolveTheme(accentColor) {
  const accent = normalizeAccentColor(accentColor);
  return { ...BASE, accent, accentSoft: accentSoft(accent) };
}

module.exports = { resolveTheme, DEFAULT_ACCENT };
