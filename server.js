const path = require("path");
const express = require("express");
const multer = require("multer");

const { DEFAULT_PROFILE } = require("./lib/profile");
const { ensureDocuments } = require("./lib/assets");
const { saveUploadedDocument, resolveDocumentPath, documentStatus } = require("./lib/documents");
const { saveMedia, resolveMedia, mediaStatus } = require("./lib/media");
const documentLibrary = require("./lib/documentLibrary");
const store = require("./lib/store");
const { generateApplication } = require("./lib/ai");
const { STATUSES, isValidStatus } = require("./lib/statuses");
const { fetchJobPostingText } = require("./lib/fetchJob");
const { findDuplicateApplication } = require("./lib/dedupe");
const { requireAuth } = require("./lib/auth");
const { renderPdfBufferFit } = require("./lib/pdf/printer");
const { buildCvDocDefinition } = require("./lib/pdf/cv");
const { buildCoverDocDefinition } = require("./lib/pdf/cover");
const { qrDataUri } = require("./lib/qr");
const { buildApplicationEml } = require("./lib/eml");
const { renderIndexPage } = require("./lib/pages/indexPage");
const { renderAppPage } = require("./lib/pages/appPage");
const { renderDeactivatedPage } = require("./lib/pages/deactivatedPage");
const { renderProfilePage } = require("./lib/pages/profilePage");
const { renderPostingPage } = require("./lib/pages/postingPage");

ensureDocuments();

const app = express();
app.use(express.json({ limit: "1mb" }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const PORT = process.env.PORT || 3000;

function getProfile() {
  return store.loadProfile(DEFAULT_PROFILE);
}

// ---------- Public static assets ----------
app.use(express.static(path.join(__dirname, "public")));
app.get("/documents/lehrzeugnis.pdf", (req, res) => {
  const p = resolveDocumentPath("lehrzeugnis");
  if (!p) return res.status(404).send("Lehrzeugnis wurde noch nicht hochgeladen. Bitte unter /profile hochladen.");
  res.sendFile(p);
});
app.get("/documents/efz.pdf", (req, res) => {
  const p = resolveDocumentPath("efz");
  if (!p) return res.status(404).send("EFZ wurde noch nicht hochgeladen. Bitte unter /profile hochladen.");
  res.sendFile(p);
});
app.get("/media/:key", (req, res) => {
  const m = resolveMedia(req.params.key);
  if (!m) return res.status(404).send("Nicht gefunden.");
  res.set("Content-Type", m.mime).sendFile(m.path);
});
app.get("/documents/library/:id", (req, res) => {
  const file = documentLibrary.resolveLibraryFile(req.params.id);
  if (!file) return res.status(404).send("Dokument nicht gefunden.");
  res.set("Content-Type", file.mime).sendFile(file.path);
});
app.get("/health", (req, res) => res.json({ ok: true }));

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
app.get("/a/:slug", (req, res) => {
  const entry = store.getApplication(req.params.slug);
  if (!entry) return res.status(404).send("Bewerbung nicht gefunden.");
  if (entry.publicDisabled) {
    return res.status(410).set("Content-Type", "text/html; charset=utf-8").send(renderDeactivatedPage());
  }
  const libraryDocs = documentLibrary.listLibraryDocuments();
  const html = renderAppPage({
    profile: entry.profileSnapshot,
    generated: entry.generated,
    entry,
    libraryDocs
  });
  res.set("Content-Type", "text/html; charset=utf-8").send(html);
});

app.get("/pdf/:slug/cv", async (req, res) => {
  const entry = store.getApplication(req.params.slug);
  if (!entry) return res.status(404).send("Bewerbung nicht gefunden.");
  if (entry.publicDisabled) {
    return res.status(410).set("Content-Type", "text/html; charset=utf-8").send(renderDeactivatedPage());
  }
  try {
    const qr = await buildQr(req, entry.slug);
    const buffer = await renderPdfBufferFit(
      (level) => buildCvDocDefinition(entry.profileSnapshot, entry.generated, { qr }, level),
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
  const entry = store.getApplication(req.params.slug);
  if (!entry) return res.status(404).send("Bewerbung nicht gefunden.");
  if (entry.publicDisabled) {
    return res.status(410).set("Content-Type", "text/html; charset=utf-8").send(renderDeactivatedPage());
  }
  try {
    const qr = await buildQr(req, entry.slug);
    const buffer = await renderPdfBufferFit(
      (level) => buildCoverDocDefinition(entry.profileSnapshot, entry.generated, { qr }, level),
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

// ---------- Protected: the tool itself ----------
app.get("/", requireAuth, (req, res) => {
  const applications = store.listApplications();
  res.set("Content-Type", "text/html; charset=utf-8").send(
    renderIndexPage({
      applications,
      hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
      statuses: STATUSES,
      baseUrl: baseUrlFor(req),
      savedSearches: store.listSearches()
    })
  );
});

app.post("/api/generate", requireAuth, async (req, res) => {
  try {
    const { jobText, jobUrl } = req.body || {};
    let text = jobText;
    if (!text && jobUrl) {
      text = await fetchJobPostingText(jobUrl);
    }
    if (!text || text.trim().length < 30) {
      return res.status(400).json({ error: "Bitte einen ausreichend langen Stelleninserat-Text oder einen gültigen Link angeben." });
    }

    const profile = getProfile();
    const libraryDocs = documentLibrary.listLibraryDocuments();
    const generated = await generateApplication({ profile, jobPostingText: text, jobUrl, libraryDocs });

    // Dublettenprüfung: die KI kann Firmennamen leicht unterschiedlich
    // schreiben (z.B. "Muster AG" vs. "Muster") — findDuplicateApplication
    // vergleicht deshalb normalisiert statt exakt. Eine gefundene Dublette
    // verhindert das Speichern NICHT (Raffael könnte bewusst erneut bei
    // derselben Firma auf eine andere Stelle antworten), sondern wird nur
    // sichtbar markiert, damit er es bewusst prüfen kann.
    const duplicate = findDuplicateApplication(store.listApplications(), generated.company);

    const entry = store.createApplication({
      jobTitle: generated.jobTitle,
      company: generated.company,
      jobUrl: jobUrl || null,
      jobPostingRaw: text.slice(0, 8000),
      generated,
      profileSnapshot: profile,
      duplicateOfSlug: duplicate ? duplicate.slug : null
    });

    res.json({
      slug: entry.slug,
      generated,
      duplicateWarning: duplicate
        ? {
            slug: duplicate.slug,
            status: duplicate.status,
            statusLabel: (STATUSES.find((s) => s.key === duplicate.status) || {}).label,
            createdAt: duplicate.createdAt
          }
        : null
    });
  } catch (err) {
    console.error(err);
    const msg = err.code === "NO_API_KEY" ? err.message : err.message || "Unbekannter Fehler bei der Generierung.";
    res.status(500).json({ error: msg });
  }
});

app.get("/posting/:slug", requireAuth, (req, res) => {
  const entry = store.getApplication(req.params.slug);
  if (!entry) return res.status(404).send("Bewerbung nicht gefunden.");
  res.set("Content-Type", "text/html; charset=utf-8").send(renderPostingPage({ entry }));
});

app.delete("/api/applications/:slug", requireAuth, (req, res) => {
  const ok = store.deleteApplication(req.params.slug);
  res.json({ ok });
});

app.patch("/api/applications/:slug/status", requireAuth, (req, res) => {
  const { status } = req.body || {};
  if (!isValidStatus(status)) {
    return res.status(400).json({ error: "Ungültiger Status." });
  }
  const entry = store.updateApplicationStatus(req.params.slug, status);
  if (!entry) return res.status(404).json({ error: "Bewerbung nicht gefunden." });
  res.json({ ok: true, status: entry.status, statusUpdatedAt: entry.statusUpdatedAt });
});

app.patch("/api/applications/:slug/note", requireAuth, (req, res) => {
  const { note } = req.body || {};
  const entry = store.updateApplicationNote(req.params.slug, note);
  if (!entry) return res.status(404).json({ error: "Bewerbung nicht gefunden." });
  res.json({ ok: true, note: entry.note });
});

// Manually take the public digital application page + PDF downloads offline
// (e.g. once a process is finished) without deleting the application itself —
// the private dashboard entry, its status/note history and the .eml download
// stay available to Raffael regardless.
app.patch("/api/applications/:slug/public", requireAuth, (req, res) => {
  const { disabled } = req.body || {};
  const entry = store.setPublicDisabled(req.params.slug, disabled);
  if (!entry) return res.status(404).json({ error: "Bewerbung nicht gefunden." });
  res.json({ ok: true, publicDisabled: entry.publicDisabled });
});

// A mailto: link can never carry a real file attachment (hard limitation of
// the mailto: standard itself). This route builds an actual .eml message —
// CV and cover letter already embedded as real PDF attachments — so Raffael
// can download it, open it in his mail app, and just forward/send it on.
app.get("/api/applications/:slug/eml", requireAuth, async (req, res) => {
  const entry = store.getApplication(req.params.slug);
  if (!entry) return res.status(404).send("Bewerbung nicht gefunden.");
  try {
    const qr = await buildQr(req, entry.slug);
    const [cvBuffer, coverBuffer] = await Promise.all([
      renderPdfBufferFit(
        (level) => buildCvDocDefinition(entry.profileSnapshot, entry.generated, { qr }, level),
        { maxPages: 1 }
      ),
      renderPdfBufferFit(
        (level) => buildCoverDocDefinition(entry.profileSnapshot, entry.generated, { qr }, level),
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
  const profile = getProfile();
  res.set("Content-Type", "text/html; charset=utf-8").send(
    renderProfilePage({
      profileJson: JSON.stringify(profile, null, 2),
      docs: documentStatus(),
      media: mediaStatus(),
      libraryDocs: documentLibrary.listLibraryDocuments(),
      libraryCategories: documentLibrary.CATEGORIES
    })
  );
});

// NOTE: these two /api/documents/library routes must be registered BEFORE
// the generic /api/documents/:key route below — otherwise Express matches
// "library" as :key first and the library upload/list never gets reached.
app.get("/api/documents/library", requireAuth, (req, res) => {
  res.json({ documents: documentLibrary.listLibraryDocuments(), categories: documentLibrary.CATEGORIES });
});

app.post("/api/documents/library", requireAuth, upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Keine Datei erhalten." });
    const { category, title, skillsText } = req.body || {};
    const entry = documentLibrary.addLibraryDocument({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalName: req.file.originalname,
      category,
      title,
      skillsText
    });
    res.json({ ok: true, document: entry });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/documents/library/:id", requireAuth, (req, res) => {
  const ok = documentLibrary.deleteLibraryDocument(req.params.id);
  res.json({ ok });
});

app.post("/api/documents/:key", requireAuth, upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Keine Datei erhalten." });
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Bitte eine PDF-Datei hochladen." });
    }
    saveUploadedDocument(req.params.key, req.file.buffer);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/media/:key", requireAuth, upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Keine Datei erhalten." });
    saveMedia(req.params.key, req.file.buffer, req.file.mimetype);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/profile", requireAuth, (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || !body.personal || !Array.isArray(body.experience)) {
    return res.status(400).json({ error: "Ungültige Profilstruktur (personal & experience erforderlich)." });
  }
  store.saveProfile(body);
  res.json({ ok: true });
});

app.post("/api/profile/reset", requireAuth, (req, res) => {
  store.saveProfile(DEFAULT_PROFILE);
  res.json({ ok: true });
});

// Gespeicherte Job-Suchen: kein automatisches Scraping/RSS (siehe lib/store.js
// für die Begründung), nur Raffaels eigene Suchlinks als Ein-Klick-Schnellzugriff.
app.post("/api/searches", requireAuth, (req, res) => {
  const { label, url } = req.body || {};
  if (!label || !String(label).trim()) {
    return res.status(400).json({ error: "Bitte einen Namen für die Suche angeben." });
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: "Ungültiger Link." });
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ error: "Nur http(s)-Links sind erlaubt." });
  }
  const entry = store.addSearch({ label: String(label).trim(), url: parsed.toString() });
  res.json({ ok: true, entry });
});

app.delete("/api/searches/:id", requireAuth, (req, res) => {
  const ok = store.deleteSearch(req.params.id);
  res.json({ ok });
});

app.listen(PORT, () => {
  console.log(`Bewerbungs-Generator läuft auf Port ${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("WARNUNG: ANTHROPIC_API_KEY ist nicht gesetzt — Generierung wird fehlschlagen.");
  }
  if (!process.env.APP_PASSWORD) {
    console.warn("Hinweis: APP_PASSWORD ist nicht gesetzt — das Tool ist ohne Login erreichbar (nur digitale Bewerbungsseiten sollen ohnehin öffentlich sein).");
  }
});
