const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { userDir, listUserIds } = require("./store");

// Extensible library of reference documents (certificates, references,
// diplomas, etc.) that each account can upload themselves via /profile. Each
// entry carries a short free-text description of what skills/facts it
// proves; that description is fed into the AI prompt (lib/ai.js) as extra
// grounding material so relevant facts can be woven into a generated
// application, and every entry is automatically listed in the "Dokumente
// zum Download" section of every digital application page.
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

function libraryDir(userId) {
  return path.join(userDir(userId), "documents", "library");
}

function metaFile(userId) {
  return path.join(libraryDir(userId), "library.json");
}

function ensureDir(userId) {
  const dir = libraryDir(userId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function readMeta(userId) {
  ensureDir(userId);
  const file = metaFile(userId);
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, "utf8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("documentLibrary: konnte library.json nicht lesen:", err);
    return [];
  }
}

function writeMeta(userId, list) {
  ensureDir(userId);
  const file = metaFile(userId);
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2), "utf8");
  fs.renameSync(tmp, file);
}

function listLibraryDocuments(userId) {
  return readMeta(userId).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

function addLibraryDocument(userId, { buffer, mimetype, originalName, category, title, skillsText }) {
  const ext = EXT_BY_MIME[mimetype];
  if (!ext) throw new Error("Bitte eine PDF-, JPG-, PNG- oder WEBP-Datei hochladen.");
  const cat = CATEGORY_BY_KEY[category] ? category : DEFAULT_CATEGORY;
  ensureDir(userId);
  const id = crypto.randomBytes(6).toString("hex");
  const storedName = `${id}.${ext}`;
  fs.writeFileSync(path.join(libraryDir(userId), storedName), buffer);
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
  const list = readMeta(userId);
  list.push(entry);
  writeMeta(userId, list);
  return entry;
}

function deleteLibraryDocument(userId, id) {
  const list = readMeta(userId);
  const entry = list.find((d) => d.id === id);
  if (!entry) return false;
  const filePath = path.join(libraryDir(userId), entry.storedName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  writeMeta(userId, list.filter((d) => d.id !== id));
  return true;
}

/** Resolve a library document's disk path + mime for serving via /documents/library/:id. */
function resolveLibraryFile(userId, id) {
  const entry = readMeta(userId).find((d) => d.id === id);
  if (!entry) return null;
  const filePath = path.join(libraryDir(userId), entry.storedName);
  if (!fs.existsSync(filePath)) return null;
  return { path: filePath, mime: entry.mime, entry };
}

// Public digital application pages link to a library document by id alone,
// with no user context in the URL (same reasoning as
// store.findApplicationAnyUser) — ids are random 6-byte hex, so a scan across
// accounts is both cheap at this scale and safe against collisions.
function resolveLibraryFileAnyUser(id) {
  for (const userId of listUserIds()) {
    const file = resolveLibraryFile(userId, id);
    if (file) return { userId, ...file };
  }
  return null;
}

module.exports = {
  CATEGORIES,
  CATEGORY_BY_KEY,
  DEFAULT_CATEGORY,
  listLibraryDocuments,
  addLibraryDocument,
  deleteLibraryDocument,
  resolveLibraryFile,
  resolveLibraryFileAnyUser
};
