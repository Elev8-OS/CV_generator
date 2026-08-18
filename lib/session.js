const crypto = require("crypto");

// Minimal signed-cookie session — no server-side session store needed since
// the only thing we ever need to remember is "which user id is this". A
// bare userId cookie would let anyone log in as anyone by editing it, so it's
// HMAC-signed with a server secret; the cookie is the userId plus that
// signature, and any tampering is rejected on the next request.
const SECRET =
  process.env.SESSION_SECRET ||
  process.env.APP_PASSWORD || // reuse the old shared secret if that's all that's set, so existing setups don't need a new Railway variable just to keep working
  crypto.randomBytes(32).toString("hex"); // last resort: works, but invalidates all sessions on every restart

if (!process.env.SESSION_SECRET) {
  console.warn(
    "Hinweis: SESSION_SECRET ist nicht gesetzt — Logins bleiben nur bis zum nächsten Neustart/Redeploy gültig (bzw. werden mit APP_PASSWORD als Ersatz signiert, falls gesetzt). Für dauerhafte Logins SESSION_SECRET in den Railway-Variablen setzen."
  );
}

const COOKIE_NAME = "session";
const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000; // 180 days
// Railway always terminates TLS at the edge in production (see server.js
// baseUrlFor), but local/dev runs plain HTTP — a "Secure" cookie would
// silently never be sent there, breaking local testing.
const IS_PROD = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);

function sign(userId) {
  const hmac = crypto.createHmac("sha256", SECRET).update(userId).digest("hex");
  return `${userId}.${hmac}`;
}

function verify(cookieValue) {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  const idx = cookieValue.lastIndexOf(".");
  if (idx < 0) return null;
  const userId = cookieValue.slice(0, idx);
  const sig = cookieValue.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(userId).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx < 0) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

function getSessionUserId(req) {
  const cookies = parseCookies(req);
  return verify(cookies[COOKIE_NAME]);
}

function setSessionCookie(res, userId) {
  const value = sign(userId);
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(MAX_AGE_MS / 1000)}`
  ];
  if (IS_PROD) parts.push("Secure");
  res.append("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(res) {
  const parts = [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (IS_PROD) parts.push("Secure");
  res.append("Set-Cookie", parts.join("; "));
}

module.exports = { getSessionUserId, setSessionCookie, clearSessionCookie, parseCookies };
