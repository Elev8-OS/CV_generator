const path = require("path");
const express = require("express");
const multer = require("multer");

const { DEFAULT_PROFILE, EMPTY_PROFILE, mergeExtractedProfile, mergeAdditionalExperience } = require("./lib/profile");
const { DEFAULT_ACCENT } = require("./lib/accentColor");
const { ensureDocuments } = require("./lib/assets");
const documentLibrary = require("./lib/documentLibrary");
const store = require("./lib/store");
const { saveMedia, resolveMedia, mediaStatus } = require("./lib/media");
const { generateApplication, extractProfileFromCv } = require("./lib/ai");
const { STATUSES, isValidStatus } = require("./lib/statuses");
const { fetchJobPostingText } = require("./lib/fetchJob");
const { findDuplicateApplication } = require("./lib/dedupe");
const { requireAuth } = require("./lib/auth");
const { getSessionUserId, setSessionCookie, clearSessionCookie } = require("./lib/session");
const { createUser, findUserByUsername, findUserById, verifyPassword, updateUsername, updatePassword } = require("./lib/users");
const { migrateLegacyDataIfNeeded } = require("./lib/migrate");
const rateLimit = require("./lib/rateLimit");
const { renderPdfBufferFit, renderPdfBuffer } = require("./lib/pdf/printer");
const { buildCvDocDefinition } = require("./lib/pdf/cv");
const { buildCoverDocDefinition } = require("./lib/pdf/cover");
const { buildInsightsDocDefinition } = require("./lib/pdf/insights");
const { generateCompanyInsights } = require("./lib/companyInsights");
const { qrDataUri } = require("./lib/qr");
const { buildApplicationEml } = require("./lib/eml");
const { extractTextFromFile } = require("./lib/cvParse");
const { t, LANGS, isValidLang, normalizeLang, langFromReq, LANG_COOKIE } = require("./lib/i18n");
const { renderIndexPage } = require("./lib/pages/indexPage");
const { renderAppPage } = require("./lib/pages/appPage");
const { renderDeactivatedPage } = require("./lib/pages/deactivatedPage");
const { renderProfilePage } = require("./lib/pages/profilePage");
const { renderPostingPage } = require("./lib/pages/postingPage");
const { renderLoginPage } = require("./lib/pages/loginPage");
const { renderSignupPage } = require("./lib/pages/signupPage");
const { renderCvImportPage } = require("./lib/pages/cvImportPage");

// Decode the two bundled reference PDFs to disk first (documents.js/migrate.js
// fall back to these bundled defaults) — must run before the one-time
// migration below, which folds whichever version was live into Raffael's
// document library.
ensureDocuments();
migrateLegacyDataIfNeeded();

const app = express();
app.use(express.json({ limit: "1mb" }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const PORT = process.env.PORT || 3000;

// Raffael's own account (created by the migration) keeps his real shipped
// data as its "reset to default" target — that's his own baseline, not a
// generic template. Every other (self-registered) account has no such
// baseline, so their reset target is just a clean empty profile; using
// DEFAULT_PROFILE there would leak Raffael's personal data into a stranger's
// account.
function defaultProfileFor(user) {
  return user && user.username === "raffael" ? DEFAULT_PROFILE : EMPTY_PROFILE;
}

function getProfile(userId, user) {
  return store.loadProfile(userId, defaultProfileFor(user));
}

// Resolves an account's CURRENT accent color from just its userId — used by
// the public routes below (/a/:slug, /pdf/:slug/cv, /pdf/:slug/cover), which
// only ever have userId (via store.findApplicationAnyUser), not a full
// req.user. Deliberately reads the LIVE profile rather than any
// entry.profileSnapshot (frozen at generation time for the CV's factual
// content) so that changing the brand color retroactively re-colors every
// previously-generated digital page/PDF, not just future ones.
function accentColorFor(userId) {
  const profile = store.loadProfile(userId, EMPTY_PROFILE);
  return (profile && profile.accentColor) || DEFAULT_ACCENT;
}

// ---------- Public static assets ----------
app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (req, res) => res.json({ ok: true }));

// Only allow redirecting back to a same-site relative path — "next"/"returnTo"
// query params are attacker-influenceable (open-redirect risk otherwise).
function safeNext(value, fallback = "/") {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

// Sets the UI-language cookie (DE/FR/EN dashboard chrome) and bounces back to
// wherever the switcher was clicked from. Not tied to any account — works
// pre-login on /login and /signup too. One year, not HttpOnly (no security
// value in hiding a language preference, and it keeps this cookie simple to
// reason about / doesn't need signing since it never grants access to anything).
app.get("/lang/:code", (req, res) => {
  const code = isValidLang(req.params.code) ? req.params.code : "de";
  res.append(
    "Set-Cookie",
    `${LANG_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=${365 * 24 * 60 * 60}; SameSite=Lax`
  );
  res.redirect(safeNext(req.query.next));
});

// Public: a digital application page links to library documents (Zeugnisse,
// Zertifikate, ...) by id alone, with no user/session context — the browser
// hitting this is the employer, not a logged-in account. See
// documentLibrary.resolveLibraryFileAnyUser for why a scan across accounts is
// safe & cheap at this tool's scale.
app.get("/documents/library/:id", (req, res) => {
  const file = documentLibrary.resolveLibraryFileAnyUser(req.params.id);
  if (!file) return res.status(404).send("Dokument nicht gefunden.");
  res.set("Content-Type", file.mime).sendFile(file.path);
});

// Railway always terminates TLS at the edge, so the public URL is always
// https even though the app itself just sees a plain HTTP request.
function baseUrlFor(req) {
  return `https://${req.get("host")}`;
}

function digitalUrl(req, slug) {
  return `${baseUrlFor(req)}/a/${slug}`;
}

async function buildQr(req, slug) {
  const url = digitalUrl(req, slug);
  try {
    return { url, dataUri: await qrDataUri(url) };
  } catch (err) {
    console.error("QR-Code konnte nicht erstellt werden:", err);
    return null;
  }
}

// ---------- Public: digital application page + generated PDFs ----------
// These are reached directly by an employer's browser via a shared link, with
// no session/user context — the owning account is resolved from the slug
// itself via store.findApplicationAnyUser (slugs carry a random hex suffix,
// so cross-account collisions are effectively impossible at this tool's
// scale — see store.js for the full reasoning).
app.get("/a/:slug", (req, res) => {
  const found = store.findApplicationAnyUser(req.params.slug);
  if (!found) return res.status(404).send("Bewerbung nicht gefunden.");
  const { userId, entry } = found;
  if (entry.publicDisabled) {
    return res.status(410).set("Content-Type", "text/html; charset=utf-8").send(renderDeactivatedPage(entry.language));
  }
  const libraryDocs = documentLibrary.listLibraryDocuments(userId);
  const photo = resolveMedia(userId, "photo");
  const html = renderAppPage({
    profile: entry.profileSnapshot,
    generated: entry.generated,
    entry,
    libraryDocs,
    photo,
    lang: entry.language,
    accentColor: accentColorFor(userId)
  });
  res.set("Content-Type", "text/html; charset=utf-8").send(html);
});

app.get("/pdf/:slug/cv", async (req, res) => {
  const found = store.findApplicationAnyUser(req.params.slug);
  if (!found) return res.status(404).send("Bewerbung nicht gefunden.");
  const { userId, entry } = found;
  if (entry.publicDisabled) {
    return res.status(410).set("Content-Type", "text/html; charset=utf-8").send(renderDeactivatedPage(entry.language));
  }
  try {
    const qr = await buildQr(req, entry.slug);
    const photo = resolveMedia(userId, "photo");
    const accentColor = accentColorFor(userId);
    const buffer = await renderPdfBufferFit(
      (level) => buildCvDocDefinition(entry.profileSnapshot, entry.generated, { qr, photo, lang: entry.language, accentColor }, level),
      { maxPages: 1 }
    );
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="CV_${entry.profileSnapshot.personal.name.replace(/\s+/g, "_")}.pdf"`
    });
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("PDF konnte nicht erstellt werden.");
  }
});

app.get("/pdf/:slug/cover", async (req, res) => {
  const found = store.findApplicationAnyUser(req.params.slug);
  if (!found) return res.status(404).send("Bewerbung nicht gefunden.");
  const { userId, entry } = found;
  if (entry.publicDisabled) {
    return res.status(410).set("Content-Type", "text/html; charset=utf-8").send(renderDeactivatedPage(entry.language));
  }
  try {
    const qr = await buildQr(req, entry.slug);
    const signature = resolveMedia(userId, "signature");
    const accentColor = accentColorFor(userId);
    const buffer = await renderPdfBufferFit(
      (level) => buildCoverDocDefinition(entry.profileSnapshot, entry.generated, { qr, signature, lang: entry.language, accentColor }, level),
      { maxPages: 1 }
    );
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Motivationsschreiben_${(entry.generated.company || "Bewerbung").replace(/\s+/g, "_")}.pdf"`
    });
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("PDF konnte nicht erstellt werden.");
  }
});

// ---------- Auth: signup / login / logout ----------
app.get("/login", (req, res) => {
  if (getSessionUserId(req)) return res.redirect("/");
  const next = safeNext(req.query.next);
  res.set("Content-Type", "text/html; charset=utf-8").send(renderLoginPage({ next, lang: langFromReq(req) }));
});

app.get("/signup", (req, res) => {
  if (getSessionUserId(req)) return res.redirect("/");
  res.set("Content-Type", "text/html; charset=utf-8").send(renderSignupPage({ lang: langFromReq(req) }));
});

app.post("/api/auth/signup", (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = createUser({ username, password, lang: langFromReq(req) });
    // Seed a real (empty) profile.json right away so this account never
    // falls back to Raffael's DEFAULT_PROFILE by accident (see
    // defaultProfileFor above).
    store.saveProfile(user.id, EMPTY_PROFILE);
    setSessionCookie(res, user.id);
    res.json({ ok: true, user: { username: user.username } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = findUserByUsername(username);
  if (!user || !verifyPassword(user, password)) {
    return res.status(401).json({ error: t(langFromReq(req), "auth.wrongCredentials") });
  }
  setSessionCookie(res, user.id);
  res.json({ ok: true, user: { username: user.username } });
});

app.post("/api/auth/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// ---------- Onboarding: optional CV import ----------
// Shown right after signup (and reachable again later from /profile) so a
// brand-new account can start from an AI-prefilled profile instead of a
// blank one. Always skippable — never blocks access to the dashboard.
app.get("/onboarding/cv-import", requireAuth, (req, res) => {
  const returnTo = safeNext(req.query.returnTo, "/");
  const accentColor = getProfile(req.user.id, req.user).accentColor;
  res.set("Content-Type", "text/html; charset=utf-8").send(renderCvImportPage({ lang: langFromReq(req), returnTo, accentColor }));
});

app.post("/api/onboarding/cv-import", requireAuth, upload.single("file"), async (req, res) => {
  try {
    let cvText = String((req.body && req.body.cvText) || "").trim();
    if (!cvText && req.file) {
      cvText = await extractTextFromFile(req.file.buffer, req.file.mimetype, req.file.originalname);
    }
    if (!cvText || cvText.trim().length < 30) {
      return res.status(400).json({ error: t(langFromReq(req), "cvImport.errorNoInput") });
    }
    const extracted = await extractProfileFromCv({ cvText, uiLang: langFromReq(req) });
    const merged = mergeExtractedProfile(extracted);
    store.saveProfile(req.user.id, merged);
    res.json({ ok: true, issues: extracted.detectedIssues || [] });
  } catch (err) {
    console.error(err);
    const msg = err.code === "NO_API_KEY" ? err.message : err.message || t(langFromReq(req), "cvImport.errorGeneric");
    res.status(500).json({ error: msg });
  }
});

// After a CV import surfaces detectedIssues (gaps/contradictions/missing
// info), the client shows a short follow-up form so the user can explain (or
// leave blank to skip) each one. Only non-empty explanations are kept —
// skipped issues simply never become a clarification. These clarifications
// are later woven into generateApplication's prompt (lib/ai.js
// buildSystemPrompt / clarificationsBlock), never forced.
app.post("/api/onboarding/cv-clarify", requireAuth, (req, res) => {
  try {
    const { answers } = req.body || {};
    const profile = getProfile(req.user.id, req.user);
    const clarifications = Array.isArray(answers)
      ? answers
          .filter((a) => a && String(a.explanation || "").trim())
          .map((a) => ({
            type: String(a.type || "sonstiges"),
            description: String(a.description || "").slice(0, 400),
            explanation: String(a.explanation).trim().slice(0, 800)
          }))
      : [];
    profile.clarifications = [...(profile.clarifications || []), ...clarifications];
    store.saveProfile(req.user.id, profile);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------- Protected: the tool itself (per-account data only) ----------
app.get("/", requireAuth, (req, res) => {
  const applications = store.listApplications(req.user.id);
  const profile = getProfile(req.user.id, req.user);
  res.set("Content-Type", "text/html; charset=utf-8").send(
    renderIndexPage({
      applications,
      hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
      statuses: STATUSES,
      baseUrl: baseUrlFor(req),
      savedSearches: store.listSearches(req.user.id),
      username: req.user.username,
      lang: langFromReq(req),
      accentColor: profile.accentColor
    })
  );
});

app.post("/api/generate", requireAuth, async (req, res) => {
  const uiLang = langFromReq(req);
  const limit = rateLimit.checkAndIncrement(req.user.id, "generate");
  if (!limit.ok) {
    return res.status(429).json({ error: t(uiLang, "server.rateLimitGenerate", { limit: limit.limit }) });
  }
  try {
    const { jobText, jobUrl, language } = req.body || {};
    const appLang = isValidLang(language) ? language : "de";
    let text = jobText;
    if (!text && jobUrl) {
      text = await fetchJobPostingText(jobUrl);
    }
    if (!text || text.trim().length < 30) {
      return res.status(400).json({ error: t(uiLang, "server.needTextOrUrl") });
    }

    const profile = getProfile(req.user.id, req.user);
    const libraryDocs = documentLibrary.listLibraryDocuments(req.user.id);
    const generated = await generateApplication({ profile, jobPostingText: text, jobUrl, libraryDocs, language: appLang });

    // Dublettenprüfung: die KI kann Firmennamen leicht unterschiedlich
    // schreiben (z.B. "Muster AG" vs. "Muster") — findDuplicateApplication
    // vergleicht deshalb normalisiert statt exakt. Eine gefundene Dublette
    // verhindert das Speichern NICHT (man könnte bewusst erneut bei
    // derselben Firma auf eine andere Stelle antworten), sondern wird nur
    // sichtbar markiert, damit man es bewusst prüfen kann.
    const duplicate = findDuplicateApplication(store.listApplications(req.user.id), generated.company);

    const entry = store.createApplication(req.user.id, {
      jobTitle: generated.jobTitle,
      company: generated.company,
      jobUrl: jobUrl || null,
      jobPostingRaw: text.slice(0, 8000),
      generated,
      profileSnapshot: profile,
      language: appLang,
      duplicateOfSlug: duplicate ? duplicate.slug : null
    });

    res.json({
      slug: entry.slug,
      generated,
      duplicateWarning: duplicate
        ? {
            slug: duplicate.slug,
            status: duplicate.status,
            statusLabel: t(uiLang, `status.${duplicate.status}`),
            createdAt: duplicate.createdAt
          }
        : null
    });
  } catch (err) {
    console.error(err);
    const msg = err.code === "NO_API_KEY" ? err.message : err.message || t(uiLang, "server.genericGenerateError");
    res.status(500).json({ error: msg });
  }
});

app.get("/posting/:slug", requireAuth, (req, res) => {
  const entry = store.getApplication(req.user.id, req.params.slug);
  if (!entry) return res.status(404).send("Bewerbung nicht gefunden.");
  const accentColor = getProfile(req.user.id, req.user).accentColor;
  res.set("Content-Type", "text/html; charset=utf-8").send(renderPostingPage({ entry, lang: langFromReq(req), accentColor }));
});

app.delete("/api/applications/:slug", requireAuth, (req, res) => {
  const ok = store.deleteApplication(req.user.id, req.params.slug);
  res.json({ ok });
});

app.patch("/api/applications/:slug/status", requireAuth, (req, res) => {
  const { status } = req.body || {};
  if (!isValidStatus(status)) {
    return res.status(400).json({ error: t(langFromReq(req), "server.invalidStatus") });
  }
  const entry = store.updateApplicationStatus(req.user.id, req.params.slug, status);
  if (!entry) return res.status(404).json({ error: "Bewerbung nicht gefunden." });
  res.json({ ok: true, status: entry.status, statusUpdatedAt: entry.statusUpdatedAt });
});

app.patch("/api/applications/:slug/note", requireAuth, (req, res) => {
  const { note } = req.body || {};
  const entry = store.updateApplicationNote(req.user.id, req.params.slug, note);
  if (!entry) return res.status(404).json({ error: "Bewerbung nicht gefunden." });
  res.json({ ok: true, note: entry.note });
});

// Manually take the public digital application page + PDF downloads offline
// (e.g. once a process is finished) without deleting the application itself —
// the private dashboard entry, its status/note history and the .eml download
// stay available regardless.
app.patch("/api/applications/:slug/public", requireAuth, (req, res) => {
  const { disabled } = req.body || {};
  const entry = store.setPublicDisabled(req.user.id, req.params.slug, disabled);
  if (!entry) return res.status(404).json({ error: "Bewerbung nicht gefunden." });
  res.json({ ok: true, publicDisabled: entry.publicDisabled });
});

// Interview-Vorbereitung: recherchiert die Firma live im Web (siehe
// lib/companyInsights.js — bewusst KEIN reines KI-Gedächtnis, gerade kleinere
// Firmen kennt das Modell sonst schlecht oder gar nicht) und cached das
// Ergebnis auf der Bewerbung. Bewusst requireAuth + kein Link von /a/:slug
// aus: das ist die private Gesprächsvorbereitung des Kontoinhabers, nicht
// Teil der Bewerbung, die die Firma sieht.
app.post("/api/applications/:slug/company-insights", requireAuth, async (req, res) => {
  const uiLang = langFromReq(req);
  const entry = store.getApplication(req.user.id, req.params.slug);
  if (!entry) return res.status(404).json({ error: "Bewerbung nicht gefunden." });
  const limit = rateLimit.checkAndIncrement(req.user.id, "insights");
  if (!limit.ok) {
    return res.status(429).json({ error: t(uiLang, "server.rateLimitInsights", { limit: limit.limit }) });
  }
  try {
    const insights = await generateCompanyInsights({
      company: (entry.generated && entry.generated.company) || entry.company,
      jobTitle: (entry.generated && entry.generated.jobTitle) || entry.jobTitle,
      jobPostingText: entry.jobPostingRaw,
      language: entry.language || "de"
    });
    const updated = store.saveCompanyInsights(req.user.id, entry.slug, insights);
    res.json({ ok: true, generatedAt: updated.companyInsights.generatedAt });
  } catch (err) {
    console.error(err);
    const msg = err.code === "NO_API_KEY" ? err.message : err.message || t(uiLang, "server.genericInsightsError");
    res.status(500).json({ error: msg });
  }
});

app.get("/pdf/:slug/insights", requireAuth, async (req, res) => {
  const entry = store.getApplication(req.user.id, req.params.slug);
  if (!entry) return res.status(404).send("Bewerbung nicht gefunden.");
  if (!entry.companyInsights) {
    return res.status(404).send("Noch nicht erstellt — bitte zuerst im Dashboard über den Button 'Firmen-Insights erstellen' generieren.");
  }
  try {
    const accentColor = getProfile(req.user.id, req.user).accentColor;
    const buffer = await renderPdfBuffer(buildInsightsDocDefinition(entry, entry.language, accentColor));
    const companyName = (entry.generated && entry.generated.company) || entry.company || "Firma";
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Firmen-Insights_${companyName.replace(/\s+/g, "_")}.pdf"`
    });
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("PDF konnte nicht erstellt werden.");
  }
});

// A mailto: link can never carry a real file attachment (hard limitation of
// the mailto: standard itself). This route builds an actual .eml message —
// CV and cover letter already embedded as real PDF attachments — so the user
// can download it, open it in their mail app, and just forward/send it on.
app.get("/api/applications/:slug/eml", requireAuth, async (req, res) => {
  const entry = store.getApplication(req.user.id, req.params.slug);
  if (!entry) return res.status(404).send("Bewerbung nicht gefunden.");
  try {
    const qr = await buildQr(req, entry.slug);
    const signature = resolveMedia(req.user.id, "signature");
    const accentColor = getProfile(req.user.id, req.user).accentColor;
    const [cvBuffer, coverBuffer] = await Promise.all([
      renderPdfBufferFit(
        (level) =>
          buildCvDocDefinition(
            entry.profileSnapshot,
            entry.generated,
            { qr, photo: resolveMedia(req.user.id, "photo"), lang: entry.language, accentColor },
            level
          ),
        { maxPages: 1 }
      ),
      renderPdfBufferFit(
        (level) => buildCoverDocDefinition(entry.profileSnapshot, entry.generated, { qr, signature, lang: entry.language, accentColor }, level),
        { maxPages: 1 }
      )
    ]);

    const g = entry.generated;
    const p = entry.profileSnapshot.personal;
    const eml = buildApplicationEml({
      to: (g.contactEmail || "").trim(),
      subject: g.emailSubject || `Bewerbung als ${g.jobTitle || ""}`,
      bodyText: g.emailBody || "",
      fromName: p.name,
      fromEmail: p.email,
      attachments: [
        { filename: `Lebenslauf_${p.name.replace(/\s+/g, "_")}.pdf`, mime: "application/pdf", buffer: cvBuffer },
        {
          filename: `Motivationsschreiben_${(g.company || "Bewerbung").replace(/\s+/g, "_")}.pdf`,
          mime: "application/pdf",
          buffer: coverBuffer
        }
      ]
    });

    const safeName = `Bewerbung_${(g.company || "Bewerbung").replace(/[^a-zA-Z0-9_-]+/g, "_")}.eml`;
    res.set({
      "Content-Type": "message/rfc822",
      "Content-Disposition": `attachment; filename="${safeName}"`
    });
    res.send(eml);
  } catch (err) {
    console.error(err);
    res.status(500).send("E-Mail-Datei konnte nicht erstellt werden.");
  }
});

app.get("/profile", requireAuth, (req, res) => {
  const profile = getProfile(req.user.id, req.user);
  res.set("Content-Type", "text/html; charset=utf-8").send(
    renderProfilePage({
      profileJson: JSON.stringify(profile, null, 2),
      media: mediaStatus(req.user.id),
      libraryDocs: documentLibrary.listLibraryDocuments(req.user.id),
      libraryCategories: documentLibrary.CATEGORIES,
      username: req.user.username,
      lang: langFromReq(req),
      imported: req.query.imported === "1",
      accentColor: profile.accentColor
    })
  );
});

// NOTE: these two /api/documents/library routes must be registered BEFORE
// any generic /api/documents/:key-style route — otherwise Express would
// match "library" as :key first and the library upload/list would never be
// reached. (There is no such generic route anymore — the old fixed
// Lehrzeugnis/EFZ document slots were removed in favour of this library —
// but the ordering note stays relevant if one is ever added back.)
app.get("/api/documents/library", requireAuth, (req, res) => {
  res.json({ documents: documentLibrary.listLibraryDocuments(req.user.id), categories: documentLibrary.CATEGORIES });
});

app.post("/api/documents/library", requireAuth, upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: t(langFromReq(req), "server.noFileReceived") });
    const { category, title, skillsText } = req.body || {};
    const entry = documentLibrary.addLibraryDocument(req.user.id, {
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalName: req.file.originalname,
      category,
      title,
      skillsText,
      lang: langFromReq(req)
    });
    res.json({ ok: true, document: entry });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/documents/library/:id", requireAuth, (req, res) => {
  const ok = documentLibrary.deleteLibraryDocument(req.user.id, req.params.id);
  res.json({ ok });
});

// Private media preview (used by /profile's "Ansehen" links) — photo/
// signature are otherwise only ever embedded server-side as data: URIs
// (digital page, PDFs), never served at a public URL.
app.get("/api/media/mine/:key", requireAuth, (req, res) => {
  const m = resolveMedia(req.user.id, req.params.key);
  if (!m) return res.status(404).send("Nicht gefunden.");
  res.set("Content-Type", m.mime).sendFile(m.path);
});

app.post("/api/media/:key", requireAuth, upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: t(langFromReq(req), "server.noFileReceived") });
    saveMedia(req.user.id, req.params.key, req.file.buffer, req.file.mimetype, langFromReq(req));
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/profile", requireAuth, (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || !body.personal || !Array.isArray(body.experience)) {
    return res.status(400).json({ error: t(langFromReq(req), "server.invalidProfileStructure") });
  }
  store.saveProfile(req.user.id, body);
  res.json({ ok: true });
});

// Lets someone whose original CV import is out of date add newly-found
// positions from a supplementary document (or just a pasted text block)
// WITHOUT overwriting anything already in their profile — see
// lib/profile.js mergeAdditionalExperience for the additive-only merge
// semantics. Reuses the same extraction as the first-time CV import.
app.post("/api/profile/experience/import", requireAuth, upload.single("file"), async (req, res) => {
  try {
    let cvText = String((req.body && req.body.cvText) || "").trim();
    if (!cvText && req.file) {
      cvText = await extractTextFromFile(req.file.buffer, req.file.mimetype, req.file.originalname);
    }
    if (!cvText || cvText.trim().length < 30) {
      return res.status(400).json({ error: t(langFromReq(req), "cvImport.errorNoInput") });
    }
    const extracted = await extractProfileFromCv({ cvText, uiLang: langFromReq(req) });
    const existing = getProfile(req.user.id, req.user);
    const { profile, addedCount } = mergeAdditionalExperience(existing, extracted);
    store.saveProfile(req.user.id, profile);
    res.json({ ok: true, addedCount });
  } catch (err) {
    console.error(err);
    const msg = err.code === "NO_API_KEY" ? err.message : err.message || t(langFromReq(req), "cvImport.errorGeneric");
    res.status(500).json({ error: msg });
  }
});

app.post("/api/profile/reset", requireAuth, (req, res) => {
  store.saveProfile(req.user.id, defaultProfileFor(req.user));
  res.json({ ok: true });
});

// ---------- Account settings: self-service username/password change ----------
// Both always require re-entering the CURRENT password first, even though
// the person is already logged in — a deliberate default for changing
// account credentials, not something the user explicitly asked for.
app.patch("/api/account/username", requireAuth, (req, res) => {
  const lang = langFromReq(req);
  const { newUsername, currentPassword } = req.body || {};
  const fullUser = findUserById(req.user.id);
  if (!fullUser || !verifyPassword(fullUser, currentPassword)) {
    return res.status(401).json({ error: t(lang, "auth.wrongCurrentPassword") });
  }
  try {
    const updated = updateUsername(req.user.id, newUsername, lang);
    res.json({ ok: true, username: updated.username });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/account/password", requireAuth, (req, res) => {
  const lang = langFromReq(req);
  const { currentPassword, newPassword } = req.body || {};
  const fullUser = findUserById(req.user.id);
  if (!fullUser || !verifyPassword(fullUser, currentPassword)) {
    return res.status(401).json({ error: t(lang, "auth.wrongCurrentPassword") });
  }
  try {
    updatePassword(req.user.id, newPassword, lang);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Gespeicherte Job-Suchen: kein automatisches Scraping/RSS (siehe lib/store.js
// für die Begründung), nur die eigenen Suchlinks als Ein-Klick-Schnellzugriff.
app.post("/api/searches", requireAuth, (req, res) => {
  const uiLang = langFromReq(req);
  const { label, url } = req.body || {};
  if (!label || !String(label).trim()) {
    return res.status(400).json({ error: t(uiLang, "server.searchNameRequired") });
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: t(uiLang, "server.invalidLink") });
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ error: t(uiLang, "server.onlyHttpLinks") });
  }
  const entry = store.addSearch(req.user.id, { label: String(label).trim(), url: parsed.toString() });
  res.json({ ok: true, entry });
});

app.delete("/api/searches/:id", requireAuth, (req, res) => {
  const ok = store.deleteSearch(req.user.id, req.params.id);
  res.json({ ok });
});

app.listen(PORT, () => {
  console.log(`Bewerbungs-Generator läuft auf Port ${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("WARNUNG: ANTHROPIC_API_KEY ist nicht gesetzt — Generierung wird fehlschlagen.");
  }
});
