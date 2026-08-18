const fs = require("fs");
const path = require("path");
const { userDir } = require("./store");

// Portrait photo + signature live on the persistent volume, per account
// (userDir(userId)/media), uploaded by each person themselves via /profile.
// Both are optional: PDFs and the digital page render fine without them,
// they just gain a personal touch once present.
const MEDIA_KEYS = ["photo", "signature"];

const EXT_BY_MIME = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MIME_BY_EXT = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

function mediaDir(userId) {
  return path.join(userDir(userId), "media");
}

function ensureMediaDir(userId) {
  const dir = mediaDir(userId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function saveMedia(userId, key, buffer, mimetype) {
  if (!MEDIA_KEYS.includes(key)) throw new Error("Unbekannter Medientyp: " + key);
  const ext = EXT_BY_MIME[mimetype];
  if (!ext) throw new Error("Bitte ein JPG, PNG oder WEBP-Bild hochladen.");
  const dir = ensureMediaDir(userId);
  // Remove any previous file for this key (it may have had a different extension).
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith(key + ".")) fs.unlinkSync(path.join(dir, f));
  }
  fs.writeFileSync(path.join(dir, `${key}.${ext}`), buffer);
}

function findMediaFile(userId, key) {
  const dir = mediaDir(userId);
  if (!fs.existsSync(dir)) return null;
  const file = fs.readdirSync(dir).find((f) => f.startsWith(key + "."));
  return file ? path.join(dir, file) : null;
}

/** Resolve a media file's disk path + data URI (for embedding into pdfmake docs). */
function resolveMedia(userId, key) {
  const filePath = findMediaFile(userId, key);
  if (!filePath) return null;
  const ext = filePath.split(".").pop().toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) return null;
  const buffer = fs.readFileSync(filePath);
  return { path: filePath, mime, dataUri: `data:${mime};base64,${buffer.toString("base64")}` };
}

function mediaStatus(userId) {
  return Object.fromEntries(MEDIA_KEYS.map((key) => [key, { available: Boolean(findMediaFile(userId, key)) }]));
}

module.exports = { saveMedia, resolveMedia, mediaStatus, findMediaFile, MEDIA_KEYS };
