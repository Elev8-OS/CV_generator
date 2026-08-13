const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DEFAULT_STATUS } = require("./statuses");

// Persist under DATA_DIR (mount a Railway Volume at this path for durability
// across redeploys; falls back to a local folder otherwise).
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const PROFILE_FILE = path.join(DATA_DIR, "profile.json");
const SEARCHES_FILE = path.join(DATA_DIR, "searches.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  try {
    ensureDir();
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error("readJson failed for", file, err);
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir();
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, file);
}

// ---- Applications DB ----

function loadDb() {
  return readJson(DB_FILE, { applications: [] });
}

function saveDb(db) {
  writeJson(DB_FILE, db);
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

function shortId() {
  return crypto.randomBytes(3).toString("hex");
}

function createApplication(record) {
  const db = loadDb();
  const base = slugify(`${record.company || "bewerbung"}-${record.jobTitle || ""}`) || "bewerbung";
  const slug = `${base}-${shortId()}`;
  const entry = {
    slug,
    createdAt: new Date().toISOString(),
    status: DEFAULT_STATUS,
    statusUpdatedAt: null,
    note: "",
    publicDisabled: false,
    ...record
  };
  db.applications.unshift(entry);
  saveDb(db);
  return entry;
}

function getApplication(slug) {
  const db = loadDb();
  return db.applications.find((a) => a.slug === slug) || null;
}

function listApplications() {
  const db = loadDb();
  return db.applications;
}

function deleteApplication(slug) {
  const db = loadDb();
  const before = db.applications.length;
  db.applications = db.applications.filter((a) => a.slug !== slug);
  saveDb(db);
  return db.applications.length < before;
}

function updateApplicationStatus(slug, status) {
  const db = loadDb();
  const entry = db.applications.find((a) => a.slug === slug);
  if (!entry) return null;
  entry.status = status;
  entry.statusUpdatedAt = new Date().toISOString();
  saveDb(db);
  return entry;
}

function updateApplicationNote(slug, note) {
  const db = loadDb();
  const entry = db.applications.find((a) => a.slug === slug);
  if (!entry) return null;
  entry.note = String(note || "").slice(0, 2000);
  saveDb(db);
  return entry;
}

// Lets Raffael manually take the public digital application page (and its
// PDF downloads) offline once a process is finished — the URL and any PDFs
// he already sent stay linked to real personal data (address, phone, photo)
// indefinitely otherwise, even long after the application is no longer live.
function setPublicDisabled(slug, disabled) {
  const db = loadDb();
  const entry = db.applications.find((a) => a.slug === slug);
  if (!entry) return null;
  entry.publicDisabled = Boolean(disabled);
  saveDb(db);
  return entry;
}

// ---- Gespeicherte Job-Suchen (Schnellzugriff-Links auf Jobbörsen) ----
// Kein automatisches Nachladen/Scraping (Indeed hat RSS abgeschafft und
// blockt es inzwischen per robots.txt, jobs.ch/jobscout24.ch bieten keine
// öffentliche Such-Schnittstelle, LinkedIn-Scraping verstösst gegen deren
// Nutzungsbedingungen) — stattdessen einfach Raffaels eigene, bereits
// gefilterte Suchlinks als Ein-Klick-Schnellzugriff im Dashboard.
function listSearches() {
  return readJson(SEARCHES_FILE, []);
}

function addSearch({ label, url }) {
  const searches = listSearches();
  const entry = {
    id: shortId(),
    label: String(label || "").slice(0, 80),
    url: String(url || ""),
    createdAt: new Date().toISOString()
  };
  searches.push(entry);
  writeJson(SEARCHES_FILE, searches);
  return entry;
}

function deleteSearch(id) {
  const searches = listSearches();
  const before = searches.length;
  const next = searches.filter((s) => s.id !== id);
  writeJson(SEARCHES_FILE, next);
  return next.length < before;
}

// ---- Profile (editable copy of lib/profile.js defaults) ----

function loadProfile(defaultProfile) {
  return readJson(PROFILE_FILE, defaultProfile);
}

function saveProfile(profile) {
  writeJson(PROFILE_FILE, profile);
}

module.exports = {
  DATA_DIR,
  createApplication,
  getApplication,
  listApplications,
  deleteApplication,
  updateApplicationStatus,
  updateApplicationNote,
  setPublicDisabled,
  listSearches,
  addSearch,
  deleteSearch,
  loadProfile,
  saveProfile,
  slugify
};
