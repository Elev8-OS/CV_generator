function requireAuth(req, res, next) {
  const password = process.env.APP_PASSWORD;
  if (!password) return next(); // no password configured -> open (only the Railway URL guards it)

  const header = req.headers.authorization || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    const pass = idx >= 0 ? decoded.slice(idx + 1) : decoded;
    if (pass === password) return next();
  }
  res.set("WWW-Authenticate", 'Basic realm="Bewerbungs-Generator"');
  res.status(401).send("Authentifizierung erforderlich.");
}

module.exports = { requireAuth };
