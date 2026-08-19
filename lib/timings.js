const fs = require("fs");
const path = require("path");
const { DATA_DIR } = require("./store");

// Tracks how long the app's Anthropic-backed generation actions actually
// took recently, so the "kann X Sekunden dauern" hints shown while the user
// waits reflect real, observed behaviour instead of a guess baked into the
// UI copy at launch time. Those guesses (originally "15-30s" for generating
// an application, "15-20s" for company-insights research) drifted from
// reality as prompts/models/typical profile size changed, which is exactly
// what was reported as "Zeitangabe ... ist fehlerhaft".
//
// Deliberately global (not per-user): this reflects Anthropic API + network
// latency for a given action, which is essentially the same for everyone
// using this deployment, and a global rolling window converges to a useful
// average far faster than any single person's own (rare) generation history
// ever could. A simple JSON file on the persistent volume, same pattern as
// lib/rateLimit.js.
const FILE = path.join(DATA_DIR, "timings.json");

// Keep only the most recent N samples per action — an average that never
// forgets would react too slowly to a real, lasting change (e.g. a slower
// model, a longer prompt).
const WINDOW_SIZE = 20;

// Used only until a given action has recorded at least one real sample
// (e.g. right after a fresh deploy/volume). Roughly the midpoints of the old
// static hints, so the very first run still shows a sane number.
const FALLBACK_SECONDS = {
  generate: 22,
  insights: 17,
  cvImport: 22
};

function readAll() {
  try {
    if (!fs.existsSync(FILE)) return {};
    const raw = fs.readFileSync(FILE, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("timings.js: konnte timings.json nicht lesen:", err);
    return {};
  }
}

function writeAll(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, FILE);
}

/**
 * Records one observed duration (in ms) for the given action key
 * ("generate" | "insights" | "cvImport"). Silently ignores bogus values
 * (e.g. a negative/NaN duration from a clock oddity) rather than letting one
 * bad sample skew the average.
 */
function recordDuration(key, ms) {
  if (!Number.isFinite(ms) || ms <= 0) return;
  try {
    const all = readAll();
    const list = Array.isArray(all[key]) ? all[key] : [];
    list.push(ms);
    if (list.length > WINDOW_SIZE) list.shift();
    all[key] = list;
    writeAll(all);
  } catch (err) {
    // A timing hint is a nice-to-have, never worth failing the actual
    // generation request over.
    console.error("timings.js: konnte Dauer nicht speichern:", err);
  }
}

/**
 * Rounded average duration in seconds for the given action key, based on the
 * most recent WINDOW_SIZE samples. Falls back to a fixed estimate until at
 * least one real sample has been recorded.
 */
function averageSeconds(key) {
  const fallback = FALLBACK_SECONDS[key] || 20;
  const all = readAll();
  const list = Array.isArray(all[key]) ? all[key] : [];
  if (!list.length) return fallback;
  const avgMs = list.reduce((sum, ms) => sum + ms, 0) / list.length;
  return Math.max(1, Math.round(avgMs / 1000));
}

module.exports = { recordDuration, averageSeconds };
