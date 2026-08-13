const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DATA_DIR } = require("./store");

// Extensible library of additional reference documents (certificates,
// references, diplomas, etc.) that Raffael can upload himself via /profile —
// on top of the two fixed slots in lib/documents.js (Lehrzeugnis/EFZ). Each
// entry carries a short free-text description of what skills/facts it
// proves; that description is fed into the AI prompt (lib/ai.js) as extra
// grounding material so relevant facts can be woven into a generated
// application, and every entry is automatically listed in the "Dokumente
// zum Download" section of every digital application page.
const LIBRARY_DIR = path.join(DATA_DIR, "documents", "library");
const META_FILE = path.join(LIBRARY_DIR, "library.json");

const CATEGORIES = [
  { key: "zeugnis", label: "Arbeitszeugnis" },
  { key: "diplom", label: "Diplom / Abschluss" },
  { key: "zertifikat", label: "Zertifikat / Kurs" },
  { key: "referenz", label: "Referenzschreiben" },
  { key: "sonstiges", label: "Sonstiges" }
];
const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
const DEFAULT_CATEGORY = "sonstiges";

const EXT_BY_MIME = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function ensureDir() {
  if (!fs.existsSync(LIBRARY_DIR)) fs.mkdirSync(LIBRARY_DIR, { recursive: true });
}

function readMeta() {
  ensureDir();
  if (!fs.existsSync(META_FILE)) return [];
  try {
    const raw = fs.readFileSync(META_FILE, "utf8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("documentLibrary: konnte library.json nicht lesen:", err);
    return [];
  }
}

function writeMeta(list) {
  ensureDir();
  const tmp = META_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2), "utf8");
  fs.renameSync(tmp, META_FILE);
}

function listLibraryDocuments() {
  return readMeta().sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

function addLibraryDocument({ buffer, mimetype, originalName, category, title, skillsText }) {
  const ext = EXT_BY_MIME[mimetype];
  if (!ext) throw new Error("Bitte eine PDF-, JPG-, PNG- oder WEBP-Datei hochladen.");
  const cat = CATEGORY_BY_KEY[category] ? category : DEFAULT_CATEGORY;
  ensureDir();
  const id = crypto.randomBytes(6).toString("hex");
  const storedName = `${id}.${ext}`;
  fs.writeFileSync(path.join(LIBRARY_DIR, storedName), buffer);
  const entry = {
    id,
    storedName,
    mime: mimetype,
    originalName: originalName || storedName,
    category: cat,
    title: String(title || originalName || "Dokument").slice(0, 120),
    skillsText: String(skillsText || "").slice(0, 800),
    uploadedAt: new Date().toISOString()
  };
  const list = readMeta();
  list.push(entry);
  writeMeta(list);
  return entry;
}

function deleteLibraryDocument(id) {
  const list = readMeta();
  const entry = list.find((d) => d.id === id);
  if (!entry) return false;
  const filePath = path.join(LIBRARY_DIR, entry.storedName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  writeMeta(list.filter((d) => d.id !== id));
  return true;
}

/** Resolve a library document's disk path + mime for serving via /documents/library/:id. */
function resolveLibraryFile(id) {
  const entry = readMeta().find((d) => d.id === id);
  if (!entry) return null;
  const filePath = path.join(LIBRARY_DIR, entry.storedName);
  if (!fs.existsSync(filePath)) return null;
  return { path: filePath, mime: entry.mime, entry };
}

module.exports = {
  CATEGORIES,
  CATEGORY_BY_KEY,
  DEFAULT_CATEGORY,
  listLibraryDocuments,
  addLibraryDocument,
  deleteLibraryDocument,
  resolveLibraryFile
};
