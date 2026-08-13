const fs = require("fs");
const path = require("path");
const { DATA_DIR } = require("./store");

// Portrait photo + signature live on the persistent volume (DATA_DIR/media),
// uploaded by Raffael himself via /profile — same self-service pattern as the
// reference documents in lib/documents.js. Both are optional: PDFs and the
// digital page render fine without them, they just gain a personal touch
// once present.
const MEDIA_DIR = path.join(DATA_DIR, "media");
const MEDIA_KEYS = ["photo", "signature"];

const EXT_BY_MIME = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MIME_BY_EXT = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

function ensureMediaDir() {
  if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

function saveMedia(key, buffer, mimetype) {
  if (!MEDIA_KEYS.includes(key)) throw new Error("Unbekannter Medientyp: " + key);
  const ext = EXT_BY_MIME[mimetype];
  if (!ext) throw new Error("Bitte ein JPG, PNG oder WEBP-Bild hochladen.");
  ensureMediaDir();
  // Remove any previous file for this key (it may have had a different extension).
  for (const f of fs.readdirSync(MEDIA_DIR)) {
    if (f.startsWith(key + ".")) fs.unlinkSync(path.join(MEDIA_DIR, f));
  }
  fs.writeFileSync(path.join(MEDIA_DIR, `${key}.${ext}`), buffer);
}

function findMediaFile(key) {
  if (!fs.existsSync(MEDIA_DIR)) return null;
  const file = fs.readdirSync(MEDIA_DIR).find((f) => f.startsWith(key + "."));
  return file ? path.join(MEDIA_DIR, file) : null;
}

/** Resolve a media file's disk path + data URI (for embedding into pdfmake docs). */
function resolveMedia(key) {
  const filePath = findMediaFile(key);
  if (!filePath) return null;
  const ext = filePath.split(".").pop().toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) return null;
  const buffer = fs.readFileSync(filePath);
  return { path: filePath, mime, dataUri: `data:${mime};base64,${buffer.toString("base64")}` };
}

function mediaStatus() {
  return Object.fromEntries(MEDIA_KEYS.map((key) => [key, { available: Boolean(findMediaFile(key)) }]));
}

module.exports = { saveMedia, resolveMedia, mediaStatus, findMediaFile, MEDIA_KEYS };
