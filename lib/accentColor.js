// Shared helpers for the single customizable "brand accent color" — the tool
// UI, the digital application page, and the CV/cover-letter/insights PDFs all
// derive their accent-colored elements from one hex value stored on the
// account's profile (profile.accentColor). Neutral colors (ink, grey, paper,
// border) stay fixed for legibility; only this one color is user-customizable.
//
// Every render site normalizes through normalizeAccentColor() rather than
// trusting the stored value directly — profile.json can be hand-edited via
// the raw-JSON textarea on /profile, so a malformed or malicious string must
// never reach a CSS <style> block or a PDF color field unfiltered. An invalid
// value silently falls back to DEFAULT_ACCENT instead of erroring, consistent
// with this app's generally lenient handling of the rest of the raw profile
// data.
//
// Callers must thread the resolved color/theme through explicit function
// parameters (see lib/pdf/theme.js resolveTheme() and lib/pages/styles.js
// baseCss()) rather than any shared module-level mutable state — PDF builders
// are invoked in a loop with `await` between iterations (see
// lib/pdf/printer.js renderPdfBufferFit), so concurrent requests for
// different users' documents could otherwise interleave and leak one
// account's color into another's.

const DEFAULT_ACCENT = "#e2572b";

// Hand-tuned shades matching the tool's original hardcoded design exactly —
// used whenever the account is still on the default accent color, so
// existing accounts see pixel-identical output after this refactor. Custom
// colors fall back to the programmatic approximations below.
const DEFAULT_SHADES = {
  soft: "#f6d9cd",
  dark: "#cc4a20",
  pillText: "#9a3316",
  light: "#ffb090"
};

const HEX_RE = /^#[0-9a-f]{6}$/i;

function isValidAccentColor(color) {
  return typeof color === "string" && HEX_RE.test(color.trim());
}

function normalizeAccentColor(color) {
  return isValidAccentColor(color) ? color.trim().toLowerCase() : DEFAULT_ACCENT;
}

function isDefault(hex) {
  return hex === DEFAULT_ACCENT;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mixWithWhite(hex, factor) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c) => c + (255 - c) * factor;
  return rgbToHex({ r: mix(r), g: mix(g), b: mix(b) });
}

function darken(hex, factor) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c) => c * (1 - factor);
  return rgbToHex({ r: mix(r), g: mix(g), b: mix(b) });
}

/** Light, mostly-white tint — soft pill/background fills. */
function accentSoft(color) {
  const hex = normalizeAccentColor(color);
  if (isDefault(hex)) return DEFAULT_SHADES.soft;
  return mixWithWhite(hex, 0.75);
}

/** Darker shade — hover state on primary buttons. */
function accentDark(color) {
  const hex = normalizeAccentColor(color);
  if (isDefault(hex)) return DEFAULT_SHADES.dark;
  return darken(hex, 0.17);
}

/** Darker, more saturated shade — legible text on top of accentSoft. */
function accentPillText(color) {
  const hex = normalizeAccentColor(color);
  if (isDefault(hex)) return DEFAULT_SHADES.pillText;
  return darken(hex, 0.4);
}

/** Light, warm shade — legible text on a translucent accent fill over a dark
 * background (the hero pill on the digital application page). */
function accentLight(color) {
  const hex = normalizeAccentColor(color);
  if (isDefault(hex)) return DEFAULT_SHADES.light;
  return mixWithWhite(hex, 0.55);
}

/** "r, g, b" triplet for CSS `rgba(var(--accent-rgb), alpha)` usage. */
function accentRgb(color) {
  const { r, g, b } = hexToRgb(normalizeAccentColor(color));
  return `${r}, ${g}, ${b}`;
}

module.exports = {
  DEFAULT_ACCENT,
  isValidAccentColor,
  normalizeAccentColor,
  accentSoft,
  accentDark,
  accentPillText,
  accentLight,
  accentRgb
};
