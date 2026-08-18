const { getSessionUserId, clearSessionCookie } = require("./session");
const { findUserById, toPublicUser } = require("./users");
const { t, langFromReq } = require("./i18n");

// Real per-account auth (replaces the old single shared-password Basic Auth)
// now that multiple people use this tool with their own separate data. Every
// protected route gets `req.user` (the public user record — no passwordHash)
// once this passes.
function requireAuth(req, res, next) {
  const userId = getSessionUserId(req);
  const user = userId ? findUserById(userId) : null;
  if (user) {
    req.user = toPublicUser(user);
    return next();
  }
  // The signed cookie didn't resolve to a real account (missing, tampered,
  // or the account was since removed) — clear it so the browser doesn't keep
  // resending a dead cookie.
  clearSessionCookie(res);
  if (req.path.startsWith("/api/")) {
    return res.status(401).json({ error: t(langFromReq(req), "auth.pleaseLoginFirst") });
  }
  const next_ = encodeURIComponent(req.originalUrl || "/");
  res.redirect(`/login?next=${next_}`);
}

module.exports = { requireAuth };
