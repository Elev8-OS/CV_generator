const fs = require("fs");
const path = require("path");
const { DATA_DIR } = require("./store");
const { OUT_DIR: BUNDLED_DIR } = require("./assets");

// Uploaded reference documents (Lehrzeugnis, EFZ) live on the persistent
// volume (DATA_DIR/documents) so Raffael can upload/replace them himself via
// the browser, without a redeploy. Falls back to the bundled defaults
// (decoded from assets/documents-b64 at boot, if present) until he does.
const UPLOAD_DIR = path.join(DATA_DIR, "documents");

const DOC_KEYS = {
  lehrzeugnis: "lehrzeugnis.pdf",
  efz: "efz.pdf"
};

const BUNDLED_NAMES = {
  lehrzeugnis: "Lehrzeugnis_R_Nussbaum_AG.pdf",
  efz: "Faehigkeitszeugnis_EFZ_Polymechaniker.pdf"
};

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function saveUploadedDocument(key, buffer) {
  if (!DOC_KEYS[key]) throw new Error("Unbekannter Dokumenttyp: " + key);
  ensureUploadDir();
  fs.writeFileSync(path.join(UPLOAD_DIR, DOC_KEYS[key]), buffer);
}

/** Resolve the best available path for a document: uploaded copy first, else bundled default. */
function resolveDocumentPath(key) {
  if (!DOC_KEYS[key]) return null;
  const uploaded = path.join(UPLOAD_DIR, DOC_KEYS[key]);
  if (fs.existsSync(uploaded)) return uploaded;
  const bundled = path.join(BUNDLED_DIR, BUNDLED_NAMES[key]);
  if (fs.existsSync(bundled)) return bundled;
  return null;
}

function documentStatus() {
  return Object.fromEntries(
    Object.keys(DOC_KEYS).map((key) => {
      const p = resolveDocumentPath(key);
      return [key, p ? { available: true, source: p.startsWith(UPLOAD_DIR) ? "upload" : "bundled" } : { available: false }];
    })
  );
}

module.exports = { saveUploadedDocument, resolveDocumentPath, documentStatus, DOC_KEYS };
