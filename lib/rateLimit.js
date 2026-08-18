const fs = require("fs");
const path = require("path");
const { DATA_DIR } = require("./store");

// Lightweight per-user daily rate limiting on the endpoints that call the
// Anthropic API (application generation + company-insights research).
//
// This exists specifically because the multi-user extension uses OPEN
// self-registration (an explicit choice, made against this app's own
// recommendation of admin-only account creation) rather than admin-approved
// signup — without some ceiling, anyone could script repeated calls and run
// up real API costs on someone else's account. This is a coarse safety net,
// not fraud/abuse detection: generous daily limits that a real user doing
// real job-hunting would never realistically hit, but that stop a runaway
// script or a bot account cold.
//
// Deliberately a simple JSON counter file, consistent with the rest of this
// app's "just files on the persistent volume" approach — see lib/store.js.
const FILE = path.join(DATA_DIR, "ratelimits.json");

const LIMITS = {
  generate: Number(process.env.RATE_LIMIT_GENERATE_PER_DAY || 30),
  insights: Number(process.env.RATE_LIMIT_INSIGHTS_PER_DAY || 20)
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readAll() {
  try {
    if (!fs.existsSync(FILE)) return {};
    const raw = fs.readFileSync(FILE, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("rateLimit.js: konnte ratelimits.json nicht lesen:", err);
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
 * Checks + atomically increments today's counter for userId/key ("generate"
 * or "insights"). Returns { ok: true, remaining } and increments the counter
 * if still under today's limit, or { ok: false, limit } (WITHOUT
 * incrementing) once the daily limit is already reached.
 */
function checkAndIncrement(userId, key) {
  const limit = LIMITS[key];
  if (!limit) return { ok: true, remaining: Infinity };

  const all = readAll();
  const day = today();
  const existing = all[userId];
  const entry = existing && existing.day === day ? existing : { day, counts: {} };
  const used = entry.counts[key] || 0;

  if (used >= limit) {
    return { ok: false, limit };
  }

  entry.counts[key] = used + 1;
  all[userId] = entry;
  writeAll(all);
  return { ok: true, remaining: limit - entry.counts[key] };
}

module.exports = { checkAndIncrement, LIMITS };
