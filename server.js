const path = require("path");
const express = require("express");
const multer = require("multer");

const { DEFAULT_PROFILE } = require("./lib/profile");
const { ensureDocuments } = require("./lib/assets");
const { saveUploadedDocument, resolveDocumentPath, documentStatus } = require("./lib/documents");
const store = require("./lib/store");
const { generateApplication } = require("./lib/ai");
const { fetchJobPostingText } = require("./lib/fetchJob");
const { requireAuth } = require("./lib/auth");
const { renderPdfBuffer } = require("./lib/pdf/printer");
const { buildCvDocDefinition } = require("./lib/pdf/cv");
const { buildCoverDocDefinition } = require("./lib/pdf/cover");
const { renderIndexPage } = require("./lib/pages/indexPage");
const { renderAppPage } = require("./lib/pages/appPage");
const { renderProfilePage } = require("./lib/pages/profilePage");

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
app.get("/health", (req, res) => res.json({ ok: true }));

// ---------- Public: digital application page + generated PDFs ----------
app.get("/a/:slug", (req, res) => {
  const entry = store.getApplication(req.params.slug);
  if (!entry) return res.status(404).send("Bewerbung nicht gefunden.");
  const html = renderAppPage({ profile: entry.profileSnapshot, generated: entry.generated, entry });
  res.set("Content-Type", "text/html; charset=utf-8").send(html);
});

app.get("/pdf/:slug/cv", async (req, res) => {
  const entry = store.getApplication(req.params.slug);
  if (!entry) return res.status(404).send("Bewerbung nicht gefunden.");
  try {
    const buffer = await renderPdfBuffer(buildCvDocDefinition(entry.profileSnapshot, entry.generated));
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
  try {
    const buffer = await renderPdfBuffer(buildCoverDocDefinition(entry.profileSnapshot, entry.generated));
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
    renderIndexPage({ applications, hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY) })
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
    const generated = await generateApplication({ profile, jobPostingText: text, jobUrl });

    const entry = store.createApplication({
      jobTitle: generated.jobTitle,
      company: generated.company,
      jobUrl: jobUrl || null,
      jobPostingRaw: text.slice(0, 8000),
      generated,
      profileSnapshot: profile
    });

    res.json({ slug: entry.slug, generated });
  } catch (err) {
    console.error(err);
    const msg = err.code === "NO_API_KEY" ? err.message : err.message || "Unbekannter Fehler bei der Generierung.";
    res.status(500).json({ error: msg });
  }
});

app.delete("/api/applications/:slug", requireAuth, (req, res) => {
  const ok = store.deleteApplication(req.params.slug);
  res.json({ ok });
});

app.get("/profile", requireAuth, (req, res) => {
  const profile = getProfile();
  res.set("Content-Type", "text/html; charset=utf-8").send(
    renderProfilePage({ profileJson: JSON.stringify(profile, null, 2), docs: documentStatus() })
  );
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

app.listen(PORT, () => {
  console.log(`Bewerbungs-Generator läuft auf Port ${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("WARNUNG: ANTHROPIC_API_KEY ist nicht gesetzt — Generierung wird fehlschlagen.");
  }
  if (!process.env.APP_PASSWORD) {
    console.warn("Hinweis: APP_PASSWORD ist nicht gesetzt — das Tool ist ohne Login erreichbar (nur digitale Bewerbungsseiten sollen ohnehin öffentlich sein).");
  }
});
